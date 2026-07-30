import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Poppins } from "next/font/google";
import { themeInitScript } from "@binary/tokens";
import { SiteHeader } from "@/widgets/site-header";
import "./globals.css";

/*
 * Shriftlar `next/font` orqali — shablondagi `fonts.googleapis.com`
 * havolasi bilan emas. Ikki sabab: fayllar build paytida yuklab olinib
 * o'z domenimizdan beriladi (tashqi ulanish yo'q, LCP tezroq), va Next
 * `size-adjust` bilan fallback shrift yasaydi, ya'ni layout shrift
 * yuklanganda sakramaydi.
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

export const metadata: Metadata = {
	// `metadataBase` bo'lmasa nisbiy OG rasm manzillari noto'g'ri chiqadi
	// va ijtimoiy tarmoqlarda oldindan ko'rish ishlamaydi.
	metadataBase: new URL(siteUrl),
	title: {
		default: "binary.uz — algoritmik masalalar platformasi",
		// Sahifa o'z sarlavhasini beradi, brend nomi shu yerda bir marta.
		template: "%s · binary.uz",
	},
	description:
		"Algoritmlar va matematikadan masalalar yechib, kodingizni darhol " +
		"tekshirtiring. Python, C++ va Go qo'llab-quvvatlanadi.",
	openGraph: {
		type: "website",
		locale: "uz_UZ",
		siteName: "binary.uz",
		url: siteUrl,
	},
	robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="uz"
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
				<SiteHeader />
				{children}
			</body>
		</html>
	);
}
