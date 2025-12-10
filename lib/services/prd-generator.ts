import type { Client } from '@prisma/client';

interface PbiForPrd {
  id: string;
  title: string;
  description: string | null;
  type: 'feature' | 'bug' | 'tweak' | 'idea';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL' | null;
  stackPosition: number;
}

interface PrdOptions {
  includeCompleted?: boolean;
  includeEffortEstimates?: boolean;
  groupByType?: boolean;
  groupByStatus?: boolean;
}

const effortLabels: Record<string, string> = {
  XS: 'Extra Small (hours)',
  S: 'Small (1-2 days)',
  M: 'Medium (3-5 days)',
  L: 'Large (1-2 weeks)',
  XL: 'Extra Large (2+ weeks)',
};

const typeLabels: Record<string, string> = {
  feature: 'Feature',
  bug: 'Bug Fix',
  tweak: 'Tweak/Enhancement',
  idea: 'Idea/Future Consideration',
};

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

/**
 * Generate a PRD markdown document from PBIs
 */
export function generatePrd(
  client: Pick<Client, 'name' | 'description'>,
  pbis: PbiForPrd[],
  options: PrdOptions = {}
): string {
  const {
    includeCompleted = false,
    includeEffortEstimates = true,
    groupByType = false,
    groupByStatus = false,
  } = options;

  // Filter PBIs
  let filteredPbis = pbis;
  if (!includeCompleted) {
    filteredPbis = pbis.filter((pbi) => pbi.status !== 'done');
  }

  // Sort by stack position
  filteredPbis.sort((a, b) => a.stackPosition - b.stackPosition);

  const lines: string[] = [];
  const generatedDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Header
  lines.push(`# Product Requirements Document`);
  lines.push(``);
  lines.push(`**Project:** ${client.name}`);
  if (client.description) {
    lines.push(`**Description:** ${client.description}`);
  }
  lines.push(`**Generated:** ${generatedDate}`);
  lines.push(`**Total Items:** ${filteredPbis.length}`);
  lines.push(``);

  // Summary statistics
  const stats = {
    features: filteredPbis.filter((p) => p.type === 'feature').length,
    bugs: filteredPbis.filter((p) => p.type === 'bug').length,
    tweaks: filteredPbis.filter((p) => p.type === 'tweak').length,
    ideas: filteredPbis.filter((p) => p.type === 'idea').length,
    todo: filteredPbis.filter((p) => p.status === 'todo').length,
    inProgress: filteredPbis.filter((p) => p.status === 'in_progress').length,
    blocked: filteredPbis.filter((p) => p.status === 'blocked').length,
    done: filteredPbis.filter((p) => p.status === 'done').length,
  };

  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`### By Type`);
  lines.push(`- Features: ${stats.features}`);
  lines.push(`- Bug Fixes: ${stats.bugs}`);
  lines.push(`- Tweaks: ${stats.tweaks}`);
  lines.push(`- Ideas: ${stats.ideas}`);
  lines.push(``);
  lines.push(`### By Status`);
  lines.push(`- To Do: ${stats.todo}`);
  lines.push(`- In Progress: ${stats.inProgress}`);
  lines.push(`- Blocked: ${stats.blocked}`);
  if (includeCompleted) {
    lines.push(`- Done: ${stats.done}`);
  }
  lines.push(``);

  // Generate content based on grouping
  if (groupByType) {
    lines.push(...generateGroupedByType(filteredPbis, includeEffortEstimates));
  } else if (groupByStatus) {
    lines.push(...generateGroupedByStatus(filteredPbis, includeEffortEstimates));
  } else {
    lines.push(...generatePrioritizedList(filteredPbis, includeEffortEstimates));
  }

  // Footer for AI context
  lines.push(``);
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Notes for AI Analysis`);
  lines.push(``);
  lines.push(`This PRD represents the current product backlog for ${client.name}. Items are listed in priority order (stack rank). When analysing this document:`);
  lines.push(``);
  lines.push(`1. **Priority** is indicated by the item number - lower numbers are higher priority`);
  lines.push(`2. **Effort estimates** use T-shirt sizing: XS (hours), S (1-2 days), M (3-5 days), L (1-2 weeks), XL (2+ weeks)`);
  lines.push(`3. **Status** indicates current progress: To Do, In Progress, Blocked, or Done`);
  lines.push(`4. **Type** categorises items: Feature (new functionality), Bug (defect fix), Tweak (enhancement), Idea (future consideration)`);
  lines.push(``);

  return lines.join('\n');
}

function generatePrioritizedList(
  pbis: PbiForPrd[],
  includeEffort: boolean
): string[] {
  const lines: string[] = [];

  lines.push(`## Prioritised Backlog`);
  lines.push(``);
  lines.push(`Items listed in priority order (highest priority first).`);
  lines.push(``);

  pbis.forEach((pbi, index) => {
    lines.push(...formatPbiEntry(pbi, index + 1, includeEffort));
    lines.push(``);
  });

  return lines;
}

function generateGroupedByType(
  pbis: PbiForPrd[],
  includeEffort: boolean
): string[] {
  const lines: string[] = [];
  const types: Array<'feature' | 'bug' | 'tweak' | 'idea'> = [
    'feature',
    'bug',
    'tweak',
    'idea',
  ];

  lines.push(`## Backlog by Type`);
  lines.push(``);

  types.forEach((type) => {
    const typePbis = pbis.filter((p) => p.type === type);
    if (typePbis.length === 0) return;

    lines.push(`### ${typeLabels[type]}s (${typePbis.length})`);
    lines.push(``);

    typePbis.forEach((pbi) => {
      lines.push(...formatPbiEntry(pbi, pbi.stackPosition, includeEffort));
      lines.push(``);
    });
  });

  return lines;
}

function generateGroupedByStatus(
  pbis: PbiForPrd[],
  includeEffort: boolean
): string[] {
  const lines: string[] = [];
  const statuses: Array<'blocked' | 'in_progress' | 'todo' | 'done'> = [
    'blocked',
    'in_progress',
    'todo',
    'done',
  ];

  lines.push(`## Backlog by Status`);
  lines.push(``);

  statuses.forEach((status) => {
    const statusPbis = pbis.filter((p) => p.status === status);
    if (statusPbis.length === 0) return;

    lines.push(`### ${statusLabels[status]} (${statusPbis.length})`);
    lines.push(``);

    statusPbis.forEach((pbi) => {
      lines.push(...formatPbiEntry(pbi, pbi.stackPosition, includeEffort));
      lines.push(``);
    });
  });

  return lines;
}

function formatPbiEntry(
  pbi: PbiForPrd,
  priority: number,
  includeEffort: boolean
): string[] {
  const lines: string[] = [];
  const meta: string[] = [];

  meta.push(`**Type:** ${typeLabels[pbi.type]}`);
  meta.push(`**Status:** ${statusLabels[pbi.status]}`);
  if (includeEffort && pbi.effort) {
    meta.push(`**Effort:** ${pbi.effort} (${effortLabels[pbi.effort]})`);
  }

  lines.push(`#### ${priority}. ${pbi.title}`);
  lines.push(``);
  lines.push(meta.join(' | '));
  lines.push(``);

  if (pbi.description) {
    lines.push(pbi.description);
  } else {
    lines.push(`*No detailed description provided.*`);
  }

  return lines;
}

/**
 * Generate a concise PRD for quick review
 */
export function generateConcisePrd(
  client: Pick<Client, 'name'>,
  pbis: PbiForPrd[]
): string {
  const activePbis = pbis
    .filter((p) => p.status !== 'done')
    .sort((a, b) => a.stackPosition - b.stackPosition);

  const lines: string[] = [];

  lines.push(`# ${client.name} - Product Backlog Summary`);
  lines.push(``);
  lines.push(`**${activePbis.length} active items** (excluding completed)`);
  lines.push(``);

  // Quick list
  lines.push(`## Priority List`);
  lines.push(``);

  activePbis.forEach((pbi, index) => {
    const effort = pbi.effort ? ` [${pbi.effort}]` : '';
    const status = pbi.status !== 'todo' ? ` (${statusLabels[pbi.status]})` : '';
    lines.push(
      `${index + 1}. **${pbi.title}**${effort}${status} - ${typeLabels[pbi.type]}`
    );
  });

  return lines.join('\n');
}
