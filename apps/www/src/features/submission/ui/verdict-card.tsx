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
	scopeLabel,
}: {
	submission: SubmissionDto;
	stillJudging: boolean;
	scopeLabel: string;
}) {
	const t = useTranslations("submission");
	const tVerdict = useTranslations("verdict");
	const tStatus = useTranslations("submissionStatus");
	const title = submission.verdict ? tVerdict(submission.verdict) : tStatus(submission.status);

	return (
		<Panel className="mt-4 overflow-hidden">
			<div aria-live="polite" className="px-4 py-3">
				<div className="flex flex-wrap items-start gap-3">
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
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
							<span className="rounded-pill bg-surface-subtle px-2 py-0.5 text-[12px] font-semibold text-fg-muted">
								{scopeLabel}
							</span>
						</div>
						<p className="mt-2 text-base font-bold text-fg">{title}</p>
						{submission.failed_test !== null && (
							<p className="mt-1 text-sm text-danger">
								{t("failedTest", { n: submission.failed_test })}
							</p>
						)}
					</div>

					<div className="grid min-w-[190px] grid-cols-2 gap-2">
						<Metric label={t("time")} value={submission.time_ms !== null ? formatMs(submission.time_ms) : "—"} />
						<Metric
							label={t("memory")}
							value={submission.memory_kb !== null ? formatMemory(submission.memory_kb) : "—"}
						/>
					</div>
				</div>
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

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-control border border-border-default bg-surface-subtle px-3 py-2">
			<p className="text-[11px] font-bold tracking-wide text-fg-subtle">{label}</p>
			<p className="mt-1 font-mono text-[12.5px] text-fg-secondary">{value}</p>
		</div>
	);
}
