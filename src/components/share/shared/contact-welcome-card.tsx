import { User } from "lucide-react";
import type { Contact } from "@/types/share";

interface ContactWelcomeCardProps {
  contact: Contact;
}

/**
 * Displays a welcome card with contact information
 */
export function ContactWelcomeCard({ contact }: ContactWelcomeCardProps) {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <User className="h-6 w-6 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Hello, {contact.name}, welcome to Ripple! 👋
        </h2>
        <p>
          We&apos;re excited to have you as a speaker. Just fill out a few details
          below so we can get your talk scheduled and set everything up for you.
        </p>
      </div>
    </div>
  );
}
