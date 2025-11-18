import { render } from "@testing-library/react";
import RuntimeLogger from "@/components/RuntimeLogger";

// Mock console.log to track calls
const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

describe("RuntimeLogger", () => {
	beforeEach(() => {
		consoleSpy.mockClear();
	});

	afterAll(() => {
		consoleSpy.mockRestore();
	});

	it("renders without errors", () => {
		expect(() => render(<RuntimeLogger />)).not.toThrow();
	});

	it("returns null (does not render anything)", () => {
		const { container } = render(<RuntimeLogger />);
		expect(container.firstChild).toBeNull();
	});

	it("calls console.log with expected messages", () => {
		render(<RuntimeLogger />);

		expect(consoleSpy).toHaveBeenCalledWith(
			"--- RuntimeLogger: Client-Side Logging ---",
		);
		expect(consoleSpy).toHaveBeenCalledWith(
			"process.env.NEXT_PUBLIC_APP_URL:",
			process.env.NEXT_PUBLIC_APP_URL,
		);
	});

	it("useEffect hook only runs once", () => {
		const { rerender } = render(<RuntimeLogger />);

		// Clear previous calls
		consoleSpy.mockClear();

		// Re-render the component
		rerender(<RuntimeLogger />);

		// Console.log should not be called again since useEffect has empty dependency array
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it("logs the correct number of console messages", () => {
		render(<RuntimeLogger />);

		// Should call console.log exactly 2 times
		expect(consoleSpy).toHaveBeenCalledTimes(2);
	});
});
