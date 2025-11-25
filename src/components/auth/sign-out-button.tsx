'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Signed out successfully');
    router.push('/login');
    router.refresh();
  }

  return (
    <Button onClick={handleSignOut} variant="outline" className="w-full">
      Sign out
    </Button>
  );
}
