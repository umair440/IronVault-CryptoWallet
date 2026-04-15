import './globals.css';
import type { Metadata } from 'next';
import { MockHelpChatbot } from '@/components/help/mock-help-chatbot';

export const metadata: Metadata = {
  title: 'IronVault',
  description: 'IronVault crypto wallet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen">
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
        <MockHelpChatbot />
      </body>
    </html>
  );
}
