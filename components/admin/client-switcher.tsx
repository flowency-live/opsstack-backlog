'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface Client {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface Props {
  currentSlug: string;
  basePath?: string; // e.g., '/backlog' - will navigate to /backlog/[slug]
}

export function ClientSwitcher({ currentSlug, basePath = '/backlog' }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClients();
  }, []);

  const handleChange = (slug: string) => {
    if (slug !== currentSlug) {
      router.push(`${basePath}/${slug}`);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  if (clients.length === 0) {
    return null;
  }

  const currentClient = clients.find((c) => c.slug === currentSlug);

  return (
    <Select value={currentSlug} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue>
          {currentClient ? (
            <div className="flex items-center gap-2">
              {currentClient.logoUrl ? (
                <img
                  src={currentClient.logoUrl}
                  alt=""
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs font-medium">
                    {currentClient.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="truncate">{currentClient.name}</span>
            </div>
          ) : (
            'Select client'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.slug}>
            <div className="flex items-center gap-2">
              {client.logoUrl ? (
                <img
                  src={client.logoUrl}
                  alt=""
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xs font-medium">
                    {client.name.charAt(0)}
                  </span>
                </div>
              )}
              <span>{client.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
