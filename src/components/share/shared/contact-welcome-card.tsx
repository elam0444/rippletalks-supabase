import { User } from "lucide-react";
import type { Company, Contact } from "@/types/share";

interface ContactWelcomeCardProps {
  contact: Contact;
  company: Company | null | undefined;
}

export function ContactWelcomeCard({
  contact,
  company,
}: ContactWelcomeCardProps) {
  return (
    <div className='px-2 py-4 sm:p-6 space-y-3'>
      <div className='flex items-center gap-3'>
        <div className='hidden h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0'>
          <User className='h-6 w-6 text-gray-400' />
        </div>
        <h2 className='text-xl sm:text-2xl font-semibold text-gray-900'>
          Hi {contact.first_name}, welcome to Ripple’s{" "}
          {contact.panelist_type || "Guest"} inner circle.
        </h2>
      </div>

      {/* <p className='text-base text-gray-900'>
        We’re excited to host you as our {contact.panelist_type || "Guest"} on
        our upcoming fireside chat.
      </p> */}

      <p className='text-base text-gray-900'>
        We’re happy to make introductions to fellow{" "}
        {contact.panelist_type || "Guest"}s at your request.
      </p>

      <p>
        To help you maximize your fireside chat, we’ve reserved 10 VIP seats for
        CEOs you’d want in the room — including prospective customers for{" "}
        {company?.name?.replace(/\.$/, "") || "your company"}.
      </p>

      <p>Please review the steps below.</p>
    </div>
  );
}
