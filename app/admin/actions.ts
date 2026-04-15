'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireSession, requireRole } from '@/lib/session';
import type { TicketStatus } from '@prisma/client';

export async function submitSupportTicket(formData: FormData) {
  const session = await requireSession();
  const subject = (formData.get('subject') as string | null)?.trim();
  const message = (formData.get('message') as string | null)?.trim();

  if (!subject || !message) return;

  await prisma.supportTicket.create({
    data: {
      subject,
      message,
      submitterId: session.user.id,
    },
  });

  revalidatePath('/support');
  revalidatePath('/admin');
}

export async function updateTicketStatus(ticketId: string, formData: FormData) {
  await requireRole(['ADMIN', 'DEVELOPER']);
  const status = formData.get('status') as TicketStatus;

  if (!status) return;

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  revalidatePath('/admin');
}
