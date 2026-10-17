import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "maisonly_admin";
const ADMIN_SESSION_PAYLOAD = "maisonly-admin-session";

/**
 * The validation console is reserved for the maisonly operator. The access code
 * must be provided through the environment in production; the development
 * fallback keeps the preview usable without shipping a real secret.
 */
const DEVELOPMENT_ACCESS_CODE = "maisonly-admin";

function accessCode() {
  const configured = process.env.ADMIN_ACCESS_CODE?.trim();
  return configured || DEVELOPMENT_ACCESS_CODE;
}

/** True when the shipped default code is used because none was configured. */
export function isAdminUsingDefaultCode() {
  return !process.env.ADMIN_ACCESS_CODE?.trim();
}

function sessionToken(code: string) {
  return createHmac("sha256", code).update(ADMIN_SESSION_PAYLOAD).digest("hex");
}

export function isAdminConfigured() {
  return accessCode() !== null;
}

export async function createAdminSession(code: string) {
  const expected = accessCode();
  if (!expected) return false;

  const provided = Buffer.from(code);
  const expectedBuffer = Buffer.from(expected);
  const matches =
    provided.length === expectedBuffer.length &&
    timingSafeEqual(provided, expectedBuffer);
  if (!matches) return false;

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, sessionToken(expected), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return true;
}

export async function isAdmin() {
  const expected = accessCode();
  if (!expected) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const expectedToken = sessionToken(expected);
  const provided = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedToken);
  return (
    provided.length === expectedBuffer.length &&
    timingSafeEqual(provided, expectedBuffer)
  );
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
