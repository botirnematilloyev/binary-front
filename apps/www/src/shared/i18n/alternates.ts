import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { LOCALES, localeOf, type Locale } from "./locales";

type Href = Parameters<typeof getPathname>[0]["href"];

export interface AlternatesOptions {
	/**
	 * Kanonik manzil QAYSI tilga ishora qilishi kerak.
	 *
	 * Ko'p hollarda bu joriy til. Lekin masala sahifasida boshqacha:
	 * so'ralgan tilda tarjima bo'lmasa, backend `uz` ga fallback qiladi va
	 * `/ru/masalalar/x` da o'zbekcha matn chiqadi. O'sha sahifa o'zini
	 * kanonik deb e'lon qilsa, `/masalalar/x` bilan bir xil kontentga ega
	 * ikkita URL paydo bo'ladi — Google buni duplicate deb ko'radi va
	 * ikkalasini ham pasaytiradi.
	 *
	 * Sahifa foydalanuvchi uchun baribir foydali (interfeys ruscha), biz
	 * faqat uni alohida indekslashni so'ramaymiz.
	 */
	canonicalLocale: Locale;

	/**
	 * hreflang FAQAT tarjimasi bor tillar uchun ko'rsatiladi. Mavjud
	 * bo'lmagan tarjimaga ishora qilish Google uchun xato: u sahifani
	 * boshqa tilda topadi va hreflang'ni ishonchsiz deb belgilaydi.
	 */
	availableLocales?: readonly Locale[];
}

/**
 * `canonical` + `hreflang` to'plamini yasaydi.
 *
 * Manzillarni qo'lda `/${locale}${path}` shaklida yig'ish mumkin edi,
 * lekin `localePrefix: "as-needed"` da asosiy tilda prefiks YO'Q — ya'ni
 * qo'lda yig'ish `/uz/masalalar` degan mavjud bo'lmagan manzilni
 * ko'rsatardi va Google har hreflang uchun 404 ko'rardi. `getPathname`
 * bu qoidani biladi, chunki u `routing` dan kelib chiqadi.
 */
export function buildAlternates(
	href: Href,
	options: AlternatesOptions,
): Metadata["alternates"] {
	const availableLocales = options.availableLocales ?? LOCALES.map((l) => l.segment);
	const languages: Record<string, string> = {};

	for (const locale of availableLocales) {
		languages[localeOf(locale).hreflang] = getPathname({ href, locale });
	}

	// `x-default` — tili mos kelmagan foydalanuvchi uchun. Usiz Google
	// o'zi tanlaydi va tanlovi kutilganidan boshqa bo'lishi mumkin.
	if (availableLocales.includes("uz")) {
		languages["x-default"] = getPathname({ href, locale: "uz" });
	}

	return {
		canonical: getPathname({ href, locale: options.canonicalLocale }),
		languages,
	};
}
