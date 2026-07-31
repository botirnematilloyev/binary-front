import { getTranslations } from "next-intl/server";
import { cn, Panel } from "@binary/ui";
import type { SubjectDto } from "@binary/api";
import { Link } from "@/i18n/navigation";
import { filterQuery, pickName, type CatalogFilters, type CatalogQuery } from "../model";

/**
 * Katalogning yon paneli: FANLAR.
 *
 * MAVZULAR bu yerdan filtr paneliga KO'CHIRILDI. Sabab kardinallik:
 * fan 3–4 ta va u asosiy o'q, mavzu esa cheksiz o'sadi (LeetCode'da
 * 70+ teg bor) — uzun ro'yxat yon panelda ishlatib bo'lmaydigan bo'lib
 * qoladi. Bir filtr ikki joyda turishi esa undan ham yomon: ikkalasi
 * bir-biriga zid ko'rinadi va foydalanuvchi qaysi biri "haqiqiy"
 * ekanini bilmaydi.
 *
 * Filtr — havolalar, tugmalar emas.
 *
 * Har filtr holati o'z URL'iga ega bo'ladi: ulashish mumkin, orqaga qaytish
 * ishlaydi, va sahifa serverda render qilinadi. `useState` bilan qilinsa
 * uchtasi ham yo'qolardi, va qidiruv tizimi faqat bo'sh boshlang'ich holatni
 * ko'rardi.
 *
 * `Link` `@/i18n/navigation` dan — `next/link` dan emas. U joriy tilni o'zi
 * qo'shadi, ya'ni `/ru/masalalar` da filtr bosilganda til yo'qolmaydi.
 */
export async function CatalogSidebar({
	subjects,
	filters,
	apiLang,
}: {
	subjects: SubjectDto[];
	filters: CatalogFilters;
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
					{/*
					 * "Barchasi" fan bilan birga MAVZUNI ham tozalaydi.
					 * Aks holda "hamma fan + graflar" degan holat qoladi:
					 * yon panelda hech narsa yoritilmagan, lekin ro'yxat
					 * baribir filtrlangan — foydalanuvchi buni tushunmaydi.
					 */}
					<FilterLink
						query={filterQuery(filters, { subjectId: null, topicId: null })}
						active={filters.subjectId === undefined}
					>
						{t("all")}
					</FilterLink>
				</li>
				{subjects.map((subject) => (
					<li key={subject.id}>
						{/*
						 * Fan almashganda mavzu ham tashlanadi: joriy mavzu
						 * boshqa fanga tegishli bo'lishi mumkin, va u holda
						 * ikkovi VA bilan birikib bo'sh natija beradi.
						 */}
						<FilterLink
							query={filterQuery(filters, { subjectId: subject.id, topicId: null })}
							active={filters.subjectId === subject.id}
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
	query,
	active,
	children,
}: {
	/**
	 * `pathname` bu yerda qattiq yozilgan, chunki yon panel faqat katalogga
	 * havola qiladi. Obyekt shakli (satr emas) `next-intl` ning `Link` ini
	 * `pathnames` ro'yxatiga qarab tiplashtiradi — mavjud bo'lmagan yo'l
	 * kompilyatsiyada ushlanadi.
	 */
	query: CatalogQuery;
	active: boolean;
	children: string;
}) {
	return (
		<Link
			href={{ pathname: "/masalalar", query }}
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
