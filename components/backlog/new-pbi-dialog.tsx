'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientSlug: string;
  onCreated: (pbi: Pbi) => void;
}

export function NewPbiDialog({ open, onOpenChange, clientSlug, onCreated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature',
    status: 'todo',
    effort: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clients/${clientSlug}/pbis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          type: formData.type,
          status: formData.status,
          effort: formData.effort || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create PBI');
      }

      const pbi = await response.json();

      // Fetch the PBI with full details
      const detailResponse = await fetch(`/api/pbis/${pbi.id}?include=full`);
      if (detailResponse.ok) {
        const fullPbi = await detailResponse.json();
        onCreated(fullPbi);
      } else {
        // Use basic pbi data with defaults
        onCreated({
          ...pbi,
          creator: { id: '', name: 'You', avatarUrl: null },
          _count: { comments: 0, attachments: 0 },
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'feature',
        status: 'todo',
        effort: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New PBI</DialogTitle>
            <DialogDescription>
              Add a new item to the product backlog.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mt-4">
              {error}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Brief description of the item"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Detailed description (supports markdown)"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="tweak">Tweak</SelectItem>
                    <SelectItem value="idea">Idea</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effort">Effort Estimate</Label>
              <Select
                value={formData.effort}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, effort: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select effort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XS">XS - Extra Small (hours)</SelectItem>
                  <SelectItem value="S">S - Small (1-2 days)</SelectItem>
                  <SelectItem value="M">M - Medium (3-5 days)</SelectItem>
                  <SelectItem value="L">L - Large (1-2 weeks)</SelectItem>
                  <SelectItem value="XL">XL - Extra Large (2+ weeks)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create PBI'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
