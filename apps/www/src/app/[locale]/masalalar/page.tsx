import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { problemsApi, taxonomyApi } from "@binary/api";
import { Container } from "@binary/ui";
import { ProblemTable, SubjectFilter, toProblemRow } from "@/features/problem-catalog";
import { buildAlternates } from "@/shared/i18n/alternates";
import { apiLangOf, type Locale } from "@/shared/i18n/locales";

/**
 * Ma'lumot 5 daqiqa keshda yashaydi.
 *
 * Nega har so'rovda emas: katalog tez o'zgarmaydi, setter kuniga bir necha
 * masala qo'shadi. Nega build paytida emas: yangi masala chiqqanda qayta
 * build kutish mumkin emas. Bu serverdagi 3 yadroni ham ayaydi — o'sha
 * mashinada judge ikkitasini olib turadi.
 *
 * Diqqat: sahifaning O'ZI `searchParams` ishlatgani uchun dinamik render
 * bo'ladi (filtr URL'da). Keshlanadigan narsa — `fetch` javoblari, ya'ni
 * API har so'rovda urilmaydi.
 */
export const revalidate = 300;

interface PageProps {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ subject_id?: string; difficulty?: string; page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "problems" });

	return {
		title: t("title"),
		description: t("metaDescription"),
		// Filtr va sahifa raqami canonical'ga KIRMAYDI: `?page=2` va
		// `?subject_id=1` bir xil kontentning kesimlari, ularni alohida
		// sahifa sifatida indekslash reytingni bo'lib tashlaydi.
		//
		// Bu yerda canonical joriy tilga ishora qiladi, masala sahifasidan
		// farqli: katalogning O'ZI to'liq tarjimalangan (sarlavha, ustunlar,
		// filtrlar), ya'ni `/ru/masalalar` haqiqatan boshqa sahifa. Faqat
		// masala nomlari fallback bo'lishi mumkin.
		alternates: buildAlternates({ pathname: "/masalalar" }, { canonicalLocale: locale }),
	};
}

export default async function ProblemsPage({ params, searchParams }: PageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const query = await searchParams;
	const t = await getTranslations("problems");

	// URL'dan kelgan hamma narsa ishonchsiz: `?subject_id=abc` yoki
	// `?page=-5` bo'lishi mumkin. `undefined` ga aylantiramiz va API'ga
	// yubormaymiz — backend ham o'z tomonidan tekshiradi, lekin bu yerda
	// tozalash 400 xatosi o'rniga oddiy "filtr yo'q" holatini beradi.
	const subjectId = positiveInt(query.subject_id);
	const page = positiveInt(query.page) ?? 1;

	// URL'dagi til bo'lagi (`uz-cyrl`) backend kutgan kod (`uz_cyr`) EMAS.
	// O'girish faqat reyestr orqali bo'ladi.
	const apiLang = apiLangOf(locale);

	// Ikkita so'rov bir-biriga bog'liq emas, shuning uchun ketma-ket
	// kutmaymiz: `await` larni ketma-ket yozish sahifa yuklanishini
	// ikki barobar sekinlashtiradigan eng keng tarqalgan xato.
	const [list, subjects] = await Promise.all([
		problemsApi.listProblems({ page, subjectId, lang: apiLang }, { revalidate }),
		taxonomyApi.listSubjects({ revalidate: 3600 }),
	]);

	const rows = list.problems.map(toProblemRow);

	return (
		<Container className="py-9">
			<h1 className="text-[26px] font-bold">{t("title")}</h1>

			<div className="mt-6 grid gap-6 lg:grid-cols-[210px_1fr]">
				<aside>
					<SubjectFilter
						subjects={subjects.subjects}
						activeSubjectId={subjectId}
						apiLang={apiLang}
					/>
				</aside>
				<div>
					<ProblemTable rows={rows} />
				</div>
			</div>
		</Container>
	);
}

function positiveInt(raw: string | undefined): number | undefined {
	if (raw === undefined) return undefined;
	const value = Number(raw);
	return Number.isInteger(value) && value > 0 ? value : undefined;
}
