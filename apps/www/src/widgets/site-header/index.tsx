import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { AuthMenu } from "./auth-menu";
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
				<Link href="/" className="shrink-0" aria-label={t("home")}>
					{/*
					 * `width`/`height` — rasmning HAQIQIY nisbati (1329×445).
					 * Next ulardan joyni oldindan band qiladi, ya'ni rasm
					 * yuklanguncha sarlavha "sakramaydi". Noto'g'ri nisbat
					 * bersak, o'sha sakrash qaytib kelardi.
					 *
					 * Ilgari fayl 6256×1312 edi va belgining o'zi uning
					 * atigi 27% ini egallardi — qolgani bo'sh joy. Shu
					 * sababli 38px balandlikda belgi ~10px bo'lib
					 * ko'rinardi. Fayl kesildi (belgi endi 80%), shuning
					 * uchun bir xil balandlikda u uch barobar kattaroq.
					 *
					 * `mix-blend-multiply` — rasmning oq foni uchun. U
					 * FAQAT yorug' mavzuda ishlaydi; qorong'i mavzu
					 * qo'shilganda shaffof fonli nusxa kerak bo'ladi.
					 */}
					<Image
						src="/logo.png"
						alt="binary.uz"
						width={1329}
						height={445}
						priority
						className="h-[38px] w-auto mix-blend-multiply"
					/>
				</Link>

				<nav className="flex min-w-0 flex-1 items-center gap-5">
					<NavLink href="/masalalar">{t("problems")}</NavLink>
				</nav>

				<LanguageSwitcher />
				<AuthMenu />
			</Container>
		</header>
	);
}
