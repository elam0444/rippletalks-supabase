"use client"

import { useState } from "react"
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
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { removeTargetCompany } from "@/lib/actions/target-company"
import { toast } from "sonner"
import { Loader2, X } from "lucide-react"

interface RemoveTargetCompanyButtonProps {
  targetId: string
  clientCompanyId: string
  targetCompanyName: string
}

export function RemoveTargetCompanyButton({
  targetId,
  clientCompanyId,
  targetCompanyName,
}: RemoveTargetCompanyButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleRemove() {
    setIsDeleting(true)
    const result = await removeTargetCompany(targetId, clientCompanyId)
    setIsDeleting(false)

    if (result.success) {
      toast.success("Target company removed")
      setOpen(false)
    } else {
      toast.error(result.error || "Failed to remove target company")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Target Company</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{targetCompanyName}</strong> from
            your target list?
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
  )
}
