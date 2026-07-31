import { getTranslations } from "next-intl/server";
import { cn, Panel } from "@binary/ui";
import type { SubjectDto, TopicDto } from "@binary/api";
import { Link } from "@/i18n/navigation";
import { filterQuery, pickName, type CatalogFilters, type CatalogQuery } from "../model";

/**
 * Katalogning yon paneli: FANLAR va MAVZULAR.
 *
 * Ikkita alohida komponent EMAS, bittasi. Dizaynda bu bitta ustundagi ikki
 * bo'lim, ya'ni bitta ramka ichida; ikkiga bo'linsa ikkita `Panel` chiqadi
 * va ular orasidagi masofani sahifa boshqarishga majbur bo'lardi — ya'ni
 * ko'rinish qarori ikki joyga tarqalardi.
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
	topics,
	filters,
	apiLang,
}: {
	subjects: SubjectDto[];
	/**
	 * Fan tanlangan bo'lsa — faqat o'sha fanning mavzulari.
	 *
	 * Bu qaror sahifada emas, chunki so'rovni ham o'sha yerda kesish kerak;
	 * bu yerda esa faqat kelgan ro'yxat chiziladi.
	 */
	topics: TopicDto[];
	filters: CatalogFilters;
	apiLang: string;
}) {
	const t = await getTranslations("problems");

	return (
		<Panel className="p-3">
			<SectionLabel>{t("subjects")}</SectionLabel>
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

			{/*
			 * Mavzular yo'q bo'lsa — sarlavha ham yo'q. Bo'sh "MAVZULAR"
			 * yozuvi foydalanuvchiga hech narsa aytmaydi, faqat yuklanish
			 * xatosidek ko'rinadi.
			 */}
			{topics.length > 0 && (
				<>
					<SectionLabel className="mt-5">{t("topics")}</SectionLabel>
					<ul className="flex flex-col gap-0.5">
						<li>
							{/*
							 * Mavzular uchun ham "Barchasi" bor, garchi
							 * dizaynda ko'rsatilmagan bo'lsa ham: usiz mavzu
							 * tanlangandan keyin undan chiqish yo'li qolmaydi
							 * (faol qatorni qayta bosish — ko'rinmaydigan
							 * imkoniyat). Fan esa saqlanadi.
							 */}
							<FilterLink
								query={filterQuery(filters, { topicId: null })}
								active={filters.topicId === undefined}
							>
								{t("all")}
							</FilterLink>
						</li>
						{topics.map((topic) => (
							<li key={topic.id}>
								{/*
								 * Mavzu bilan birga uning FANI ham qo'yiladi.
								 * `TopicDto.subject_id` aynan shuning uchun
								 * kerak: "hamma fan" holatida mavzu bosilsa,
								 * yon panel keyin o'sha fanning mavzularini
								 * ko'rsatadi va fan yoritilgan bo'ladi —
								 * ya'ni panel o'zi bilan ziddiyatga tushmaydi.
								 */}
								<FilterLink
									query={filterQuery(filters, {
										subjectId: topic.subject_id,
										topicId: topic.id,
									})}
									active={filters.topicId === topic.id}
								>
									{pickName(topic.name, apiLang)}
								</FilterLink>
							</li>
						))}
					</ul>
				</>
			)}
		</Panel>
	);
}

function SectionLabel({ children, className }: { children: string; className?: string }) {
	return (
		<p
			className={cn(
				"px-2 pb-2 text-[11px] font-bold tracking-wide text-fg-subtle",
				className,
			)}
		>
			{children}
		</p>
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
