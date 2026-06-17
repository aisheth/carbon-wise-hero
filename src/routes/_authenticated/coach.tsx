import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Sparkles, Leaf } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({ meta: [{ title: "AI Coach — Carbon Coach" }] }),
  component: CoachPage,
});

const SUGGESTIONS = [
  "How can I cut my commuting emissions?",
  "Is buying secondhand really better?",
  "Compare gas vs electric heat pump",
  "Easy plant-based dinners for a week",
];

function CoachPage() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message || "Coach unavailable"),
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-semibold">AI Carbon Coach</h1>
        <p className="text-muted-foreground text-sm">
          Ask anything about sustainability. Powered by Lovable AI.
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="size-12 mx-auto eco-gradient rounded-2xl grid place-items-center mb-3">
                <Sparkles className="size-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">How can I help you go greener?</h3>
              <p className="text-sm text-muted-foreground mt-1">Try one of these:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => submit(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                {!isUser && (
                  <div className="size-8 shrink-0 rounded-lg eco-gradient grid place-items-center">
                    <Leaf className="size-4 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] ${isUser ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5" : ""}`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap text-sm">{text}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none text-foreground prose-p:my-2 prose-li:my-0.5">
                      <ReactMarkdown>{text || "…"}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="flex gap-3">
              <div className="size-8 shrink-0 rounded-lg eco-gradient grid place-items-center">
                <Leaf className="size-4 text-primary-foreground animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground italic">Thinking…</p>
            </div>
          )}
        </div>

        <form
          className="border-t border-border p-3 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Carbon Coach…"
            rows={1}
            className="min-h-[44px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={busy || !input.trim()}
            aria-label="Send message"
          >
            <Send className="size-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
