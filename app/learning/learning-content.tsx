'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookUser,
  ChevronDown,
  CircleHelp,
  History,
  Wallet,
  WalletCards,
} from 'lucide-react';
import type { LearningSection } from '@/lib/learning-guide';

const LEARNING_PROGRESS_KEY = 'ironvault_learning_progress_v1';

/** Same icons as the sidebar for each walkthrough section. */
const sectionIcons: Record<string, LucideIcon> = {
  dashboard: Wallet,
  wallets: WalletCards,
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  history: History,
  contacts: BookUser,
};

type ProgressMap = Record<string, boolean[]>;

function LearningSectionSummaryTitle({
  sectionId,
  title,
}: {
  sectionId: string;
  title: string;
}) {
  const Icon = sectionIcons[sectionId] ?? CircleHelp;
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-emerald-300">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h2 className="min-w-0 text-xl font-semibold text-white">{title}</h2>
    </span>
  );
}

function SectionProgressCircle({ percent }: { percent: number }) {
  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center">
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(rgb(16 185 129) ${percent}%, rgb(51 65 85) ${percent}% 100%)`,
        }}
        aria-hidden
      />
      <span className="absolute inset-[3px] rounded-full bg-slate-900" aria-hidden />
      <span className="relative text-sm font-semibold text-emerald-300">{percent}%</span>
    </span>
  );
}

function StepText({ children }: { children: string }) {
  const parts = children.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-emerald-200">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function BeginnerLearningWalkthrough({ sections }: { sections: LearningSection[] }) {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [hydrated, setHydrated] = useState(false);

  const sectionMeta = useMemo(
    () =>
      sections.map((section) => {
        const checks = progress[section.id] ?? new Array(section.steps.length).fill(false);
        const completedCount = checks.filter(Boolean).length;
        const completedPercent =
          section.steps.length === 0 ? 0 : Math.round((completedCount / section.steps.length) * 100);

        return { section, checks, completedPercent };
      }),
    [progress, sections],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LEARNING_PROGRESS_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        setHydrated(true);
        return;
      }

      const restored: ProgressMap = {};
      for (const section of sections) {
        const maybeChecks = (parsed as Record<string, unknown>)[section.id];
        if (!Array.isArray(maybeChecks)) continue;
        restored[section.id] = section.steps.map((_, idx) => maybeChecks[idx] === true);
      }
      setProgress(restored);
    } catch {
      // Ignore corrupted local progress and start fresh.
    } finally {
      setHydrated(true);
    }
  }, [sections]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(LEARNING_PROGRESS_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  function toggleStep(sectionId: string, stepIndex: number, stepsCount: number) {
    setProgress((prev) => {
      const current = prev[sectionId] ?? new Array(stepsCount).fill(false);
      const next = [...current];
      next[stepIndex] = !next[stepIndex];
      return { ...prev, [sectionId]: next };
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="badge">Beginner walkthrough</span>
        <h1 className="mt-3 text-3xl font-bold">Learning</h1>
        <div className="mt-2 min-w-0 overflow-x-auto">
          <p className="text-slate-400">
            <span className="block whitespace-nowrap">
              Follow these sections in order. Each one matches a tab in the sidebar so you always know where to click next.
            </span>
            <span className="mt-1 block whitespace-nowrap">
              Tick each instruction when you understand it to track your progress.
            </span>
          </p>
        </div>
      </div>

      <ol className="space-y-4">
        {sectionMeta.map(({ section, checks, completedPercent }) => (
          <li key={section.id} className="list-none">
            <details className="group card overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 marker:hidden [&::-webkit-details-marker]:hidden">
                <LearningSectionSummaryTitle sectionId={section.id} title={section.title} />
                <span className="flex shrink-0 items-center gap-3">
                  <SectionProgressCircle percent={completedPercent} />
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </span>
              </summary>
              <div className="border-t border-slate-800 px-6 pb-6 pt-4">
                <p className="text-sm leading-relaxed text-slate-300">{section.summary}</p>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
                  {section.steps.map((step, stepIndex) => (
                    <li key={`${section.id}-${stepIndex}`}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={checks[stepIndex] ?? false}
                          disabled={!hydrated}
                          onChange={() => toggleStep(section.id, stepIndex, section.steps.length)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500 disabled:opacity-60"
                          aria-label={`Mark ${section.title} step ${stepIndex + 1} as completed`}
                        />
                        <span className={checks[stepIndex] ? 'text-slate-500 line-through' : ''}>
                          <StepText>{step}</StepText>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function NonBeginnerLearningNotice({ roleLabel }: { roleLabel: string }) {
  return (
    <div className="space-y-6">
      <div>
        <span className="badge">Learning</span>
        <h1 className="mt-3 text-3xl font-bold">Guided tutorials</h1>
        <p className="mt-2 max-w-2xl text-slate-400">Step-by-step sidebar tutorials are enabled for accounts with the <strong className="text-slate-200">Beginner trader</strong> profile. Your current role is <strong className="text-slate-200">{roleLabel}</strong>. Use the sidebar to move around the app as usual; if you need walkthroughs, update your profile type where you manage your account (for example at registration or through your team&apos;s process).</p>
      </div>
      <div className="card p-6 text-sm text-slate-400">
        Nothing else to show here yet for this role.
      </div>
    </div>
  );
}
