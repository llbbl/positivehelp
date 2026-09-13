/**
 * Re-export the raw client from the consolidated db/client module
 * This maintains backward compatibility for existing imports
 */
export { rawClient as default } from "@/db/client";
