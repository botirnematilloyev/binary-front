import { getTranslations } from "next-intl/server";
import { cn, Panel } from "@binary/ui";
import type { SubjectDto, TopicDto } from "@binary/api";
import { Link } from "@/i18n/navigation";
import { filterQuery, pickName, type CatalogFilters, type CatalogQuery } from "../model";

/**
 * Katalogning yon paneli: FANLAR va MAVZULAR.
 *
 * Mavzular bir muddat filtr panelida turgan edi (uzun ro'yxat yon
 * panelga sig'maydi degan mulohaza bilan), lekin dizaynda ular aynan
 * shu yerda va amalda ham shunday qulayroq: fan va mavzu — bitta
 * taksonomiya, ularni ikki xil joydan tanlash g'alati.
 *
 * Panelda mavzu tanlagichi endi YO'Q: bir filtr ikki joyda turishi
 * ularni bir-biriga zid ko'rsatardi.
 *
 * Trigger: mavzular soni o'nlab bo'lsa (LeetCode'da 70+ teg), bu
 * ro'yxat qidiruvli tanlagichga aylanishi kerak — o'shanda joyi ham
 * qayta ko'rib chiqiladi.
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
	/** Tanlangan fanning mavzulari. */
	topics: TopicDto[];
	filters: CatalogFilters;
	apiLang: string;
}) {
	const t = await getTranslations("problems");

	// `lg` dan pastda ro'yxatlar gorizontal suriladigan chiplar qatori
	// bo'ladi: tik ro'yxatda 15+ mavzu mobilda masalalarni bir necha
	// ekran pastga surib yuborardi.
	return (
		<Panel className="p-3">
			<p className="px-2 pb-2 text-[11px] font-bold tracking-wide text-fg-subtle">
				{t("subjects")}
			</p>
			<ul className={listClass}>
				{/*
				 * Fanlar uchun "Barchasi" YO'Q: ikki fanning mavzulari birga
				 * ~35 ta bo'lib, yon panel sahifadan uzun chiqardi. Fan
				 * tanlanmagan bo'lsa sahifa birinchi fanni ochadi, ya'ni
				 * `filters.subjectId` bu yerda doim to'ldirilgan.
				 */}
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
			 * Mavzular yo'q bo'lsa sarlavha ham yo'q: bo'sh "MAVZULAR"
			 * yozuvi foydalanuvchiga hech narsa aytmaydi, faqat
			 * yuklanish xatosidek ko'rinadi.
			 */}
			{topics.length > 0 && (
				<>
					<p className="mt-3 px-2 pb-2 text-[11px] font-bold tracking-wide text-fg-subtle lg:mt-5">
						{t("topics")}
					</p>
					<ul className={listClass}>
						<li>
							{/*
							 * Mavzular uchun ham "Barchasi" bor, garchi
							 * dizaynda ko'rsatilmagan bo'lsa ham: usiz
							 * mavzu tanlangandan keyin undan chiqish yo'li
							 * qolmaydi. Fan esa saqlanadi.
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
								 * Mavzu bilan birga uning FANI ham qo'yiladi —
								 * `TopicDto.subject_id` aynan shuning uchun kerak:
								 * mavzu va fan URL'da doim bir-biriga mos turadi.
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
				"block rounded-control px-2.5 py-2 text-sm font-semibold whitespace-nowrap transition-colors lg:whitespace-normal",
				active ? "bg-surface-muted text-fg" : "text-fg-secondary hover:bg-surface-hover",
			)}
		>
			{children}
		</Link>
	);
}

const listClass =
	"-mx-1 flex gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0";
