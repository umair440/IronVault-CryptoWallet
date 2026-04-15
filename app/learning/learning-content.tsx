import type { LearningSection } from '@/lib/learning-guide';

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
  return (
    <div className="space-y-6">
      <div>
        <span className="badge">Beginner walkthrough</span>
        <h1 className="mt-3 text-3xl font-bold">Learning</h1>
        <div className="mt-2 min-w-0 overflow-x-auto">
          <p className="whitespace-nowrap text-slate-400">
            Follow these sections in order. Each one matches a tab in the sidebar so you always know where to click next.
          </p>
        </div>
      </div>

      <ol className="space-y-6">
        {sections.map((section) => (
          <li key={section.id} className="card list-none p-6">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{section.summary}</p>
            <ul className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-300">
              {section.steps.map((step, stepIndex) => (
                <li key={`${section.id}-${stepIndex}`}>
                  <StepText>{step}</StepText>
                </li>
              ))}
            </ul>
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
