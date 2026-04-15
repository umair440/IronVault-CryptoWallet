import { AppShell } from '@/components/layout/app-shell';
import { beginnerSections, showBeginnerLearning } from '@/lib/learning-guide';
import { requireSession, roleLabels } from '@/lib/session';
import { BeginnerLearningWalkthrough, NonBeginnerLearningNotice } from './learning-content';

export default async function LearningPage() {
  const session = await requireSession();

  return (
    <AppShell>
      {showBeginnerLearning(session.user.role) ? (
        <BeginnerLearningWalkthrough sections={beginnerSections} />
      ) : (
        <NonBeginnerLearningNotice roleLabel={roleLabels[session.user.role]} />
      )}
    </AppShell>
  );
}
