import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { NavLink } from "./nav-link";

/**
 * Sayt sarlavhasi — server komponenti.
 *
 * Navigatsiyada hozircha faqat sahifasi MAVJUD bo'lgan bo'limlar bor.
 * Shablonda Kontestlar, Arena, Kurslar, Reyting ham bor, lekin ular
 * backendda hali yo'q — bo'sh sahifaga havola qo'yish ham foydalanuvchini
 * chalg'itadi, ham qidiruv tizimiga qiymatsiz sahifalarni ko'rsatadi.
 * `next-intl` ning `pathnames` ro'yxati buni majburlaydi: e'lon
 * qilinmagan yo'lga havola kompilyatsiyada xato beradi.
 */
export async function SiteHeader() {
	const t = await getTranslations("nav");

	return (
		<header className="border-b border-border-default bg-canvas">
			<Container className="flex h-[62px] items-center gap-6">
				<Link href="/" className="-mx-2 shrink-0" aria-label={t("home")}>
					<Image
						src="/logo.png"
						alt="binary.uz"
						width={120}
						height={38}
						priority
						className="h-[38px] w-auto mix-blend-multiply"
					/>
				</Link>

				<nav className="flex min-w-0 flex-1 items-center gap-5">
					<NavLink href="/masalalar">{t("problems")}</NavLink>
				</nav>

				<LanguageSwitcher />

				{/* Kirish/Ro'yxatdan tugmalari va profil avatari keyingi
				    bosqichda: ular sessiya holatiga bog'liq, va tokenni
				    qayerda saqlash — alohida muhokama talab qiladigan qaror. */}
			</Container>
		</header>
	);
}
