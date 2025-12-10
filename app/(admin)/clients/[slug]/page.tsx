import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getClientWithStats, listUsersByClient, listInvitationsByClient } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ClientSettingsForm } from '@/components/admin/client-settings-form';
import { ClientUsersTable } from '@/components/admin/client-users-table';
import { ClientInvitations } from '@/components/admin/client-invitations';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'flowency_admin') {
    redirect('/');
  }

  const { slug } = await params;
  const client = await getClientWithStats(slug);

  if (!client) {
    notFound();
  }

  const users = await listUsersByClient(client.id);
  const invitations = await listInvitationsByClient(client.id);

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/clients"
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          &larr; Back to Clients
        </Link>
        <div className="flex items-center gap-4">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 font-bold text-lg">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-500">
              {client.stats.totalPbis} PBIs &middot; {client.stats.totalUsers} users
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="invitations">
            Invitations ({invitations.filter((i) => !i.acceptedAt).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <ClientSettingsForm client={client} />
        </TabsContent>

        <TabsContent value="users">
          <ClientUsersTable users={users} clientSlug={slug} />
        </TabsContent>

        <TabsContent value="invitations">
          <ClientInvitations
            invitations={invitations}
            clientId={client.id}
            clientSlug={slug}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
