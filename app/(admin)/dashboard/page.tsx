import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { listClientsWithStats } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (session.user.role !== 'flowency_admin') {
    redirect('/');
  }

  const clients = await listClientsWithStats();

  // Calculate totals
  const totals = clients.reduce(
    (acc, client) => ({
      totalPbis: acc.totalPbis + client.stats.totalPbis,
      todo: acc.todo + client.stats.todo,
      inProgress: acc.inProgress + client.stats.inProgress,
      done: acc.done + client.stats.done,
      blocked: acc.blocked + client.stats.blocked,
    }),
    { totalPbis: 0, todo: 0, inProgress: 0, done: 0, blocked: 0 }
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of all client backlogs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total PBIs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.totalPbis}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              To Do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{totals.todo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">{totals.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totals.done}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clients</CardTitle>
            <Link
              href="/clients/new"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Add Client
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No clients yet.</p>
              <Link
                href="/clients/new"
                className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block"
              >
                Create your first client
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.slug}`}
                  className="block p-4 rounded-lg border hover:border-primary-200 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {client.logoUrl ? (
                        <img
                          src={client.logoUrl}
                          alt={client.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-500 font-medium text-sm">
                            {client.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-500">
                          {client.stats.totalPbis} PBIs &middot; {client.stats.totalUsers} users
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.stats.blocked > 0 && (
                        <Badge variant="destructive">{client.stats.blocked} blocked</Badge>
                      )}
                      {client.stats.inProgress > 0 && (
                        <Badge variant="secondary" className="bg-primary-100 text-primary-600">
                          {client.stats.inProgress} in progress
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {client.stats.todo} to do
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
