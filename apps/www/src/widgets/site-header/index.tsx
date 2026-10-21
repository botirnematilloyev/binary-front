import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { AuthMenu } from "./auth-menu";
import { LanguageSwitcher } from "./language-switcher";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

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
			{/*
			 * Tor ekranda navigatsiya ikkinchi qatorga tushadi (`order-last
			 * w-full`), `md` dan boshlab logotip va til tanlagich orasida
			 * turadi. Ilgari havolalar `whitespace-nowrap` bo'lgani uchun
			 * joy yetmaganda ular til tanlagich USTIGA chiqib ketardi.
			 * `overflow-x-auto` — oxirgi himoya: joy baribir yetmasa (uzun
			 * tarjima, yangi bo'lim) qator ustma-ust tushmay, suriladi.
			 */}
			<Container className="flex flex-wrap items-center gap-x-3 sm:gap-x-6">
				<Link href="/" className="flex h-[62px] shrink-0 items-center" aria-label={t("home")}>
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
					 * `mix-blend-multiply` — rasmning oq foni uchun.
					 * Qorong'i temalarda rasm teskari qilinadi (qora → oq)
					 * va `screen` bilan aralashtiriladi: endi qora bo'lib
					 * qolgan fon yo'qoladi, alohida nusxa kerak emas.
					 */}
					<Image
						src="/logo.png"
						alt="binary.uz"
						width={1329}
						height={445}
						priority
						className="h-[38px] w-auto mix-blend-multiply dark:mix-blend-screen dark:invert"
					/>
				</Link>

				<nav className="order-last -mt-2 flex w-full items-center gap-5 overflow-x-auto pb-2 [scrollbar-width:none] md:order-none md:mt-0 md:w-auto md:min-w-0 md:flex-1 md:pb-0">
					<NavLink href="/masalalar">{t("problems")}</NavLink>
					<NavLink href="/yol-xaritasi">{t("roadmap")}</NavLink>
					<NavLink href="/reyting">{t("rating")}</NavLink>
				</nav>

				<div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 md:gap-6">
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<LanguageSwitcher />
					</div>
					<AuthMenu />
				</div>
			</Container>
		</header>
	);
}
