import { getCurrentAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await getCurrentAuth();
  if (!auth) return Response.json({ error: "Connexion requise." }, { status: 401 });
  return Response.json({
    status: auth.subscription.status,
    hasAccess: auth.hasAccess,
    priceFcfa: auth.subscription.priceFcfa,
    currentPeriodEnd: auth.subscription.currentPeriodEnd,
  });
}
