"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/shared/session";

/**
 * Sarlavhadagi sessiya qismi.
 *
 * `usePathname` `next/navigation` dan — `@/i18n/navigation` dan EMAS.
 * Farqi muhim: bizga til prefiksi BILAN to'liq yo'l kerak, chunki u
 * `?next=` ga tushadi va login'dan keyin `location.assign` bilan aynan
 * shu manzilga qaytariladi. next-intl'ning varianti prefiksni olib
 * tashlaydi va foydalanuvchi boshqa tilga tushib qolardi.
 */
export function AuthMenu() {
	const t = useTranslations("nav");
	const { status, user, signOut } = useSession();
	const pathname = usePathname();

	// Yuklanish paytida joy band qilib turiladi, aks holda sessiya
	// aniqlangan lahzada sarlavha "sakraydi" (layout shift).
	if (status === "loading") {
		return <div aria-hidden className="h-8 w-20 rounded-control bg-surface-muted" />;
	}

	if (status === "anonymous") {
		return (
			<a
				href={`/kirish?next=${encodeURIComponent(pathname)}`}
				className="rounded-control border border-border-strong px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:border-border-hover"
			>
				{t("login")}
			</a>
		);
	}

	return (
		<details className="relative">
			<summary className="flex cursor-pointer list-none items-center gap-2">
				<span
					aria-hidden
					className="flex size-8 items-center justify-center rounded-full bg-fg text-[12px] font-bold text-fg-inverted"
				>
					{initials(user)}
				</span>
			</summary>
			<ul className="absolute right-0 top-11 z-50 flex min-w-[180px] flex-col gap-0.5 rounded-card border border-border-default bg-surface p-1.5 shadow-popover">
				<li className="px-3 py-1.5">
					<p className="truncate text-sm font-semibold">
						{user?.full_name ?? user?.username}
					</p>
					{/* Rol faqat oddiy foydalanuvchidan farq qilganda ko'rsatiladi. */}
					{user && user.role !== "user" && (
						<p className="mt-0.5 text-[11px] font-semibold tracking-wide text-fg-subtle uppercase">
							{user.role}
						</p>
					)}
				</li>
				<li>
					<button
						type="button"
						onClick={() => void signOut()}
						className="w-full cursor-pointer rounded-control px-3 py-2 text-left text-sm font-semibold text-fg transition-colors hover:bg-surface-hover"
					>
						{t("logout")}
					</button>
				</li>
			</ul>
		</details>
	);
}

function initials(user: { full_name: string | null; username: string } | null): string {
	if (!user) return "?";

	const source = user.full_name?.trim() || user.username;
	// Ism va familiyaning birinchi harflari; bittasi bo'lsa ikki harf.
	const parts = source.split(/\s+/).filter(Boolean);
	if (parts.length >= 2) {
		return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
	}
	return source.slice(0, 2).toUpperCase();
}
