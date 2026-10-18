import { getTranslations } from "next-intl/server";
import { buttonClass } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { Mascot } from "@/widgets/mascot";

/**
 * Bosh sahifaning yuqori qismi.
 *
 * O'ng tomonda maskot turadi — u diqqatni tortadi va loyihaning
 * yuzi bo'ladi. Mahsulotni TUSHUNTIRADIGAN karta (kod va verdikt)
 * pastroqqa, "qanday ishlaydi" bo'limiga ko'chdi: birinchi ekranda
 * ikkita raqobatlashadigan markaz bo'lishi kerak emas.
 */
export async function HomeHero({
	stats,
}: {
	stats: { label: string; value: string }[];
}) {
	const t = await getTranslations("home");

	return (
		<div className="grid items-center gap-10 lg:grid-cols-[1fr_420px]">
			<div>
				{/* Ko'z ilg'aydigan yorliq: loyihaning nomi ham shundan. */}
				<p className="flex items-center gap-2 font-mono text-[12px] font-bold tracking-[0.14em] text-fg-subtle">
					<span className="rounded bg-fg px-1.5 py-0.5 text-fg-inverted">
						01
					</span>
					{t("eyebrow")}
				</p>

				<h1 className="mt-5 text-[42px] leading-[1.12] font-bold">
					{t("title")}
				</h1>
				<p className="mt-4 max-w-[560px] text-lg text-fg-secondary">
					{t("subtitle")}
				</p>

				<div className="mt-7 flex flex-wrap gap-3">
					<Link href="/masalalar" className={buttonClass({ size: "lg" })}>
						{t("cta")}
					</Link>
					<Link
						href="/kirish"
						className={buttonClass({ size: "lg", variant: "outline" })}
					>
						{t("ctaSecondary")}
					</Link>
				</div>

				{/*
         * Raqamlar API'dan keladi. To'qib chiqarilgan "840+" yozish
         * oson edi va aynan shuning uchun qilinmadi: bosh sahifadagi
         * son katalogdagi bilan mos kelmasa, birinchi bosgan odam
         * buni darrov ko'radi.
         */}
				<dl className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
					{stats.map((item) => (
						<div key={item.label} className="flex items-baseline gap-1.5">
							<dt className="sr-only">{item.label}</dt>
							<dd className="font-mono font-semibold">{item.value}</dd>
							<span className="text-fg-muted">{item.label}</span>
						</div>
					))}
				</dl>
			</div>

			<Mascot />
		</div>
	);
}
