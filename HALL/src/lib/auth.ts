import "server-only";

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { agencies, sessions, subscriptions, users } from "@/db/schema";

const SESSION_COOKIE = "maisonly_session";
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const PASSWORD_COST = 16384;

type SubscriptionSnapshot = {
  status: string;
  priceFcfa: number;
  currentPeriodEnd: Date | null;
  approvedPaymentCount: number;
};

export type CurrentAuth = {
  userId: number;
  agencyId: number;
  userName: string;
  userEmail: string;
  agencyName: string;
  agencyCity: string;
  subscription: SubscriptionSnapshot;
  hasAccess: boolean;
};

function digestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: PASSWORD_COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await derivePassword(password, salt);
  return `scrypt$${PASSWORD_COST}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, cost, salt, key] = storedHash.split("$");
  if (algorithm !== "scrypt" || cost !== String(PASSWORD_COST) || !salt || !key) {
    return false;
  }

  try {
    const expected = Buffer.from(key, "hex");
    const actual = await derivePassword(password, salt);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export async function createUserSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
  await db.insert(sessions).values({
    userId,
    tokenHash: digestToken(token),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentAuth(): Promise<CurrentAuth | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      agencyId: agencies.id,
      agencyName: agencies.name,
      agencyCity: agencies.city,
      subscriptionStatus: subscriptions.status,
      priceFcfa: subscriptions.priceFcfa,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      approvedPaymentCount: subscriptions.approvedPaymentCount,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(agencies, eq(users.agencyId, agencies.id))
    .leftJoin(subscriptions, eq(subscriptions.agencyId, agencies.id))
    .where(
      and(
        eq(sessions.tokenHash, digestToken(token)),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;

  const subscription: SubscriptionSnapshot = {
    status: row.subscriptionStatus ?? "pending",
    priceFcfa: row.priceFcfa ?? 25000,
    currentPeriodEnd: row.currentPeriodEnd,
    approvedPaymentCount: row.approvedPaymentCount ?? 0,
  };
  const hasAccess =
    subscription.status === "active" &&
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getTime() > Date.now();

  return {
    userId: row.userId,
    agencyId: row.agencyId,
    userName: row.userName,
    userEmail: row.userEmail,
    agencyName: row.agencyName,
    agencyCity: row.agencyCity,
    subscription,
    hasAccess,
  };
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, digestToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}
