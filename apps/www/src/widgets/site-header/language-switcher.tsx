"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { DEFAULT_LOCALE, localeOf, LOCALES, type Locale } from "@/shared/i18n/locales";

/**
 * Til tanlagich — `<details>` va haqiqiy `<a>` havolalar.
 *
 * Uchta qaror bor va har biri sababli:
 *
 * 1. **Havolalar, `router.replace` emas.** Anchor'lar crawler tomonidan
 *    yurib chiqiladi, ya'ni Google boshqa tildagi versiyani hreflang'dan
 *    tashqari yana bir yo'l bilan topadi. JS navigatsiyasi bunday
 *    ishlamaydi va JS o'chirilganda umuman ishlamaydi.
 *
 * 2. **`<details>`, `useState` emas.** Ochish/yopish brauzer tomonidan
 *    bajariladi: klaviatura, `Escape` va skrin rider bepul ishlaydi.
 *
 * 3. **Manzil qo'lda yig'iladi** (`/${segment}${pathname}`) — bu `routing`
 *    da yo'l nomlari TARJIMA QILINMAGANiga bog'liq. Agar bir kun
 *    `/ru/zadachi` qilinsa, bu joy ham o'zgarishi shart. Shuning uchun
 *    ikkisi bir-biriga bog'langan qaror.
 */
export function LanguageSwitcher() {
	const t = useTranslations("language");
	const active = useLocale() as Locale;

	// next-intl'ning `usePathname` i til prefiksisiz yo'lni qaytaradi
	// (`/masalalar/ikki-son`), ya'ni har til uchun prefiksni old qo'shish
	// yetarli.
	const pathname = usePathname();

	// `useSearchParams` ATAYLAB ishlatilmadi: u komponentni dinamik
	// render'ga majburlaydi, komponent esa layout'da — ya'ni SAYTDAGI HAMMA
	// sahifa statik bo'lishdan chiqardi. Narxi: til almashtirilganda
	// filtrlar tushib qoladi. Bu arzonroq yo'qotish.
	return (
		<details className="relative">
			<summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-pill border border-border-default px-3 py-1.5 text-[13px] font-semibold text-fg-secondary transition-colors hover:border-border-hover">
				<span className="sr-only">{t("label")}: </span>
				{/* Mobilda qisqa kod: to'liq nom bilan boshqaruvlar logotip
				    qatoriga sig'masdan alohida qatorga tushardi. */}
				<span className="sm:hidden">{localeOf(active).short}</span>
				<span className="hidden sm:inline">{localeOf(active).label}</span>
				<span aria-hidden className="text-[9px]">
					▾
				</span>
			</summary>
			<ul className="absolute right-0 top-10 z-50 flex min-w-[160px] flex-col gap-0.5 rounded-card border border-border-default bg-surface p-1.5 shadow-popover">
				{LOCALES.map((locale) => (
					<li key={locale.segment}>
						{/*
						 * Oddiy `<a>`, `next/link` emas — ya'ni to'liq sahifa
						 * yuklanishi. Bu YO'QOTISH emas, to'g'ri xatti-harakat:
						 * til o'zgarganda `<html lang>`, shrift subset'i va butun
						 * lug'at o'zgaradi, ya'ni bu yangi dokument. Yon foydasi:
						 * `typedRoutes` bilan urishish uchun `as Route` casti
						 * kerak emas — guard'ni o'chirmaymiz.
						 */}
						<a
							href={hrefFor(locale.segment, pathname)}
							hrefLang={locale.hreflang}
							className={`block rounded-control px-3 py-2 text-sm font-semibold transition-colors hover:bg-surface-hover ${
								locale.segment === active ? "text-accent" : "text-fg"
							}`}
						>
							{locale.label}
						</a>
					</li>
				))}
			</ul>
		</details>
	);
}

function hrefFor(segment: Locale, pathname: string): string {
	// `localePrefix: "as-needed"` — asosiy tilda prefiks yo'q. Buni
	// e'tiborsiz qoldirsak `/uz/masalalar` chiqadi va u mavjud emas.
	if (segment === DEFAULT_LOCALE) return pathname;
	return `/${segment}${pathname === "/" ? "" : pathname}`;
}
