'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { removeContact } from '@/lib/actions/contact';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface RemoveContactButtonProperties {
  contactId: string;
  companyId: string;
  contactName: string;
}

export function RemoveContactButton({
  contactId,
  companyId,
  contactName,
}: RemoveContactButtonProperties) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleRemove() {
    setIsDeleting(true);
    const result = await removeContact(contactId, companyId);
    setIsDeleting(false);

    if (result.success) {
      toast.success('Contact removed');
      setOpen(false);
    } else {
      toast.error(result.error || 'Failed to remove contact');
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Contact</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{contactName}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
