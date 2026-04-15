'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Bot, ChevronLeft, ChevronRight, SendHorizonal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockAssistantReply, type ChatMessage } from '@/lib/help-chatbot-mock';

const PANEL_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

const introMessage: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  content:
    'Hello! What would you like help with, please? I am **IronVault AI** (keyword rules only — **not** a connected LLM); try send, receive, wallets, history, or the dashboard.',
};

function nextId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderInlineBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-emerald-200">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function MockHelpChatbot() {
  const panelId = useId();
  const [expanded, setExpanded] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([introMessage]);
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, expanded, scrollToBottom]);

  const send = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);

    window.setTimeout(() => {
      const reply: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: mockAssistantReply(trimmed),
      };
      setMessages((m) => [...m, reply]);
      setThinking(false);
    }, 450);
  }, [input, thinking]);

  return (
    <aside
      id={panelId}
      style={{ transitionTimingFunction: PANEL_EASE }}
      className={cn(
        'relative sticky top-0 flex h-screen shrink-0 self-start flex-col overflow-hidden border-l-2 border-l-violet-500/50 border-slate-800 bg-gradient-to-b from-violet-950/35 to-slate-900 md:from-violet-950/30 md:via-slate-900 md:to-slate-900',
        'transition-[width] duration-300 motion-reduce:transition-none',
        expanded ? 'w-[min(22rem,calc(100vw-9rem))] md:w-96' : 'w-12',
      )}
      aria-label={
        expanded
          ? 'IronVault AI chat (prototype, not a live model)'
          : 'IronVault AI (prototype, collapsed)'
      }
    >
      {/* Narrow rail — fades out when expanded */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 z-10 flex w-12 flex-col bg-gradient-to-b from-violet-950/35 to-slate-900 transition-opacity duration-200 motion-reduce:transition-none',
          expanded ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
        aria-hidden={expanded}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          tabIndex={expanded ? -1 : 0}
          className="flex flex-1 flex-col items-center gap-2 border-b border-slate-800 py-3 text-slate-400 transition hover:bg-violet-950/40 hover:text-violet-200"
          aria-expanded={expanded}
          aria-controls={panelId}
          title="Open IronVault AI (prototype)"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-200">
            <Bot className="h-4 w-4" aria-hidden />
            <Sparkles className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 text-amber-300/90" aria-hidden />
          </span>
          <span
            className="select-none text-[10px] font-bold uppercase tracking-[0.12em] text-violet-300/90 [writing-mode:vertical-rl] rotate-180"
            aria-hidden
          >
            AI
          </span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        </button>
      </div>

      {/* Full panel — clipped while width animates; fades when collapsed */}
      <div
        className={cn(
          'flex h-full min-h-0 w-[min(22rem,calc(100vw-9rem))] flex-col md:w-96',
          'transition-opacity duration-200 ease-out motion-reduce:transition-none',
          expanded ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <header className="flex shrink-0 flex-col gap-2 border-b border-slate-800 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/30">
                <Bot className="h-5 w-5" aria-hidden />
                <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-amber-300/95" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-white">IronVault AI</p>
                  <span className="shrink-0 rounded-md border border-violet-500/40 bg-violet-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                    Prototype
                  </span>
                </div>
                <p className="truncate text-xs text-slate-400">Not a real model</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="shrink-0 self-start rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              aria-expanded={expanded}
              aria-controls={panelId}
              title="Collapse IronVault AI panel"
              aria-label="Collapse IronVault AI panel"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <p className="text-[11px] leading-snug text-slate-500">
            This sidebar is a <span className="font-medium text-violet-300/90">prototype AI UI</span>.
          </p>
        </header>

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'ml-auto bg-emerald-600/25 text-slate-100'
                  : 'mr-auto border border-violet-500/20 bg-slate-950/90 text-slate-200 ring-1 ring-violet-500/10',
              )}
            >
              <p className="whitespace-pre-wrap">{renderInlineBold(msg.content)}</p>
            </div>
          ))}
          {thinking ? (
            <div className="mr-auto max-w-[92%] rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-500">
              <span className="inline-flex gap-1">
                <span className="animate-pulse">Thinking</span>
                <span className="inline-flex gap-0.5">
                  <span className="animate-bounce [animation-delay:0ms]">.</span>
                  <span className="animate-bounce [animation-delay:150ms]">.</span>
                  <span className="animate-bounce [animation-delay:300ms]">.</span>
                </span>
              </span>
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 space-y-2 border-t border-slate-800 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask IronVault AI…"
              className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              aria-label="Message to IronVault AI"
            />
            <button
              type="button"
              onClick={send}
              disabled={!input.trim() || thinking}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send message to IronVault AI"
            >
              <SendHorizonal className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-600">
            Prototype · no API keys · no data leaves your session
          </p>
        </footer>
      </div>
    </aside>
  );
}
