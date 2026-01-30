import { type NextRequest } from "next/server";

const API_KEY = process.env.API_KEY as string;

export function verifyApiKey(req: NextRequest): boolean {
  if (!API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("API_KEY is not defined in environment variables.");
    }
    return false;
  }

  const headerKey = req.headers.get("x-api-key");
  if (!headerKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Missing x-api-key header.");
    }
    return false;
  }

  return API_KEY === headerKey;
}
