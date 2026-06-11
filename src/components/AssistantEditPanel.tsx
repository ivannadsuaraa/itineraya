import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Compass, Plane, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { editItineraryWithAssistant } from "@/lib/itinerary-edit.functions";
import { toast } from "sonner";

type Message = { id: string; role: "user" | "assistant"; text: string };

export function AssistantEditPanel({
  open,
  onClose,
  tripId,
  destination,
  onItineraryUpdated,
}: {
  open: boolean;
  onClose: () => void;
  tripId: string;
  destination: string;
  onItineraryUpdated: (itinerary: unknown) => void;
}) {
  const { t } = useTranslation();
  const edit = useServerFn(editItineraryWithAssistant);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "greeting",
      role: "assistant",
      text: t("assistant.panelGreeting", { destination }),
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Refresh greeting if destination or language changes.
  useEffect(() => {
    setMessages((m) => {
      if (m.length === 0 || m[0].id !== "greeting") return m;
      return [{ ...m[0], text: t("assistant.panelGreeting", { destination }) }, ...m.slice(1)];
    });
  }, [destination, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setBusy(true);
    try {
      const res = await edit({ data: { tripId, instruction: text } });
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: res.change_summary },
      ]);
      onItineraryUpdated(res.itinerary);
      toast.success(t("assistant.panelUpdated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("assistant.panelSomethingWrong");
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: t("assistant.panelOops", { msg }) },
      ]);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-sky-950/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8] shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-white/40 bg-white/60 px-5 py-3 backdrop-blur-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] shadow-md shadow-[#1E6B9A]/30">
                  <Compass className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-bold text-sky-900 truncate">
                    {t("assistant.panelTitle")}
                  </h2>
                  <p className="text-xs text-sky-600 truncate">{destination}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sky-800 hover:bg-white"
                aria-label={t("assistant.panelClose")}
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <Bubble key={m.id} message={m} />
                ))}
                {busy && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white">
                      <Compass className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl bg-white/85 px-4 py-2.5 text-sm text-sky-700 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      {t("assistant.panelTyping")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={handleSend}
              className="border-t border-white/40 bg-white/70 px-4 py-3 backdrop-blur-xl"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as unknown as React.FormEvent);
                    }
                  }}
                  rows={1}
                  placeholder={t("assistant.panelPh")}
                  disabled={busy}
                  className="flex-1 resize-none rounded-2xl border border-sky-200 bg-white/90 px-4 py-3 text-sm text-sky-900 placeholder-sky-400 outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-[#1E6B9A]/10 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser ? "bg-sky-100 text-sky-700" : "bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white"
        }`}
      >
        {isUser ? <Plane className="h-4 w-4 -rotate-45" /> : <Compass className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "rounded-tr-sm bg-[#1E6B9A] text-white"
            : "rounded-tl-sm bg-white/85 text-sky-900 ring-1 ring-white/60"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
