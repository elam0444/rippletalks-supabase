import { User } from "lucide-react";
import type { Contact } from "@/types/share";

interface ContactWelcomeCardProps {
  contact: Contact;
}

export function ContactWelcomeCard({ contact }: ContactWelcomeCardProps) {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <div className="hidden flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shrink-0">
          <User className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Hello {contact.name}, welcome to Ripple! 👋
        </h2>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        We&apos;re excited to have you as a speaker. Just fill out a few details
        below so we can get your talk scheduled and set everything up for you.
      </p>
    </div>
  );
}