"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/share";

interface DeleteCompanyDialogProps {
  company: Company | null;
  onClose: () => void;
  onDelete: (companyId: string) => Promise<void>;
  isDeleting?: boolean;
}

/**
 * Confirmation dialog for deleting a company
 */
export function DeleteCompanyDialog({
  company,
  onClose,
  onDelete,
  isDeleting = false,
}: DeleteCompanyDialogProps) {
  const handleDelete = async () => {
    if (company) {
      await onDelete(company.id);
    }
  };

  return (
    <AlertDialog open={!!company} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove company?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove {company?.name} from this list? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isDeleting ? "Removing…" : "Remove"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
