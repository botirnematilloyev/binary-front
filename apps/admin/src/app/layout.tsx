import type { Metadata } from "next";
import { JetBrains_Mono, Manrope, Poppins } from "next/font/google";
import { SessionProvider } from "@binary/session";
import { AdminGate } from "@/features/admin-auth";
import "./globals.css";

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

export const metadata: Metadata = {
	title: "binary.uz — admin",
	/*
	 * `noindex` — nginx ham `X-Robots-Tag` yuboradi, lekin ikkalasi ham
	 * bo'lgani yaxshi: bir kun panel boshqa hostdan berilsa, nginx
	 * qoidasi qolib ketadi, meta esa sahifa bilan birga ko'chadi.
	 */
	robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang="uz"
			className={`${manrope.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
		>
			{/*
			 * Tema tanlagich skripti bu yerda YO'Q — admin bir temada
			 * (light) ishlaydi. `tokens.css` dagi `:root` bloki uni
			 * `data-theme` atributisiz ham beradi.
			 */}
			<body className="min-h-dvh">
				<SessionProvider>
					{/*
					 * Butun panel darvoza ortida. Har sahifada alohida
					 * tekshiruv yozish mumkin edi, lekin o'shanda YANGI
					 * sahifa qo'shgan odam tekshiruvni unutishi mumkin —
					 * va unutilgan tekshiruv ko'rinmaydi.
					 */}
					<AdminGate>{children}</AdminGate>
				</SessionProvider>
			</body>
		</html>
	);
}
