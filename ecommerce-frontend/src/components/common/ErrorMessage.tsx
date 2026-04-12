import { AlertCircle } from "lucide-react";
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
