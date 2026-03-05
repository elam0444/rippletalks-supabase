"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateContact } from "@/lib/actions/contact";
import { getPanelistTypes } from "@/lib/actions/panelist-types";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(255),
  last_name: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  title: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  avatar_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  panelist_type_id: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PanelistType {
  id: string;
  name: string;
}

interface EditContactFormProps {
  contactId: string;
  companyId: string;
  initialData: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    title?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    panelist_type_id?: string | null;
  };
}

export function EditContactForm({
  contactId,
  companyId,
  initialData,
}: EditContactFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [panelistTypes, setPanelistTypes] = useState<PanelistType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      email: initialData.email || "",
      title: initialData.title || "",
      phone: initialData.phone || "",
      avatar_url: initialData.avatar_url || "",
      panelist_type_id: initialData.panelist_type_id || null,
    },
  });

  // Fetch panelist types when the dialog opens
  useEffect(() => {
    if (!open) return;
    form.reset({
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      email: initialData.email || "",
      title: initialData.title || "",
      phone: initialData.phone || "",
      avatar_url: initialData.avatar_url || "",
      panelist_type_id: initialData.panelist_type_id ?? null,
    });

    setLoadingTypes(true);

    getPanelistTypes()
      .then((data) => setPanelistTypes(data))
      .catch(() => toast.error("Failed to load panelist types"))
      .finally(() => setLoadingTypes(false));
  }, [open]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    const result = await updateContact(contactId, companyId, {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email || null,
      title: values.title || null,
      phone: values.phone || null,
      avatar_url: values.avatar_url || null,
      panelist_type_id: values.panelist_type_id || null,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Contact updated");
      setOpen(false);
    } else {
      toast.error(result.error || "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update contact details for {[initialData.first_name, initialData.last_name].filter(Boolean).join(" ")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="CEO, CTO, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="panelist_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Panelist Type</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value ?? "none"}
                    disabled={loadingTypes}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {loadingTypes ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          <SelectValue placeholder="Select a panelist type" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">None</span>
                      </SelectItem>
                      {panelistTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
