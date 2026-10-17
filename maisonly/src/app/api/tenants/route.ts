import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";
import { isValidSenegalPhone, normalizeSenegalPhone } from "@/lib/pricing";
import { isUniqueViolation } from "@/lib/db-errors";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) return Response.json({ error: "Abonnement actif requis." }, { status: 402 });

  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.agencyId, auth.agencyId))
    .orderBy(asc(tenants.fullName));
  return Response.json(rows);
}

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) return Response.json({ error: "Abonnement actif requis." }, { status: 402 });

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Vérifiez les informations du locataire." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const profession = typeof input.profession === "string" ? input.profession.trim() : "";
  const idNumber = typeof input.idNumber === "string" ? input.idNumber.trim() : "";

  if (
    fullName.length < 2 ||
    fullName.length > 160 ||
    email.length > 180 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !isValidSenegalPhone(phone) ||
    profession.length > 120 ||
    idNumber.length > 60
  ) {
    return Response.json(
      {
        error: !isValidSenegalPhone(phone)
          ? "Saisissez un numéro sénégalais valide, par exemple 77 123 45 67."
          : "Le nom et une adresse e-mail valide sont obligatoires.",
      },
      { status: 400 },
    );
  }

  try {
    const [created] = await db
      .insert(tenants)
      .values({
        agencyId: auth.agencyId,
        fullName,
        email,
        phone: normalizeSenegalPhone(phone),
        profession,
        idNumber,
      })
      .returning({
        id: tenants.id,
        fullName: tenants.fullName,
        email: tenants.email,
        phone: tenants.phone,
        profession: tenants.profession,
        idNumber: tenants.idNumber,
      });
    return Response.json(created, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return Response.json({ error: "Ce locataire existe déjà." }, { status: 409 });
    }
    console.error("Tenant creation failed.");
    return Response.json({ error: "La création a échoué." }, { status: 500 });
  }
}
