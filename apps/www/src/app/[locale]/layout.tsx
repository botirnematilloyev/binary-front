import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JetBrains_Mono, Manrope, Poppins } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { themeInitScript } from "@binary/tokens";
import { SessionProvider } from "@/features/auth";
import { routing } from "@/i18n/routing";
import { localeOf, LOCALES } from "@/shared/i18n/locales";
import { SiteHeader } from "@/widgets/site-header";
import "../globals.css";

/*
 * Shriftlar `next/font` orqali — shablondagi `fonts.googleapis.com`
 * havolasi bilan emas. Ikki sabab: fayllar build paytida yuklab olinib
 * o'z domenimizdan beriladi (tashqi ulanish yo'q, LCP tezroq), va Next
 * `size-adjust` bilan fallback shrift yasaydi, ya'ni layout shrift
 * yuklanganda sakramaydi.
 *
 * `cyrillic` subset SHART: interfeys ham `uz-Cyrl`, ham `ru` da
 * ko'rsatiladi. Usiz kirill harflari fallback shriftga tushib, matn
 * boshqa oilada ko'rinardi.
 */
const manrope = Manrope({
	subsets: ["latin", "cyrillic"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-manrope",
	display: "swap",
});

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-poppins",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600"],
	variable: "--font-jetbrains-mono",
	display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.binary.uz";

/**
 * To'rtta til sahifasi build paytida ma'lum, ya'ni ularni oldindan
 * yasash mumkin — bu `[locale]` segmentini dinamik bo'lishdan saqlaydi.
 */
export function generateStaticParams() {
	return LOCALES.map((locale) => ({ locale: locale.segment }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ locale: string }>;
}): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "meta" });

	return {
		// `metadataBase` bo'lmasa nisbiy OG rasm manzillari noto'g'ri chiqadi
		// va ijtimoiy tarmoqlarda oldindan ko'rish ishlamaydi.
		metadataBase: new URL(siteUrl),
		title: {
			default: t("siteTitle"),
			// Sahifa o'z sarlavhasini beradi, brend nomi shu yerda bir marta.
			template: "%s · binary.uz",
		},
		description: t("siteDescription"),
		openGraph: {
			type: "website",
			siteName: "binary.uz",
			locale: locale.replace("-", "_"),
		},
		robots: { index: true, follow: true },
	};
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;

	// URL'dan kelgan qiymat ishonchsiz. Reyestrda yo'q til — 404,
	// chalkash fallback emas.
	if (!hasLocale(routing.locales, locale)) notFound();

	// Statik render paytida joriy tilni server komponentlariga bildiradi.
	// Usiz `getTranslations` so'rov kontekstini topa olmaydi va sahifa
	// dinamik render'ga tushib qoladi.
	setRequestLocale(locale);

	return (
		<html
			// `lang` da BCP 47 shakli: `uz-cyrl` emas, `uz-Cyrl`. Brauzer va
			// skrin rider aynan shu atributdan tilni aniqlaydi.
			lang={localeOf(locale).hreflang}
			suppressHydrationWarning
			className={`${manrope.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
		>
			<head>
				{/*
				 * Temani React'dan oldin o'rnatadi. `suppressHydrationWarning`
				 * yuqorida shuning uchun kerak: skript `<html>` ning
				 * `data-theme` atributini serverdagi HTML'dan farqli qilib
				 * qo'yadi va React buni nomuvofiqlik deb hisoblaydi.
				 */}
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
			</head>
			<body className="min-h-dvh">
				{/*
				 * Provider client komponentlariga tarjimalarni uzatadi.
				 * `messages` prop ATAYLAB berilmadi: usiz next-intl faqat
				 * client komponent haqiqatan so'ragan namespace'ni yuboradi,
				 * ya'ni butun lug'at bundle'ga tushmaydi.
				 */}
				<NextIntlClientProvider>
					{/*
					 * `SessionProvider` bu yerda, ILDIZDA: sessiya sarlavhaga
					 * ham, sahifa ichidagi yechim yuborish formasiga ham kerak.
					 * Pastroqqa qo'yilsa ikkita alohida provider paydo bo'lardi
					 * va har biri `/me` ni alohida so'rardi.
					 */}
					<SessionProvider>
						<SiteHeader />
						{children}
					</SessionProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
