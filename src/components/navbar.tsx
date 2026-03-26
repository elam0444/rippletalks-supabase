import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { BarChart3 } from "lucide-react";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className='border-b'>
      <div className='mx-auto px-4 h-16 flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2'>
          <Image
            src='/RippleTalks Logo_edited.png'
            alt='RippleTalk Logo'
            width={40}
            height={40}
          />
          <span className='font-semibold text-lg'>Ripple Talks</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/analytics">
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  Analytics
                </Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
