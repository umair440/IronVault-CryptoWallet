'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, SendHorizonal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockAssistantReply, type ChatMessage } from '@/lib/help-chatbot-mock';

const introMessage: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  content:
    'Hi — I am a **demo helper** for IronVault (mock replies, not a real AI). Ask how to send, receive, manage wallets, or read your dashboard.',
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

  if (!expanded) {
    return (
      <aside
        className="sticky top-0 flex h-screen w-12 shrink-0 flex-col self-start border-l border-slate-800 bg-slate-900"
        aria-label="Help chat (collapsed)"
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex flex-1 flex-col items-center gap-3 border-b border-slate-800 py-4 text-slate-400 transition hover:bg-slate-800/80 hover:text-emerald-300"
          aria-expanded={false}
          aria-controls={panelId}
          title="Open help"
        >
          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
          <span
            className="select-none text-[10px] font-semibold uppercase tracking-widest text-slate-500 [writing-mode:vertical-rl] rotate-180"
            aria-hidden
          >
            Help
          </span>
          <ChevronLeft className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        </button>
      </aside>
    );
  }

  return (
    <aside
      id={panelId}
      className={cn(
        'sticky top-0 flex h-screen w-[min(22rem,calc(100vw-9rem))] shrink-0 flex-col self-start border-l border-slate-800 bg-slate-900 md:w-96',
      )}
      aria-label="Help chat (mock)"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">IronVault helper</p>
            <p className="truncate text-xs text-slate-500">Mock assistant · not live AI</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-expanded={true}
          aria-controls={panelId}
          title="Collapse help panel"
          aria-label="Collapse help panel"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
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
                : 'mr-auto border border-slate-800 bg-slate-950/80 text-slate-200',
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

      <footer className="shrink-0 border-t border-slate-800 p-3">
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
            placeholder="Ask anything…"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            aria-label="Message to mock assistant"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || thinking}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send message"
          >
            <SendHorizonal className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </aside>
  );
}
