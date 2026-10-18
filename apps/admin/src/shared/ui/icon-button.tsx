"use client";

import type { ButtonHTMLAttributes, ComponentProps, ReactNode, SVGProps } from "react";
import Link from "next/link";
import { cn } from "@binary/ui";

type Tone = "neutral" | "accent" | "danger";

const toneClass: Record<Tone, string> = {
	neutral: "text-fg-muted hover:border-border-hover hover:bg-surface-hover hover:text-fg",
	accent: "text-accent hover:border-accent hover:bg-accent-tint hover:text-accent-hover",
	danger: "text-fg-muted hover:border-danger hover:bg-danger-tint hover:text-danger",
};

const baseClass =
	"inline-flex size-8 shrink-0 items-center justify-center rounded-control border border-transparent " +
	"cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
	"disabled:cursor-not-allowed disabled:opacity-50";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
	label: string;
	tone?: Tone;
	icon: ReactNode;
};

export function IconButton({
	label,
	tone = "neutral",
	icon,
	className,
	type = "button",
	...props
}: IconButtonProps) {
	return (
		<button
			type={type}
			aria-label={label}
			title={label}
			className={cn(baseClass, toneClass[tone], className)}
			{...props}
		>
			{icon}
		</button>
	);
}

export function IconLink({
	label,
	tone = "accent",
	icon,
	className,
	...props
}: Omit<ComponentProps<typeof Link>, "children"> & {
	label: string;
	tone?: Tone;
	icon: ReactNode;
}) {
	return (
		<Link
			aria-label={label}
			title={label}
			className={cn(baseClass, toneClass[tone], className)}
			{...props}
		>
			{icon}
		</Link>
	);
}

type IconProps = SVGProps<SVGSVGElement>;

const iconClass = "size-4";

export function PencilIcon(props: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
			className={cn(iconClass, props.className)}
		>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
		</svg>
	);
}

export function TrashIcon(props: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
			className={cn(iconClass, props.className)}
		>
			<path d="M3 6h18" />
			<path d="M8 6V4h8v2" />
			<path d="M19 6l-1 14H6L5 6" />
			<path d="M10 11v5" />
			<path d="M14 11v5" />
		</svg>
	);
}
