"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Share2, Copy, Check } from "lucide-react"

interface ShareContactButtonProps {
  contactId: string
  companyId: string
  contactName: string
}

export function ShareContactButton({
  contactId,
  companyId,
  contactName,
}: ShareContactButtonProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isExistingLink, setIsExistingLink] = useState(false)

  async function handleGenerateLink() {
    setIsGenerating(true)

    try {
      const res = await fetch("/api/share/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, companyId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to generate share link")
        setIsGenerating(false)
        return
      }

      setShareUrl(data.shareUrl)
      setIsExistingLink(data.isExisting)

      if (data.isExisting) {
        toast.success("Retrieved existing share link!")
      } else {
        toast.success("New share link created!")
      }
    } catch (err) {
      console.error("Error generating share link:", err)
      toast.error("Something went wrong")
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      toast.error("Failed to copy link")
    }
  }

  async function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      // When opening, check if a link already exists
      handleGenerateLink()
    } else {
      // Reset state when dialog closes
      setShareUrl(null)
      setCopied(false)
      setIsExistingLink(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Contact</DialogTitle>
          <DialogDescription>
            Generate a shareable link for {contactName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading share link...</p>
            </div>
          ) : shareUrl ? (
            <div className="space-y-4">
              {isExistingLink && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                  <Check className="h-4 w-4" />
                  <span>This link was previously created and is being reused</span>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Share URL</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with others to give them access to view this contact's information. This link will remain the same each time you share this contact.
              </p>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>Failed to load share link. Please try again.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
