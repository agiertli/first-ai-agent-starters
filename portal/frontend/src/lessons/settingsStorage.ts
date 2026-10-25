export const SETTINGS_STORAGE_KEY = "dny-ai.connection.v1";
export interface SavedConnection { api_base: string; model: string; api_key?: string }
type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readConnection(storage: StorageLike): SavedConnection | null {
  try {
    const value = JSON.parse(storage.getItem(SETTINGS_STORAGE_KEY) ?? "null");
    if (!value || typeof value.api_base !== "string" || typeof value.model !== "string" ||
        value.api_key !== undefined && typeof value.api_key !== "string") return null;
    const url = new URL(value.api_base);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    return { api_base: value.api_base, model: value.model, ...(value.api_key ? {api_key: value.api_key} : {}) };
  } catch { return null; }
}

export function writeConnection(storage: StorageLike, connection: SavedConnection): void {
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(connection));
}
