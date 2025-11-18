import { fireEvent, render, screen } from "@testing-library/react";
import { Navigation } from "@/components/Navigation";

// Mock Clerk components
jest.mock("@clerk/nextjs", () => ({
	SignInButton: ({ children }: any) => (
		<div data-testid="sign-in-button">{children}</div>
	),
	SignedIn: ({ children }: any) => (
		<div data-testid="signed-in">{children}</div>
	),
	SignedOut: ({ children }: any) => (
		<div data-testid="signed-out">{children}</div>
	),
	UserButton: ({ afterSignOutUrl }: any) => (
		<div data-testid="user-button">User Button</div>
	),
}));

// Mock AdminLink component
jest.mock("@/components/admin-link", () => ({
	AdminLink: () => <div data-testid="admin-link">Admin Link</div>,
}));

describe("Navigation", () => {
	it("renders the main navigation elements", () => {
		render(<Navigation />);

		expect(screen.getByText("positive.help")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /positive\.help/i }),
		).toHaveAttribute("href", "/");
	});

	it("toggles mobile menu when hamburger button is clicked", () => {
		render(<Navigation />);

		// Find the mobile menu button (the one with md:hidden class and no text content)
		const menuButton = screen.getByRole("button", { name: "" });

		// Count how many "Submissions" links exist initially (should be 1 for desktop)
		const initialSubmissionsLinks = screen.getAllByText("Submissions");
		expect(initialSubmissionsLinks).toHaveLength(1);

		fireEvent.click(menuButton);

		// After clicking, should have 2 "Submissions" links (desktop + mobile)
		const afterClickSubmissionsLinks = screen.getAllByText("Submissions");
		expect(afterClickSubmissionsLinks).toHaveLength(2);
	});

	it("shows hamburger icon when menu is closed and X icon when open", () => {
		render(<Navigation />);

		const menuButton = screen.getByRole("button", { name: "" });

		// Should show Menu icon initially (lucide-menu class)
		expect(menuButton.querySelector(".lucide-menu")).toBeInTheDocument();

		fireEvent.click(menuButton);

		// Should show X icon when open (lucide-x class)
		expect(menuButton.querySelector(".lucide-x")).toBeInTheDocument();
	});

	it("contains Add Positivity buttons with correct links", () => {
		render(<Navigation />);

		const addLinks = screen
			.getAllByRole("link")
			.filter((link) => link.getAttribute("href") === "/add");

		expect(addLinks.length).toBeGreaterThan(0);
	});
});
