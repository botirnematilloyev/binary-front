"use client";

import { useTranslations } from "next-intl";
import { Badge, Panel } from "@binary/ui";
import type { SubmissionDto } from "@binary/api";
import { formatMemory, formatMs } from "@/shared/format";
import { verdictTone } from "../model";

/**
 * O'z kirishi bilan ishlangan run natijasi.
 *
 * `VerdictCard` dan ALOHIDA komponent, chunki bu yerda verdikt odatda
 * YO'Q: solishtiradigan javob bo'lmagani uchun "to'g'ri/noto'g'ri"
 * tushunchasi ham yo'q. Natija — dasturning chiqishi.
 *
 * Verdikt faqat kirishga bog'liq bo'lmagan xatolarda keladi (vaqt,
 * xotira, crash) va o'shanda ko'rsatiladi — chiqish bilan birga, chunki
 * yiqilishdan oldin chop etilgan matn eng foydali diagnostika.
 */
export function RunOutputCard({
	submission,
	stillRunning,
}: {
	submission: SubmissionDto;
	stillRunning: boolean;
}) {
	const t = useTranslations("submission");
	const tVerdict = useTranslations("verdict");
	const tStatus = useTranslations("submissionStatus");

	const done = submission.is_final;

	return (
		// `aria-live` — natija foydalanuvchi hech narsa bosmasdan, polling
		// orqali paydo bo'ladi. Usiz skrin rider uni umuman sezmaydi.
		<Panel aria-live="polite">
			<div className="flex flex-wrap items-center gap-3 border-b border-border-default px-4 py-2.5">
				{!done ? (
					<span className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
						<span
							aria-hidden
							className="size-3.5 animate-spin rounded-full border-2 border-border-strong border-t-accent"
						/>
						{tStatus(submission.status)}
					</span>
				) : submission.verdict ? (
					<Badge tone={verdictTone(submission.verdict)} size="sm">
						{tVerdict(submission.verdict)}
					</Badge>
				) : (
					<span className="text-sm font-bold text-fg">{t("output")}</span>
				)}

				<span className="ml-auto flex gap-3 font-mono text-[12px] text-fg-muted">
					{submission.time_ms !== null && <span>{formatMs(submission.time_ms)}</span>}
					{submission.memory_kb !== null && <span>{formatMemory(submission.memory_kb)}</span>}
				</span>
			</div>

			{done && (
				<pre className="max-h-56 overflow-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
					{submission.run_output && submission.run_output !== "" ? (
						submission.run_output
					) : (
						<span className="text-fg-subtle">{t("noOutput")}</span>
					)}
				</pre>
			)}

			{submission.compile_output && (
				<div className="border-t border-border-default">
					<p className="px-4 pt-3 text-[11px] font-bold tracking-wide text-fg-subtle">
						{t("compileOutput")}
					</p>
					<pre className="max-h-40 overflow-auto px-4 pt-1 pb-3 font-mono text-[12.5px] leading-relaxed text-danger">
						{submission.compile_output}
					</pre>
				</div>
			)}

			{stillRunning && (
				<p className="border-t border-border-default px-4 py-2.5 text-sm text-fg-muted">
					{t("stillJudging")}
				</p>
			)}
		</Panel>
	);
}
