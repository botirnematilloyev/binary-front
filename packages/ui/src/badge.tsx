import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "./cn";

/**
 * `tone` — bitta o'q, ko'p boolean prop emas.
 *
 * `<Badge success outlined small>` yo'lidan bormaymiz: uchta boolean
 * sakkizta kombinatsiya beradi, ularning yarmi ma'nosiz (`success` +
 * `danger` bir vaqtda), va tur tizimi buni ushlamaydi. `tone` esa
 * o'zi bo'yicha o'zaro istisno.
 */
const badge = cva(
	"inline-flex items-center gap-1.5 rounded-pill font-semibold whitespace-nowrap",
	{
		variants: {
			tone: {
				neutral: "bg-surface-muted text-fg-secondary",
				accent: "bg-accent-tint text-accent",
				success: "bg-success-tint text-success",
				danger: "bg-danger-tint text-danger",
				warning: "bg-warning-tint text-warning",
			},
			size: {
				sm: "px-2 py-0.5 text-[11.5px]",
				md: "px-2.5 py-1 text-xs",
			},
		},
		defaultVariants: { tone: "neutral", size: "md" },
	},
);

export type BadgeProps = VariantProps<typeof badge> & {
	children: ReactNode;
	className?: string;
};

export function Badge({ tone, size, className, children }: BadgeProps) {
	return <span className={cn(badge({ tone, size }), className)}>{children}</span>;
}
