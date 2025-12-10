import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listClientsWithStats } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function ClientsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'flowency_admin') {
    redirect('/');
  }

  const clients = await listClientsWithStats();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client organisations</p>
        </div>
        <Link href="/clients/new">
          <Button>Add Client</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No clients yet.</p>
              <Link href="/clients/new">
                <Button>Create your first client</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Users</TableHead>
                  <TableHead className="text-center">PBIs</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {client.logoUrl ? (
                          <img
                            src={client.logoUrl}
                            alt={client.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <span className="text-gray-500 font-medium text-xs">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.description && (
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">
                              {client.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {client.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      {client.stats.totalUsers}
                    </TableCell>
                    <TableCell className="text-center">
                      {client.stats.totalPbis}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {client.stats.blocked > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {client.stats.blocked}
                          </Badge>
                        )}
                        {client.stats.inProgress > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-primary-100 text-primary-600"
                          >
                            {client.stats.inProgress}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {client.stats.todo}
                        </Badge>
                        {client.stats.done > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-700"
                          >
                            {client.stats.done}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/backlog/${client.slug}`}>
                          <Button variant="outline" size="sm">
                            Backlog
                          </Button>
                        </Link>
                        <Link href={`/clients/${client.slug}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
