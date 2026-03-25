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
    <div className='p-6 space-y-3'>
      <div className='flex items-center gap-3'>
        <div className='hidden h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0'>
          <User className='h-6 w-6 text-gray-400' />
        </div>
        <h2 className='text-2xl font-semibold text-gray-900'>
          Hi {contact.first_name}, Welcome to our Ripple Talks App!
        </h2>
      </div>

      <p className='text-base text-gray-900'>
        We’re excited to host you as our {contact.panelist_type || "Guest"} on
        our upcoming fireside chat.
      </p>

      <p>
        In order to make our fireside chats as productive and strategic to our{" "}
        {contact.panelist_type} we are reserving 10 spots to invite CEOs of
        companies that could prospectively be customers of{" "}
        {company?.name?.replace(/\.$/, "") || "your company"}.
      </p>

      <p>Feel free to edit or add any company to the list.</p>
    </div>
  );
}
