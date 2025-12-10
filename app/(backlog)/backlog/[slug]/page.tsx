import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getClientBySlug, listPbisByClient } from '@/lib/db';
import { BacklogHeader } from '@/components/backlog/backlog-header';
import { BacklogBoard } from '@/components/backlog/backlog-board';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BacklogPage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { slug } = await params;
  const client = await getClientBySlug(slug);

  if (!client) {
    notFound();
  }

  // Check access
  if (
    session.user.role !== 'flowency_admin' &&
    session.user.clientId !== client.id
  ) {
    redirect('/');
  }

  const pbis = await listPbisByClient(client.id);

  return (
    <>
      <BacklogHeader
        client={client}
        isFlowencyAdmin={session.user.role === 'flowency_admin'}
      />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <BacklogBoard
          clientSlug={slug}
          initialPbis={pbis}
        />
      </main>
    </>
  );
}
