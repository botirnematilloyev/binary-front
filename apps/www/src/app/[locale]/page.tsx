import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buttonClass, Container } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/shared/i18n/alternates";
import type { Locale } from "@/shared/i18n/locales";

interface PageProps {
	params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	return { alternates: buildAlternates({ pathname: "/" }, { canonicalLocale: locale }) };
}

/**
 * Bosh sahifa — hozircha eng kichik shakl.
 *
 * Shablondagi HOME ekranida statistika, tanlangan masalalar va kurslar
 * bloklari bor. Ular backendda hali mavjud bo'lmagan ma'lumotga tayanadi
 * (yechilgan masalalar soni, kurslar), shuning uchun to'qib chiqarilgan
 * raqamlar bilan to'ldirmaymiz — bo'limlar ma'lumot paydo bo'lgan sayin
 * qo'shiladi.
 */
export default async function HomePage({ params }: PageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("home");

	return (
		<Container className="py-20">
			<div className="max-w-[620px]">
				<h1 className="text-[40px] leading-[1.15] font-bold">{t("title")}</h1>
				<p className="mt-4 text-lg text-fg-secondary">{t("subtitle")}</p>
				<div className="mt-7">
					<Link href="/masalalar" className={buttonClass({ size: "lg" })}>
						{t("cta")}
					</Link>
				</div>
			</div>
		</Container>
	);
}
