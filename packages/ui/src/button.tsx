import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

const button = cva(
	"inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap " +
		"transition-colors cursor-pointer " +
		// Fokus halqasi ATAYLAB o'chirilmaydi. Klaviatura bilan yuradigan
		// foydalanuvchi uchun bu yagona orientir, va `outline-none` —
		// frontendda eng ko'p uchraydigan a11y buzilishi.
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
		"disabled:cursor-not-allowed disabled:opacity-55",
	{
		variants: {
			variant: {
				/** Shablonda asosiy harakat qora, hover'da ko'kka o'tadi. */
				primary: "bg-fg text-fg-inverted border-0 hover:bg-accent",
				outline:
					"bg-transparent text-fg border border-border-strong hover:border-border-hover",
				ghost: "bg-transparent text-fg-muted border-0 hover:bg-surface-hover hover:text-fg",
				accent: "bg-accent text-accent-fg border-0 hover:bg-accent-hover",
			},
			size: {
				sm: "h-8 px-3 text-[13px] rounded-control",
				md: "h-9.5 px-4 text-sm rounded-control",
				lg: "h-11 px-5 text-[15px] rounded-control",
				pill: "h-8 px-3.5 text-[13px] rounded-pill",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof button> & { children: ReactNode };

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
	return (
		<button className={cn(button({ variant, size }), className)} {...rest}>
			{children}
		</button>
	);
}

/** Havola ko'rinishidagi tugma uchun: `<Link className={buttonClass(...)}>`. */
export const buttonClass = button;
