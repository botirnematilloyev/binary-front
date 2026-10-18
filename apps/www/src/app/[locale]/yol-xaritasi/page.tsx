import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { taxonomyApi, ApiError } from "@binary/api";
import { Container } from "@binary/ui";
import { RoadmapView, SubjectTabs } from "@/features/roadmap";
import { buildAlternates } from "@/shared/i18n/alternates";
import { apiLangOf, type Locale } from "@/shared/i18n/locales";

/**
 * Yo'l xaritasi 5 daqiqa keshda yashaydi.
 *
 * Keshlanadigan javob — MEHMONNIKI: so'rov tokensiz yuboriladi, ya'ni
 * unda hech kimning progressi yo'q. Kirgan foydalanuvchining sonlari
 * mijozda, sahifa chizilgandan keyin ustidan qo'yiladi.
 */
export const revalidate = 300;

/** Fan tanlanmaganda ochiladigan xarita. */
const DEFAULT_SUBJECT = "algorithm";

interface PageProps {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ fan?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "roadmap" });

	return {
		title: t("title"),
		description: t("metaDescription"),
		// Fan tanlovi (`?fan=math`) canonical'ga kirmaydi: u bir
		// sahifaning kesimi, alohida sahifa emas.
		alternates: buildAlternates({ pathname: "/yol-xaritasi" }, { canonicalLocale: locale }),
	};
}

export default async function RoadmapPage({ params, searchParams }: PageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const { fan } = await searchParams;
	const subject = fan?.trim() || DEFAULT_SUBJECT;
	const t = await getTranslations("roadmap");
	const apiLang = apiLangOf(locale);

	const [roadmap, subjects] = await Promise.all([
		fetchRoadmap(subject),
		taxonomyApi.listSubjects({ revalidate: 3600 }),
	]);

	return (
		<Container className="py-9">
			<h1 className="text-[26px] font-bold">{t("title")}</h1>

			<SubjectTabs subjects={subjects.subjects} current={subject} apiLang={apiLang} />

			{/*
			 * `key` — fan almashganda komponent QAYTA yaratilsin.
			 * Bo'lmasa, ichkaridagi holat (mijozda olingan progress)
			 * eski fandan qolib ketardi.
			 */}
			<RoadmapView key={subject} initial={roadmap} apiLang={apiLang} />
		</Container>
	);
}

/**
 * Mavjud bo'lmagan fan → 404.
 *
 * Bo'sh sahifa ko'rsatish ham mumkin edi, lekin `?fan=algoritmlar` deb
 * xato yozgan odam "yo'l xaritasi bo'sh ekan" deb o'ylardi. 404 esa
 * qidiruv tizimlariga ham to'g'ri signal beradi.
 */
async function fetchRoadmap(subject: string) {
	try {
		return await taxonomyApi.getRoadmap(subject, { revalidate });
	} catch (error) {
		if (error instanceof ApiError && error.status === 404) notFound();
		throw error;
	}
}
