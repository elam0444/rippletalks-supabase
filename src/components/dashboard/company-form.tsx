'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createCompany, updateCompany, type CompanyFormData } from '@/lib/actions/company';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  legal_name: z.string().max(255).optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo_url: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  industry_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Industry {
  id: string;
  name: string;
}

interface CompanyFormProperties {
  mode: 'create' | 'edit';
  industries: Industry[];
  initialData?: {
    id: string;
    name: string;
    legal_name?: string | null;
    website?: string | null;
    logo_url?: string | null;
    description?: string | null;
    industry_id?: string | null;
  };
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CompanyForm({
  mode,
  industries,
  initialData,
  trigger,
  onSuccess,
}: CompanyFormProperties) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      legal_name: initialData?.legal_name || '',
      website: initialData?.website || '',
      logo_url: initialData?.logo_url || '',
      description: initialData?.description || '',
      industry_id: initialData?.industry_id || '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    const formData: CompanyFormData = {
      name: values.name,
      legal_name: values.legal_name || null,
      website: values.website || null,
      logo_url: values.logo_url || null,
      description: values.description || null,
      industry_id: values.industry_id || null,
    };

    const result =
      mode === 'create'
        ? await createCompany(formData)
        : await updateCompany(initialData!.id, formData);

    setIsSubmitting(false);

    if (result.success) {
      toast.success(mode === 'create' ? 'Company created' : 'Company updated');
      setOpen(false);
      form.reset();
      onSuccess?.();
    } else {
      toast.error(result.error || 'Something went wrong');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>{mode === 'create' ? 'Add Company' : 'Edit'}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add New Company' : 'Edit Company'}</DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new company to your dashboard.'
              : 'Update the company details.'}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Brief description of the company..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'create' ? 'Create Company' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
