import type { SupabaseClient } from "@supabase/supabase-js";
import { emitEvent } from "@/lib/events";
import type { WorkspaceNotification } from "./notification-sheet";

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;
const DAY = 86400_000;

interface ContractSlice {
  id: string;
  contract_expiration: string | null;
  overdue_notified_at: string | null;
  clients: { full_name: string; phone: string | null } | null;
  cars: { reg_number: string } | null;
}

interface PaymentSlice {
  id: string;
  amount: number;
  created_at: string;
  contracts: { clients: { full_name: string } | null; cars: { reg_number: string } | null } | null;
}

interface ComplaintSlice {
  id: string;
  type: string;
  created_at: string;
  cars: { reg_number: string } | null;
}

/**
 * Live in-app notification feed: overdue rentals, rentals due within 24h,
 * money received in the last 48h, complaints opened in the last 7 days.
 * Computed on read — no notifications table needed yet.
 */
export async function getWorkspaceNotifications(
  supabase: SupabaseClient,
  orgId: string
): Promise<WorkspaceNotification[]> {
  const now = Date.now();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [activeRes, paymentsRes, complaintsRes, dismissedRes] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, contract_expiration, overdue_notified_at, clients(full_name, phone), cars(reg_number)")
      .eq("org_id", orgId)
      .eq("status", "ACTIVE")
      .not("contract_expiration", "is", null),
    supabase
      .from("payments")
      .select("id, amount, created_at, contracts(clients(full_name), cars(reg_number))")
      .eq("org_id", orgId)
      .gte("created_at", new Date(now - 2 * DAY).toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("complaints")
      .select("id, type, created_at, cars(reg_number)")
      .eq("org_id", orgId)
      .eq("is_resolved", false)
      .gte("created_at", new Date(now - 7 * DAY).toISOString())
      .order("created_at", { ascending: false })
      .limit(5),
    user
      ? supabase
          .from("notification_dismissals")
          .select("key")
          .eq("org_id", orgId)
          .eq("user_id", user.id)
      : Promise.resolve({ data: [] as { key: string }[] }),
  ]);

  const dismissed = new Set((dismissedRes.data ?? []).map((d) => d.key));
  const items: WorkspaceNotification[] = [];
  const freshOverdue: ContractSlice[] = [];

  for (const c of (activeRes.data ?? []) as unknown as ContractSlice[]) {
    const due = new Date(c.contract_expiration!).getTime();
    const who = c.clients?.full_name ?? "client";
    const reg = c.cars?.reg_number ?? "vehicle";
    if (due < now) {
      items.push({
        id: `overdue-${c.id}`,
        kind: "OVERDUE",
        title: `${reg} is overdue`,
        detail: `${who} was due back ${new Date(due).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
        at: c.contract_expiration!,
        href: `/workspace/${orgId}/rentals`,
        phone: c.clients?.phone ?? null,
        clientName: c.clients?.full_name ?? null,
      });
      if (!c.overdue_notified_at) freshOverdue.push(c);
    } else if (due - now <= DAY) {
      items.push({
        id: `due-${c.id}`,
        kind: "DUE_SOON",
        title: `${reg} due back soon`,
        detail: `${who} · due ${new Date(due).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
        at: c.contract_expiration!,
        href: `/workspace/${orgId}/rentals`,
        phone: c.clients?.phone ?? null,
        clientName: c.clients?.full_name ?? null,
      });
    }
  }

  for (const p of (paymentsRes.data ?? []) as unknown as PaymentSlice[]) {
    items.push({
      id: `pay-${p.id}`,
      kind: "PAYMENT",
      title: `${kes(Number(p.amount))} received`,
      detail: [p.contracts?.clients?.full_name, p.contracts?.cars?.reg_number]
        .filter(Boolean)
        .join(" · "),
      at: p.created_at,
      href: `/workspace/${orgId}/financials`,
    });
  }

  for (const c of (complaintsRes.data ?? []) as unknown as ComplaintSlice[]) {
    items.push({
      id: `complaint-${c.id}`,
      kind: "COMPLAINT",
      title: `Open complaint${c.cars?.reg_number ? ` on ${c.cars.reg_number}` : ""}`,
      detail: c.type.charAt(0) + c.type.slice(1).toLowerCase(),
      at: c.created_at,
      href: `/workspace/${orgId}/complaints`,
    });
  }

  // Newly-overdue rentals: push-alert the whole org exactly once per contract.
  // Stamp first so concurrent page loads don't double-send.
  for (const c of freshOverdue) {
    const { data: stamped } = await supabase
      .from("contracts")
      .update({ overdue_notified_at: new Date().toISOString() })
      .eq("id", c.id)
      .eq("org_id", orgId)
      .is("overdue_notified_at", null)
      .select("id");
    if (stamped && stamped.length > 0) {
      await emitEvent({
        type: "rental.overdue",
        orgId,
        title: `${c.cars?.reg_number ?? "A vehicle"} is OVERDUE`,
        body: `${c.clients?.full_name ?? "Client"} has kept the car past the contract deadline — follow up.`,
        href: `/workspace/${orgId}/rentals`,
        entityType: "contract",
        entityId: c.id,
      });
    }
  }

  // Overdue first, then newest first. Cap the feed.
  return items
    .filter((i) => !dismissed.has(i.id))
    .sort((a, b) => {
      if ((a.kind === "OVERDUE") !== (b.kind === "OVERDUE")) {
        return a.kind === "OVERDUE" ? -1 : 1;
      }
      return new Date(b.at).getTime() - new Date(a.at).getTime();
    })
    .slice(0, 15);
}
