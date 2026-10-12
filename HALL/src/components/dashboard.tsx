"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

type PropertyType = "apartment" | "house" | "studio" | "commercial";
type PropertyStatus = "occupied" | "vacant" | "maintenance";
type PaymentStatus = "paid" | "pending" | "late";
type MaintenanceStatus = "open" | "in_progress" | "resolved";
type Section = "overview" | "properties" | "tenants" | "leases" | "finances" | "maintenance";
type PropertyRecord = {
  id: number; name: string; type: PropertyType; address: string; city: string;
  postalCode: string; surface: number; rooms: number; monthlyRent: number; status: PropertyStatus;
};
type TenantRecord = {
  id: number; fullName: string; email: string; phone: string; profession: string; idNumber: string;
};
type PassportRecord = { tenantId: number; code: string; status: "active" | "revoked"; checkCount: number };
type LeaseRecord = {
  id: number; propertyId: number; tenantId: number; monthlyRent: number; charges: number;
  caution: number; cautionPaid: boolean; paymentDay: number; startDate: string; endDate: string;
  status: "active" | "ending" | "ended";
};
type PaymentRecord = {
  id: number; leaseId: number; period: string; amount: number; dueDate: string;
  status: PaymentStatus; paidAt: string | Date | null; receiptCode: string;
};
type MaintenanceRecord = {
  id: number; propertyId: number; title: string; detail: string;
  priority: "low" | "normal" | "high"; status: MaintenanceStatus; reportedAt: string;
};
type DashboardData = {
  properties: PropertyRecord[]; tenants: TenantRecord[]; leases: LeaseRecord[];
  payments: PaymentRecord[]; maintenance: MaintenanceRecord[];
};
type IconName =
  | "overview" | "building" | "users" | "wallet" | "wrench" | "plus" | "search" | "bell"
  | "chevron" | "arrow" | "check" | "clock" | "pin" | "home" | "calendar" | "close"
  | "filter" | "sparkle" | "phone" | "mail" | "dots" | "trend" | "receipt" | "logout" | "shield";

type DashboardProps = {
  initialData: DashboardData;
  agencyName: string;
  userName: string;
  passports: PassportRecord[];
};

const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: "Appartement", house: "Maison / Villa", studio: "Studio / Chambre", commercial: "Boutique / Bureau",
};
const propertyStatusLabels: Record<PropertyStatus, string> = {
  occupied: "Loué", vacant: "Disponible", maintenance: "En travaux",
};
const paymentStatusLabels: Record<PaymentStatus, string> = {
  paid: "Réglé", pending: "À venir", late: "En retard",
};
const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  open: "À traiter", in_progress: "En cours", resolved: "Terminée",
};
const sectionLabels: Record<Section, string> = {
  overview: "Vue d’ensemble", properties: "Mes biens", tenants: "Locataires",
  leases: "Baux & contrats", finances: "Finances", maintenance: "Maintenance",
};
const navItems: { id: Section; label: string; icon: IconName }[] = [
  { id: "overview", label: "Vue d’ensemble", icon: "overview" },
  { id: "properties", label: "Mes biens", icon: "building" },
  { id: "tenants", label: "Locataires", icon: "users" },
  { id: "leases", label: "Baux & contrats", icon: "calendar" },
  { id: "finances", label: "Finances", icon: "wallet" },
  { id: "maintenance", label: "Maintenance", icon: "wrench" },
];

function Icon({ name, size = 19, strokeWidth = 1.8 }: { name: IconName; size?: number; strokeWidth?: number }) {
  const drawings: Record<IconName, ReactNode> = {
    overview: (<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" /><rect x="13.5" y="10.5" width="7" height="10" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /></>),
    building: (<><path d="M4 21V5.5A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5V21M2 21h20M8 8h1m3 0h1M8 12h1m3 0h1M8 16h1m3 0h1M18 10h1.5a1.5 1.5 0 0 1 1.5 1.5V21" /></>),
    users: (<><path d="M16 21v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V21M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 3.3a4 4 0 0 1 0 7.7m2 4.5a4 4 0 0 1 3 3.8V21" /></>),
    wallet: (<><rect x="3" y="5" width="18" height="15" rx="2.5" /><path d="M3 9h18M16 14h.01M7 5V3.5A1.5 1.5 0 0 1 8.5 2H19" /></>),
    wrench: (<><path d="M14.5 6.5a5 5 0 0 0-6.9 6.9l-5.3 5.3a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.9-6.9l-3 3-3-3 3-3Z" /></>),
    plus: <path d="M12 5v14m-7-7h14" />,
    search: (<><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>),
    bell: (<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>),
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>),
    pin: (<><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>),
    home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1Z" />,
    calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></>),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    filter: (<><path d="M4 7h16M7 12h10m-7 5h4" /><circle cx="8" cy="7" r="1.5" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.5" fill="currentColor" stroke="none" /></>),
    sparkle: (<><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>),
    phone: <path d="M21 16.5v3a1.5 1.5 0 0 1-1.6 1.5A18.9 18.9 0 0 1 11.2 18a18.6 18.6 0 0 1-5.7-5.7A18.9 18.9 0 0 1 3 4.6 1.5 1.5 0 0 1 4.5 3h3a1.5 1.5 0 0 1 1.5 1.3c.1 1 .4 2 .7 2.9a1.5 1.5 0 0 1-.3 1.6L8.1 10a15 15 0 0 0 5.9 5.9l1.2-1.3a1.5 1.5 0 0 1 1.6-.3c.9.3 1.9.6 2.9.7a1.5 1.5 0 0 1 1.3 1.5Z" />,
    mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>),
    dots: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
    trend: <path d="m3 17 6-6 4 4 8-8m-6 0h6v6" />,
    receipt: (<><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h2" /></>),
    logout: (<><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>),
    shield: (<><path d="M12 22s8-4 8-10V5.5L12 2 4 5.5V12c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>),
  };
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {drawings[name]}
    </svg>
  );
}

function fcfa(value: number) {
  if (value >= 1_000_000) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value / 1_000_000)} M FCFA`;
  }
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} F`;
}
function currentPeriod() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}
function periodLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" })
    .format(new Date(`${value}-01T12:00:00`));
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
function plusYears(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + n);
  return d.toISOString().slice(0, 10);
}

function MetricCard({ icon, label, value, detail, tone }: {
  icon: IconName; label: string; value: string; detail: string; tone: "green" | "blue" | "peach" | "lavender";
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-icon--${tone}`}><Icon name={icon} size={19} /></div>
      <p className="metric-label">{label}</p>
      <div className="metric-value">{value}</div>
      <p className="metric-detail">{detail}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-dot" />{propertyStatusLabels[status]}
    </span>
  );
}

function PropertyArtwork({ index, status }: { index: number; status: PropertyStatus }) {
  return (
    <div className={`property-artwork property-artwork--${index % 5}`}>
      <div className="art-sun" />
      <div className="art-hill art-hill--back" /><div className="art-hill art-hill--front" />
      <div className="art-building art-building--main">
        <div className="art-window-grid">{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</div>
      </div>
      <div className="art-building art-building--side">
        <div className="art-window-grid art-window-grid--small">{Array.from({ length: 8 }, (_, i) => <span key={i} />)}</div>
      </div>
      <span className="art-status"><StatusBadge status={status} /></span>
    </div>
  );
}

function PropertyCard({ property, index }: { property: PropertyRecord; index: number }) {
  return (
    <article className="property-card">
      <PropertyArtwork index={index} status={property.status} />
      <div className="property-card-body">
        <div className="property-card-heading">
          <div>
            <p className="property-type-label">{propertyTypeLabels[property.type]}</p>
            <h3>{property.name}</h3>
          </div>
          <button className="icon-button property-menu" type="button" aria-label={`Options pour ${property.name}`}><Icon name="dots" /></button>
        </div>
        <p className="property-address"><Icon name="pin" size={14} />{property.city} · {property.address}</p>
        <div className="property-card-footer">
          <span>{property.surface} m² <i /> {property.rooms} pièces</span>
          <strong>{property.monthlyRent ? fcfa(property.monthlyRent) : "—"}<small> / mois</small></strong>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ icon, title, detail }: { icon: IconName; title: string; detail: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><Icon name={icon} size={24} /></div>
      <h3>{title}</h3><p>{detail}</p>
    </div>
  );
}

export default function Dashboard({ initialData, agencyName, userName, passports: initialPassports }: DashboardProps) {
  const [data, setData] = useState(initialData);
  const [passports, setPassports] = useState<PassportRecord[]>(initialPassports);
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PropertyStatus>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyPayments, setBusyPayments] = useState<number[]>([]);
  const [busyMaintenance, setBusyMaintenance] = useState<number[]>([]);
  const [busyPassport, setBusyPassport] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const period = currentPeriod();
  const currentPayments = data.payments.filter((p) => p.period === period);
  const activeLeases = data.leases.filter((l) => l.status !== "ended");
  const monthlyIncome = activeLeases.reduce((t, l) => t + l.monthlyRent + l.charges, 0);
  const paidThisMonth = currentPayments.filter((p) => p.status === "paid").reduce((t, p) => t + p.amount, 0);
  const unpaidPayments = currentPayments.filter((p) => p.status !== "paid");
  const outstandingAmount = unpaidPayments.reduce((t, p) => t + p.amount, 0);
  const occupiedCount = data.properties.filter((p) => p.status === "occupied").length;
  const occupancyRate = data.properties.length ? Math.round((occupiedCount / data.properties.length) * 100) : 0;
  const openMaintenance = data.maintenance.filter((r) => r.status !== "resolved");
  const totalCaution = activeLeases.reduce((t, l) => t + l.caution, 0);
  const activePassports = passports.filter((p) => p.status === "active");

  const people = (payment: PaymentRecord) => {
    const lease = data.leases.find((l) => l.id === payment.leaseId);
    return {
      tenant: data.tenants.find((t) => t.id === lease?.tenantId),
      property: data.properties.find((p) => p.id === lease?.propertyId),
    };
  };
  const passportOf = (tenantId: number) => passports.find((p) => p.tenantId === tenantId);

  const monthlySeries = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const amount = data.payments
        .filter((p) => p.period === key && p.status === "paid")
        .reduce((total, p) => total + p.amount, 0);
      return {
        key,
        label: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", ""),
        amount, isCurrent: key === period,
      };
    });
  }, [data.payments, period]);
  const chartMax = Math.max(monthlyIncome, ...monthlySeries.map((m) => m.amount), 1);

  const visibleProperties = data.properties.filter((property) => {
    const matchesFilter = statusFilter === "all" || property.status === statusFilter;
    const needle = search.trim().toLocaleLowerCase("fr-FR");
    const matchesSearch = !needle ||
      `${property.name} ${property.address} ${property.city}`.toLocaleLowerCase("fr-FR").includes(needle);
    return matchesFilter && matchesSearch;
  });

  async function handlePropertySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/properties", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""), type: String(form.get("type") ?? "apartment"),
          address: String(form.get("address") ?? ""), city: String(form.get("city") ?? ""),
          postalCode: String(form.get("postalCode") ?? ""), surface: Number(form.get("surface")),
          rooms: Number(form.get("rooms")), monthlyRent: Number(form.get("monthlyRent") || 0),
          status: String(form.get("status") ?? "vacant"),
        }),
      });
      const result = (await response.json()) as PropertyRecord & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Impossible d’ajouter ce bien.");
      setData((previous) => ({ ...previous, properties: [result, ...previous.properties] }));
      setModalOpen(false); setSection("properties"); setStatusFilter("all"); setSearch("");
      setToast("Votre bien a bien été ajouté au portefeuille.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally { setSaving(false); }
  }

  async function handleTenantSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/tenants", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: String(form.get("fullName") ?? ""), email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""), profession: String(form.get("profession") ?? ""),
          idNumber: String(form.get("idNumber") ?? ""),
        }),
      });
      const result = (await response.json()) as TenantRecord & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Création impossible.");
      setData((previous) => ({ ...previous, tenants: [...previous.tenants, result] }));
      setTenantModalOpen(false); setSection("tenants");
      setToast("Locataire ajouté à votre agence.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally { setSaving(false); }
  }

  async function handleLeaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      const response = await fetch("/api/leases", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: Number(form.get("propertyId")), tenantId: Number(form.get("tenantId")),
          monthlyRent: Number(form.get("monthlyRent")), charges: Number(form.get("charges") || 0),
          caution: Number(form.get("caution") || 0), cautionPaid: form.get("cautionPaid") === "on",
          paymentDay: Number(form.get("paymentDay") || 5),
          startDate: String(form.get("startDate") ?? ""), endDate: String(form.get("endDate") ?? ""),
        }),
      });
      const result = (await response.json()) as LeaseRecord & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Création impossible.");
      setData((previous) => ({
        ...previous,
        leases: [...previous.leases, result],
        payments: [
          ...previous.payments,
          {
            id: Date.now(), leaseId: result.id,
            period: result.startDate.slice(0, 7), amount: result.monthlyRent,
            dueDate: `${result.startDate.slice(0, 7)}-${String(result.paymentDay).padStart(2, "0")}`,
            status: "pending" as PaymentStatus, paidAt: null, receiptCode: "",
          },
        ],
        properties: previous.properties.map((property) =>
          property.id === result.propertyId ? { ...property, status: "occupied" as PropertyStatus } : property),
      }));
      setLeaseModalOpen(false); setSection("leases");
      setToast("Bail créé : le premier loyer est déjà planifié.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally { setSaving(false); }
  }

  async function handlePassport(tenantId: number, action: "issue" | "revoke") {
    setBusyPassport(tenantId);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/passport`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as { code?: string; status?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Action impossible.");
      if (action === "issue" && result.code) {
        setPassports((previous) => [
          ...previous.filter((p) => p.tenantId !== tenantId),
          { tenantId, code: result.code as string, status: "active", checkCount: 0 },
        ]);
        setToast(`Passeport actif · code ${result.code}`);
      } else {
        setPassports((previous) =>
          previous.map((p) => (p.tenantId === tenantId ? { ...p, status: "revoked" } : p)));
        setToast("Passeport locataire révoqué : le lien partagé ne fonctionne plus.");
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally { setBusyPassport(null); }
  }

  async function markPaymentPaid(paymentId: number) {
    setBusyPayments((previous) => [...previous, paymentId]);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, { method: "PATCH" });
      const result = (await response.json()) as { receiptCode?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Mise à jour impossible.");
      setData((previous) => ({
        ...previous,
        payments: previous.payments.map((payment) =>
          payment.id === paymentId
            ? { ...payment, status: "paid", paidAt: new Date().toISOString(), receiptCode: result.receiptCode ?? payment.receiptCode }
            : payment),
      }));
      setToast("Loyer encaissé : la quittance est disponible.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setBusyPayments((previous) => previous.filter((id) => id !== paymentId));
    }
  }

  async function updateMaintenance(requestId: number, status: MaintenanceStatus) {
    setBusyMaintenance((previous) => [...previous, requestId]);
    try {
      const response = await fetch(`/api/maintenance/${requestId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("L’intervention n’a pas pu être mise à jour.");
      setData((previous) => ({
        ...previous,
        maintenance: previous.maintenance.map((item) => (item.id === requestId ? { ...item, status } : item)),
      }));
      setToast(status === "resolved" ? "Intervention terminée." : "Intervention prise en charge.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setBusyMaintenance((previous) => previous.filter((id) => id !== requestId));
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  function goTo(nextSection: Section) {
    setSection(nextSection); setMobileMenuOpen(false); setNotificationsOpen(false);
  }

  const dateLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const pageDescriptions: Record<Section, string> = {
    overview: "Tout votre patrimoine, en un seul endroit.",
    properties: "Un aperçu clair de votre parc immobilier.",
    tenants: "Vos locataires et leur passeport de fiabilité.",
    leases: "Caution, charges et échéances de chaque bail.",
    finances: "Suivez vos loyers et gardez le cap sur vos revenus.",
    maintenance: "Chaque demande au bon endroit, au bon moment.",
  };
  const seniority = (iso: string) => {
    const months = Math.max(0, Math.round((Date.now() - new Date(`${iso}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    return months < 1 ? "Nouveau" : months < 12 ? `${months} mois d’ancienneté` : `${Math.floor(months / 12)} an(s)`;
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Aller au contenu principal</a>
      {mobileMenuOpen && <button className="mobile-scrim" aria-label="Fermer le menu" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar--open" : ""}`}>
        <div className="brand-lockup"><div className="brand-mark"><span /><span /><span /><span /></div><span className="brand-name">maisonly</span></div>
        <div className="workspace-card">
          <div className="workspace-avatar">{initials(agencyName) || "AG"}</div>
          <div className="workspace-copy"><strong>{agencyName}</strong><span>{userName}</span></div>
          <Icon name="chevron" size={15} />
        </div>
        <p className="sidebar-caption">ESPACE DE TRAVAIL</p>
        <nav className="primary-nav" aria-label="Navigation principale">
          {navItems.map((item) => {
            const badge = item.id === "properties" ? data.properties.length
              : item.id === "maintenance" ? openMaintenance.length
              : item.id === "leases" ? activeLeases.length
              : item.id === "tenants" ? data.tenants.length : null;
            return (
              <button key={item.id} type="button"
                className={`nav-link ${section === item.id ? "nav-link--active" : ""}`}
                onClick={() => goTo(item.id)} aria-current={section === item.id ? "page" : undefined}>
                <Icon name={item.icon} size={19} /><span>{item.label}</span>
                {badge !== null && <span className={`nav-badge ${item.id === "maintenance" && badge > 0 ? "nav-badge--alert" : ""}`}>{badge}</span>}
              </button>
            );
          })}
          <a className="nav-link billing-nav-link" href="/billing" onClick={() => setMobileMenuOpen(false)}>
            <Icon name="receipt" size={19} /><span>Mon abonnement</span>
          </a>
        </nav>
        <div className="sidebar-tip">
          <div className="tip-icon"><Icon name="shield" size={17} /></div>
          <strong>Passeports actifs</strong>
          <p>{activePassports.length} locataire(s) ont un historique vérifiable en ligne.</p>
          <button type="button" onClick={() => goTo("tenants")}>Gérer les passeports <Icon name="arrow" size={14} /></button>
        </div>
        <div className="sidebar-footer">
          <div className="footer-avatar">{initials(userName) || "AG"}</div>
          <div><strong>{userName}</strong><span>{agencyName}</span></div>
          <button className="icon-button sidebar-more" type="button" aria-label="Se déconnecter" title="Se déconnecter" onClick={handleLogout}><Icon name="logout" size={17} /></button>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" type="button" aria-label="Ouvrir le menu" onClick={() => setMobileMenuOpen(true)}>
            <span className="menu-lines"><i /><i /><i /></span>
          </button>
          <div className="topbar-breadcrumb"><span>Mon espace</span><Icon name="chevron" size={14} /><strong>{sectionLabels[section]}</strong></div>
          <div className="topbar-actions">
            <label className="global-search">
              <Icon name="search" size={17} />
              <input aria-label="Rechercher un bien" placeholder="Rechercher un bien..." value={search}
                onChange={(event) => { setSearch(event.target.value); if (event.target.value) setSection("properties"); }} />
              <kbd>⌘ K</kbd>
            </label>
            <div className="notification-wrap">
              <button className={`icon-button notification-button ${notificationsOpen ? "icon-button--selected" : ""}`} type="button"
                aria-label="Notifications" aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}>
                <Icon name="bell" size={19} />
                {unpaidPayments.length + openMaintenance.length > 0 && <span className="notification-dot" />}
              </button>
              {notificationsOpen && (
                <div className="notification-popover">
                  <div className="popover-heading"><strong>À ne pas manquer</strong><span>{unpaidPayments.length + openMaintenance.length}</span></div>
                  {unpaidPayments.length > 0 && <button type="button" onClick={() => goTo("finances")}><span className="popover-icon popover-icon--peach"><Icon name="wallet" size={16} /></span><span><strong>{unpaidPayments.length} loyer{unpaidPayments.length > 1 ? "s" : ""} à suivre</strong><small>{fcfa(outstandingAmount)} à percevoir ce mois</small></span><Icon name="chevron" size={15} /></button>}
                  {openMaintenance.length > 0 && <button type="button" onClick={() => goTo("maintenance")}><span className="popover-icon popover-icon--green"><Icon name="wrench" size={16} /></span><span><strong>{openMaintenance.length} intervention{openMaintenance.length > 1 ? "s" : ""}</strong><small>Gardez un œil sur vos demandes</small></span><Icon name="chevron" size={15} /></button>}
                  {unpaidPayments.length === 0 && openMaintenance.length === 0 && <p className="popover-empty">Tout est à jour, bravo !</p>}
                </div>
              )}
            </div>
            <button className="topbar-profile" type="button" title="Gérer l’abonnement" onClick={() => window.location.assign("/billing")}>
              <div className="profile-avatar">{initials(userName) || "AG"}</div><span>{userName.split(/\s+/)[0]}</span><Icon name="chevron" size={14} />
            </button>
          </div>
        </header>

        <main className="dashboard-content" id="main-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">{section === "overview" ? dateLabel : "VOTRE ESPACE MAISONLY"}</p>
              <h1>{section === "overview" ? <>Bonjour {userName.split(/\s+/)[0]} <span className="heading-sparkle">✳</span></> : sectionLabels[section]}</h1>
              <p className="page-description">{pageDescriptions[section]}</p>
            </div>
            <div className="heading-actions">
              {section === "tenants" && <button className="button button--soft" type="button" onClick={() => setTenantModalOpen(true)}><Icon name="users" size={17} /> Ajouter un locataire</button>}
              {section === "leases" && <button className="button button--soft" type="button" onClick={() => setLeaseModalOpen(true)}><Icon name="calendar" size={17} /> Créer un bail</button>}
              <button className="button button--primary" type="button" onClick={() => setModalOpen(true)}><Icon name="plus" size={18} /> Ajouter un bien</button>
            </div>
          </div>

          {section === "overview" && (<>
            <section className="metrics-grid" aria-label="Indicateurs clés">
              <MetricCard icon="building" label="Biens sous gestion" value={String(data.properties.length).padStart(2, "0")}
                detail={`${occupiedCount} loués · ${data.properties.filter((p) => p.status === "vacant").length} disponible(s)`} tone="green" />
              <MetricCard icon="trend" label="Taux d’occupation" value={`${occupancyRate}%`} detail="sur l’ensemble de votre parc" tone="blue" />
              <MetricCard icon="wallet" label="Revenus mensuels" value={fcfa(monthlyIncome)} detail={`${activeLeases.length} baux en cours`} tone="lavender" />
              <MetricCard icon="shield" label="Cautions détenues" value={fcfa(totalCaution)} detail={`${activePassports.length} passeport(s) actif(s)`} tone="peach" />
            </section>

            <section className="overview-grid">
              <article className="panel revenue-panel">
                <div className="panel-heading">
                  <div><p className="panel-kicker">VOTRE ACTIVITÉ</p><h2>Revenus locatifs</h2></div>
                  <button className="select-pill" type="button" aria-label="Période affichée"><Icon name="calendar" size={15} /> 6 derniers mois <Icon name="chevron" size={14} /></button>
                </div>
                <div className="chart-summary"><strong>{fcfa(paidThisMonth)}</strong><span className="chart-current-label"><span className="live-dot" /> {periodLabel(period)}</span><span className="chart-target">Potentiel mensuel <b>{fcfa(monthlyIncome)}</b></span></div>
                <div className="chart" aria-label="Graphique des loyers encaissés sur les six derniers mois">
                  <div className="chart-axis"><span>{fcfa(chartMax)}</span><span>{fcfa(Math.round(chartMax * 0.66))}</span><span>{fcfa(Math.round(chartMax * 0.33))}</span><span>0 F</span></div>
                  <div className="chart-bars-wrap">
                    <div className="chart-guides"><i /><i /><i /><i /></div>
                    <div className="chart-bars">
                      {monthlySeries.map((month) => (
                        <div className={`chart-bar-column ${month.isCurrent ? "chart-bar-column--current" : ""}`} key={month.key}>
                          <div className="chart-bar-slot">
                            <div className="chart-bar" style={{ height: `${Math.max(month.amount > 0 ? 8 : 0, (month.amount / chartMax) * 100)}%` }}
                              title={`${month.label} : ${fcfa(month.amount)}`} />
                          </div>
                          <span className="chart-month">{month.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="chart-legend"><span><i className="legend-square" /> Loyers encaissés</span><span><i className="legend-line" /> Potentiel locatif</span></div>
              </article>

              <article className="panel follow-panel">
                <div className="panel-heading">
                  <div><p className="panel-kicker">PETIT RAPPEL</p><h2>À suivre</h2></div>
                  <span className="count-pill">{unpaidPayments.length + openMaintenance.length}</span>
                </div>
                {unpaidPayments.length > 0 ? (
                  <div className="follow-payment">
                    <div className="follow-payment-top"><span className="alert-tag"><span /> {unpaidPayments[0].status === "late" ? "LOYER EN RETARD" : "LOYER À SUIVRE"}</span><span className="follow-amount">{fcfa(unpaidPayments[0].amount)}</span></div>
                    <div className="follow-tenant">
                      <div className="avatar avatar--coral">{initials(people(unpaidPayments[0]).tenant?.fullName ?? "Locataire")}</div>
                      <div><strong>{people(unpaidPayments[0]).tenant?.fullName ?? "Locataire"}</strong><span>{people(unpaidPayments[0]).property?.name ?? "Bien immobilier"}</span></div>
                    </div>
                    <div className="follow-payment-bottom">
                      <span><Icon name="clock" size={14} /> Échéance : {formatDate(unpaidPayments[0].dueDate)}</span>
                      <button type="button" className="text-action" disabled={busyPayments.includes(unpaidPayments[0].id)} onClick={() => markPaymentPaid(unpaidPayments[0].id)}>
                        {busyPayments.includes(unpaidPayments[0].id) ? "Mise à jour…" : "Marquer réglé"}<Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="follow-all-clear"><span><Icon name="check" size={17} /></span><div><strong>Tout est à jour</strong><small>Aucun loyer en attente pour ce mois.</small></div></div>
                )}
                <div className="follow-divider" />
                <div className="follow-task-list">
                  <button type="button" className="follow-task" onClick={() => goTo("maintenance")}>
                    <span className="follow-task-icon follow-task-icon--orange"><Icon name="wrench" size={16} /></span>
                    <span><strong>Demandes d’intervention</strong><small>{openMaintenance.length ? `${openMaintenance.length} à traiter` : "Aucune demande en cours"}</small></span>
                    <Icon name="chevron" size={16} />
                  </button>
                  {activeLeases.some((lease) => new Date(`${lease.endDate}T12:00:00`).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 90) && (
                    <button type="button" className="follow-task" onClick={() => goTo("leases")}>
                      <span className="follow-task-icon follow-task-icon--blue"><Icon name="calendar" size={16} /></span>
                      <span><strong>Un bail arrive à échéance</strong><small>À renouveler dans les 3 prochains mois</small></span>
                      <Icon name="chevron" size={16} />
                    </button>
                  )}
                </div>
              </article>
            </section>

            <section className="property-preview-section">
              <div className="section-heading">
                <div><p className="panel-kicker">VOTRE PORTEFEUILLE</p><h2>Les biens en un coup d’œil <span>{data.properties.length}</span></h2></div>
                <button className="text-action" type="button" onClick={() => goTo("properties")}>Voir tous mes biens <Icon name="arrow" size={15} /></button>
              </div>
              {data.properties.length > 0 ? (
                <div className="property-preview-grid">{data.properties.slice(0, 3).map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}</div>
              ) : (
                <div className="panel"><EmptyState icon="building" title="Votre parc commence ici" detail="Ajoutez votre premier bien pour suivre votre patrimoine." /></div>
              )}
            </section>
          </>)}

          {section === "properties" && (
            <section className="section-content">
              <div className="section-toolbar">
                <div className="filter-pills" role="group" aria-label="Filtrer les biens">
                  {(["all", "occupied", "vacant", "maintenance"] as const).map((filter) => {
                    const label = filter === "all" ? "Tous les biens" : propertyStatusLabels[filter];
                    const count = filter === "all" ? data.properties.length : data.properties.filter((p) => p.status === filter).length;
                    return <button key={filter} className={`filter-pill ${statusFilter === filter ? "filter-pill--active" : ""}`} type="button" onClick={() => setStatusFilter(filter)}>{label}<span>{count}</span></button>;
                  })}
                </div>
                <span className="result-count"><Icon name="filter" size={15} /> {visibleProperties.length} résultat(s)</span>
              </div>
              {visibleProperties.length > 0 ? (
                <div className="property-list-grid">{visibleProperties.map((property, index) => <PropertyCard key={property.id} property={property} index={index} />)}</div>
              ) : (
                <div className="panel"><EmptyState icon="search" title="Aucun bien trouvé" detail="Essayez un autre mot-clé ou modifiez les filtres." /></div>
              )}
            </section>
          )}

          {section === "tenants" && (
            <section className="section-content">
              <div className="passport-banner">
                <span className="passport-banner-icon"><Icon name="shield" size={21} /></span>
                <div>
                  <strong>Passeport locataire · votre avantage exclusif</strong>
                  <p>Donnez à chaque bon locataire un code vérifiable en ligne. Les autres agences et les propriétaires contrôlent son historique réel — plus personne ne se fie aux fausses références papier.</p>
                </div>
                <a className="button button--soft" href="/verifier" target="_blank" rel="noreferrer">Voir le portail public <Icon name="arrow" size={15} /></a>
              </div>
              {data.tenants.length > 0 ? (
                <div className="tenant-grid">
                  {data.tenants.map((tenant, index) => {
                    const lease = activeLeases.find((l) => l.tenantId === tenant.id);
                    const property = data.properties.find((p) => p.id === lease?.propertyId);
                    const passport = passportOf(tenant.id);
                    const active = passport?.status === "active";
                    return (
                      <article className="tenant-card" key={tenant.id}>
                        <div className="tenant-card-top">
                          <div className={`avatar avatar--${["green", "lavender", "coral", "blue"][index % 4]}`}>{initials(tenant.fullName)}</div>
                          <span className={`tenant-lease-badge ${lease ? "tenant-lease-badge--active" : ""}`}><i />{lease ? seniority(lease.startDate) : "Sans bail"}</span>
                        </div>
                        <h3>{tenant.fullName}</h3>
                        {tenant.profession && <p className="tenant-profession">{tenant.profession}{tenant.idNumber ? ` · CNI ${tenant.idNumber}` : ""}</p>}
                        <div className="tenant-contact">
                          <span><Icon name="mail" size={15} />{tenant.email}</span>
                          <span><Icon name="phone" size={15} />{tenant.phone}</span>
                          <span><Icon name="home" size={15} />{property ? `${property.name}, ${property.city}` : "Aucun logement"}</span>
                        </div>
                        <div className="passport-box">
                          <div className="passport-box-head">
                            <strong><Icon name="shield" size={14} /> Passeport locataire</strong>
                            {active ? <span className="passport-chip passport-chip--on">Actif</span> : <span className="passport-chip">Inactif</span>}
                          </div>
                          {active ? (
                            <>
                              <code className="passport-code">{passport?.code}</code>
                              <div className="passport-actions">
                                <a className="button button--soft" href={`/verifier/${passport?.code}`} target="_blank" rel="noreferrer">Aperçu</a>
                                <button className="text-action" type="button" disabled={busyPassport === tenant.id} onClick={() => handlePassport(tenant.id, "revoke")}>Révoquer</button>
                              </div>
                            </>
                          ) : (
                            <button className="button button--soft passport-issue" type="button" disabled={busyPassport === tenant.id} onClick={() => handlePassport(tenant.id, "issue")}>
                              {busyPassport === tenant.id ? "Émission…" : "Activer le passeport vérifiable"}
                            </button>
                          )}
                        </div>
                        {lease && <div className="tenant-card-bottom"><span>Loyer + charges</span><strong>{fcfa(lease.monthlyRent + lease.charges)}<small> / mois</small></strong></div>}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="panel"><EmptyState icon="users" title="Aucun locataire pour le moment" detail="Ajoutez vos locataires, puis créez leurs baux." /></div>
              )}
            </section>
          )}

          {section === "leases" && (
            <section className="section-content">
              <div className="summary-strip">
                <div><span className="summary-icon summary-icon--blue"><Icon name="calendar" size={18} /></span><span><small>Baux en cours</small><strong>{activeLeases.length}</strong></span></div>
                <div><span className="summary-icon summary-icon--green"><Icon name="wallet" size={18} /></span><span><small>Loyers + charges / mois</small><strong>{fcfa(monthlyIncome)}</strong></span></div>
                <div><span className="summary-icon summary-icon--peach"><Icon name="shield" size={18} /></span><span><small>Cautions détenues</small><strong>{fcfa(totalCaution)}</strong></span></div>
              </div>
              {data.leases.length > 0 ? (
                <div className="lease-list">
                  {data.leases.map((lease) => {
                    const property = data.properties.find((p) => p.id === lease.propertyId);
                    const tenant = data.tenants.find((t) => t.id === lease.tenantId);
                    const daysLeft = Math.round((new Date(`${lease.endDate}T12:00:00`).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <article className={`lease-card ${lease.status === "ended" ? "lease-card--ended" : ""}`} key={lease.id}>
                        <div className="lease-main">
                          <header>
                            <strong>{property?.name ?? "Bien"}</strong>
                            <span className={`lease-chip lease-chip--${lease.status}`}>{lease.status === "active" ? "En cours" : lease.status === "ending" ? "À renouveler" : "Terminé"}</span>
                          </header>
                          <p className="lease-tenant">{tenant?.fullName ?? "Locataire"}{tenant?.phone ? ` · ${tenant.phone}` : ""}</p>
                          <dl className="lease-facts">
                            <div><dt>Loyer</dt><dd>{fcfa(lease.monthlyRent)}</dd></div>
                            <div><dt>Charges</dt><dd>{lease.charges ? fcfa(lease.charges) : "—"}</dd></div>
                            <div><dt>Caution</dt><dd>{lease.caution ? fcfa(lease.caution) : "—"}{lease.caution ? <i className={lease.cautionPaid ? "lease-paid" : "lease-unpaid"}>{lease.cautionPaid ? " encaissée" : " due"}</i> : null}</dd></div>
                            <div><dt>Échéance</dt><dd>le {lease.paymentDay} du mois</dd></div>
                            <div><dt>Période</dt><dd>{formatDate(lease.startDate)} → {formatDate(lease.endDate)}</dd></div>
                            <div><dt>Fin</dt><dd>{daysLeft > 0 ? `dans ${daysLeft} j` : "échue"}</dd></div>
                          </dl>
                        </div>
                        <div className="lease-actions">
                          <a className="button button--soft" href={`/contrat/${lease.id}`} target="_blank" rel="noreferrer"><Icon name="receipt" size={15} /> Contrat de bail</a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="panel"><EmptyState icon="calendar" title="Aucun bail enregistré" detail="Créez un bail pour planifier les loyers et tracer la caution." /></div>
              )}
            </section>
          )}

          {section === "finances" && (
            <section className="section-content">
              <div className="finance-summary-grid">
                <MetricCard icon="wallet" label="Attendu / mois" value={fcfa(monthlyIncome)} detail={`${activeLeases.length} baux actifs`} tone="green" />
                <MetricCard icon="check" label="Encaissé ce mois" value={fcfa(paidThisMonth)} detail={`${currentPayments.filter((p) => p.status === "paid").length} paiements reçus`} tone="blue" />
                <MetricCard icon="clock" label="Reste à percevoir" value={fcfa(outstandingAmount)} detail={`${unpaidPayments.length} loyer(s) à suivre`} tone="peach" />
              </div>
              <article className="panel finance-panel">
                <div className="panel-heading finance-panel-heading">
                  <div><p className="panel-kicker">SUIVI DES ENCAISSEMENTS</p><h2>{periodLabel(period)} <span className="subtle-count">{currentPayments.length} paiements</span></h2></div>
                  <span className="finance-period"><Icon name="calendar" size={15} /> Ce mois-ci</span>
                </div>
                {currentPayments.length > 0 ? (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead><tr><th>LOCATAIRE</th><th>BIEN</th><th>ÉCHÉANCE</th><th>MONTANT</th><th>STATUT</th><th>QUITTANCE</th></tr></thead>
                      <tbody>
                        {currentPayments.map((payment) => {
                          const info = people(payment);
                          return (
                            <tr key={payment.id}>
                              <td><div className="table-person"><div className="avatar avatar--small avatar--blue">{initials(info.tenant?.fullName ?? "?")}</div><strong>{info.tenant?.fullName ?? "Locataire"}</strong></div></td>
                              <td>{info.property?.name ?? "—"}</td>
                              <td>{formatDate(payment.dueDate)}</td>
                              <td><strong>{fcfa(payment.amount)}</strong></td>
                              <td><span className={`payment-badge payment-badge--${payment.status}`}><i />{paymentStatusLabels[payment.status]}</span></td>
                              <td>
                                {payment.status === "paid" && payment.receiptCode
                                  ? <a className="table-link" href={`/verifier/${payment.receiptCode}`} target="_blank" rel="noreferrer">{payment.receiptCode}</a>
                                  : payment.status !== "paid"
                                    ? <button className="table-action" type="button" disabled={busyPayments.includes(payment.id)} onClick={() => markPaymentPaid(payment.id)}>{busyPayments.includes(payment.id) ? "…" : "Encaisser"}</button>
                                    : <span className="payment-check"><Icon name="check" size={16} /></span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState icon="receipt" title="Aucun paiement ce mois-ci" detail="Les échéances de vos baux apparaîtront ici." />
                )}
              </article>
              <article className="panel history-panel">
                <div className="panel-heading">
                  <div><p className="panel-kicker">TENDANCE</p><h2>Encaissements des six derniers mois</h2></div>
                  <span className="history-total"><Icon name="trend" size={15} /> {fcfa(monthlySeries.reduce((t, m) => t + m.amount, 0))}</span>
                </div>
                <div className="history-months">
                  {monthlySeries.map((month) => (
                    <div key={month.key}>
                      <span>{month.label}</span><strong>{fcfa(month.amount)}</strong>
                      <div className="history-progress"><i style={{ width: `${Math.max(0, Math.min(100, (month.amount / chartMax) * 100))}%` }} /></div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {section === "maintenance" && (
            <section className="section-content">
              <div className="summary-strip maintenance-summary">
                <div><span className="summary-icon summary-icon--peach"><Icon name="wrench" size={18} /></span><span><small>Demandes ouvertes</small><strong>{openMaintenance.length}</strong></span></div>
                <div><span className="summary-icon summary-icon--blue"><Icon name="clock" size={18} /></span><span><small>En cours</small><strong>{data.maintenance.filter((i) => i.status === "in_progress").length}</strong></span></div>
                <div><span className="summary-icon summary-icon--green"><Icon name="check" size={18} /></span><span><small>Terminées</small><strong>{data.maintenance.filter((i) => i.status === "resolved").length}</strong></span></div>
              </div>
              {data.maintenance.length > 0 ? (
                <div className="maintenance-list">
                  {data.maintenance.map((request) => {
                    const property = data.properties.find((p) => p.id === request.propertyId);
                    return (
                      <article className={`maintenance-card ${request.status === "resolved" ? "maintenance-card--resolved" : ""}`} key={request.id}>
                        <div className={`maintenance-icon maintenance-icon--${request.priority}`}><Icon name="wrench" size={19} /></div>
                        <div className="maintenance-main">
                          <div className="maintenance-title-row"><h3>{request.title}</h3><span className={`priority-badge priority-badge--${request.priority}`}>{request.priority === "high" ? "Prioritaire" : request.priority === "low" ? "Faible" : "Normal"}</span></div>
                          <p>{request.detail}</p>
                          <div className="maintenance-meta">
                            <span><Icon name="home" size={14} />{property?.name ?? "Bien"} · {property?.city ?? ""}</span>
                            <span><Icon name="calendar" size={14} />Signalé le {formatDate(request.reportedAt)}</span>
                          </div>
                        </div>
                        <div className="maintenance-actions">
                          <span className={`maintenance-status maintenance-status--${request.status}`}><i />{maintenanceStatusLabels[request.status]}</span>
                          {request.status !== "resolved" && (
                            <button className="button button--soft" type="button" disabled={busyMaintenance.includes(request.id)}
                              onClick={() => updateMaintenance(request.id, request.status === "open" ? "in_progress" : "resolved")}>
                              {busyMaintenance.includes(request.id) ? "Mise à jour…" : request.status === "open" ? "Prendre en charge" : "Terminer"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="panel"><EmptyState icon="wrench" title="Aucune intervention à suivre" detail="Les demandes de maintenance apparaîtront ici." /></div>
              )}
            </section>
          )}

          <footer className="dashboard-footer">
            <span>© {new Date().getFullYear()} maisonly · Dakar</span>
            <span>Fait pour gérer mieux, et vivre plus léger.</span>
            <button type="button" onClick={() => setToast("Notre équipe est là pour vous aider : bonjour@maisonly.sn")}>Besoin d’aide ?</button>
          </footer>
        </main>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
          <section className="property-modal" role="dialog" aria-modal="true" aria-labelledby="property-modal-title">
            <div className="modal-heading"><div><span className="modal-icon"><Icon name="building" size={19} /></span><div><p className="panel-kicker">VOTRE PORTEFEUILLE</p><h2 id="property-modal-title">Ajouter un bien</h2></div></div><button className="icon-button" type="button" aria-label="Fermer" onClick={() => setModalOpen(false)}><Icon name="close" /></button></div>
            <p className="modal-description">Quelques détails et votre nouveau bien rejoindra votre espace.</p>
            <form className="property-form" onSubmit={handlePropertySubmit}>
              <label className="form-field form-field--wide"><span>Nom du bien</span><input name="name" placeholder="Ex. Villa Sacré-Cœur" maxLength={160} required autoFocus /></label>
              <label className="form-field form-field--wide"><span>Adresse</span><input name="address" placeholder="Cité Keur Gorgui, villa 12" required /></label>
              <div className="form-row"><label className="form-field"><span>Ville</span><input name="city" list="senegal-city-options" placeholder="Dakar" required /></label><label className="form-field form-field--postal"><span>Quartier / BP (facultatif)</span><input name="postalCode" placeholder="Almadies" maxLength={12} /></label>
                <datalist id="senegal-city-options"><option value="Dakar" /><option value="Pikine" /><option value="Guédiawaye" /><option value="Thiès" /><option value="Touba" /><option value="Saint-Louis" /><option value="Mbour" /><option value="Kaolack" /><option value="Ziguinchor" /><option value="Rufisque" /><option value="Louga" /></datalist></div>
              <div className="form-row"><label className="form-field"><span>Type de bien</span><select name="type" defaultValue="apartment"><option value="apartment">Appartement</option><option value="house">Maison / Villa</option><option value="studio">Studio / Chambre</option><option value="commercial">Boutique / Bureau</option></select></label><label className="form-field"><span>Statut</span><select name="status" defaultValue="vacant"><option value="vacant">Disponible</option><option value="occupied">Loué</option><option value="maintenance">En travaux</option></select></label></div>
              <div className="form-row"><label className="form-field"><span>Surface (m²)</span><input name="surface" type="number" min="1" placeholder="85" required /></label><label className="form-field"><span>Pièces</span><input name="rooms" type="number" min="1" placeholder="3" required /></label><label className="form-field"><span>Loyer / mois (FCFA)</span><input name="monthlyRent" type="number" min="0" step="1000" placeholder="250000" /></label></div>
              <div className="modal-actions"><button className="button button--quiet" type="button" onClick={() => setModalOpen(false)}>Annuler</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? <><span className="button-spinner" /> Enregistrement…</> : <><Icon name="plus" size={17} /> Ajouter le bien</>}</button></div>
            </form>
          </section>
        </div>
      )}

      {tenantModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTenantModalOpen(false); }}>
          <section className="property-modal" role="dialog" aria-modal="true" aria-labelledby="tenant-modal-title">
            <div className="modal-heading"><div><span className="modal-icon"><Icon name="users" size={19} /></span><div><p className="panel-kicker">VOS LOCATAIRES</p><h2 id="tenant-modal-title">Ajouter un locataire</h2></div></div><button className="icon-button" type="button" aria-label="Fermer" onClick={() => setTenantModalOpen(false)}><Icon name="close" /></button></div>
            <p className="modal-description">Ces informations alimentent le bail et le passeport locataire.</p>
            <form className="property-form" onSubmit={handleTenantSubmit}>
              <label className="form-field form-field--wide"><span>Nom complet</span><input name="fullName" placeholder="Moussa Diop" minLength={2} maxLength={160} required autoFocus /></label>
              <div className="form-row">
                <label className="form-field"><span>Téléphone</span><input name="phone" type="tel" placeholder="77 123 45 67" inputMode="tel" maxLength={30} required /></label>
                <label className="form-field"><span>N° CNI / passeport</span><input name="idNumber" placeholder="1 234 1990 00123" maxLength={60} /></label>
              </div>
              <label className="form-field form-field--wide"><span>Adresse e-mail</span><input name="email" type="email" placeholder="moussa.diop@email.sn" maxLength={180} required /></label>
              <label className="form-field form-field--wide"><span>Profession</span><input name="profession" placeholder="Commerçant, enseignant…" maxLength={120} /></label>
              <div className="modal-actions"><button className="button button--quiet" type="button" onClick={() => setTenantModalOpen(false)}>Annuler</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? <><span className="button-spinner" /> Enregistrement…</> : <><Icon name="plus" size={17} /> Ajouter le locataire</>}</button></div>
            </form>
          </section>
        </div>
      )}

      {leaseModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLeaseModalOpen(false); }}>
          <section className="property-modal" role="dialog" aria-modal="true" aria-labelledby="lease-modal-title">
            <div className="modal-heading"><div><span className="modal-icon"><Icon name="calendar" size={19} /></span><div><p className="panel-kicker">BAUX &amp; CONTRATS</p><h2 id="lease-modal-title">Créer un bail</h2></div></div><button className="icon-button" type="button" aria-label="Fermer" onClick={() => setLeaseModalOpen(false)}><Icon name="close" /></button></div>
            <p className="modal-description">Le premier loyer est planifié automatiquement et le bien passe en « Loué ».</p>
            <form className="property-form" onSubmit={handleLeaseSubmit}>
              <label className="form-field form-field--wide"><span>Bien à louer</span>
                <select name="propertyId" required>
                  {data.properties.map((property) => <option key={property.id} value={property.id}>{property.name} — {property.city}</option>)}
                </select>
              </label>
              <label className="form-field form-field--wide"><span>Locataire</span>
                <select name="tenantId" required>
                  {data.tenants.map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.fullName}{tenant.phone ? ` — ${tenant.phone}` : ""}</option>)}
                </select>
              </label>
              {data.properties.length === 0 || data.tenants.length === 0 ? <p className="mm-error">Ajoutez d’abord un bien et un locataire.</p> : null}
              <div className="form-row">
                <label className="form-field"><span>Loyer / mois (FCFA)</span><input name="monthlyRent" type="number" min="1" step="1000" placeholder="250000" required /></label>
                <label className="form-field"><span>Charges / mois (FCFA)</span><input name="charges" type="number" min="0" step="1000" placeholder="15000" /></label>
              </div>
              <div className="form-row">
                <label className="form-field"><span>Caution (FCFA)</span><input name="caution" type="number" min="0" step="1000" placeholder="500000" /></label>
                <label className="form-field"><span>Jour d’échéance</span><input name="paymentDay" type="number" min="1" max="28" defaultValue={5} required /></label>
              </div>
              <div className="form-row">
                <label className="form-field"><span>Début du bail</span><input name="startDate" type="date" defaultValue={todayIso()} required /></label>
                <label className="form-field"><span>Fin du bail</span><input name="endDate" type="date" defaultValue={plusYears(3)} required /></label>
              </div>
              <label className="form-check"><input name="cautionPaid" type="checkbox" /><span>Caution déjà encaissée</span></label>
              <div className="modal-actions"><button className="button button--quiet" type="button" onClick={() => setLeaseModalOpen(false)}>Annuler</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? <><span className="button-spinner" /> Enregistrement…</> : <><Icon name="plus" size={17} /> Créer le bail</>}</button></div>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="toast-message" role="status" aria-live="polite"><span className="toast-check"><Icon name="check" size={16} /></span>{toast}<button type="button" aria-label="Fermer la notification" onClick={() => setToast("")}><Icon name="close" size={15} /></button></div>}
    </div>
  );
}
