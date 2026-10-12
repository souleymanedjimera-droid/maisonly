import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentSubmissions, subscriptions } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/db-errors";
import {
  AVAILABLE_MONTHS,
  MONTHLY_PRICE_FCFA,
  PAYMENT_OPERATORS,
  formatFcfa,
  isValidSenegalPhone,
  isValidTransactionReference,
  normalizeSenegalPhone,
} from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });

  const rows = await db
    .select()
    .from(paymentSubmissions)
    .where(eq(paymentSubmissions.agencyId, auth.agencyId))
    .orderBy(desc(paymentSubmissions.createdAt), desc(paymentSubmissions.id))
    .limit(20);
  return Response.json(rows);
}

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Vérifiez les informations de paiement." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const operator = PAYMENT_OPERATORS.find((item) => item.id === input.operator);
  const reference =
    typeof input.reference === "string" ? input.reference.trim().replace(/\s+/g, "") : "";
  const rawPhone = typeof input.payerPhone === "string" ? input.payerPhone : "";
  const months = Number(input.months);
  const amountFcfa = Number(input.amountFcfa);
  const note = typeof input.note === "string" ? input.note.trim() : "";

  if (!operator) {
    return Response.json(
      { error: "Choisissez Wave, Orange Money ou Free Money." },
      { status: 400 },
    );
  }
  if (!isValidTransactionReference(reference)) {
    return Response.json(
      { error: "Saisissez l’identifiant de la transaction reçu par SMS (4 caractères minimum)." },
      { status: 400 },
    );
  }
  if (!isValidSenegalPhone(rawPhone)) {
    return Response.json(
      { error: "Saisissez un numéro sénégalais valide, par exemple 77 123 45 67." },
      { status: 400 },
    );
  }
  if (!AVAILABLE_MONTHS.some((value) => value === months)) {
    return Response.json({ error: "Choisissez une durée d’abonnement valide." }, { status: 400 });
  }
  if (!Number.isInteger(amountFcfa) || amountFcfa !== MONTHLY_PRICE_FCFA * months) {
    return Response.json(
      { error: `Le montant attendu est de ${formatFcfa(MONTHLY_PRICE_FCFA * months)} pour ${months} mois.` },
      { status: 400 },
    );
  }
  if (note.length > 500) {
    return Response.json({ error: "La note est trop longue." }, { status: 400 });
  }

  const [subscription] = await db
    .select({ currentPeriodEnd: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(eq(subscriptions.agencyId, auth.agencyId))
    .limit(1);
  if (!subscription) {
    return Response.json({ error: "Abonnement d’agence introuvable." }, { status: 404 });
  }

  try {
    const [created] = await db
      .insert(paymentSubmissions)
      .values({
        agencyId: auth.agencyId,
        operator: operator.id,
        reference,
        payerPhone: normalizeSenegalPhone(rawPhone),
        amountFcfa,
        months,
        note,
      })
      .returning({ id: paymentSubmissions.id, status: paymentSubmissions.status });

    await db
      .update(subscriptions)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(subscriptions.agencyId, auth.agencyId));

    return Response.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json(
        { error: "Cette référence de transaction a déjà été déclarée." },
        { status: 409 },
      );
    }
    console.error("Mobile money payment submission failed.");
    return Response.json(
      { error: "L’envoi du paiement a échoué. Réessayez dans un instant." },
      { status: 500 },
    );
  }
}
