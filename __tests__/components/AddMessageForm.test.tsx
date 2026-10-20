import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import { AddMessageForm } from "@/app/add/add-message-form";

// Mock dependencies
vi.mock("next/navigation", () => ({
	useRouter: vi.fn(),
}));

vi.mock("@/app/actions", () => ({
	createMessage: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
	useToast: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
	useAuth: vi.fn(),
}));

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createMessage } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const mockUseRouter = useRouter as MockedFunction<typeof useRouter>;
const mockCreateMessage = createMessage as MockedFunction<typeof createMessage>;
const mockUseToast = useToast as MockedFunction<typeof useToast>;
const mockUseAuth = useAuth as MockedFunction<typeof useAuth>;

describe("AddMessageForm", () => {
	const mockPush = vi.fn();
	const mockRefresh = vi.fn();
	const mockToast = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();

		mockUseRouter.mockReturnValue({
			push: mockPush,
			refresh: mockRefresh,
			back: vi.fn(),
			forward: vi.fn(),
			prefetch: vi.fn(),
			replace: vi.fn(),
			bfcacheId: "test-bfcache-id",
		});

		mockUseToast.mockReturnValue({
			toast: mockToast,
			dismiss: vi.fn(),
			toasts: [],
		});

		mockUseAuth.mockReturnValue({
			userId: "user123",
			isLoaded: true,
			isSignedIn: true,
			sessionId: "session123",
			sessionClaims: {} as any,
			actor: null,
			orgId: null,
			orgRole: null,
			orgSlug: null,
			has: vi.fn(),
			signOut: vi.fn(),
			getToken: vi.fn(),
		});
	});

	it("renders form fields correctly", () => {
		render(<AddMessageForm />);

		expect(screen.getByLabelText("Your Message")).toBeInTheDocument();
		expect(screen.getByLabelText("Author or Attribution")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Add Message" }),
		).toBeInTheDocument();
	});

	it("shows correct placeholders", () => {
		render(<AddMessageForm />);

		expect(
			screen.getByPlaceholderText("Share something positive..."),
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText(
				"Who said or wrote this? Leave blank for anonymous.",
			),
		).toBeInTheDocument();
	});

	it("requires content field", () => {
		render(<AddMessageForm />);

		const contentField = screen.getByLabelText("Your Message");
		expect(contentField).toBeRequired();
	});

	it("author field is optional", () => {
		render(<AddMessageForm />);

		const authorField = screen.getByLabelText("Author or Attribution");
		expect(authorField).not.toBeRequired();
	});

	it("shows error when user is not logged in", async () => {
		mockUseAuth.mockReturnValue({
			userId: null,
			isLoaded: true,
			isSignedIn: false,
			sessionId: null,
			sessionClaims: null,
			actor: null,
			orgId: null,
			orgRole: null,
			orgSlug: null,
			has: vi.fn(),
			signOut: vi.fn(),
			getToken: vi.fn(),
		});

		render(<AddMessageForm />);

		fireEvent.change(screen.getByLabelText("Your Message"), {
			target: { value: "Test positive message" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Add Message" }));

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith({
				variant: "destructive",
				title: "Error",
				description: "You must be logged in to add a message",
			});
		});
		expect(mockCreateMessage).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
		expect(mockRefresh).not.toHaveBeenCalled();
	});

	it("submits form with correct data when logged in", async () => {
		mockCreateMessage.mockResolvedValue({ success: true });

		render(<AddMessageForm />);

		const contentField = screen.getByLabelText("Your Message");
		const authorField = screen.getByLabelText("Author or Attribution");
		const submitButton = screen.getByRole("button", { name: "Add Message" });

		fireEvent.change(contentField, {
			target: { value: "Test positive message" },
		});
		fireEvent.change(authorField, { target: { value: "Test Author" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMessage).toHaveBeenCalledTimes(1);
		});
		const [formData] = mockCreateMessage.mock.calls[0]!;
		expect(Object.fromEntries(formData.entries())).toEqual({
			content: "Test positive message",
			author: "Test Author",
			userId: "user123",
		});
	});

	it("shows success message and redirects on successful submission", async () => {
		mockCreateMessage.mockResolvedValue({ success: true });

		render(<AddMessageForm />);

		const contentField = screen.getByLabelText("Your Message");
		const submitButton = screen.getByRole("button", { name: "Add Message" });

		fireEvent.change(contentField, { target: { value: "Test message" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith({
				title: "Success",
				description: "Your message has been submitted for review!",
			});
			expect(mockPush).toHaveBeenCalledWith("/");
			expect(mockRefresh).toHaveBeenCalled();
		});
	});

	it("shows error message when submission fails", async () => {
		mockCreateMessage.mockResolvedValue({ error: "Failed to create message" });

		render(<AddMessageForm />);

		const contentField = screen.getByLabelText("Your Message");
		const submitButton = screen.getByRole("button", { name: "Add Message" });

		fireEvent.change(contentField, { target: { value: "Test message" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith({
				variant: "destructive",
				title: "Error",
				description: "Failed to create message",
			});
		});
	});

	it("shows loading state during submission", async () => {
		mockCreateMessage.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(() => resolve({ success: true }), 100),
				),
		);

		render(<AddMessageForm />);

		const contentField = screen.getByLabelText("Your Message");
		const submitButton = screen.getByRole("button", { name: "Add Message" });

		fireEvent.change(contentField, { target: { value: "Test message" } });
		fireEvent.click(submitButton);

		expect(screen.getByText("Adding...")).toBeInTheDocument();
		expect(submitButton).toBeDisabled();

		await waitFor(() => {
			expect(screen.getByText("Add Message")).toBeInTheDocument();
		});
	});

	it("submits an empty author for anonymous attribution", async () => {
		mockCreateMessage.mockResolvedValue({ success: true });

		render(<AddMessageForm />);

		const contentField = screen.getByLabelText("Your Message");
		const submitButton = screen.getByRole("button", { name: "Add Message" });

		fireEvent.change(contentField, { target: { value: "Test message" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockCreateMessage).toHaveBeenCalledTimes(1);
		});
		const [formData] = mockCreateMessage.mock.calls[0]!;
		expect(Object.fromEntries(formData.entries())).toEqual({
			content: "Test message",
			author: "",
			userId: "user123",
		});
	});
});
