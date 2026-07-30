"use client";

import { useTranslations } from "next-intl";
import { Badge, Panel } from "@binary/ui";
import type { SubmissionDto } from "@binary/api";
import { formatMemory, formatMs } from "@/shared/format";
import { verdictTone } from "../model";

/**
 * Baholash natijasi.
 *
 * `aria-live="polite"` SHART: natija foydalanuvchi hech narsa bosmasdan,
 * polling orqali paydo bo'ladi. Usiz skrin rider ishlatuvchi odam
 * yechimi tekshirilganini umuman bilmaydi — u kutib o'tiradi.
 */
export function VerdictCard({
	submission,
	stillJudging,
}: {
	submission: SubmissionDto;
	stillJudging: boolean;
}) {
	const t = useTranslations("submission");
	const tVerdict = useTranslations("verdict");
	const tStatus = useTranslations("submissionStatus");

	return (
		<Panel className="mt-4">
			<div aria-live="polite" className="flex flex-wrap items-center gap-3 px-4 py-3">
				{submission.verdict ? (
					<Badge tone={verdictTone(submission.verdict)}>
						{tVerdict(submission.verdict)}
					</Badge>
				) : (
					<span className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
						{/* Aylanuvchi indikator `aria-hidden`: matn allaqachon
						    holatni aytib turadi, ikkinchi marta o'qish shovqin. */}
						<span
							aria-hidden
							className="size-3.5 animate-spin rounded-full border-2 border-border-strong border-t-accent"
						/>
						{tStatus(submission.status)}
					</span>
				)}

				{submission.failed_test !== null && (
					<span className="text-sm text-fg-secondary">
						{t("failedTest", { n: submission.failed_test })}
					</span>
				)}

				<span className="ml-auto flex gap-3 font-mono text-[12px] text-fg-muted">
					{submission.time_ms !== null && (
						<span>
							{t("time")}: {formatMs(submission.time_ms)}
						</span>
					)}
					{submission.memory_kb !== null && (
						<span>
							{t("memory")}: {formatMemory(submission.memory_kb)}
						</span>
					)}
				</span>
			</div>

			{stillJudging && (
				<p className="border-t border-border-default px-4 py-2.5 text-sm text-fg-muted">
					{t("stillJudging")}
				</p>
			)}

			{/*
			 * Kompilyator chiqishi faqat mavjud bo'lganda. U yechim
			 * muallifiga ko'rsatiladi va foydali diagnostika, lekin
			 * `<pre>` ichida — HTML sifatida EMAS, chunki bu matn
			 * kompilyatordan keladi va uning ichida burchakli qavslar bor.
			 */}
			{submission.compile_output && (
				<div className="border-t border-border-default">
					<p className="px-4 pt-3 text-[11px] font-bold tracking-wide text-fg-subtle">
						{t("compileOutput")}
					</p>
					<pre className="overflow-x-auto px-4 pt-1 pb-3 font-mono text-[12.5px] leading-relaxed text-danger">
						{submission.compile_output}
					</pre>
				</div>
			)}
		</Panel>
	);
}
