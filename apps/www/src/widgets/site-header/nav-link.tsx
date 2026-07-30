"use client";

import { cn } from "@binary/ui";
import { Link, usePathname } from "@/i18n/navigation";

type Href = Parameters<typeof Link>[0]["href"];

/**
 * `"use client"` FAQAT shu kichik komponentda.
 *
 * Aktiv holatni bilish uchun `usePathname` kerak, u esa client hook.
 * Butun header'ni client qilish oson yo'l edi, lekin unda logotip,
 * tugmalar va tartib ham brauzerga JS bo'lib ketardi. Chegara qanchalik
 * kichik bo'lsa, shuncha kam JS yuboriladi.
 */
export function NavLink({ href, children }: { href: Href; children: string }) {
	// next-intl'ning `usePathname` i til prefiksisiz yo'lni qaytaradi,
	// ya'ni taqqoslashda tilni hisobga olish kerak emas: `/ru/masalalar`
	// ham, `/masalalar` ham `/masalalar` bo'lib keladi.
	const pathname = usePathname();
	const target = typeof href === "string" ? href : href.pathname;

	// `startsWith` ataylab: `/masalalar/ikki-son` ochilganda ham
	// "Masalalar" aktiv ko'rinishi kerak.
	const active = pathname === target || pathname.startsWith(`${target}/`);

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
