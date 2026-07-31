import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@binary/ui";
import { ProfileView } from "@/features/profile";
import { apiLangOf, type Locale } from "@/shared/i18n/locales";

interface PageProps {
	params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "profile" });

	return {
		title: t("title"),
		/*
		 * `noindex` — sahifa faqat egasiga ko'rinadi va login ortida.
		 * Qidiruv tizimi uni baribir bo'sh holatda ko'radi, ya'ni
		 * indekslash faqat zarar.
		 *
		 * Shu sababli `alternates` (hreflang) ham yo'q: indekslanmaydigan
		 * sahifa uchun til muqobillari ma'nosiz.
		 */
		robots: { index: false, follow: false },
	};
}

export default async function ProfilePage({ params }: PageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	return (
		<Container className="py-9">
			<ProfileView apiLang={apiLangOf(locale)} />
		</Container>
	);
}
