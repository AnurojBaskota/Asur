import "server-only";
import jwt from "jsonwebtoken";
import { SESSION_COOKIE, SESSION_MAX_AGE as MAX_AGE, sessionSecret as secret, verifySessionToken } from "./session-token";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createSession(email: string) {
  const token = jwt.sign({ email }, secret(), { expiresIn: MAX_AGE, algorithm: "HS256" });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getSession() {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin page and Server Action. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
