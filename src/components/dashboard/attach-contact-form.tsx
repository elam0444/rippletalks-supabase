"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { attachContact } from "@/lib/actions/contact";
import { toast } from "sonner";
import { Loader2, UserPlus, Check } from "lucide-react";

interface AvailableContact {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  company:
    | {
        id: string;
        name: string;
      }[]
    | null;
}

interface AttachContactFormProps {
  companyId: string;
  companyName: string;
  availableContacts: AvailableContact[];
}

export function AttachContactForm({
  companyId,
  companyName,
  availableContacts,
}: AttachContactFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  async function handleSelect(contactId: string) {
    setSelectedContactId(contactId);
    setIsSubmitting(true);

    const result = await attachContact(contactId, companyId);

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Contact attached");
      setOpen(false);
      setSelectedContactId("");
    } else {
      toast.error(result.error || "Something went wrong");
    }
  }

  if (availableContacts.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Attach Existing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Attach Existing Contact</DialogTitle>
          <DialogDescription>
            Search and select an existing contact to attach to {companyName}.
          </DialogDescription>
        </DialogHeader>
        <Command className="border rounded-md">
          <CommandInput
            placeholder="Search contacts..."
            className="focus:ring-0 focus:outline-none"
          />
          <CommandList className="h-[300px] max-h-[300px]">
            <CommandEmpty>No contacts found.</CommandEmpty>
            <CommandGroup>
              {availableContacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.name} ${contact.email || ""} ${
                    contact.title || ""
                  }`}
                  onSelect={() => handleSelect(contact.id)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contact.name}</span>
                      {selectedContactId === contact.id && isSubmitting && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {selectedContactId === contact.id && !isSubmitting && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {contact.title && <span>{contact.title}</span>}
                      {contact.title && contact.company?.[0]?.name && (
                        <span> · </span>
                      )}
                      {contact.company?.[0]?.name && (
                        <span>{contact.company[0].name}</span>
                      )}
                    </div>
                    {contact.email && (
                      <span className="text-xs text-muted-foreground">
                        {contact.email}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
