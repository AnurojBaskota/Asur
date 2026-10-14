import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "asur_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function sessionSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return s;
}

export function verifySessionToken(token: string | undefined): { email: string } | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, sessionSecret(), { algorithms: ["HS256"] }) as { email?: string };
    return payload.email ? { email: payload.email } : null;
  } catch {
    return null;
  }
}
