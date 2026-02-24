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
    <div className="bg-white border rounded-lg p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="hidden flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0">
          <User className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Hi {contact.name}, Welcome to our Ripple Talks App!
        </h2>
      </div>
      <p className="text-base text-gray-600">
        We’re excited to host you as our <strong>{contact.panelist_type || "Guest"}</strong> on
        our upcoming fireside chat. In order to make our fireside chats as
        productive and strategic to our &nbsp;{contact.panelist_type} we are
        reserving 10 spots to invite CEOs of companies that could prospectively
        be customers of &nbsp;
        <strong>{company?.name?.replace(/\.$/, "") || "your company"}</strong>. Feel free to edit or add any company
        to the list.
      </p>
    </div>
  );
}
