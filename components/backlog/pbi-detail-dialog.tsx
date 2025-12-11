'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PbiComments } from './pbi-comments';

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
  pbi: Pbi;
  onUpdated: (pbi: Pbi) => void;
  onDeleted: (pbiId: string) => void;
}

export function PbiDetailDialog({
  open,
  onOpenChange,
  pbi,
  onUpdated,
  onDeleted,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: pbi.title,
    description: pbi.description || '',
    type: pbi.type,
    status: pbi.status,
    effort: pbi.effort || '',
  });

  // Reset form when pbi changes
  useEffect(() => {
    setFormData({
      title: pbi.title,
      description: pbi.description || '',
      type: pbi.type,
      status: pbi.status,
      effort: pbi.effort || '',
    });
    setIsEditing(false);
    setError(null);
  }, [pbi]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pbis/${pbi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          type: formData.type,
          status: formData.status,
          effort: formData.effort || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update PBI');
      }

      const updated = await response.json();
      onUpdated({
        ...updated,
        creator: pbi.creator,
        _count: pbi._count,
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pbis/${pbi.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete PBI');
      }

      onDeleted(pbi.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-mono text-sm">
                #{pbi.stackPosition}
              </span>
              <DialogTitle className="text-xl">
                {isEditing ? 'Edit PBI' : pbi.title}
              </DialogTitle>
            </div>
            {!isEditing && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={typeColors[pbi.type]}>
                  {pbi.type}
                </Badge>
                <Badge variant="outline" className={statusColors[pbi.status]}>
                  {pbi.status.replace('_', ' ')}
                </Badge>
              </div>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              Comments ({pbi._count?.comments ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            {isEditing ? (
              // Edit mode
              <>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, type: value as Pbi['type'] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, status: value as Pbi['status'] }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Effort</Label>
                    <Select
                      value={formData.effort}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, effort: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="XS">XS</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="L">L</SelectItem>
                        <SelectItem value="XL">XL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete PBI
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          title: pbi.title,
                          description: pbi.description || '',
                          type: pbi.type,
                          status: pbi.status,
                          effort: pbi.effort || '',
                        });
                        setIsEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // View mode
              <>
                {pbi.description ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{pbi.description}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Effort</p>
                    <p className="font-medium">{pbi.effort || 'Not estimated'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created by</p>
                    <p className="font-medium">{pbi.creator.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Attachments</p>
                    <p className="font-medium">{pbi._count.attachments}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setIsEditing(true)}>Edit PBI</Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-4">
            <PbiComments pbiId={pbi.id} />
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete PBI?</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this PBI? This action cannot be
                undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
