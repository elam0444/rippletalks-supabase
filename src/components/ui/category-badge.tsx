import { Badge } from "@/components/ui/badge";
import { getCategoryColor } from "@/lib/utils/color-utils";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

/**
 * Displays a category or industry name with a consistent color-coded badge
 */
export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  if (!category) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Badge className={cn("truncate", getCategoryColor(category), className)}>
      {category}
    </Badge>
  );
}
