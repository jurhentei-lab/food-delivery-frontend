const rawApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:999";

export const API_BASE = rawApiBase.replace(/\/+$/, "");
