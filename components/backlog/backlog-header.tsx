'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientSwitcher } from '@/components/admin/client-switcher';

interface Client {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

interface Props {
  client: Client;
  isFlowencyAdmin: boolean;
}

export function BacklogHeader({ client, isFlowencyAdmin }: Props) {
  const { data: session } = useSession();

  const userInitials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and client info */}
          <div className="flex items-center gap-4">
            <Link href={isFlowencyAdmin ? '/dashboard' : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FB</span>
              </div>
            </Link>

            <div className="h-6 w-px bg-gray-200" />

            {isFlowencyAdmin ? (
              <ClientSwitcher currentSlug={client.slug} />
            ) : (
              <div className="flex items-center gap-3">
                {client.logoUrl ? (
                  <img
                    src={client.logoUrl}
                    alt={client.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500 font-medium text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium">{client.name}</span>
              </div>
            )}
          </div>

          {/* Right side - Actions and user menu */}
          <div className="flex items-center gap-4">
            <Link href={`/backlog/${client.slug}/prd`}>
              <Button variant="outline" size="sm">
                Export PRD
              </Button>
            </Link>

            {isFlowencyAdmin && (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Admin
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.user?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary-100 text-primary-600 text-xs">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-red-600"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
