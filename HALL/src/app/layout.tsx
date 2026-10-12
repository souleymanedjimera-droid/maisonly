import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./marketing.css";

export const metadata: Metadata = {
  title: "maisonly — Gestion immobilière pour agences au Sénégal",
  description:
    "Agences immobilières du Sénégal : gérez vos biens, vos loyers et vos interventions dans un espace privé. Abonnement mensuel payable par Wave, Orange Money ou Free Money.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
