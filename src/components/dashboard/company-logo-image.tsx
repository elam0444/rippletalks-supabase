"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { getLogoDevUrl } from "@/lib/utils/logo-utils";

interface CompanyLogoImageProps {
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  size?: number;
  className?: string;
  fallbackClassName?: string;
}

export function CompanyLogoImage({
  name,
  logoUrl,
  website,
  size = 64,
  className = "rounded-lg object-cover",
  fallbackClassName = "rounded-lg",
}: CompanyLogoImageProps) {
  const [error, setError] = useState(false);
  const src = !error ? (logoUrl || getLogoDevUrl(website)) : null;

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        className={className}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-muted ${fallbackClassName}`}
      style={{ width: size, height: size }}
    >
      <Building2
        className="text-muted-foreground"
        style={{ width: size / 2, height: size / 2 }}
      />
    </div>
  );
}
