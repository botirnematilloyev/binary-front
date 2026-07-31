"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@binary/ui";
import type { Verdict } from "@binary/api";
import { verdictTone } from "../model";

/** Backenddagi `MaxCustomInputs` bilan bir xil. */
export const MAX_CASES = 5;

/**
 * Sinov holatlari — LeetCode uslubidagi tab'lar.
 *
 * Har holat alohida kirish, lekin ular BITTA so'rovda yuboriladi.
 * Har biri uchun alohida so'rov yuborish oson yo'l edi va aynan shuning
 * uchun tanlanmadi: har run alohida sandbox konteyneri demak, va
 * konteyner ko'tarish butun jarayonning eng qimmat qismi. Judge esa
 * bitta sandbox ichida ketma-ket ishlatadi.
 */
export function CustomCases({
	cases,
	onChange,
	outputs,
	failedIndex,
	verdict,
	disabled,
	active,
	onActiveChange,
}: {
	cases: string[];
	onChange: (next: string[]) => void;
	/** Kirishlar bilan BIR XIL tartibda; hali natija yo'q bo'lsa — bo'sh. */
	outputs: string[] | undefined;
	/** Dastur qaysi holatda to'xtagani (0 dan boshlab), yoki null. */
	failedIndex: number | null;
	verdict: Verdict | null;
	disabled?: boolean;
	active: number;
	onActiveChange: (index: number) => void;
}) {
	const t = useTranslations("submission");
	const tVerdict = useTranslations("verdict");

	function update(index: number, value: string) {
		onChange(cases.map((item, i) => (i === index ? value : item)));
	}

	function add() {
		if (cases.length >= MAX_CASES) return;
		onChange([...cases, ""]);
		onActiveChange(cases.length);
	}

	function remove(index: number) {
		if (cases.length <= 1) return;
		onChange(cases.filter((_, i) => i !== index));
		// Oxirgisi o'chirilsa fokus oldingisiga tushadi, aks holda
		// mavjud bo'lmagan tab tanlangan bo'lib qolardi.
		onActiveChange(Math.min(active, cases.length - 2));
	}

	const output = outputs?.[active];
	const activeFailed = failedIndex === active;

	return (
		<div>
			<div className="flex flex-wrap items-center gap-1.5">
				{cases.map((_, index) => (
					<button
						key={index}
						type="button"
						onClick={() => onActiveChange(index)}
						aria-pressed={index === active}
						className={`cursor-pointer rounded-pill px-3 py-1 text-[13px] font-semibold transition-colors ${
							index === active
								? "bg-fg text-fg-inverted"
								: "border border-border-default text-fg-secondary hover:border-border-hover"
						}`}
					>
						{t("case", { n: index + 1 })}
						{/* Qaysi holatda to'xtagani tab'ning O'ZIDA ko'rinadi —
						    aks holda foydalanuvchi har tabni bosib qidirardi. */}
						{failedIndex === index && (
							<span aria-hidden className="ml-1.5 text-danger">
								●
							</span>
						)}
					</button>
				))}

				{cases.length < MAX_CASES && (
					<button
						type="button"
						onClick={add}
						disabled={disabled}
						aria-label={t("addCase")}
						className="cursor-pointer rounded-pill border border-border-default px-2.5 py-1 text-[13px] font-semibold text-fg-muted transition-colors hover:border-border-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
					>
						+
					</button>
				)}

				{cases.length > 1 && (
					<button
						type="button"
						onClick={() => remove(active)}
						disabled={disabled}
						className="ml-auto cursor-pointer text-[13px] text-fg-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
					>
						{t("removeCase")}
					</button>
				)}
			</div>

			<textarea
				value={cases[active] ?? ""}
				onChange={(event) => update(active, event.target.value)}
				disabled={disabled}
				rows={3}
				spellCheck={false}
				autoCorrect="off"
				placeholder="5 3"
				aria-label={t("customInput")}
				className="mt-2 w-full resize-y rounded-card border border-border-strong bg-surface p-2.5 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:bg-surface-muted"
			/>

			{/*
			 * Chiqish AYNAN shu holat uchun. Hamma natijalarni bir ro'yxatda
			 * ko'rsatish mumkin edi, lekin unda kirish va chiqishni ko'z
			 * bilan moslashtirishga to'g'ri kelardi — tab esa ularni yonma-yon
			 * ushlab turadi.
			 */}
			{output !== undefined && (
				<div className="mt-3">
					<div className="flex items-center gap-2">
						<p className="text-[11px] font-bold tracking-wide text-fg-subtle">
							{t("output")}
						</p>
						{activeFailed && verdict && (
							<Badge tone={verdictTone(verdict)} size="sm">
								{tVerdict(verdict)}
							</Badge>
						)}
					</div>
					<pre className="mt-1 max-h-40 overflow-auto rounded-card border border-border-default bg-surface-subtle p-2.5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
						{output !== "" ? output : <span className="text-fg-subtle">{t("noOutput")}</span>}
					</pre>
					{activeFailed && (
						<p className="mt-1.5 text-sm text-danger">{t("caseFailed")}</p>
					)}
				</div>
			)}
		</div>
	);
}
