"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellRing,
  BellOff,
  XIcon,
  X,
  TriangleAlert,
  Clock3,
  Banknote,
  MessageSquareWarning,
  Phone,
  MessageCircle,
  CheckCheck,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import {
  savePushSubscription,
  removePushSubscription,
  dismissNotifications,
} from "@/features/notifications/actions";

export interface WorkspaceNotification {
  id: string;
  kind: "OVERDUE" | "DUE_SOON" | "PAYMENT" | "COMPLAINT";
  title: string;
  detail: string;
  at: string; // ISO
  href?: string;
  phone?: string | null;
  clientName?: string | null;
}

const KIND_STYLE: Record<
  WorkspaceNotification["kind"],
  { icon: typeof Bell; className: string }
> = {
  OVERDUE: {
    icon: TriangleAlert,
    className: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  DUE_SOON: {
    icon: Clock3,
    className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  PAYMENT: {
    icon: Banknote,
    className: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  },
  COMPLAINT: {
    icon: MessageSquareWarning,
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function whatsappUrl(phone: string, clientName: string | null, title: string): string {
  const number = phone.replace(/\D/g, "");
  const msg = `Hello ${clientName ?? ""}, a reminder regarding your car rental: ${title}. Kindly get in touch or return the vehicle. Thank you.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

/* Swipe-to-dismiss row: drag past the threshold (or tap X) to clear it. */
function NotificationItem({
  item,
  onDismiss,
}: {
  item: WorkspaceNotification;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, className } = KIND_STYLE[item.kind];
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);

  function pointerDown(e: React.PointerEvent) {
    start.current = e.clientX;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function pointerMove(e: React.PointerEvent) {
    if (start.current === null) return;
    setDx(e.clientX - start.current);
  }
  function pointerUp() {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (Math.abs(dx) > 90) {
      setLeaving(true);
      setTimeout(() => onDismiss(item.id), 180);
      setDx(dx > 0 ? 400 : -400);
    } else {
      setDx(0);
    }
  }

  return (
    <div
      className={cn(
        "group relative touch-pan-y select-none overflow-hidden transition-[opacity,max-height] duration-200",
        leaving ? "max-h-0 opacity-0" : "max-h-40"
      )}
    >
      <div
        className="flex gap-3 px-4 py-3 transition-transform hover:bg-muted/50"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging ? "none" : "transform 180ms ease",
        }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            className
          )}
        >
          <Icon className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-sm font-medium leading-snug">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.detail}</p>
          <p className="text-xs text-muted-foreground/70">{timeAgo(item.at)}</p>

          {/* Actions — reach the client right from the notification */}
          {item.phone && (
            <div className="mt-1.5 flex gap-2">
              <a
                href={`tel:${item.phone}`}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-foreground transition-colors hover:bg-muted"
              >
                <Phone className="size-3" />
                Call client
              </a>
              <a
                href={whatsappUrl(item.phone, item.clientName ?? null, item.title)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-md border border-green-600/30 px-2 py-1 text-xs text-green-700 transition-colors hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
              >
                <MessageCircle className="size-3" />
                WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* Dismiss (also available without swiping) */}
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => {
            setLeaving(true);
            setTimeout(() => onDismiss(item.id), 180);
          }}
          className="h-fit rounded p-1 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

// VAPID keys are base64url — the Push API needs them as bytes, not a string.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Browser push toggle — subscribes this device via the service worker. */
function PushToggle({ orgId }: { orgId: string }) {
  const [state, setState] = useState<"unknown" | "off" | "on" | "busy" | "unsupported">(
    "unknown"
  );

  useEffect(() => {
    let cancelled = false;
    // Async detection — setState only fires from resolved promises, never
    // synchronously in the effect body (keeps the React Compiler happy).
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js");
        const sub = await reg?.pushManager.getSubscription();
        if (!cancelled) setState(sub ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) {
      // Deployed build is missing the public VAPID key — the real cause of the
      // "missing applicationServerKey" browser error.
      toast.error("Push isn't set up for this site yet — the notification key is missing.");
      return;
    }

    setState("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        toast.error("Notifications are blocked. Turn them on in your browser's site settings, then try again.");
        setState("off");
        return;
      }
      if (permission !== "granted") {
        setState("off");
        return;
      }

      const reg =
        (await navigator.serviceWorker.getRegistration("/sw.js")) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });
      await savePushSubscription(orgId, sub.toJSON() as never);
      toast.success("You'll get alerts on this device now 🔔");
      setState("on");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        /applicationServerKey|manifest/i.test(msg)
          ? "Couldn't turn on push — the site's notification key looks misconfigured."
          : "Couldn't enable notifications. Please try again."
      );
      setState("off");
    }
  }

  async function disable() {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(orgId, sub.endpoint);
        await sub.unsubscribe();
      }
      toast.success("Push notifications turned off");
    } finally {
      setState("off");
    }
  }

  if (state === "unsupported" || state === "unknown") return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-xs text-muted-foreground"
      disabled={state === "busy"}
      onClick={state === "on" ? disable : enable}
    >
      {state === "busy" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : state === "on" ? (
        <BellOff className="size-3.5" />
      ) : (
        <BellRing className="size-3.5" />
      )}
      {state === "on" ? "Disable push" : "Enable push"}
    </Button>
  );
}

export function NotificationSheet({
  orgId,
  notifications = [],
  triggerClassName,
  mobile = false,
}: {
  orgId: string;
  notifications?: WorkspaceNotification[];
  triggerClassName?: string;
  /** On mobile, open as a bottom drawer instead of a side sheet. */
  mobile?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [snap, setSnap] = useState<number | string | null>(0.98);

  // Server refreshes bring new props — resync the local list.
  const [prev, setPrev] = useState(notifications);
  if (notifications !== prev) {
    setPrev(notifications);
    setItems(notifications);
  }

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLastSeen(Number(localStorage.getItem(`notif-seen-${orgId}`) ?? 0));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const unread = items.filter((n) => new Date(n.at).getTime() > lastSeen).length;
  const urgent = items.some((n) => n.kind === "OVERDUE");

  function markAllRead() {
    const now = Date.now();
    localStorage.setItem(`notif-seen-${orgId}`, String(now));
    setLastSeen(now);
  }

  function dismissOne(id: string) {
    setItems((cur) => cur.filter((i) => i.id !== id));
    dismissNotifications(orgId, [id])
      .then(() => router.refresh())
      .catch(() => toast.error("Couldn't dismiss — it may come back on refresh."));
  }

  function clearAll() {
    const keys = items.map((i) => i.id);
    setItems([]);
    dismissNotifications(orgId, keys)
      .then(() => router.refresh())
      .catch(() => toast.error("Couldn't clear everything — try again."));
  }

  const trigger = (
    <Button
      className={cn("relative h-7 w-7", triggerClassName)}
      variant={triggerClassName ? "ghost" : "outline"}
    >
      <Bell />
      {unread > 0 && (
        <span
          className={cn(
            "absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white",
            urgent ? "bg-red-500" : "bg-blue-500"
          )}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  );

  const Toolbar =
    items.length > 0 ? (
      <div className="flex items-center justify-end gap-1 border-b px-2 py-1.5">
        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={markAllRead}
          >
            <CheckCheck className="size-3.5" />
            Mark all as read
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-muted-foreground"
          onClick={clearAll}
        >
          <Trash2 className="size-3.5" />
          Clear all
        </Button>
      </div>
    ) : null;

  const List = (
    <div className="flex-1 divide-y overflow-y-auto">
      {items.length > 0 ? (
        items.map((item) => (
          <NotificationItem key={item.id} item={item} onDismiss={dismissOne} />
        ))
      ) : (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <Bell className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You&apos;re all caught up — no notifications right now.
          </p>
        </div>
      )}
    </div>
  );

  // Mobile → resizable bottom drawer: drag up to full height, down to close.
  if (mobile) {
    return (
      <Drawer
        snapPoints={[0.55, 0.98]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="h-[98svh] max-h-none">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <DrawerTitle>Notifications</DrawerTitle>
            <div className="flex items-center gap-1">
              <PushToggle orgId={orgId} />
              <DrawerClose
                aria-label="Close notifications"
                className="rounded p-1.5 text-muted-foreground hover:bg-muted"
              >
                <XIcon className="size-4" />
              </DrawerClose>
            </div>
          </div>
          {Toolbar}
          {List}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent showCloseButton={false} className="p-0 bg-background">
        <div className="flex items-center justify-between border-b px-1 py-2">
          <div className="flex items-center gap-1">
            <SheetClose
              render={<Button variant="ghost" size="icon-sm" />}
              aria-label="Close notifications"
            >
              <XIcon className="size-4" />
            </SheetClose>
            <SheetTitle>Notifications</SheetTitle>
          </div>
          <PushToggle orgId={orgId} />
        </div>
        {Toolbar}
        {List}
      </SheetContent>
    </Sheet>
  );
}
