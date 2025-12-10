import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getClientBySlug, listPbisByClient } from '@/lib/db';
import { generatePrd, generateConcisePrd } from '@/lib/services/prd-generator';

// GET /api/clients/[slug]/prd - Generate PRD for a client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const client = await getClientBySlug(slug);

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check access
    if (
      session.user.role !== 'flowency_admin' &&
      session.user.clientId !== client.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse options from query params
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'full'; // full, concise
    const includeCompleted = searchParams.get('includeCompleted') === 'true';
    const includeEffort = searchParams.get('includeEffort') !== 'false';
    const groupBy = searchParams.get('groupBy'); // type, status, or null for priority

    // Get PBIs
    const pbis = await listPbisByClient(client.id);

    // Transform for PRD generator
    const pbisForPrd = pbis.map((pbi) => ({
      id: pbi.id,
      title: pbi.title,
      description: pbi.description,
      type: pbi.type as 'feature' | 'bug' | 'tweak' | 'idea',
      status: pbi.status as 'todo' | 'in_progress' | 'done' | 'blocked',
      effort: pbi.effort as 'XS' | 'S' | 'M' | 'L' | 'XL' | null,
      stackPosition: pbi.stackPosition,
    }));

    // Generate PRD
    let markdown: string;
    if (format === 'concise') {
      markdown = generateConcisePrd(client, pbisForPrd);
    } else {
      markdown = generatePrd(client, pbisForPrd, {
        includeCompleted,
        includeEffortEstimates: includeEffort,
        groupByType: groupBy === 'type',
        groupByStatus: groupBy === 'status',
      });
    }

    // Return based on Accept header
    const acceptHeader = request.headers.get('accept') || '';
    if (acceptHeader.includes('text/markdown') || acceptHeader.includes('text/plain')) {
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${client.slug}-prd.md"`,
        },
      });
    }

    return NextResponse.json({
      client: {
        name: client.name,
        slug: client.slug,
      },
      pbiCount: pbisForPrd.length,
      markdown,
    });
  } catch (error) {
    console.error('Error generating PRD:', error);
    return NextResponse.json(
      { error: 'Failed to generate PRD' },
      { status: 500 }
    );
  }
}
