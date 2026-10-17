import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { maintenanceRequests } from "@/db/schema";
import { getCurrentAuth } from "@/lib/auth";

const statuses = ["open", "in_progress", "resolved"] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  if (!auth.hasAccess) {
    return Response.json({ error: "Abonnement actif requis." }, { status: 402 });
  }

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  const body: unknown = await request.json().catch(() => null);
  const status =
    body && typeof body === "object"
      ? (body as { status?: unknown }).status
      : undefined;

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !statuses.some((value) => value === status)
  ) {
    return Response.json({ error: "Mise à jour invalide." }, { status: 400 });
  }

  const [updated] = await db
    .update(maintenanceRequests)
    .set({ status: status as (typeof statuses)[number] })
    .where(
      and(
        eq(maintenanceRequests.id, id),
        eq(maintenanceRequests.agencyId, auth.agencyId),
      ),
    )
    .returning({ id: maintenanceRequests.id, status: maintenanceRequests.status });

  if (!updated) {
    return Response.json({ error: "Intervention introuvable." }, { status: 404 });
  }
  return Response.json(updated);
}
