import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";
import { toast } from "@/hooks/use-toast";

vi.mock("@/app/globals.css", () => ({}));

vi.mock("@clerk/nextjs", () => ({
	ClerkProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("next/font/google", () => ({
	Geist: () => ({ variable: "--font-geist-sans" }),
	Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));

vi.mock("@/components/Navigation", () => ({
	Navigation: () => <nav aria-label="Main navigation" />,
}));

describe("RootLayout", () => {
	it("delivers page notifications through one global toaster", async () => {
		render(
			<RootLayout>
				<button
					type="button"
					onClick={() =>
						toast({
							title: "Message submitted",
							description: "Your positivity is ready for review.",
						})
					}
				>
					Submit message
				</button>
			</RootLayout>,
			{ container: document },
		);

		fireEvent.click(screen.getByRole("button", { name: "Submit message" }));

		expect(await screen.findByText("Message submitted")).toBeVisible();
		expect(
			screen.getByText("Your positivity is ready for review."),
		).toBeVisible();
		expect(
			screen.getAllByRole("region", { name: "Notifications (F8)" }),
		).toHaveLength(1);
	});
});
