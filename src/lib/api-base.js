const rawApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://food-delivery-backend-7.onrender.com";

export const API_BASE = rawApiBase.replace(/\/+$/, "");
