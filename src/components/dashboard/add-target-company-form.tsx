"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { addTargetCompany } from "@/lib/actions/target-company";
import { toast } from "sonner";
import { Loader2, Plus, Building2 } from "lucide-react";

const formSchema = z.object({
  target_company_id: z.string().uuid("Please select a company"),
  relationship_category: z.string().uuid("Please select a category"),
  why: z.string().max(1000).optional(),
  note: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface AddTargetCompanyFormProps {
  clientCompanyId: string;
  availableCompanies: Company[];
  categories: Category[];
}

export function AddTargetCompanyForm({
  clientCompanyId,
  availableCompanies,
  categories,
}: AddTargetCompanyFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_company_id: "",
      relationship_category: "",
      why: "",
      note: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    const result = await addTargetCompany({
      client_company_id: clientCompanyId,
      target_company_id: values.target_company_id,
      relationship_category: values.relationship_category,
      why: values.why || null,
      note: values.note || null,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Target company added");
      setOpen(false);
      form.reset();
    } else {
      toast.error(result.error || "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Add Target
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Add Target Company</DialogTitle>
          <DialogDescription>
            Select a company to add as a target.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='target_company_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Company *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a company' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableCompanies.length > 0 ? (
                        availableCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className='flex items-center gap-2'>
                              {company.logo_url ? (
                                <Image
                                  src={company.logo_url}
                                  alt={company.name}
                                  className='h-5 w-5 rounded object-cover'
                                />
                              ) : (
                                <Building2 className='h-5 w-5 text-muted-foreground' />
                              )}
                              {company.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <div className='px-2 py-4 text-center text-sm text-muted-foreground'>
                          No available companies to target
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='relationship_category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a category' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              name='why'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why</FormLabel>
                  <FormControl>
                    <textarea
                      className='flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                      placeholder='Why are you targeting this company?'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='note'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <textarea
                      className='flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                      placeholder='Additional notes...'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex justify-end gap-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isSubmitting || availableCompanies.length === 0}
              >
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Add Target
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
