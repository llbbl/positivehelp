/**
 * Re-export the raw client from the consolidated db/client module
 * This maintains backward compatibility for existing imports
 */
export { rawClient as default } from "@/db/client";

/**
 * @deprecated The Message interface should be imported from lib/messages.ts
 */
export interface Message {
	id: number;
	text: string;
	date: string;
}
