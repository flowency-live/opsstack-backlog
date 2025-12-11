'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Pbi {
  id: string;
  title: string;
  description: string | null;
  type: 'feature' | 'bug' | 'tweak' | 'idea';
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  effort: 'XS' | 'S' | 'M' | 'L' | 'XL' | null;
  stackPosition: number;
  creator: { id: string; name: string; avatarUrl: string | null };
  _count: { comments: number; attachments: number };
}

interface Props {
  pbi: Pbi;
  isDragging: boolean;
  onClick: () => void;
}

const typeColors: Record<string, string> = {
  feature: 'bg-primary-100 text-primary-600',
  bug: 'bg-red-100 text-red-700',
  tweak: 'bg-amber-100 text-amber-700',
  idea: 'bg-amber-50 text-amber-600',
};

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-primary-100 text-primary-600',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

const effortColors: Record<string, string> = {
  XS: 'bg-green-50 text-green-700 border-green-200',
  S: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  M: 'bg-amber-50 text-amber-700 border-amber-200',
  L: 'bg-orange-50 text-orange-700 border-orange-200',
  XL: 'bg-red-50 text-red-700 border-red-200',
};

export function PbiCard({ pbi, isDragging, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isDragging ? 'shadow-lg ring-2 ring-primary-500' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Position indicator */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-500">
            {pbi.stackPosition}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-gray-900 truncate">{pbi.title}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className={typeColors[pbi.type]}>
                {pbi.type}
              </Badge>
              <Badge variant="outline" className={statusColors[pbi.status]}>
                {statusLabels[pbi.status]}
              </Badge>
            </div>
          </div>

          {pbi.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {pbi.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            {pbi.effort && (
              <span
                className={`px-2 py-0.5 rounded border ${effortColors[pbi.effort]}`}
              >
                {pbi.effort}
              </span>
            )}
            {pbi._count?.comments > 0 && (
              <span className="flex items-center gap-1">
                <CommentIcon className="w-3.5 h-3.5" />
                {pbi._count.comments}
              </span>
            )}
            {pbi._count?.attachments > 0 && (
              <span className="flex items-center gap-1">
                <AttachmentIcon className="w-3.5 h-3.5" />
                {pbi._count.attachments}
              </span>
            )}
            <span className="flex items-center gap-1">
              by {pbi.creator.name}
            </span>
          </div>
        </div>

        {/* Drag handle indicator */}
        <div className="flex-shrink-0 text-gray-300">
          <DragIcon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

function CommentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function AttachmentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  );
}

function DragIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
    </svg>
  );
}
