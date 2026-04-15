import { AppShell } from '@/components/layout/app-shell';
import { requireSession } from '@/lib/session';

export default async function LearningPage() {
  await requireSession();

  return <AppShell>{null}</AppShell>;
}
