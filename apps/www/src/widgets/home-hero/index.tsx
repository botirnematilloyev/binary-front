import { getTranslations } from "next-intl/server";
import { buttonClass } from "@binary/ui";
import { Link } from "@/i18n/navigation";

/**
 * Bosh sahifaning yuqori qismi.
 *
 * O'ng tomondagi karta — mahsulotning O'ZI: kod, "Yuborish" va
 * natija. Uni skrinshot bilan qo'yish ham mumkin edi, lekin skrinshot
 * eskiradi, til bo'yicha o'zgarmaydi va qorong'i mavzuda buziladi.
 * Bu esa oddiy razmetka: har til va har mavzuda o'zi to'g'rilanadi.
 *
 * Kataklar masala sahifasidagi test holati bilan bir xil shaklda —
 * foydalanuvchi bosh sahifada ko'rgan narsasini keyin aynan o'sha
 * ko'rinishda uchratadi.
 */
export async function HomeHero({ stats }: { stats: { label: string; value: string }[] }) {
	const t = await getTranslations("home");

	return (
		<div className="grid items-center gap-10 lg:grid-cols-[1fr_420px]">
			<div>
				{/* Ko'z ilg'aydigan yorliq: loyihaning nomi ham shundan. */}
				<p className="flex items-center gap-2 font-mono text-[12px] font-bold tracking-[0.14em] text-fg-subtle">
					<span className="rounded bg-fg px-1.5 py-0.5 text-fg-inverted">01</span>
					{t("eyebrow")}
				</p>

				<h1 className="mt-5 text-[42px] leading-[1.12] font-bold">{t("title")}</h1>
				<p className="mt-4 max-w-[560px] text-lg text-fg-secondary">{t("subtitle")}</p>

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

			{/* ── Mahsulot kartasi ── */}
			<div className="rounded-card border border-border-default bg-surface p-4 shadow-sm">
				<div className="flex items-center gap-2 border-b border-border-default pb-3">
					<span className="font-mono text-[12px] text-fg-subtle">solution.py</span>
					<span className="ml-auto rounded-control bg-fg px-2.5 py-1 text-[11px] font-semibold text-fg-inverted">
						{t("demoSubmit")}
					</span>
				</div>

				<pre className="overflow-x-auto py-3 font-mono text-[13px] leading-relaxed">
					<code>{"a, b = map(int, input().split())\nprint(a + b)"}</code>
				</pre>

				<div className="border-t border-border-default pt-3">
					<div className="flex flex-wrap items-center gap-1.5">
						{Array.from({ length: 8 }, (_, index) => (
							<span
								key={index}
								aria-hidden
								className="flex size-[18px] items-center justify-center rounded-[4px] bg-success/15 font-mono text-[11px] leading-none font-bold text-success"
							>
								1
							</span>
						))}
					</div>
					<p className="mt-2.5 font-mono text-[12.5px] text-success">{t("demoVerdict")}</p>
				</div>
			</div>
		</div>
	);
}
