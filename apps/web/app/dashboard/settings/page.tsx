import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { prisma } from '@fluxfile/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      accountTier: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) redirect('/login');

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p className="text-sm">{user.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm">{user.email}</p>
                  {user.emailVerified ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <Badge variant="warning">Unverified</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Your current plan and usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current Plan</p>
                <p className="text-sm text-muted-foreground">
                  {user.accountTier === 'FREE' && 'Free plan with basic features'}
                  {user.accountTier === 'PRO' && 'Pro plan with advanced features'}
                  {user.accountTier === 'ENTERPRISE' && 'Enterprise plan with full access'}
                </p>
              </div>
              <Badge>{user.accountTier}</Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">
                Member since{' '}
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Account deletion is currently managed by contacting support at{' '}
              <a href="mailto:admin@fluxfile.aspekts.dev" className="text-primary hover:underline">
                admin@fluxfile.aspekts.dev
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
