import { AppShell } from '@/components/layout/app-shell';
import { ContactManager } from '@/components/wallet/contact-manager';
import { prisma } from '@/lib/prisma';
import { requireSession } from '@/lib/session';
import type { Contact } from '@/types';

export default async function ContactsPage() {
  const session = await requireSession();

  const rows = await prisma.contact.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: 'asc' },
  });

  const contacts: Contact[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    address: c.address,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <AppShell>
      <div>
        <span className="badge">Contacts</span>
        <h1 className="mt-3 text-3xl font-bold">Address book</h1>
        <p className="mt-2 text-slate-400">Save frequently used addresses with a contact name.</p>
      </div>
      <ContactManager contacts={contacts} />
    </AppShell>
  );
}
