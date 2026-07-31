import { getTranslations } from "next-intl/server";
import type { TopicDto } from "@binary/api";
import { getPathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { DIFFICULTIES, filterQuery, pickName, type CatalogFilters } from "../model";
import type { Locale } from "@/shared/i18n/locales";

/**
 * Qidiruv + filtr paneli — bitta GET forma.
 *
 * Panel LeetCode'dagidek ochiladi, lekin JS'siz: `<details>`/`<summary>`
 * brauzerning o'z ochiluvchi bloki, ya'ni klaviatura bilan ham ishlaydi
 * va client komponent talab qilmaydi. Yagona narsa yo'q — tashqariga
 * bosganda o'zi yopilmaydi; "Qo'llash" bosilganda sahifa qayta
 * render bo'ladi va panel baribir yopiq holatda ochiladi.
 *
 * Qidiruv va filtrlar BITTA formada: shunda "Qo'llash" hammasini birga
 * yuboradi va hech qaysi maydonni yashirin nusxada takrorlash kerak
 * emas. Ikkita alohida forma bo'lganda har biri boshqasining
 * qiymatlarini `<input type="hidden">` bilan olib yurishi kerak edi —
 * va o'sha nusxalardan biri esdan chiqsa, filtr jimgina tozalanardi.
 *
 * `page` maydoni ataylab YO'Q: yangi filtr har doim birinchi sahifadan
 * boshlanadi (bu filtr havolalaridagi qoidaning aynan o'zi).
 */
export async function CatalogToolbar({
	filters,
	topics,
	locale,
	apiLang,
}: {
	filters: CatalogFilters;
	topics: TopicDto[];
	locale: Locale;
	apiLang: string;
}) {
	const t = await getTranslations("problems");
	const tDifficulty = await getTranslations("difficulty");

	// Faol filtrlar soni — qidiruv HISOBGA KIRMAYDI, chunki u
	// maydonning o'zida ko'rinib turibdi. Panel esa yopiq bo'lishi
	// mumkin, ya'ni ichidagi filtrlar haqida boshqa hech narsa
	// bilintirmaydi.
	const activeCount = [filters.difficulty, filters.topicId].filter(
		(value) => value !== undefined,
	).length;

	return (
		<form
			action={getPathname({ href: "/masalalar", locale })}
			method="get"
			role="search"
			className="flex flex-wrap items-start gap-2"
		>
			{/*
			 * Fan yon panelda tanlanadi, shuning uchun u forma maydoni
			 * emas — lekin forma yuborilganda yo'qolib ketmasligi kerak.
			 */}
			{filters.subjectId !== undefined && (
				<input type="hidden" name="subject_id" value={filters.subjectId} />
			)}

			<input
				type="search"
				name="q"
				defaultValue={filters.query ?? ""}
				placeholder={t("searchPlaceholder")}
				aria-label={t("searchLabel")}
				className="min-w-0 flex-1 rounded-control border border-border-strong bg-surface px-3.5 py-2 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
			/>

			<details className="relative">
				<summary
					className={
						"flex cursor-pointer list-none items-center gap-2 rounded-control border px-3.5 py-2 text-[13px] font-semibold transition-colors " +
						(activeCount > 0
							? "border-accent text-accent"
							: "border-border-strong text-fg-secondary hover:border-border-hover")
					}
				>
					{t("filters")}
					{activeCount > 0 && (
						<span className="rounded-pill bg-accent px-1.5 text-[11px] font-bold text-fg-inverted">
							{activeCount}
						</span>
					)}
				</summary>

				{/*
				 * `absolute` + `z-20`: panel jadvalning ustida ochiladi,
				 * uni pastga surib yubormaydi — aks holda har ochilganda
				 * butun ro'yxat sakrardi.
				 */}
				<div className="absolute right-0 z-20 mt-2 w-72 rounded-card border border-border-default bg-surface p-4 shadow-lg">
					<Field label={t("columnDifficulty")}>
						<select name="difficulty" defaultValue={filters.difficulty ?? ""} className={selectClass}>
							<option value="">{t("all")}</option>
							{DIFFICULTIES.map((difficulty) => (
								<option key={difficulty} value={difficulty}>
									{tDifficulty(difficulty)}
								</option>
							))}
						</select>
					</Field>

					{/*
					 * Mavzular ro'yxati bo'sh bo'lsa maydon ham chiqmaydi:
					 * ichida faqat "Barchasi" turgan tanlov foydalanuvchiga
					 * hech narsa bermaydi.
					 */}
					{topics.length > 0 && (
						<Field label={t("columnTopic")} className="mt-3">
							<select
								name="topic_id"
								defaultValue={filters.topicId ?? ""}
								className={selectClass}
							>
								<option value="">{t("all")}</option>
								{topics.map((topic) => (
									<option key={topic.id} value={topic.id}>
										{pickName(topic.name, apiLang)}
									</option>
								))}
							</select>
						</Field>
					)}

					<div className="mt-4 flex items-center gap-2">
						<button
							type="submit"
							className="cursor-pointer rounded-control bg-fg px-3.5 py-1.5 text-[13px] font-semibold text-fg-inverted transition-colors hover:bg-accent"
						>
							{t("applyFilters")}
						</button>

						{/*
						 * "Tozalash" — tugma emas, HAVOLA: u formani
						 * yubormaydi, balki filtrsiz manzilga o'tadi.
						 * Tanlangan fan saqlanadi, chunki u panelga
						 * tegishli emas va uni bu yerdan o'chirish
						 * kutilmagan bo'lardi.
						 */}
						{activeCount > 0 && (
							<Link
								href={{
									pathname: "/masalalar",
									query: filterQuery(filters, { difficulty: null, topicId: null }),
								}}
								className="text-[13px] font-semibold text-fg-muted hover:text-fg"
							>
								{t("resetFilters")}
							</Link>
						)}
					</div>
				</div>
			</details>

			<button
				type="submit"
				className="cursor-pointer rounded-control bg-fg px-4 py-2 text-[13px] font-semibold text-fg-inverted transition-colors hover:bg-accent"
			>
				{t("searchSubmit")}
			</button>
		</form>
	);
}

function Field({
	label,
	className,
	children,
}: {
	label: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<label className={`block ${className ?? ""}`}>
			<span className="text-[11px] font-bold tracking-wide text-fg-subtle">{label}</span>
			{children}
		</label>
	);
}

const selectClass =
	"mt-1.5 w-full cursor-pointer rounded-control border border-border-strong bg-surface px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
