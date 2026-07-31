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

	return (
		<div>
			<div className="flex flex-wrap items-center gap-1.5">
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
						className={`group relative flex items-center rounded-pill transition-colors ${
							index === active
								? "bg-fg text-fg-inverted"
								: "border border-border-default text-fg-secondary hover:border-border-hover"
						}`}
					>
						<button
							type="button"
							onClick={() => onActiveChange(index)}
							aria-pressed={index === active}
							className="cursor-pointer py-1 pr-2.5 pl-3 text-[13px] font-semibold"
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
						 * O'chirish tugmasi chipning ichida, o'ng chekkada.
						 * Ilgari u alohida "Holatni o'chirish" havolasi edi
						 * va u FAOL holatni o'chirardi — ya'ni boshqasini
						 * o'chirish uchun avval uni tanlash kerak edi.
						 *
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
								className={`mr-1.5 cursor-pointer rounded-full px-1 text-[13px] leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
									index === active
										? "text-fg-inverted/60 hover:text-fg-inverted"
										: "text-fg-subtle hover:text-danger"
								}`}
							>
								×
							</button>
						)}
					</div>
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
