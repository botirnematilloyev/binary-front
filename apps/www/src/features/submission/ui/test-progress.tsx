"use client";

import { useTranslations } from "next-intl";
import type { SubmissionDto } from "@binary/api";

/**
 * Testlar bo'yicha holat.
 *
 * MUHIM cheklov: judge har testdan o'tganini XABAR QILMAYDI. U hamma
 * testlarni bitta sandbox ichida ishlatib, bitta yakuniy natija
 * qaytaradi (`submission_test_results` jadvali ataylab kesilgan).
 * Ya'ni "hozir 3-test ketyapti" degan ma'lumot bizda YO'Q va uni
 * o'ylab chiqarish foydalanuvchiga yolg'on aytish bo'lardi.
 *
 * Shuning uchun ikki xil holat ko'rsatiladi va ikkalasi ham rost:
 *
 *   — tekshiruv davom etayotganda: to'lqinli animatsiya. U "qaysi test"
 *     demaydi, faqat "ish ketyapti" deydi;
 *   — natija kelganda: aniq manzara. Judge birinchi xatoda TO'XTAYDI,
 *     ya'ni `failed_test = 5` bo'lsa 1–4 haqiqatan o'tgan, 5 yiqilgan,
 *     qolganlari esa umuman ishlamagan. Bu xulosa taxmin emas —
 *     u judge'ning xatti-harakatidan kelib chiqadi.
 */
export function TestProgress({
	total,
	submission,
	running,
}: {
	/** Shu ishga tushirishda ko'rsatiladigan testlar soni. */
	total: number;
	/** Yakuniy yoki oraliq natija; hali yo'q bo'lsa `null`. */
	submission: SubmissionDto | null;
	running: boolean;
}) {
	const t = useTranslations("submission");

	// Testlar soni noma'lum bo'lsa (masalan eski keshdan kelgan javob)
	// hech narsa chizmaymiz: bo'sh to'r noto'g'ri taassurot berardi.
	if (total <= 0) return null;

	const failed = submission?.failed_test ?? null;
	const accepted = submission?.verdict === "accepted";

	/*
	 * Kompilyatsiya xatosida testlar UMUMAN ishlamagan, ya'ni ularni
	 * "o'tmagan" deb ko'rsatish ham yolg'on bo'lardi — hammasi kulrang
	 * qoladi.
	 */
	const compileError = submission?.verdict === "compile_error";

	const passedCount = accepted ? total : failed !== null ? failed - 1 : 0;

	return (
		<div>
			<div className="flex flex-wrap items-center gap-1.5">
				{Array.from({ length: total }, (_, index) => {
					const number = index + 1;
					const state = running
						? "running"
						: compileError
							? "idle"
							: failed !== null && number === failed
								? "failed"
								: number <= passedCount
									? "passed"
									: "idle";

					return (
						<span
							key={number}
							title={t("testNumber", { n: number })}
							data-state={state}
							/*
							 * Animatsiya kechikishi har katak uchun boshqa —
							 * shu tufayli to'lqin chapdan o'ngga yuguradi va
							 * "ish ketyapti" hissi paydo bo'ladi. Bu SOF
							 * ko'rinish: hech qanday haqiqiy progressni
							 * ifodalamaydi va shuning uchun ham hamma
							 * kataklar bir xil harakat qiladi.
							 */
							style={running ? { animationDelay: `${index * 90}ms` } : undefined}
							className="flex size-[18px] items-center justify-center rounded-[4px] bg-surface-muted font-mono text-[11px] leading-none font-bold text-transparent data-[state=failed]:bg-danger/15 data-[state=failed]:text-danger data-[state=passed]:bg-success/15 data-[state=passed]:text-success data-[state=running]:animate-pulse data-[state=running]:bg-accent/20"
						>
							{/*
							 * O'tgan test — `1`, yiqilgani — `0`. Loyihaning
							 * nomi ham shundan.
							 *
							 * Ishlamagan testlarda raqam ko'rinmaydi: `0`
							 * chiziladi, lekin rangi shaffof. Uni butunlay
							 * olib tashlash ham mumkin edi — o'shanda katak
							 * bo'sh qolib, o'lchami boshqalarnikidan farq
							 * qilardi. Ko'rinadigan "0" esa "yiqildi" degan
							 * ma'no berardi, holbuki test umuman ishlamagan.
							 */}
							{state === "passed" ? "1" : "0"}
						</span>
					);
				})}
			</div>

			<p className="mt-2 text-[12.5px] text-fg-muted">
				{running
					? t("testsRunning", { total })
					: accepted
						? t("testsAllPassed", { total })
						: failed !== null
							? t("testsFailedAt", { n: failed, total })
							: t("testsNotRun")}
			</p>
		</div>
	);
}
