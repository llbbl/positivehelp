import "@testing-library/jest-dom";

// Suppress React act() warnings and test-related errors during testing
const originalError = console.error;
beforeAll(() => {
	console.error = (...args) => {
		if (
			typeof args[0] === "string" &&
			((args[0].includes("An update to") && args[0].includes("act(...)")) ||
				args[0].includes("Error fetching latest messages"))
		) {
			return;
		}
		return originalError.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
});
