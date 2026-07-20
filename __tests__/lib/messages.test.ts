import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { MESSAGE_MAX_PAGE_SIZE, MESSAGE_PAGE_SIZE } from "@/lib/constants";
import client from "@/lib/db";
import { getMessages } from "@/lib/messages";

jest.mock("@/lib/db", () => ({
	__esModule: true,
	default: {
		execute: jest.fn(),
	},
}));

jest.mock("@/lib/logger", () => ({
	__esModule: true,
	default: {
		error: jest.fn(),
	},
}));

type ExecuteResult = Awaited<ReturnType<typeof client.execute>>;
const executeMock = client.execute as jest.MockedFunction<
	typeof client.execute
>;

function resultWithRows(rows: Array<Record<string, string | number>>) {
	return { rows } as unknown as ExecuteResult;
}

describe("getMessages", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("bounds initial retrieval to the default newest-first page", async () => {
		executeMock.mockResolvedValue(
			resultWithRows([
				{ id: 2, text: "Second", date: "2026-01-02", url: "second" },
				{ id: 1, text: "First", date: "2026-01-01", url: "first" },
			]),
		);

		await expect(getMessages()).resolves.toHaveLength(2);
		expect(executeMock).toHaveBeenCalledWith({
			sql: expect.stringMatching(/ORDER BY id DESC LIMIT \?/),
			args: [MESSAGE_PAGE_SIZE],
		});
	});

	it("selects the oldest unseen page before returning it newest-first", async () => {
		executeMock.mockResolvedValue(
			resultWithRows([
				{ id: 11, text: "Eleven", date: "2026-01-11", url: "eleven" },
				{ id: 12, text: "Twelve", date: "2026-01-12", url: "twelve" },
			]),
		);

		await expect(getMessages(10, 2)).resolves.toEqual([
			expect.objectContaining({ id: 12 }),
			expect.objectContaining({ id: 11 }),
		]);
		expect(executeMock).toHaveBeenCalledWith({
			sql: expect.stringMatching(
				/WHERE id > \?[\s\S]*ORDER BY id ASC LIMIT \?/,
			),
			args: [10, 2],
		});
	});

	it("defensively caps direct callers at the maximum page size", async () => {
		executeMock.mockResolvedValue(resultWithRows([]));

		await getMessages(undefined, MESSAGE_MAX_PAGE_SIZE + 1);

		expect(executeMock).toHaveBeenCalledWith(
			expect.objectContaining({ args: [MESSAGE_MAX_PAGE_SIZE] }),
		);
	});
});
