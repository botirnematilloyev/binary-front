import Image from "next/image";
import Link from "next/link";
import { Container } from "@binary/ui";
import { NavLink } from "./nav-link";

/**
 * Sayt sarlavhasi — server komponenti.
 *
 * Navigatsiyada hozircha faqat sahifasi MAVJUD bo'lgan bo'limlar bor.
 * Shablonda Kontestlar, Arena, Kurslar, Reyting ham bor, lekin ular
 * backendda hali yo'q — bo'sh sahifaga havola qo'yish ham foydalanuvchini
 * chalg'itadi, ham qidiruv tizimiga qiymatsiz sahifalarni ko'rsatadi.
 * `typedRoutes: true` yoqilgani uchun mavjud bo'lmagan yo'lga havola
 * build'ni yiqitadi — ya'ni bu qoida hujjatda emas, kodda majburlanadi.
 */
export function SiteHeader() {
	return (
		<header className="border-b border-border-default bg-canvas">
			<Container className="flex h-[62px] items-center gap-6">
				<Link href="/" className="-mx-2 shrink-0" aria-label="binary.uz — bosh sahifa">
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
					<NavLink href="/masalalar">Masalalar</NavLink>
				</nav>

				{/* Kirish/Ro'yxatdan tugmalari va profil avatari 2-bosqichda
				    keladi: ular sessiya holatiga bog'liq, va tokenni qayerda
				    saqlash — alohida muhokama talab qiladigan qaror. */}
			</Container>
		</header>
	);
}
