import { getTranslations } from "next-intl/server";

/**
 * Mahsulotning o'zi: kod, "Yuborish" va natija.
 *
 * Skrinshot bilan qo'yish mumkin edi, lekin skrinshot eskiradi, tilga
 * qarab o'zgarmaydi va qorong'i mavzuda buziladi. Bu esa oddiy
 * razmetka: har til va har mavzuda o'zi to'g'rilanadi.
 *
 * Test kataklari masala sahifasidagi bilan BIR XIL shaklda —
 * foydalanuvchi bosh sahifada ko'rgan narsasini keyin aynan o'sha
 * ko'rinishda uchratadi.
 */
export async function DemoCard() {
	const t = await getTranslations("home");

	return (
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
	);
}
