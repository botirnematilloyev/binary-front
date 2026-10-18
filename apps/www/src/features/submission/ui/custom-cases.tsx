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
	placeholder,
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
	placeholder?: string | undefined;
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

		/*
		 * Faol tabni to'g'rilash: o'chirilgan holat faoldan OLDINDA
		 * bo'lsa, qolganlar bir pozitsiyaga suriladi va faol indeks
		 * boshqa holatga ishora qilib qolardi.
		 *
		 * Oxirgi chegara ham kerak: oxirgi holat o'chirilganda indeks
		 * ro'yxatdan tashqarida qolib, hech qaysi tab tanlanmagan
		 * bo'lardi.
		 */
		const next = index < active ? active - 1 : active;
		onActiveChange(Math.min(next, cases.length - 2));
	}

	const output = outputs?.[active];
	const activeFailed = failedIndex === active;
	const canAdd = cases.length < MAX_CASES && !disabled;

	return (
		<div className="rounded-card border border-border-default bg-surface">
			<div className="flex flex-wrap items-center gap-2 border-b border-border-default px-3 py-2">
				<div>
					<p className="text-sm font-bold text-fg">{t("customTestTitle")}</p>
					<p className="text-[12.5px] text-fg-muted">{t("customTestHint")}</p>
				</div>

				<button
					type="button"
					onClick={add}
					disabled={!canAdd}
					aria-label={t("addCase")}
					title={t("addCase")}
					className="ml-auto inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control border border-border-default text-fg-muted transition-colors hover:border-border-hover hover:bg-surface-hover hover:text-fg disabled:cursor-not-allowed disabled:opacity-45"
				>
					+
				</button>
			</div>

			<div className="flex flex-wrap items-center gap-1.5 px-3 pt-3">
				{cases.map((_, index) => (
					/*
					 * Chip ichida ikkinchi tugma bor, ya'ni ular
					 * ichma-ich JOYLASHTIRILMAYDI: `<button>` ichidagi
					 * `<button>` yaroqsiz HTML va brauzerlar uni turlicha
					 * tuzatadi. Shuning uchun tashqarisi `<div>`, ichida
					 * ikkita alohida tugma.
					 */
					<div
						key={index}
						className={`group relative flex h-8 items-center rounded-control transition-colors ${
							index === active
								? "bg-fg text-fg-inverted"
								: "border border-border-default text-fg-secondary hover:border-border-hover"
						}`}
					>
						<button
							type="button"
							onClick={() => onActiveChange(index)}
							aria-pressed={index === active}
							className="h-full cursor-pointer px-3 text-[13px] font-semibold"
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

						{/*
						 * Bitta holat qolganda ko'rinmaydi: bo'sh ro'yxatni
						 * backend rad etadi va "avval holat qo'shing" degan
						 * holatga tushib qolish ortiqcha qadam.
						 */}
						{cases.length > 1 && (
							<button
								type="button"
								onClick={() => remove(index)}
								disabled={disabled}
								aria-label={t("removeCaseN", { n: index + 1 })}
								className={`mr-1.5 flex size-5 cursor-pointer items-center justify-center rounded-full text-[13px] leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
									index === active
										? "text-fg-inverted/60 hover:bg-white/10 hover:text-fg-inverted"
										: "text-fg-subtle hover:bg-danger-tint hover:text-danger"
								}`}
							>
								×
							</button>
						)}
					</div>
				))}
			</div>

			<div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.72fr)]">
				<label className="flex min-w-0 flex-col gap-1.5">
					<span className="text-[11px] font-bold tracking-wide text-fg-subtle">
						{t("customInput")}
					</span>
					<textarea
						value={cases[active] ?? ""}
						onChange={(event) => update(active, event.target.value)}
						disabled={disabled}
						rows={5}
						spellCheck={false}
						autoCorrect="off"
						placeholder={placeholder || t("customInputPlaceholder")}
						className="min-h-32 w-full resize-y rounded-control border border-border-strong bg-surface-subtle p-3 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:bg-surface-muted"
					/>
				</label>

				{/*
				 * Chiqish AYNAN shu holat uchun. Hamma natijalarni bir ro'yxatda
				 * ko'rsatish mumkin edi, lekin unda kirish va chiqishni ko'z
				 * bilan moslashtirishga to'g'ri kelardi — tab esa ularni yonma-yon
				 * ushlab turadi.
				 */}
				<div className="min-w-0 rounded-control border border-border-default bg-surface">
					<div className="flex min-h-10 items-center gap-2 border-b border-border-default px-3">
						<p className="text-[11px] font-bold tracking-wide text-fg-subtle">{t("output")}</p>
						{output !== undefined && activeFailed && verdict && (
							<Badge tone={verdictTone(verdict)} size="sm">
								{tVerdict(verdict)}
							</Badge>
						)}
					</div>
					{output !== undefined ? (
						<>
							<pre className="max-h-40 overflow-auto p-3 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">
								{output !== "" ? (
									output
								) : (
									<span className="text-fg-subtle">{t("noOutput")}</span>
								)}
							</pre>
							{activeFailed && (
								<p className="border-t border-border-default px-3 py-2 text-sm text-danger">
									{t("caseFailed")}
								</p>
							)}
						</>
					) : (
						<p className="px-3 py-8 text-center text-sm text-fg-muted">
							{t("runCustomHint")}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
