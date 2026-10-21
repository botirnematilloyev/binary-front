"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@binary/session";
import { cn, Container, ThemeSwitcher } from "@binary/ui";

/*
 * Panel ikkita bo'limga bo'lindi, shuning uchun navigatsiya paydo bo'ldi.
 * Mavzular masalalar ostiga QO'YILMADI: mavzu masaladan mustaqil
 * ma'lumot va uni masala tahrirlash sahifasidan izlash — aynan o'sha
 * "chalkash" holat, ya'ni bir necha sahifa bo'ylab sakrash.
 */
// `Route` tipi SHART: `typedRoutes` yoqilgan va massiv ustidan yurilganda
// element tipi `"/" | "/mavzular"` birlashmasiga kengayadi, `Link` esa
// aniq bitta marshrutni kutadi. `Route` bilan yozilganda mavjud bo'lmagan
// yo'l baribir kompilyatsiyada ushlanadi.
// `adminOnly` — setter'ga ko'rinmaydi: bo'lim shaxsiy ma'lumot
// ko'rsatadi va backend uni faqat adminga ochadi.
const NAV: { href: Route; label: string; adminOnly?: boolean }[] = [
	{ href: "/", label: "Masalalar" },
	{ href: "/mavzular", label: "Mavzular" },
	{ href: "/foydalanuvchilar", label: "Foydalanuvchilar", adminOnly: true },
];

export function AdminHeader() {
	const { user, signOut } = useSession();
	const pathname = usePathname();

	return (
		<header className="border-b border-border-default bg-canvas">
			{/*
			 * Tor ekranda navigatsiya ikkinchi qatorga tushadi va kerak
			 * bo'lsa yon tomonga suriladi; ism ham yashiriladi. Ilgari
			 * hammasi bitta 62px qatorda edi va telefonda sahifa ~690px
			 * kenglikka cho'zilardi.
			 */}
			<Container className="flex flex-wrap items-center gap-x-6 md:h-[62px] md:flex-nowrap">
				<span className="flex h-[56px] shrink-0 items-center font-display text-[15px] font-bold md:h-auto">
					binary.uz · admin
				</span>

				<nav className="order-last -mx-1 flex w-full gap-1 overflow-x-auto px-1 pb-2 [scrollbar-width:none] md:order-none md:mx-0 md:w-auto md:px-0 md:pb-0">
					{NAV.filter((item) => !item.adminOnly || user?.role === "admin").map((item) => {
						// Bosh sahifa uchun aniq tenglik: `startsWith` bo'lsa
						// "/" har doim faol bo'lib qolardi.
						const active =
							item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

						return (
							<Link
								key={item.href}
								href={item.href}
								aria-current={active ? "page" : undefined}
								className={cn(
									"shrink-0 rounded-control px-3 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
									active
										? "bg-surface-muted text-fg"
										: "text-fg-secondary hover:bg-surface-hover",
								)}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>

				<div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
					<ThemeSwitcher label="Mavzu" />
					<span
						title={user?.full_name ?? user?.username}
						className="hidden max-w-[220px] truncate text-sm text-fg-muted sm:inline"
					>
						{user?.full_name ?? user?.username}
						{user && (
							<span className="ml-2 text-[11px] font-bold tracking-wide text-fg-subtle uppercase">
								{user.role}
							</span>
						)}
					</span>
					<button
						type="button"
						onClick={() => void signOut()}
						className="cursor-pointer rounded-control border border-border-strong px-3 py-1.5 text-[13px] font-semibold transition-colors hover:border-border-hover"
					>
						Chiqish
					</button>
				</div>
			</Container>
		</header>
	);
}
