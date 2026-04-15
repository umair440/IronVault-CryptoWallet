import type { UserRole } from '@prisma/client';

/** One sidebar destination — add the next entry when you are ready. */
export type LearningSection = {
  id: string;
  /** Matches the label in the sidebar (for consistency). */
  navLabel: string;
  title: string;
  /** Short plain-language goal for a beginner. */
  summary: string;
  steps: string[];
};

/** Ordered like the sidebar (excluding Learning & Admin). Extend one section at a time. */
export const beginnerSections: LearningSection[] = [
  {
    id: 'dashboard',
    navLabel: 'Dashboard',
    title: 'Dashboard',
    summary:
      'After you sign in, Dashboard is your home base: a snapshot of wallets, balances, and recent activity so you know where you stand before sending or receiving.',
    steps: [
      'In the **left sidebar**, click **Dashboard** (wallet icon). The page opens in the main area on the right.',
      'At the top you will see a short line about your account type — that is normal and helps the app tailor hints.',
      'The **wallet summary** shows the wallets you have. You can expand or skim them to see which wallet holds what.',
      '**Summary cards** give quick numbers (for example total value and pending items). Use them as a quick health check.',
      'The **asset table** lists coins or tokens and amounts. That is where you confirm what you actually hold.',
      '**Recent transactions** at the bottom shows the latest sends and receives. Open **History** in the sidebar when you need the full list.',
      'When you are ready to move money, use **Send** or **Receive** in the sidebar.',
    ],
  },
  // Next: { id: 'wallets', navLabel: 'Wallets', ... }
];

export function showBeginnerLearning(role: UserRole): boolean {
  return role === 'BEGINNER_TRADER';
}
