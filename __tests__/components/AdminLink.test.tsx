import { render, screen } from "@testing-library/react";
import { AdminLink } from "@/components/admin-link";

// Mock Clerk
jest.mock("@clerk/nextjs", () => ({
	useUser: jest.fn(),
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

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe("AdminLink", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders admin link when user is admin (string 'true')", () => {
		const mockUser = {
			id: "user123",
			primaryEmailAddress: { emailAddress: "admin@test.com" },
			publicMetadata: { isAdmin: "true" },
		} as any;

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		render(<AdminLink />);

		expect(screen.getByText("Admin")).toBeInTheDocument();
		expect(screen.getByRole("link")).toHaveAttribute("href", "/admin");
	});

	it("renders admin link when user is admin (boolean true)", () => {
		const mockUser = {
			id: "user123",
			primaryEmailAddress: { emailAddress: "admin@test.com" },
			publicMetadata: { isAdmin: true },
		} as any;

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		render(<AdminLink />);

		expect(screen.getByText("Admin")).toBeInTheDocument();
		expect(screen.getByRole("link")).toHaveAttribute("href", "/admin");
	});

	it("does not render when user is not admin", () => {
		const mockUser = {
			id: "user123",
			primaryEmailAddress: { emailAddress: "user@test.com" },
			publicMetadata: { isAdmin: false },
		} as any;

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		render(<AdminLink />);

		expect(screen.queryByText("Admin")).not.toBeInTheDocument();
	});

	it("does not render when publicMetadata is missing", () => {
		const mockUser = {
			id: "user123",
			primaryEmailAddress: { emailAddress: "user@test.com" },
			publicMetadata: {},
		} as any;

		mockUseUser.mockReturnValue({
			user: mockUser,
			isLoaded: true,
			isSignedIn: true,
		});

		render(<AdminLink />);

		expect(screen.queryByText("Admin")).not.toBeInTheDocument();
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
});
