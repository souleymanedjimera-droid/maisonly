export const MONTHLY_PRICE_FCFA = 25000;

export const AVAILABLE_MONTHS = [1, 3, 12] as const;
export type PaymentMonths = (typeof AVAILABLE_MONTHS)[number];

export type PaymentOperatorId = "wave" | "orange_money" | "free_money";

export const PAYMENT_OPERATORS: {
  id: PaymentOperatorId;
  label: string;
  description: string;
}[] = [
  { id: "wave", label: "Wave", description: "Numéro Wave de l’agence maisonly" },
  {
    id: "orange_money",
    label: "Orange Money",
    description: "Numéro Orange Money de l’agence maisonly",
  },
  {
    id: "free_money",
    label: "Free Money",
    description: "Numéro Free Money de l’agence maisonly",
  },
];

export const OPERATOR_LABELS: Record<PaymentOperatorId, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  free_money: "Free Money",
};

export function formatFcfa(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(amount)} FCFA`;
}

export function paymentNumbers() {
  return {
    wave: process.env.WAVE_PAYMENT_NUMBER ?? "",
    orange_money: process.env.ORANGE_MONEY_PAYMENT_NUMBER ?? "",
    free_money: process.env.FREE_MONEY_PAYMENT_NUMBER ?? "",
  } satisfies Record<PaymentOperatorId, string>;
}

/** Normalize a Senegalese mobile number to its 9-digit national form. */
export function normalizeSenegalPhone(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  const withoutCountryCode = digits.startsWith("221")
    ? digits.slice(3)
    : digits;
  return withoutCountryCode;
}

export function isValidSenegalPhone(raw: string) {
  const national = normalizeSenegalPhone(raw);
  return /^7[05678]\d{7}$/.test(national);
}

export function isValidTransactionReference(raw: string) {
  const trimmed = raw.trim();
  return trimmed.length >= 4 && trimmed.length <= 80;
}
