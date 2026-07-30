import Link from "next/link";
import { cn, Panel } from "@binary/ui";
import type { SubjectDto } from "@binary/api";
import { pickName } from "../model";

/**
 * Filtr — havolalar, tugmalar emas.
 *
 * Har filtr holati o'z URL'iga ega bo'ladi: ulashish mumkin, orqaga
 * qaytish ishlaydi, va sahifa serverda render qilinadi. `useState` bilan
 * qilinsa uchtasi ham yo'qolardi, va qidiruv tizimi faqat bo'sh
 * boshlang'ich holatni ko'rardi.
 */
export function SubjectFilter({
	subjects,
	activeSubjectId,
	lang,
}: {
	subjects: SubjectDto[];
	activeSubjectId: number | undefined;
	lang: string;
}) {
	return (
		<Panel className="p-3">
			<p className="px-2 pb-2 text-[11px] font-bold tracking-wide text-fg-subtle">
				FANLAR
			</p>
			<ul className="flex flex-col gap-0.5">
				<li>
					<FilterLink
						href={{ pathname: "/masalalar" }}
						active={activeSubjectId === undefined}
					>
						Barchasi
					</FilterLink>
				</li>
				{subjects.map((subject) => (
					<li key={subject.id}>
						<FilterLink
							href={{ pathname: "/masalalar", query: { subject_id: subject.id } }}
							active={activeSubjectId === subject.id}
						>
							{pickName(subject.name, lang)}
						</FilterLink>
					</li>
				))}
			</ul>
		</Panel>
	);
}

function FilterLink({
	href,
	active,
	children,
}: {
	/**
	 * `UrlObject`, satr emas: `typedRoutes` yoqilganda `pathname` mavjud
	 * yo'llar ro'yxatiga tekshiriladi, query esa erkin qoladi. Satr bilan
	 * yozilsa har filtr uchun tur cheklovini `as never` bilan chetlab
	 * o'tishga to'g'ri kelardi — ya'ni guard'ni o'zimiz o'chirardik.
	 */
	href: { pathname: "/masalalar"; query?: Record<string, string | number> };
	active: boolean;
	children: string;
}) {
	return (
		<Link
			href={href}
			aria-current={active ? "true" : undefined}
			className={cn(
				"block rounded-control px-2.5 py-2 text-sm font-semibold transition-colors",
				active ? "bg-surface-muted text-fg" : "text-fg-secondary hover:bg-surface-hover",
			)}
		>
			{children}
		</Link>
	);
}
