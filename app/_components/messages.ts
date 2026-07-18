import { getAppUrl } from "@/lib/app-origin";

export interface Message {
	id: number;
	text: string;
	date: string;
}

export async function getMessages(): Promise<Message[]> {
	const response = await fetch(getAppUrl("/api/messages"), {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		throw new Error("Failed to fetch messages");
	}
	return response.json();
}
