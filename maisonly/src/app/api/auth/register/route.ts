import { db } from "@/db";
import { agencies, subscriptions, users } from "@/db/schema";
import { createUserSession, hashPassword } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/db-errors";
import { MONTHLY_PRICE_FCFA, isValidSenegalPhone, normalizeSenegalPhone } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Vérifiez les informations saisies." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const agencyName =
    typeof input.agencyName === "string" ? input.agencyName.trim() : "";
  const agencyCity = typeof input.agencyCity === "string" ? input.agencyCity.trim() : "";
  const rawPhone = typeof input.contactPhone === "string" ? input.contactPhone.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const acceptedTerms = input.acceptedTerms === true;

  if (
    name.length < 2 ||
    name.length > 160 ||
    agencyName.length < 2 ||
    agencyName.length > 180 ||
    agencyCity.length > 120 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 12 ||
    password.length > 128 ||
    !acceptedTerms
  ) {
    return Response.json(
      {
        error:
          password.length < 12
            ? "Choisissez un mot de passe d’au moins 12 caractères."
            : !acceptedTerms
              ? "Veuillez accepter les conditions pour créer votre compte."
              : "Vérifiez le nom, l’agence et l’adresse e-mail renseignés.",
      },
      { status: 400 },
    );
  }
  if (rawPhone && !isValidSenegalPhone(rawPhone)) {
    return Response.json(
      { error: "Saisissez un numéro sénégalais valide, par exemple 77 123 45 67." },
      { status: 400 },
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const account = await db.transaction(async (tx) => {
      const [agency] = await tx
        .insert(agencies)
        .values({
          name: agencyName,
          city: agencyCity || "Dakar",
          contactPhone: rawPhone ? normalizeSenegalPhone(rawPhone) : "",
        })
        .returning({ id: agencies.id });

      const [user] = await tx
        .insert(users)
        .values({
          agencyId: agency.id,
          name,
          email,
          passwordHash,
        })
        .returning({ id: users.id });

      await tx.insert(subscriptions).values({
        agencyId: agency.id,
        status: "pending",
        priceFcfa: MONTHLY_PRICE_FCFA,
      });

      return { agencyId: agency.id, userId: user.id };
    });

    await createUserSession(account.userId);
    return Response.json({ ok: true, next: "/billing" }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json(
        { error: "Un compte existe déjà avec cette adresse e-mail." },
        { status: 409 },
      );
    }
    console.error("Agency registration failed.");
    return Response.json(
      { error: "La création du compte a échoué. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
