import { getTranslations } from "next-intl/server";
import { cn, Panel } from "@binary/ui";
import type { SubjectDto } from "@binary/api";
import { Link } from "@/i18n/navigation";
import { pickName } from "../model";

/**
 * Filtr — havolalar, tugmalar emas.
 *
 * Har filtr holati o'z URL'iga ega bo'ladi: ulashish mumkin, orqaga
 * qaytish ishlaydi, va sahifa serverda render qilinadi. `useState` bilan
 * qilinsa uchtasi ham yo'qolardi, va qidiruv tizimi faqat bo'sh
 * boshlang'ich holatni ko'rardi.
 *
 * `Link` `@/i18n/navigation` dan — `next/link` dan emas. U joriy tilni
 * o'zi qo'shadi, ya'ni `/ru/masalalar` da filtr bosilganda til yo'qolmaydi.
 */
export async function SubjectFilter({
	subjects,
	activeSubjectId,
	apiLang,
}: {
	subjects: SubjectDto[];
	activeSubjectId: number | undefined;
	apiLang: string;
}) {
	const t = await getTranslations("problems");

	return (
		<Panel className="p-3">
			<p className="px-2 pb-2 text-[11px] font-bold tracking-wide text-fg-subtle">
				{t("subjects")}
			</p>
			<ul className="flex flex-col gap-0.5">
				<li>
					<FilterLink href={{ pathname: "/masalalar" }} active={activeSubjectId === undefined}>
						{t("all")}
					</FilterLink>
				</li>
				{subjects.map((subject) => (
					<li key={subject.id}>
						<FilterLink
							href={{ pathname: "/masalalar", query: { subject_id: subject.id } }}
							active={activeSubjectId === subject.id}
						>
							{pickName(subject.name, apiLang)}
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
	 * Obyekt shakli, satr emas: `next-intl` ning `Link` i `pathnames`
	 * ro'yxatiga qarab tiplanadi, ya'ni mavjud bo'lmagan yo'l
	 * kompilyatsiyada ushlanadi. Satr bilan yozilsa bu guard yo'qolardi.
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
