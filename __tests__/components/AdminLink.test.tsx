import { render, screen, waitFor } from "@testing-library/react";
import { AdminLink } from "@/components/admin-link";

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
	useUser: jest.fn(),
}));

// Mock auth utility
jest.mock("@/lib/auth", () => ({
	isUserAdmin: jest.fn(),
}));

// Mock Next.js Link
jest.mock("next/link", () => {
	return ({
		children,
		href,
		...props
	}: {
		children: React.ReactNode;
		href: string;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	);
});

import { useUser } from "@clerk/nextjs";
import { isUserAdmin } from "@/lib/auth";

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockIsUserAdmin = isUserAdmin as jest.MockedFunction<typeof isUserAdmin>;

describe("AdminLink", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders admin link when user is admin", async () => {
		const mockUser = {
			id: "user123",
			primaryEmailAddress: { emailAddress: "admin@test.com" },
		};

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		mockIsUserAdmin.mockResolvedValue(true);

		render(<AdminLink />);

		await waitFor(() => {
			expect(screen.getByText("Admin")).toBeInTheDocument();
			expect(screen.getByRole("link")).toHaveAttribute("href", "/admin");
		});
	});

	it("does not render when user is not admin", async () => {
		const mockUser = {
			id: "user123",
			primaryEmailAddress: { emailAddress: "user@test.com" },
		};

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		mockIsUserAdmin.mockResolvedValue(false);

		render(<AdminLink />);

		await waitFor(() => {
			expect(screen.queryByText("Admin")).not.toBeInTheDocument();
		});
	});

	it("does not render when no user is logged in", () => {
		mockUseUser.mockReturnValue({
			user: null,
			isLoaded: true,
			isSignedIn: false,
		});

		render(<AdminLink />);

		expect(screen.queryByText("Admin")).not.toBeInTheDocument();
	});

	it("calls isUserAdmin with correct user when user exists", async () => {
		const mockUser = {
			id: "user123",
			primaryEmailAddress: { emailAddress: "test@test.com" },
		};

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		mockIsUserAdmin.mockResolvedValue(false);

		render(<AdminLink />);

		await waitFor(() => {
			expect(mockIsUserAdmin).toHaveBeenCalledWith(mockUser);
		});
	});

	it("handles isUserAdmin async call gracefully", async () => {
		const mockUser = { id: "user123" };

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		// Simulate slow admin check
		mockIsUserAdmin.mockImplementation(
			() => new Promise((resolve) => setTimeout(() => resolve(true), 100)),
		);

		render(<AdminLink />);

		// Should not show admin link initially
		expect(screen.queryByText("Admin")).not.toBeInTheDocument();

		// Should show after async call completes
		await waitFor(
			() => {
				expect(screen.getByText("Admin")).toBeInTheDocument();
			},
			{ timeout: 200 },
		);
	});
});
