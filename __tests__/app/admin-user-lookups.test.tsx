import { act, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { AdminSubmissionsTable } from "@/app/admin/admin-submissions-table";

jest.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: jest.fn() }),
}));

jest.mock("@/lib/client-logger", () => ({
	__esModule: true,
	default: { error: jest.fn() },
}));

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason: Error) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});
	return { promise, resolve, reject };
}

function submission(id: number, clerkUserId: string) {
	return {
		id,
		clerkUserId,
		message: `Message ${id}`,
		date: "2026-10-15",
		submissionStatus: 0,
	};
}

function userResponse(id: string) {
	return {
		ok: true,
		json: async () => ({
			id,
			firstName: null,
			lastName: null,
			username: `username-${id}`,
		}),
	} as Response;
}

describe("Admin submission user lookups", () => {
	const fetchMock = jest.fn();

	beforeEach(() => {
		fetchMock.mockReset();
		global.fetch = fetchMock;
	});

	it("keeps unresolved lookups in flight when another user resolves or rows change", async () => {
		const pending = new Map(
			["user-a", "user-b", "user-c", "user-d"].map((id) => [
				id,
				deferred<Response>(),
			]),
		);
		fetchMock.mockImplementation((url: string) => {
			const id = url.split("/").at(-1)!;
			return pending.get(id)!.promise;
		});
		const submissions = [
			submission(1, "user-a"),
			submission(2, "user-b"),
			submission(3, "user-c"),
			submission(4, "user-b"),
		];
		const { rerender, container } = render(
			<AdminSubmissionsTable submissions={submissions} />,
		);
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(container.querySelectorAll(".animate-pulse")).toHaveLength(4);

		await act(async () => {
			pending.get("user-a")!.resolve(userResponse("user-a"));
		});

		expect(screen.getByRole("cell", { name: "username-user-a" })).toBeVisible();
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);

		rerender(
			<AdminSubmissionsTable
				submissions={[
					...submissions,
					submission(5, "user-d"),
					submission(6, "user-c"),
				]}
			/>,
		);
		expect(fetchMock).toHaveBeenCalledTimes(4);
		for (const id of pending.keys()) {
			expect(
				fetchMock.mock.calls.filter(
					([url]) => url === `/api/admin/users/${id}`,
				),
			).toHaveLength(1);
		}

		await act(async () => {
			for (const id of ["user-b", "user-c", "user-d"]) {
				pending.get(id)!.resolve(userResponse(id));
			}
		});
		expect(container.querySelectorAll(".animate-pulse")).toHaveLength(0);
		expect(
			screen.getAllByRole("cell", { name: "username-user-b" }),
		).toHaveLength(2);
		expect(
			screen.getAllByRole("cell", { name: "username-user-c" }),
		).toHaveLength(2);
		expect(screen.getByRole("cell", { name: "username-user-d" })).toBeVisible();
	});

	it("deduplicates lookups during StrictMode effect replay", async () => {
		const pending = deferred<Response>();
		fetchMock.mockReturnValue(pending.promise);
		render(
			<StrictMode>
				<AdminSubmissionsTable submissions={[submission(1, "user-a")]} />
			</StrictMode>,
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await act(async () => pending.resolve(userResponse("user-a")));
		expect(screen.getByRole("cell", { name: "username-user-a" })).toBeVisible();
	});

	it.each(["network", "http"])(
		"clears loading after a %s failure and does not retry when other lookups resolve",
		async (failure) => {
			const firstAttempt = deferred<Response>();
			const other = deferred<Response>();
			fetchMock
				.mockReturnValueOnce(firstAttempt.promise)
				.mockReturnValueOnce(other.promise);
			const submissions = [submission(1, "user-a"), submission(2, "user-b")];
			const { rerender, container } = render(
				<AdminSubmissionsTable submissions={submissions} />,
			);

			await act(async () => {
				if (failure === "network") {
					firstAttempt.reject(new Error("Network error"));
				} else {
					firstAttempt.resolve({ ok: false } as Response);
				}
			});
			expect(screen.getByRole("cell", { name: "user-a" })).toBeVisible();
			expect(fetchMock).toHaveBeenCalledTimes(2);

			await act(async () => other.resolve(userResponse("user-b")));
			expect(fetchMock).toHaveBeenCalledTimes(2);
			rerender(<AdminSubmissionsTable submissions={[...submissions]} />);
			expect(fetchMock).toHaveBeenCalledTimes(2);
			expect(screen.getByRole("cell", { name: "user-a" })).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "username-user-b" }),
			).toBeVisible();
			expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
		},
	);
});
