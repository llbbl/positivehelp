import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AddMessageForm } from "@/app/add/add-message-form";

// Mock dependencies
jest.mock("next/navigation", () => ({
	useRouter: jest.fn(),
}));

jest.mock("@/app/actions", () => ({
	createMessage: jest.fn(),
}));

jest.mock("@/hooks/use-toast", () => ({
	useToast: jest.fn(),
}));

jest.mock("@clerk/nextjs", () => ({
	useAuth: jest.fn(),
}));

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { createMessage } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockCreateMessage = createMessage as jest.MockedFunction<
	typeof createMessage
>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe("AddMessageForm", () => {
	const mockPush = jest.fn();
	const mockRefresh = jest.fn();
	const mockToast = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();

		mockUseRouter.mockReturnValue({
			push: mockPush,
			refresh: mockRefresh,
			back: jest.fn(),
			forward: jest.fn(),
			prefetch: jest.fn(),
			replace: jest.fn(),
		});

		mockUseToast.mockReturnValue({
			toast: mockToast,
			dismiss: jest.fn(),
			toasts: [],
		});

		mockUseAuth.mockReturnValue({
			userId: "user123",
			isLoaded: true,
			isSignedIn: true,
			sessionId: "session123",
			orgId: null,
			orgRole: null,
			orgSlug: null,
			has: jest.fn(),
			signOut: jest.fn(),
			getToken: jest.fn(),
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
			orgId: null,
			orgRole: null,
			orgSlug: null,
			has: jest.fn(),
			signOut: jest.fn(),
			getToken: jest.fn(),
		});

		render(<AddMessageForm />);

		const form = document.querySelector("form");
		fireEvent.submit(form!);

		await waitFor(() => {
			expect(mockToast).toHaveBeenCalledWith({
				variant: "destructive",
				title: "Error",
				description: "You must be logged in to add a message",
			});
		});
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
			expect(mockCreateMessage).toHaveBeenCalledWith(expect.any(FormData));
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

	it("includes userId in form data when submitting", async () => {
		mockCreateMessage.mockResolvedValue({ success: true });

		render(<AddMessageForm />);

		const contentField = screen.getByLabelText("Your Message");
		const submitButton = screen.getByRole("button", { name: "Add Message" });

		fireEvent.change(contentField, { target: { value: "Test message" } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			const formDataCall = mockCreateMessage.mock.calls[0][0] as FormData;
			expect(formDataCall.get("userId")).toBe("user123");
			expect(formDataCall.get("content")).toBe("Test message");
		});
	});
});
