'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Client {
  name: string;
  slug: string;
}

interface Props {
  client: Client;
  markdown: string;
  pbiCount: number;
  includeCompleted: boolean;
  groupBy?: string;
}

export function PrdViewer({
  client,
  markdown,
  pbiCount,
  includeCompleted,
  groupBy,
}: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${client.slug}-prd.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOptionsChange = (key: string, value: string) => {
    const params = new URLSearchParams();

    if (key === 'includeCompleted') {
      if (value === 'true') params.set('includeCompleted', 'true');
      if (groupBy) params.set('groupBy', groupBy);
    } else if (key === 'groupBy') {
      if (value && value !== 'priority') params.set('groupBy', value);
      if (includeCompleted) params.set('includeCompleted', 'true');
    }

    const queryString = params.toString();
    router.push(`/backlog/${client.slug}/prd${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={`/backlog/${client.slug}`}
                className="text-gray-500 hover:text-gray-700"
              >
                &larr; Back to Backlog
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <h1 className="font-semibold">PRD Export</h1>
              <Badge variant="secondary">{pbiCount} items</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopyToClipboard}>
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button onClick={handleDownload}>
                Download .md
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Options */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Group by:</span>
              <Select
                value={groupBy || 'priority'}
                onValueChange={(value) => handleOptionsChange('groupBy', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Include:</span>
              <Select
                value={includeCompleted ? 'all' : 'active'}
                onValueChange={(value) =>
                  handleOptionsChange('includeCompleted', value === 'all' ? 'true' : 'false')
                }
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active items only</SelectItem>
                  <SelectItem value="all">All items</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* PRD Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated PRD</span>
              <span className="text-sm font-normal text-gray-500">
                {markdown.length.toLocaleString()} characters
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {markdown}
                </pre>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* AI Usage Instructions */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Using with AI Tools</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>
              This PRD is formatted for easy use with AI assistants like Claude. You can:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Copy the PRD and paste it into a chat with Claude</li>
              <li>Ask Claude to analyse priorities, identify gaps, or suggest improvements</li>
              <li>Request Claude to break down large items into smaller tasks</li>
              <li>Have Claude help estimate effort or identify dependencies</li>
              <li>Generate user stories or acceptance criteria from the backlog items</li>
            </ul>
            <p className="mt-4">
              <strong>Example prompts:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 text-gray-500">
              <li>&quot;Review this PRD and suggest which items should be prioritised first&quot;</li>
              <li>&quot;Identify any missing features that would be expected for this type of product&quot;</li>
              <li>&quot;Break down item #3 into smaller, actionable tasks&quot;</li>
              <li>&quot;Write acceptance criteria for the top 5 features&quot;</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
