import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to Ripple Talk
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Connect and communicate with your community.
        </p>
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
              <Button asChild variant="outline">
                <Link href="/signup">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
