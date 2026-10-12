import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const propertyTypes = ["apartment", "house", "studio", "commercial"] as const;
const propertyStatuses = ["occupied", "vacant", "maintenance"] as const;

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) {
    return Response.json(
      { error: "Un abonnement actif est nécessaire pour gérer votre espace.", code: "SUBSCRIPTION_REQUIRED" },
      { status: 402 },
    );
  }

  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.agencyId, auth.agencyId))
    .orderBy(desc(properties.createdAt));
  return Response.json(rows);
}

export async function POST(request: Request) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) {
    return Response.json(
      { error: "Un abonnement actif est nécessaire pour gérer votre espace.", code: "SUBSCRIPTION_REQUIRED" },
      { status: 402 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Données invalides." }, { status: 400 });
  }

  const values = body as Record<string, unknown>;
  const name = typeof values.name === "string" ? values.name.trim() : "";
  const address = typeof values.address === "string" ? values.address.trim() : "";
  const city = typeof values.city === "string" ? values.city.trim() : "";
  const postalCode = typeof values.postalCode === "string" ? values.postalCode.trim() : "";
  const surface = Number(values.surface);
  const rooms = Number(values.rooms);
  const monthlyRent = Number(values.monthlyRent ?? 0);
  const type = propertyTypes.find((item) => item === values.type);
  const status = propertyStatuses.find((item) => item === values.status);

  if (
    !name ||
    !address ||
    !city ||
    postalCode.length > 12 ||
    name.length > 160 ||
    address.length > 240 ||
    city.length > 120 ||
    !Number.isInteger(surface) ||
    surface < 1 ||
    !Number.isInteger(rooms) ||
    rooms < 1 ||
    !Number.isInteger(monthlyRent) ||
    monthlyRent < 0 ||
    !type
  ) {
    return Response.json({ error: "Vérifiez les informations du bien." }, { status: 400 });
  }

  const [created] = await db
    .insert(properties)
    .values({
      agencyId: auth.agencyId,
      name,
      address,
      city,
      postalCode,
      surface,
      rooms,
      monthlyRent,
      type,
      status: status ?? "vacant",
    })
    .returning({
      id: properties.id,
      name: properties.name,
      type: properties.type,
      address: properties.address,
      city: properties.city,
      postalCode: properties.postalCode,
      surface: properties.surface,
      rooms: properties.rooms,
      monthlyRent: properties.monthlyRent,
      status: properties.status,
    });

  return Response.json(created, { status: 201 });
}
