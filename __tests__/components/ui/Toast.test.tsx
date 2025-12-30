import { fireEvent, render, screen } from "@testing-library/react";
import {
	Toast,
	ToastAction,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@/components/ui/toast";

// Mock the lucide-react icon
jest.mock("lucide-react", () => ({
	X: ({ className }: { className?: string }) => (
		<div data-testid="x-icon" className={className}>
			X
		</div>
	),
}));

describe("Toast Components", () => {
	describe("ToastProvider", () => {
		it("renders with default props", () => {
			render(
				<ToastProvider>
					<div>Provider content</div>
				</ToastProvider>,
			);

			expect(screen.getByText("Provider content")).toBeInTheDocument();
		});

		it("renders with custom swipeDirection", () => {
			render(
				<ToastProvider swipeDirection="left">
					<div>Provider content</div>
				</ToastProvider>,
			);

			expect(screen.getByText("Provider content")).toBeInTheDocument();
		});
	});

	describe("ToastViewport", () => {
		it("renders with default props", () => {
			render(
				<ToastProvider>
					<ToastViewport />
				</ToastProvider>,
			);

			const viewport = screen.getByRole("region");
			expect(viewport).toBeInTheDocument();
			// Check that the viewport renders as a region
			expect(viewport).toHaveAttribute("aria-label", "Notifications (F8)");
		});

		it("applies custom className", () => {
			render(
				<ToastProvider>
					<ToastViewport className="custom-viewport-class" />
				</ToastProvider>,
			);

			// The viewport structure includes both the region and list elements
			const viewport = screen.getByRole("region");
			expect(viewport).toBeInTheDocument();
			// The custom className is applied to the list element
			const list = screen.getByRole("list");
			expect(list).toHaveClass("custom-viewport-class");
		});

		it("forwards additional props", () => {
			render(
				<ToastProvider>
					<ToastViewport data-testid="test-viewport" />
				</ToastProvider>,
			);

			const viewport = screen.getByTestId("test-viewport");
			expect(viewport).toBeInTheDocument();
		});
	});

	describe("Toast", () => {
		it("renders with default props", () => {
			render(
				<ToastProvider>
					<Toast open data-testid="test-toast-default">
						<div>Toast content</div>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const toast = screen.getByTestId("test-toast-default");
			expect(toast).toBeInTheDocument();
			expect(toast).toHaveClass(
				"group",
				"pointer-events-auto",
				"relative",
				"flex",
				"w-full",
				"items-center",
				"justify-between",
				"space-x-2",
				"overflow-hidden",
				"rounded-md",
				"border",
				"p-4",
				"pr-6",
				"shadow-lg",
			);
		});

		it("renders with default variant", () => {
			render(
				<ToastProvider>
					<Toast open data-testid="test-toast-variant">
						<div>Default toast</div>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const toast = screen.getByTestId("test-toast-variant");
			expect(toast).toHaveClass("border", "bg-background", "text-foreground");
		});

		it("renders with destructive variant", () => {
			render(
				<ToastProvider>
					<Toast open variant="destructive" data-testid="test-toast-destructive">
						<div>Destructive toast</div>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const toast = screen.getByTestId("test-toast-destructive");
			expect(toast).toHaveClass(
				"destructive",
				"group",
				"border-destructive",
				"bg-destructive",
				"text-destructive-foreground",
			);
		});

		it("applies custom className", () => {
			render(
				<ToastProvider>
					<Toast open className="custom-toast-class" data-testid="test-toast-custom">
						<div>Custom toast</div>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const toast = screen.getByTestId("test-toast-custom");
			expect(toast).toHaveClass("custom-toast-class");
		});

		it("forwards additional props", () => {
			render(
				<ToastProvider>
					<Toast open data-testid="test-toast">
						<div>Test toast</div>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const toast = screen.getByTestId("test-toast");
			expect(toast).toBeInTheDocument();
		});
	});

	describe("ToastAction", () => {
		it("renders with default props", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastAction altText="Action">Action Button</ToastAction>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const action = screen.getByRole("button", { name: "Action Button" });
			expect(action).toBeInTheDocument();
			expect(action).toHaveClass(
				"inline-flex",
				"h-8",
				"shrink-0",
				"items-center",
				"justify-center",
				"rounded-md",
				"border",
				"bg-transparent",
				"px-3",
				"text-sm",
				"font-medium",
			);
		});

		it("applies custom className", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastAction altText="Action" className="custom-action-class">
							Custom Action
						</ToastAction>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const action = screen.getByRole("button", { name: "Custom Action" });
			expect(action).toHaveClass("custom-action-class");
		});

		it("handles click events", () => {
			const handleClick = jest.fn();
			render(
				<ToastProvider>
					<Toast open>
						<ToastAction altText="Action" onClick={handleClick}>
							Click me
						</ToastAction>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const action = screen.getByRole("button", { name: "Click me" });
			fireEvent.click(action);

			expect(handleClick).toHaveBeenCalledTimes(1);
		});
	});

	describe("ToastClose", () => {
		it("renders with default props", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastClose />
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const closeButton = screen.getByRole("button", { name: "X" });
			expect(closeButton).toBeInTheDocument();
			expect(closeButton).toHaveClass(
				"absolute",
				"right-1",
				"top-1",
				"rounded-md",
				"p-1",
				"text-foreground/50",
				"opacity-0",
			);
			expect(closeButton).toHaveAttribute("toast-close", "");
		});

		it("contains X icon", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastClose />
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			expect(screen.getByTestId("x-icon")).toBeInTheDocument();
		});

		it("applies custom className", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastClose className="custom-close-class" />
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const closeButton = screen.getByRole("button", { name: "X" });
			expect(closeButton).toHaveClass("custom-close-class");
		});

		it("handles click events", () => {
			const handleClick = jest.fn();
			render(
				<ToastProvider>
					<Toast open>
						<ToastClose onClick={handleClick} />
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const closeButton = screen.getByRole("button", { name: "X" });
			fireEvent.click(closeButton);

			expect(handleClick).toHaveBeenCalledTimes(1);
		});
	});

	describe("ToastTitle", () => {
		it("renders with default props", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastTitle>Toast Title</ToastTitle>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const title = screen.getByText("Toast Title");
			expect(title).toBeInTheDocument();
			expect(title).toHaveClass("text-sm", "font-semibold", "[&+div]:text-xs");
		});

		it("applies custom className", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastTitle className="custom-title-class">Custom Title</ToastTitle>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const title = screen.getByText("Custom Title");
			expect(title).toHaveClass("custom-title-class");
		});

		it("forwards additional props", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastTitle data-testid="test-title">Test Title</ToastTitle>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const title = screen.getByTestId("test-title");
			expect(title).toBeInTheDocument();
		});
	});

	describe("ToastDescription", () => {
		it("renders with default props", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastDescription>Toast Description</ToastDescription>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const description = screen.getByText("Toast Description");
			expect(description).toBeInTheDocument();
			expect(description).toHaveClass("text-sm", "opacity-90");
		});

		it("applies custom className", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastDescription className="custom-description-class">
							Custom Description
						</ToastDescription>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const description = screen.getByText("Custom Description");
			expect(description).toHaveClass("custom-description-class");
		});

		it("forwards additional props", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastDescription data-testid="test-description">
							Test Description
						</ToastDescription>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			const description = screen.getByTestId("test-description");
			expect(description).toBeInTheDocument();
		});
	});

	describe("Toast Integration", () => {
		it("renders complete toast structure", () => {
			render(
				<ToastProvider>
					<Toast open>
						<div className="grid gap-1">
							<ToastTitle>Success</ToastTitle>
							<ToastDescription>
								Your action was completed successfully.
							</ToastDescription>
						</div>
						<ToastAction altText="Undo">Undo</ToastAction>
						<ToastClose />
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			expect(screen.getByText("Success")).toBeInTheDocument();
			expect(
				screen.getByText("Your action was completed successfully."),
			).toBeInTheDocument();
			expect(screen.getByText("Undo")).toBeInTheDocument();
			expect(screen.getByTestId("x-icon")).toBeInTheDocument();
		});

		it("supports multiple toasts", () => {
			render(
				<ToastProvider>
					<Toast open>
						<ToastTitle>First Toast</ToastTitle>
					</Toast>
					<Toast open>
						<ToastTitle>Second Toast</ToastTitle>
					</Toast>
					<ToastViewport />
				</ToastProvider>,
			);

			expect(screen.getByText("First Toast")).toBeInTheDocument();
			expect(screen.getByText("Second Toast")).toBeInTheDocument();
		});
	});
});
