export class MessageFetchError extends Error {
	constructor(
		public readonly status: number,
		statusText: string,
	) {
		super(
			`Message API request failed with status ${status}${statusText ? ` ${statusText}` : ""}`,
		);
		this.name = "MessageFetchError";
	}
}

export function classifyMessageResponse(
	response: Pick<Response, "ok" | "status" | "statusText">,
): "found" | "not-found" {
	if (response.status === 404) {
		return "not-found";
	}
	if (!response.ok) {
		throw new MessageFetchError(response.status, response.statusText);
	}
	return "found";
}
