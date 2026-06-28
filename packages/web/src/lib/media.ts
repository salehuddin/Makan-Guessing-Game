import { apiBase } from "./api";

const storageBase = `${apiBase}/storage`;

export function mediaUrl(path: string | null | undefined): string {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  const normalized = path.replace(/^\/+/, "");

  return `${storageBase}/${normalized}`;
}