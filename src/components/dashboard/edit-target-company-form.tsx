'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { updateTargetCompany } from '@/lib/actions/target-company';
import { toast } from 'sonner';
import { Loader2, Pencil } from 'lucide-react';

const formSchema = z.object({
  relationship_category: z.string().uuid('Please select a category'),
  why: z.string().max(1000).optional(),
  note: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
}

interface EditTargetCompanyFormProperties {
  targetId: string;
  clientCompanyId: string;
  targetCompanyName: string;
  categories: Category[];
  initialData: {
    relationship_category: string;
    why?: string | null;
    note?: string | null;
  };
}

export function EditTargetCompanyForm({
  targetId,
  clientCompanyId,
  targetCompanyName,
  categories,
  initialData,
}: EditTargetCompanyFormProperties) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      relationship_category: initialData.relationship_category,
      why: initialData.why || '',
      note: initialData.note || '',
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    const result = await updateTargetCompany(targetId, clientCompanyId, {
      relationship_category: values.relationship_category,
      why: values.why || null,
      note: values.note || null,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Target company updated');
      setOpen(false);
    } else {
      toast.error(result.error || 'Something went wrong');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Target Company</DialogTitle>
          <DialogDescription>Update targeting details for {targetCompanyName}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="relationship_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
              name="why"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Why are you targeting this company?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Additional notes..."
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
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
