import Link from "next/link";
import { cn } from "@/lib/utils";

const baseClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

const variants = {
  primary:
    "border border-[#a2472d] bg-[#c95d3a] text-white shadow-[0_1px_0_rgba(47,43,37,0.18)] hover:bg-[#b95234] focus-visible:outline-[#c95d3a]",
  secondary:
    "border border-[#bfb6a8] bg-[#fffefa] text-[#312d27] hover:border-[#8f8678] hover:bg-[#f6f1e7] focus-visible:outline-[#8f8678]",
  ghost:
    "text-[#70675b] hover:bg-[#eee8dc] hover:text-[#312d27] focus-visible:outline-[#8f8678]",
};

export type ButtonVariant = keyof typeof variants;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseClass, variants[variant], className)}
      {...props}
    />
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(baseClass, variants[variant], className)}
      {...props}
    />
  );
}
