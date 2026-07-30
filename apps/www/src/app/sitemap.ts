import type { MetadataRoute } from "next";
import { problemsApi } from "@binary/api";
import { getPathname } from "@/i18n/navigation";
import { apiLangOf, LOCALES, localeOf, type Locale } from "@/shared/i18n/locales";

/**
 * `sitemap.xml` — bir soatda bir marta qayta yasaladi.
 *
 * Katalog kuniga bir necha marta o'zgaradi, ya'ni tez-tez yasash keraksiz;
 * lekin sutkalik kesh yangi masalaning indekslanishini bir kunga
 * kechiktirardi.
 */
export const revalidate = 3600;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.binary.uz").replace(
	/\/$/,
	"",
);

/** Har bir sahifa uchun mutlaq manzil — sitemap nisbiy yo'lni qabul qilmaydi. */
function absolute(href: Parameters<typeof getPathname>[0]["href"], locale: Locale) {
	return `${siteUrl}${getPathname({ href, locale })}`;
}

/**
 * `alternates.languages` — hreflang'ning sitemap'dagi ko'rinishi.
 *
 * Google ikkisidan birini talab qiladi (HTML `<link>` yoki sitemap), lekin
 * ikkisi ham bo'lsa signal kuchliroq. Muhimi — ular BIR-BIRIGA MOS
 * bo'lishi: qarama-qarshi bo'lsa Google ikkisini ham ishonchsiz deb
 * hisoblaydi. Shuning uchun bu yerda ham `localeOf(...).hreflang`
 * ishlatiladi, qo'lda yozilgan kod emas.
 */
function languagesOf(
	href: Parameters<typeof getPathname>[0]["href"],
	locales: readonly Locale[],
) {
	return Object.fromEntries(
		locales.map((locale) => [localeOf(locale).hreflang, absolute(href, locale)]),
	);
}

const ALL_LOCALES = LOCALES.map((l) => l.segment);

/**
 * Har masala QAYSI tillarga tarjima qilinganini aniqlaydi.
 *
 * Hiyla shundaki: `listProblems` javobida har masala uchun `lang` maydoni
 * bor va u sarlavha HAQIQATAN qaysi tildan kelganini bildiradi (backend
 * so'ralgan til yo'q bo'lsa `uz` ga fallback qiladi). Sarlavha esa
 * `problem_statements` jadvalidan keladi — ya'ni `lang === "ru"` bo'lishi
 * ru tarjimasi mavjudligining aynan o'zi.
 *
 * Natijada butun katalog uchun 4 × (sahifalar soni) so'rov ketadi, har
 * masala uchun alohida tafsilot so'rash emas. 800 masalada bu 800 emas,
 * 32 so'rov.
 *
 * Muqobil yo'l — hamma masala uchun to'rt tilni yozib qo'yish — bizning
 * O'ZIMIZNING canonical'imizga qarama-qarshi bo'lardi: tarjimasi yo'q
 * sahifa `uz` ga kanonik ishora qiladi, sitemap esa uni mustaqil sahifa
 * deb ko'rsatardi.
 */
async function collectProblems() {
	const perPage = 100;
	// Cheksiz sikldan himoya: backend `per_page` ni 100 ga cheklaydi, lekin
	// javob kutilganidan boshqa bo'lsa sitemap yasash abadiy davom etmasin.
	const maxPages = 50;

	const translations = new Map<string, Set<Locale>>();
	const meta = new Map<string, { publishedAt: number | null }>();

	for (const locale of ALL_LOCALES) {
		const apiLang = apiLangOf(locale);

		for (let page = 1; page <= maxPages; page++) {
			const result = await problemsApi.listProblems(
				{ page, perPage, lang: apiLang },
				{ revalidate },
			);

			for (const problem of result.problems) {
				meta.set(problem.slug, { publishedAt: problem.published_at });

				// Sarlavha so'ralgan tilda qaytdimi? Qaytsa — tarjima bor.
				if (problem.lang === apiLang) {
					const set = translations.get(problem.slug) ?? new Set<Locale>();
					set.add(locale);
					translations.set(problem.slug, set);
				}
			}

			if (result.problems.length < perPage) break;
		}
	}

	return { translations, meta };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticPages: MetadataRoute.Sitemap = (
		[
			{ pathname: "/" } as const,
			{ pathname: "/masalalar" } as const,
		] satisfies Parameters<typeof getPathname>[0]["href"][]
	).map((href) => ({
		url: absolute(href, "uz"),
		// Bu sahifalar to'rt tilda TO'LIQ tarjimalangan (sarlavha, ustunlar,
		// filtrlar), shuning uchun to'rttasi ham mustaqil sahifa.
		alternates: { languages: languagesOf(href, ALL_LOCALES) },
	}));

	let collected: Awaited<ReturnType<typeof collectProblems>>;
	try {
		collected = await collectProblems();
	} catch (cause) {
		// Sitemap build paytida yasaladi, ya'ni API nosozligi DEPLOY'ni
		// to'xtatadi. Bu almashtirish noto'g'ri: bir soatga masala
		// havolalari yo'q sitemap — yiqilgan deploydan ancha arzon
		// yo'qotish, va Google baribir qayta so'raydi.
		//
		// Amalda ko'rilgan holat: ketma-ket build'lar backend rate
		// limiterini (RATE_LIMIT_PER_MINUTE) uyg'otdi va build 429 bilan
		// to'xtadi.
		console.error("sitemap: masalalar ro'yxati olinmadi, faqat statik sahifalar", cause);
		return staticPages;
	}

	const { translations, meta } = collected;

	const problemPages: MetadataRoute.Sitemap = [...meta.entries()].map(([slug, info]) => {
		const href = { pathname: "/masalalar/[slug]", params: { slug } } as const;

		// Tarjimasi bor tillar; `uz` har doim mavjud, chunki masala kamida
		// bitta shart bilan nashr qilinadi.
		const locales = [...(translations.get(slug) ?? new Set<Locale>(["uz"]))];

		return {
			url: absolute(href, "uz"),
			...(info.publishedAt
				? { lastModified: new Date(info.publishedAt * 1000) }
				: {}),
			alternates: { languages: languagesOf(href, locales) },
		};
	});

	// `changeFrequency` va `priority` ATAYLAB yo'q: Google ular e'tiborga
	// olinmasligini ochiq aytgan, va ularni to'ldirish o'zini ishonchli
	// tuyg'u beradigan, lekin hech narsani o'zgartirmaydigan ish.
	return [...staticPages, ...problemPages];
}
