'use client';

import { usePathname } from 'next/navigation';
import { MockHelpChatbot } from '@/components/help/mock-help-chatbot';

/** Hide the AI sidebar on the marketing home page only. */
export function ConditionalHelpChatbot() {
  const pathname = usePathname();
  if (pathname === '/') {
    return null;
  }
  return <MockHelpChatbot />;
}
