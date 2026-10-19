import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { problemsApi, taxonomyApi } from "@binary/api";
import { Container } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { HomeHero } from "@/widgets/home-hero";
import { buildAlternates } from "@/shared/i18n/alternates";
import { apiLangOf, type Locale } from "@/shared/i18n/locales";

/**
 * Bosh sahifa soatiga bir marta yangilanadi.
 *
 * Undagi raqamlar (masalalar soni, fanlar) sekin o'zgaradi — setter
 * kuniga bir necha masala qo'shadi. Katalogdagi 5 daqiqadan uzunroq,
 * chunki bu yerda aniqlik emas, "kattalik tartibi" muhim.
 */
export const revalidate = 3600;

interface PageProps {
	params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "home" });

	return {
		title: t("metaTitle"),
		description: t("subtitle"),
		alternates: buildAlternates({ pathname: "/" }, { canonicalLocale: locale }),
	};
}

export default async function HomePage({ params }: PageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("home");
	const apiLang = apiLangOf(locale);

	const [all, subjects] = await Promise.all([
		// `per_page=1` — bizga faqat `total` kerak, ro'yxatning o'zi emas.
		problemsApi.listProblems({ perPage: 1, lang: apiLang }, { revalidate }),
		taxonomyApi.listSubjects({ revalidate }),
	]);

	// Masala yo'q bo'lsa raqamlar qatori umuman chiqmaydi: "0 masala"
	// platforma bo'shligini e'lon qiladi. "0 so'm" ham olib tashlandi —
	// boshqa raqamlar yonida u ham "hali hech narsa yo'q" deb o'qilardi;
	// bepulligi subtitle'da aytilgan.
	const stats =
		all.total > 0
			? [
					{ value: String(all.total), label: t("statProblems") },
					{ value: String(subjects.subjects.length), label: t("statSubjects") },
					{ value: "3", label: t("statLanguages") },
				]
			: [];

	return (
		<>
			<Container className="py-16">
				<HomeHero stats={stats} />

				{/* ── Qanday ishlaydi ── */}
				<section className="mt-20">
					<h2 className="text-[22px] font-bold">{t("howTitle")}</h2>

					{/*
         * Bu bo'lim ma'lumotga TAYANMAYDI va shuning uchun har doim
         * to'g'ri: u mahsulotning o'zi qanday ishlashini aytadi.
         * Aynan shuning uchun u bosh sahifada birinchi kunidan
         * turishi mumkin, statistika esa ma'lumot bilan birga
         * o'sadi.
         */}
					<ol className="mt-5 grid gap-6 sm:grid-cols-3">
						{[1, 2, 3].map((step) => (
							<li key={step}>
								<span className="font-mono text-[13px] font-bold text-accent">
									{String(step).padStart(2, "0")}
								</span>
								<h3 className="mt-2 font-display text-[17px] font-semibold">
									{t(`step${step}Title`)}
								</h3>
								<p className="mt-1.5 text-fg-secondary">
									{t(`step${step}Text`)}
								</p>
							</li>
						))}
					</ol>
				</section>

				{/*
         * Brend shiori. Nomning ma'nosi (0 va 1) bu yerda metafora
         * sifatida turadi — ikkilik sanoq tizimining ta'rifi emas.
         */}
				<section className="mt-20 border-l-2 border-accent pl-5">
					<p className="font-display text-[20px] font-bold">{t("tagline")}</p>
					<p className="mt-2 max-w-[620px] text-fg-secondary">
						{t("taglineText")}
					</p>
				</section>
			</Container>
			<HomeFooter />
		</>
	);
}

async function HomeFooter() {
	const t = await getTranslations("home");
	const year = new Date().getFullYear();

	return (
		<footer className="border-t border-border-default bg-canvas">
			<Container>
				<section className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center">
					<div className="flex items-center gap-10">
						<Link href="/" aria-label="binary.uz" className="shrink-0">
							<Image
								src="/logo.png"
								alt="binary.uz"
								width={1329}
								height={445}
								className="h-4 w-auto mix-blend-multiply dark:mix-blend-screen dark:invert"
							/>
						</Link>
						<p className="font-mono text-sm text-fg-subtle">
							© {year} binary.uz
						</p>
					</div>

					<nav className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold text-fg-muted sm:ml-auto">
						<Link className="transition-colors hover:text-fg" href="/masalalar">
							{t("footerProblems")}
						</Link>
						<span className="text-fg-subtle">{t("footerContests")}</span>
						<span className="text-fg-subtle">{t("footerTelegram")}</span>
						<span className="text-fg-subtle">{t("footerGithub")}</span>
					</nav>
				</section>
			</Container>
		</footer>
	);
}
