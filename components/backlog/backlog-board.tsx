'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PbiCard } from './pbi-card';
import { NewPbiDialog } from './new-pbi-dialog';
import { PbiDetailDialog } from './pbi-detail-dialog';

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
  clientSlug: string;
  initialPbis: Pbi[];
}

export function BacklogBoard({ clientSlug, initialPbis }: Props) {
  const router = useRouter();
  const [pbis, setPbis] = useState<Pbi[]>(initialPbis);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewPbiDialog, setShowNewPbiDialog] = useState(false);
  const [selectedPbi, setSelectedPbi] = useState<Pbi | null>(null);

  // Filter PBIs
  const filteredPbis = pbis.filter((pbi) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !pbi.title.toLowerCase().includes(query) &&
        !pbi.description?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (statusFilter !== 'all' && pbi.status !== statusFilter) {
      return false;
    }
    if (typeFilter !== 'all' && pbi.type !== typeFilter) {
      return false;
    }
    return true;
  });

  // Handle drag end
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;

      if (sourceIndex === destIndex) return;

      // Optimistic update
      const newPbis = Array.from(pbis);
      const [removed] = newPbis.splice(sourceIndex, 1);
      newPbis.splice(destIndex, 0, removed);

      // Update stack positions
      const reorderedPbis = newPbis.map((pbi, index) => ({
        ...pbi,
        stackPosition: index + 1,
      }));

      setPbis(reorderedPbis);

      // Send to API
      try {
        const orderedIds = reorderedPbis.map((pbi) => pbi.id);
        const response = await fetch(`/api/clients/${clientSlug}/pbis/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        });

        if (!response.ok) {
          // Revert on error
          setPbis(pbis);
          console.error('Failed to reorder PBIs');
        }
      } catch (error) {
        // Revert on error
        setPbis(pbis);
        console.error('Failed to reorder PBIs:', error);
      }
    },
    [pbis, clientSlug]
  );

  // Handle PBI created
  const handlePbiCreated = (newPbi: Pbi) => {
    setPbis([...pbis, newPbi]);
    setShowNewPbiDialog(false);
  };

  // Handle PBI updated
  const handlePbiUpdated = (updatedPbi: Pbi) => {
    setPbis(pbis.map((pbi) => (pbi.id === updatedPbi.id ? updatedPbi : pbi)));
    setSelectedPbi(null);
  };

  // Handle PBI deleted
  const handlePbiDeleted = (pbiId: string) => {
    setPbis(pbis.filter((pbi) => pbi.id !== pbiId));
    setSelectedPbi(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Input
            type="search"
            placeholder="Search PBIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="tweak">Tweak</SelectItem>
              <SelectItem value="idea">Idea</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowNewPbiDialog(true)}>
          + Add PBI
        </Button>
      </div>

      {/* PBI Count */}
      <div className="text-sm text-gray-500">
        {filteredPbis.length} of {pbis.length} items
      </div>

      {/* PBI List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="backlog">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${
                snapshot.isDraggingOver ? 'bg-primary-50' : ''
              }`}
            >
              {filteredPbis.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {pbis.length === 0 ? (
                    <>
                      <p className="mb-4">No PBIs yet. Create your first one!</p>
                      <Button onClick={() => setShowNewPbiDialog(true)}>
                        + Add PBI
                      </Button>
                    </>
                  ) : (
                    <p>No PBIs match your filters.</p>
                  )}
                </div>
              ) : (
                filteredPbis.map((pbi, index) => (
                  <Draggable key={pbi.id} draggableId={pbi.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <PbiCard
                          pbi={pbi}
                          isDragging={snapshot.isDragging}
                          onClick={() => setSelectedPbi(pbi)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* New PBI Dialog */}
      <NewPbiDialog
        open={showNewPbiDialog}
        onOpenChange={setShowNewPbiDialog}
        clientSlug={clientSlug}
        onCreated={handlePbiCreated}
      />

      {/* PBI Detail Dialog */}
      {selectedPbi && (
        <PbiDetailDialog
          open={!!selectedPbi}
          onOpenChange={(open) => !open && setSelectedPbi(null)}
          pbi={selectedPbi}
          onUpdated={handlePbiUpdated}
          onDeleted={handlePbiDeleted}
        />
      )}
    </div>
  );
}
