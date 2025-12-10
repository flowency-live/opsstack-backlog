import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getClientBySlug, listPbisByClient } from '@/lib/db';
import { generatePrd } from '@/lib/services/prd-generator';
import { PrdViewer } from '@/components/backlog/prd-viewer';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PrdPage({ params, searchParams }: Props) {
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

  const resolvedSearchParams = await searchParams;
  const includeCompleted = resolvedSearchParams.includeCompleted === 'true';
  const groupBy = resolvedSearchParams.groupBy as string | undefined;

  // Get PBIs and generate PRD
  const pbis = await listPbisByClient(client.id);
  const pbisForPrd = pbis.map((pbi) => ({
    id: pbi.id,
    title: pbi.title,
    description: pbi.description,
    type: pbi.type as 'feature' | 'bug' | 'tweak' | 'idea',
    status: pbi.status as 'todo' | 'in_progress' | 'done' | 'blocked',
    effort: pbi.effort as 'XS' | 'S' | 'M' | 'L' | 'XL' | null,
    stackPosition: pbi.stackPosition,
  }));

  const markdown = generatePrd(client, pbisForPrd, {
    includeCompleted,
    includeEffortEstimates: true,
    groupByType: groupBy === 'type',
    groupByStatus: groupBy === 'status',
  });

  return (
    <PrdViewer
      client={client}
      markdown={markdown}
      pbiCount={pbis.length}
      includeCompleted={includeCompleted}
      groupBy={groupBy}
    />
  );
}
