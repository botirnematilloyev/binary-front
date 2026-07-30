"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@binary/ui";

/**
 * `"use client"` FAQAT shu kichik komponentda.
 *
 * Aktiv holatni bilish uchun `usePathname` kerak, u esa client hook.
 * Butun header'ni client qilish oson yo'l edi, lekin unda logotip,
 * tugmalar va tartib ham brauzerga JS bo'lib ketardi. Chegara qanchalik
 * kichik bo'lsa, shuncha kam JS yuboriladi.
 */
export function NavLink({ href, children }: { href: Route; children: string }) {
	const pathname = usePathname();

	// `startsWith` ataylab: `/masalalar/ikki-son` ochilganda ham
	// "Masalalar" aktiv ko'rinishi kerak.
	const active = pathname === href || pathname.startsWith(`${href}/`);

	return (
		<Link
			href={href}
			className={cn(
				"py-1.5 text-sm font-semibold whitespace-nowrap transition-colors hover:text-fg",
				active ? "text-fg" : "text-fg-muted",
			)}
			aria-current={active ? "page" : undefined}
		>
			{children}
		</Link>
	);
}
