import { PackageX } from "lucide-react";
import Link from "next/link";

interface Props {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title = "Nothing here", description, actionLabel, actionHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <PackageX className="h-12 w-12 text-muted-foreground" />
      <div>
        <h3 className="font-medium text-lg">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
