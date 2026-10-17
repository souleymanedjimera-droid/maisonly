import { redirect } from "next/navigation";
import AuthForm from "@/components/auth-form";
import { getCurrentAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const auth = await getCurrentAuth();
  if (auth) redirect(auth.hasAccess ? "/" : "/billing");
  return <AuthForm mode="register" />;
}
