import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="space-y-6 text-center flex flex-col items-center">
        {/* Logo + Title */}
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="RippleTalk Logo" width={150} height={150} unoptimized />
          <h1 className="text-4xl font-bold tracking-tight">Welcome to Ripple Talk</h1>
        </div>

        {/* Centered paragraph */}
        <p className="text-lg text-muted-foreground max-w-md">
          Securely access your creator tools, analytics, and community controls.
        </p>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          {user ? (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
