"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { Headphones, X, ExternalLink, MessageSquare } from "lucide-react";
import { SupportTicket } from "./support-tickets";

interface AdminTicketsContextType {
  tickets: SupportTicket[];
  unreadCount: number;
  openCount: number;
  isLoading: boolean;
  refreshTickets: () => Promise<void>;
  markTicketLocallyAsRead: (ticketId: string) => void;
  playSoundNotification: () => void;
}

const AdminTicketsContext = createContext<AdminTicketsContextType>({
  tickets: [],
  unreadCount: 0,
  openCount: 0,
  isLoading: false,
  refreshTickets: async () => {},
  markTicketLocallyAsRead: () => {},
  playSoundNotification: () => {},
});

/**
 * Play a high quality crystal chime alert using Web Audio API
 * Works across all modern browsers without relying on external mp3 assets.
 */
export function playTicketNotificationSound() {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const playTone = (
      freq: number,
      startOffset: number,
      duration: number,
      volume = 0.25
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + startOffset);

      gain.gain.setValueAtTime(0.001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(volume, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration);
    };

    // Melodic 3-tone chime (F#5 -> A#5 -> C#6)
    playTone(739.99, 0, 0.22, 0.2);
    playTone(932.33, 0.12, 0.25, 0.25);
    playTone(1108.73, 0.24, 0.5, 0.3);
  } catch (err) {
    console.warn("[AdminTickets] Audio alert playback failed:", err);
  }
}

interface NewTicketAlert {
  id: string;
  ticketId: string;
  title: string;
  subject: string;
  senderText: string;
  type: "NEW_TICKET" | "NEW_MESSAGE";
}

export function AdminTicketsProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [openCount, setOpenCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<NewTicketAlert | null>(null);

  // Store ticket message counts & read status to detect new tickets and incoming messages
  const knownTicketsMapRef = useRef<Map<string, { messageCount: number; unreadByAdmin: boolean }>>(new Map());
  const isInitialLoadRef = useRef<boolean>(true);
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets?scope=all", { cache: "no-store" });
      if (!res.ok) return;

      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) return;

      const data: SupportTicket[] = json.data;
      setTickets(data);

      // Unread count: tickets strictly marked unreadByAdmin that are NOT resolved/closed
      const unread = data.filter(
        (t) => t.unreadByAdmin === true && t.status !== "RESOLVED" && t.status !== "CLOSED"
      ).length;
      const open = data.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length;

      setUnreadCount(unread);
      setOpenCount(open);

      const nextMap = new Map<string, { messageCount: number; unreadByAdmin: boolean }>();
      let alertToTrigger: NewTicketAlert | null = null;

      for (const t of data) {
        const msgCount = t.messages ? t.messages.length : 0;
        const isUnread = t.unreadByAdmin === true;
        const isActiveStatus = t.status !== "RESOLVED" && t.status !== "CLOSED";

        nextMap.set(t.id, { messageCount: msgCount, unreadByAdmin: isUnread });

        if (!isInitialLoadRef.current && isActiveStatus) {
          const prev = knownTicketsMapRef.current.get(t.id);

          if (!prev) {
            // Completely new ticket arrived
            alertToTrigger = {
              id: `alert_${Date.now()}`,
              ticketId: t.id,
              title: "Tiket Bantuan Baru Masuk!",
              subject: t.subject,
              senderText: t.userName || t.userEmail,
              type: "NEW_TICKET",
            };
          } else if (msgCount > prev.messageCount && isUnread) {
            // Existing ticket received a new message from user
            const lastMsg = t.messages[t.messages.length - 1];
            alertToTrigger = {
              id: `alert_${Date.now()}`,
              ticketId: t.id,
              title: "Pesan Baru Masuk pada Tiket!",
              subject: lastMsg ? `"${lastMsg.message.slice(0, 50)}..."` : t.subject,
              senderText: lastMsg?.senderName || t.userName || t.userEmail,
              type: "NEW_MESSAGE",
            };
          }
        }
      }

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      } else if (alertToTrigger) {
        playTicketNotificationSound();
        setActiveAlert(alertToTrigger);

        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }
        alertTimeoutRef.current = setTimeout(() => {
          setActiveAlert(null);
        }, 8000);
      }

      knownTicketsMapRef.current = nextMap;
    } catch (err) {
      console.error("[AdminTickets] Error fetching tickets:", err);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 4000); // Live poll every 4 seconds

    return () => {
      clearInterval(interval);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [fetchTickets]);

  const markTicketLocallyAsRead = useCallback((ticketId: string) => {
    setTickets((prev) => {
      const next = prev.map((t) =>
        t.id.toUpperCase() === ticketId.toUpperCase()
          ? { ...t, unreadByAdmin: false }
          : t
      );
      const unread = next.filter(
        (t) => t.unreadByAdmin === true && t.status !== "RESOLVED" && t.status !== "CLOSED"
      ).length;
      setUnreadCount(unread);
      return next;
    });

    if (knownTicketsMapRef.current.has(ticketId)) {
      const prev = knownTicketsMapRef.current.get(ticketId)!;
      knownTicketsMapRef.current.set(ticketId, { ...prev, unreadByAdmin: false });
    }
  }, []);

  const refreshTickets = async () => {
    setIsLoading(true);
    await fetchTickets();
    setIsLoading(false);
  };

  return (
    <AdminTicketsContext.Provider
      value={{
        tickets,
        unreadCount,
        openCount,
        isLoading,
        refreshTickets,
        markTicketLocallyAsRead,
        playSoundNotification: playTicketNotificationSound,
      }}
    >
      {children}

      {/* Floating Real-Time New Ticket / Message Toast Alert */}
      {activeAlert && (
        <div className="fixed top-20 right-4 sm:right-6 z-[9999] max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3.5 backdrop-blur-md">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5 animate-bounce">
              {activeAlert.type === "NEW_TICKET" ? (
                <Headphones className="w-5 h-5" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {activeAlert.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  {activeAlert.ticketId}
                </span>
              </div>

              <h4 className="text-xs font-black text-slate-100 truncate" title={activeAlert.subject}>
                {activeAlert.subject}
              </h4>

              <p className="text-[11px] text-slate-400 truncate">
                Dari: <strong className="text-slate-200">{activeAlert.senderText}</strong>
              </p>

              <div className="pt-2 flex items-center justify-between gap-2">
                <Link
                  href={`/admin/tickets/${activeAlert.ticketId}`}
                  onClick={() => {
                    markTicketLocallyAsRead(activeAlert.ticketId);
                    setActiveAlert(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Buka Tiket</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>

                <button
                  onClick={() => setActiveAlert(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Tutup Notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminTicketsContext.Provider>
  );
}

export function useAdminTickets() {
  return useContext(AdminTicketsContext);
}
