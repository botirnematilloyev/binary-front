import Link from "next/link";
import { buttonClass, Container } from "@binary/ui";

/**
 * Bosh sahifa — hozircha eng kichik shakl.
 *
 * Shablondagi HOME ekranida statistika, tanlangan masalalar va kurslar
 * bloklari bor. Ular backendda hali mavjud bo'lmagan ma'lumotga tayanadi
 * (yechilgan masalalar soni, kurslar), shuning uchun to'qib chiqarilgan
 * raqamlar bilan to'ldirmaymiz — bo'limlar ma'lumot paydo bo'lgan sayin
 * qo'shiladi.
 */
export default function HomePage() {
	return (
		<Container className="py-20">
			<div className="max-w-[620px]">
				<h1 className="text-[40px] leading-[1.15] font-bold">
					Kod yozing, darhol natijani ko'ring
				</h1>
				<p className="mt-4 text-lg text-fg-secondary">
					Algoritmlar va matematikadan masalalar. Yechimingiz avtomatik
					tekshiriladi — Python, C++ yoki Go da.
				</p>
				<div className="mt-7">
					<Link href="/masalalar" className={buttonClass({ size: "lg" })}>
						Masalalarni ko'rish
					</Link>
				</div>
			</div>
		</Container>
	);
}
