"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createCompany,
  updateCompany,
  createRelationshipCategory,
  type CompanyFormData,
} from "@/lib/actions/company";
import { toast } from "sonner";
import { Loader2, ChevronsUpDown, Check, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  legal_name: z.string().max(255).optional(),
  website: z.url("Invalid URL").optional().or(z.literal("")),
  logo_url: z.url("Invalid URL").optional().or(z.literal("")),
  description: z.string().max(1000).optional(),
  target_customer_profile: z.string().max(2000).optional(),
  preferred_relationship_categories: z.array(z.string()).optional(),
  industry_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Industry {
  id: string;
  name: string;
}

interface RelationshipCategory {
  id: string;
  name: string;
}

interface CompanyFormProps {
  mode: "create" | "edit";
  industries: Industry[];
  relationshipCategories: RelationshipCategory[];
  initialData?: {
    id: string;
    name: string;
    legal_name?: string | null;
    website?: string | null;
    logo_url?: string | null;
    description?: string | null;
    target_customer_profile?: string | null;
    preferred_relationship_categories?: string[] | null;
    industry_id?: string | null;
  };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CompanyForm({
  mode,
  industries,
  relationshipCategories: initialCategories = [],
  initialData,
  trigger,
  onSuccess,
}: CompanyFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] =
    useState<RelationshipCategory[]>(initialCategories ?? []);
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  function getDefaultValues() {
    return {
      name: initialData?.name || "",
      legal_name: initialData?.legal_name || "",
      website: initialData?.website || "",
      logo_url: initialData?.logo_url || "",
      description: initialData?.description || "",
      target_customer_profile: initialData?.target_customer_profile || "",
      preferred_relationship_categories:
        initialData?.preferred_relationship_categories || [],
      industry_id: initialData?.industry_id || "",
    };
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  const selectedCategoryIds =
    form.watch("preferred_relationship_categories") ?? [];



  function toggleCategory(id: string) {
    const current =
      form.getValues("preferred_relationship_categories") ?? [];
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    form.setValue("preferred_relationship_categories", updated, {
      shouldDirty: true,
    });
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);

    const result = await createRelationshipCategory(newCategoryName.trim());
    setIsCreatingCategory(false);

    if (!result.success || !result.data) {
      toast.error(result.error || "Failed to create category");
      return;
    }

    const created = result.data;
    setCategories((prev) => [...prev, created]);

    const current =
      form.getValues("preferred_relationship_categories") ?? [];
    form.setValue(
      "preferred_relationship_categories",
      [...current, created.id],
      { shouldDirty: true }
    );

    setNewCategoryName("");
    toast.success(`"${created.name}" category created`);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    const formData: CompanyFormData = {
      name: values.name,
      legal_name: values.legal_name || null,
      website: values.website || null,
      logo_url: values.logo_url || null,
      description: values.description || null,
      target_customer_profile: values.target_customer_profile || null,
      preferred_relationship_categories:
        values.preferred_relationship_categories ?? [],
      industry_id: values.industry_id || null,
    };

    const result =
      mode === "create"
        ? await createCompany(formData)
        : await updateCompany(initialData!.id, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(mode === "create" ? "Company created" : "Company updated");
      setOpen(false);
      if (mode === "create") form.reset();
      onSuccess?.();
    } else {
      toast.error(result.error || "Something went wrong");
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      form.reset(getDefaultValues());
      setCategories(initialCategories ?? []);
    }
    setOpen(newOpen);
  }

  const selectedCategories = categories.filter((c) =>
    selectedCategoryIds.includes(c.id)
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>{mode === "create" ? "Add Company" : "Edit"}</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add New Company" : "Edit Company"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new company to your dashboard."
              : "Update the company details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legal_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Incorporated" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com/logo.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.id} value={industry.id}>
                          {industry.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-20 max-h-40 resize-y"
                      placeholder="Brief description of the company..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_customer_profile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Customer Profile</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-24 max-h-48 resize-y"
                      placeholder="Describe the ideal customer for this company (e.g. mid-market SaaS companies in LATAM with 50–200 employees)..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_relationship_categories"
              render={() => (
                <FormItem>
                  <FormLabel>Preferred Relationship Categories</FormLabel>

                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {selectedCategories.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Popover
                    open={categoryPopoverOpen}
                    onOpenChange={setCategoryPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between font-normal"
                        >
                          <span className="text-muted-foreground">
                            {selectedCategories.length === 0
                              ? "Select categories..."
                              : `${selectedCategories.length} selected`}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <div className="max-h-48 overflow-y-auto">
                        {categories.length === 0 && (
                          <p className="p-3 text-sm text-muted-foreground">
                            No categories yet. Create one below.
                          </p>
                        )}
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 shrink-0",
                                selectedCategoryIds.includes(cat.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {cat.name}
                          </button>
                        ))}
                      </div>

                      <div className="border-t p-2 flex gap-2">
                        <Input
                          ref={newCategoryInputRef}
                          placeholder="New category..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateCategory();
                            }
                          }}
                          className="h-8 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 px-2 shrink-0"
                          disabled={
                            !newCategoryName.trim() || isCreatingCategory
                          }
                          onClick={handleCreateCategory}
                        >
                          {isCreatingCategory ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
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
                {mode === "create" ? "Create Company" : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}