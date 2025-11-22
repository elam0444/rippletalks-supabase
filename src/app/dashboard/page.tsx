import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/auth/sign-out-button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Welcome back!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">User ID</p>
            <p className="font-mono text-sm">{user.id}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Last Sign In</p>
            <p className="text-sm">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : 'N/A'}
            </p>
          </div>
          <SignOutButton />
        </CardContent>
      </Card>
    </div>
  )
}
