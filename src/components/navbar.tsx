import Link from 'next/link';
import Image from 'next/image';
// import { createClient } from "@/lib/supabase/server";
// import { Button } from "@/components/ui/button";
// import { SignOutButton } from "@/components/auth/sign-out-button";

export async function Navbar() {
  // const supabase = await createClient();
  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  return (
    <nav className="border-b">
      <div className="mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/RippleTalks Logo_edited.png" alt="RippleTalk Logo" width={40} height={40} />
          <span className="font-semibold text-lg">Ripple Talk</span>
        </Link>

        {/* <div className="flex items-center gap-4">
          {user ? (
            <>
              <Button asChild variant="ghost">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div> */}
      </div>
    </nav>
  );
}
