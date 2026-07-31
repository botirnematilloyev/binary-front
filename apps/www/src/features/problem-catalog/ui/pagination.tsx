import { getTranslations } from "next-intl/server";
import { cn } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { pageQuery, type CatalogFilters } from "../model";

/**
 * Sahifalash — "oldingi / keyingi", raqamlar EMAS.
 *
 * Shablonda `1 2 3 … 42` turibdi, lekin oxirgi raqamni chizish uchun
 * jami nechta masala borligini bilish kerak, backend esa `total`
 * qaytarmaydi (ro'yxat so'rovi bilan birga `COUNT(*)` ataylab
 * qoldirilgan). To'qib chiqarilgan `42` foydalanuvchini aldardi, shuning
 * uchun bor ma'lumot bilan rost ko'rinish tanlandi.
 *
 * `hasNext` ni sahifa hisoblaydi (to'liq sahifa keldimi degan savol
 * orqali) — bu komponent uni faqat ko'rsatadi.
 *
 * Raqamli sahifalash `total` backendga qo'shilganda qaytadi.
 */
export async function Pagination({
	filters,
	page,
	hasNext,
}: {
	filters: CatalogFilters;
	page: number;
	hasNext: boolean;
}) {
	const t = await getTranslations("problems");

	// Birinchi sahifada va davomi yo'q bo'lsa — sahifalashning o'zi
	// keraksiz. Ikkita o'chirilgan tugma ko'rsatish shovqindan boshqa
	// narsa emas.
	if (page === 1 && !hasNext) return null;

	return (
		<nav className="mt-5 flex items-center justify-center gap-2" aria-label={t("pagination")}>
			<PageLink filters={filters} page={page - 1} disabled={page === 1}>
				{t("previous")}
			</PageLink>

			{/*
			 * Joriy sahifa raqami — matn, havola emas. Jami sahifalar soni
			 * noma'lum, shuning uchun "N / M" ham yozib bo'lmaydi.
			 */}
			<span className="px-2 font-mono text-[13px] text-fg-muted">{page}</span>

			<PageLink filters={filters} page={page + 1} disabled={!hasNext}>
				{t("next")}
			</PageLink>
		</nav>
	);
}

function PageLink({
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

	// O'chirilgan holat `<span>` bilan beriladi, `<a>` ni `pointer-events`
	// bilan o'ldirish orqali emas: mavjud bo'lmagan sahifaga havola
	// klaviatura bilan ham, qidiruv tizimi uchun ham bosiladigan bo'lib
	// qolardi. `aria-disabled` li havola esa skrin riderga hamon "havola"
	// deb eshitiladi.
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
