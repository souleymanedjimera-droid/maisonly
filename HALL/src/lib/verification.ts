import "server-only";

import { randomBytes } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Human-readable, unambiguous code used on receipts and tenant passports. */
export function generateVerificationCode(prefix: string) {
  const bytes = randomBytes(10);
  let body = "";
  for (const byte of bytes) {
    body += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return `${prefix}-${body.slice(0, 6)}`;
}

export type PassportHistoryEntry = {
  property: string;
  city: string;
  from: string;
  to: string;
  rent: number;
  paidMonths: number;
  lateMonths: number;
};

export type PassportProfile = {
  tenantName: string;
  profession: string;
  agencyName: string;
  agencyCity: string;
  verifiedSince: string;
  totalPaid: number;
  onTimePayments: number;
  latePayments: number;
  punctualityRate: number;
  history: PassportHistoryEntry[];
};

export function passportGrade(rate: number) {
  if (rate >= 95) return { label: "Excellent payeur", tone: "excellent" };
  if (rate >= 80) return { label: "Bon payeur", tone: "good" };
  if (rate >= 60) return { label: "Payeur irrégulier", tone: "average" };
  if (rate > 0) return { label: "Risque élevé", tone: "risk" };
  return { label: "Historique insuffisant", tone: "unknown" };
}
