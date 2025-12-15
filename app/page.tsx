import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">OpsStack Backlog</CardTitle>
          <CardDescription>
            Product backlog collaboration for OpsStack clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login" className="block">
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            Need access? Contact your OpsStack project manager.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
