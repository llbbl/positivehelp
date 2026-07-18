import { describe, expect, it } from "@jest/globals";
import * as schema from "@/db/schema";

describe("schema relations", () => {
	it("does not associate submissions with message-author rows", () => {
		expect(schema).not.toHaveProperty("submissionsRelations");
	});

	it("retains the valid message and author relation metadata", () => {
		expect(schema).toHaveProperty("messagesRelations");
		expect(schema).toHaveProperty("authorsRelations");
		expect(schema).toHaveProperty("messageAuthorsRelations");
	});
});
