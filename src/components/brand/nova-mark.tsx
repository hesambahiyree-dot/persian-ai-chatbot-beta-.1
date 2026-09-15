import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  title?: string;
};

/** Five-petal lotus matching the NOVA mark. */
export function NovaMark({ className, title = "NOVA AI" }: Props) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("text-primary", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g fill="currentColor">
        <ellipse cx="32" cy="18" rx="6.2" ry="16" />
        <ellipse
          cx="32"
          cy="18"
          rx="6.2"
          ry="16"
          transform="rotate(-38 32 32)"
        />
        <ellipse
          cx="32"
          cy="18"
          rx="6.2"
          ry="16"
          transform="rotate(38 32 32)"
        />
        <ellipse
          cx="32"
          cy="18"
          rx="6.2"
          ry="16"
          transform="rotate(-76 32 32)"
        />
        <ellipse
          cx="32"
          cy="18"
          rx="6.2"
          ry="16"
          transform="rotate(76 32 32)"
        />
        <circle cx="32" cy="42" r="6.4" />
      </g>
    </svg>
  );
}
