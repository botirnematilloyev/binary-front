"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@binary/session";
import { cn, Container } from "@binary/ui";

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
const NAV: { href: Route; label: string }[] = [
	{ href: "/", label: "Masalalar" },
	{ href: "/mavzular", label: "Mavzular" },
];

export function AdminHeader() {
	const { user, signOut } = useSession();
	const pathname = usePathname();

	return (
		<header className="border-b border-border-default bg-canvas">
			<Container className="flex h-[62px] items-center gap-6">
				<span className="font-display text-[15px] font-bold">binary.uz · admin</span>

				<nav className="flex gap-1">
					{NAV.map((item) => {
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
									"rounded-control px-3 py-1.5 text-sm font-semibold transition-colors",
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

				<div className="ml-auto flex items-center gap-3">
					<span className="text-sm text-fg-muted">
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
