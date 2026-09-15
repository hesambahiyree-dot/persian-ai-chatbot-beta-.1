import { cn } from "@/lib/utils";

export function NovaLogo({ className }: { className?: string }) {
  return (
    <img
      src="/nova-logo.png"
      alt="NOVA AI"
      className={cn("object-contain", className)}
    />
  );
}
