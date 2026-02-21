"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Loader2,
  Plus,
  Building2,
  Check,
  ChevronDown,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createTargetCompaniesFromDescription } from "@/lib/actions/ai";
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [companyPopoverOpen, setCompanyPopoverOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [loadingCompany, setLoadingCompany] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      target_company_id: "",
      relationship_category: "",
      why: "",
      note: "",
    },
  });

  useEffect(() => {
    if (!clientCompanyId) return;

    const supabase = createClient();

    async function fetchCompany() {
      setLoadingCompany(true);
      const { data: company, error } = await supabase
        .from("companies")
        .select(`name, description, website, industry:industry_id(name)`)
        .eq("id", clientCompanyId)
        .single();

      if (error) {
        console.error("Error fetching company:", error);
        setLoadingCompany(false);
        return;
      }

      const descriptionText =
        `Company Name: ${company.name}` +
        `\nIndustry: ${company.industry?.name || "N/A"}` +
        `\nDescription: ${company.description || "N/A"}` +
        `\nWebsite: ${company.website || "N/A"}`;

      setAiDescription(descriptionText);
      setLoadingCompany(false);
    }

    fetchCompany();
  }, [clientCompanyId]);

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

  async function generateTargetsForDescription(
    description: string,
    profileId: string,
    clientCompanyId?: string,
  ) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const targets = await createTargetCompaniesFromDescription(
      description,
      profileId,
      clientCompanyId,
    );
    return targets;
  }

  async function handleGenerateTargets() {
    if (!clientCompanyId) {
      toast.error("Client company ID is missing.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return { success: false, error: "Unauthorized" };

      const description = aiDescription || "";

      const result = await generateTargetsForDescription(
        description,
        user.id,
        clientCompanyId,
      );

      toast.success(`Generated ${result.length} target companies!`);
      router.refresh()
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate target companies.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingCompany) return null; // prevent hydration mismatch

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex justify-end gap-2 pt-4">
        <Button
          size="sm"
          className="cursor-pointer flex items-center text-emerald-400 bg-gray-900 hover:bg-gray-800 border border-emerald-400 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
          onClick={handleGenerateTargets}
          disabled={isSubmitting || !clientCompanyId}
        >
          <Brain
            className={cn(
              "h-4 w-4 mr-2 text-emerald-400 drop-shadow-[0_0_6px_#10b981]",
              isSubmitting ? "animate-spin" : "animate-pulse",
            )}
          />
          {isSubmitting ? "Thinking..." : "Add Targets Using Ripple AI"}
        </Button>
        <DialogTrigger asChild>
          <Button size="sm" className="cursor-pointer">
            <Plus className="h-4 w-4 mr-2" />
            Add Target
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Target Company</DialogTitle>
          <DialogDescription>
            Select a company to add as a target.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* ...rest of form fields unchanged... */}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
