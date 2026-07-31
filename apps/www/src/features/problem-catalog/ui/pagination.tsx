import { getTranslations } from "next-intl/server";
import { cn } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { pageCount, pageItems, pageQuery, type CatalogFilters } from "../model";

/**
 * Raqamli sahifalash: `‹ 1 … 4 5 6 … 42 ›`.
 *
 * Ilgari faqat "oldingi / keyingi" edi, chunki backend jami sonni
 * qaytarmasdi va oxirgi raqamni bilishning yo'li yo'q edi. Endi javobda
 * `total` bor, ya'ni raqamlarni to'qib chiqarmasdan chizsa bo'ladi.
 *
 * O'sha paytdagi vaqtinchalik hiyla ham yo'qoldi: "keyingi sahifa bormi"
 * ni to'liq sahifa keldimi degan savol orqali taxmin qilish kerak emas —
 * masalalar soni aynan 20 ga bo'linganda bo'sh sahifaga olib boradigan
 * "Keyingi" tugmasi endi paydo bo'lmaydi.
 */
export async function Pagination({
	filters,
	page,
	total,
	perPage,
}: {
	filters: CatalogFilters;
	page: number;
	total: number;
	perPage: number;
}) {
	const t = await getTranslations("problems");
	const count = pageCount(total, perPage);

	// Bitta sahifa — sahifalashning o'zi keraksiz.
	if (count <= 1) return null;

	return (
		<nav className="mt-5 flex items-center justify-center gap-1.5" aria-label={t("pagination")}>
			<Step filters={filters} page={page - 1} disabled={page <= 1}>
				{t("previous")}
			</Step>

			{pageItems(page, count).map((item, index) =>
				item === "gap" ? (
					// Uzilish belgisi — havola emas va skrin riderga
					// o'qilmaydi: u yerda hech qanday ma'lumot yo'q.
					<span
						key={`gap-${index}`}
						aria-hidden="true"
						className="px-1 font-mono text-[13px] text-fg-subtle"
					>
						…
					</span>
				) : (
					<PageNumber key={item} filters={filters} page={item} current={item === page} />
				),
			)}

			<Step filters={filters} page={page + 1} disabled={page >= count}>
				{t("next")}
			</Step>
		</nav>
	);
}

function PageNumber({
	filters,
	page,
	current,
}: {
	filters: CatalogFilters;
	page: number;
	current: boolean;
}) {
	const className = cn(
		"rounded-control px-2.5 py-1.5 font-mono text-[13px] transition-colors",
		current ? "bg-fg text-fg-inverted" : "text-fg-secondary hover:bg-surface-hover",
	);

	// Joriy sahifa havola EMAS: o'ziga olib boradigan havola foydasiz va
	// skrin riderda "shu yerdasiz" degani `aria-current` bilan aytiladi.
	if (current) {
		return (
			<span aria-current="page" className={className}>
				{page}
			</span>
		);
	}

	return (
		<Link href={{ pathname: "/masalalar", query: pageQuery(filters, page) }} className={className}>
			{page}
		</Link>
	);
}

function Step({
	filters,
	page,
	disabled,
	children,
}: {
	filters: CatalogFilters;
	page: number;
	disabled: boolean;
	children: string;
}) {
	const className = cn(
		"rounded-control px-3 py-1.5 text-[13px] font-semibold transition-colors",
		disabled
			? "cursor-not-allowed text-fg-subtle"
			: "border border-border-default text-fg-secondary hover:border-border-hover",
	);

	// O'chirilgan holat `<span>`: mavjud bo'lmagan sahifaga havola
	// klaviatura bilan ham, qidiruv tizimi uchun ham bosiladigan
	// bo'lib qolardi.
	if (disabled) {
		return (
			<span aria-disabled="true" className={className}>
				{children}
			</span>
		);
	}

	return (
		<Link href={{ pathname: "/masalalar", query: pageQuery(filters, page) }} className={className}>
			{children}
		</Link>
	);
}
