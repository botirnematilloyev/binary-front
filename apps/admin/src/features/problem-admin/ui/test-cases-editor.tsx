"use client";

import type { TestCaseDto } from "@binary/api";
import { Badge, Button, Panel } from "@binary/ui";

/**
 * Testlar muharriri.
 *
 * ENG MUHIM QOIDA: tartib raqamlari QAYTA HISOBLANMAYDI.
 *
 * Test o'chirilganda `[1, 2, 3]` dan `[1, 3]` qoladi, `[1, 2]` emas.
 * Sabab backendda: `submissions.failed_ordinal` — bu TARIX. Kimningdir
 * yechimi "3-testda yiqildi" deb yozilgan bo'lsa va biz raqamlarni
 * siljitsak, o'sha yozuv boshqa testni ko'rsata boshlaydi va jimgina
 * yolg'on gapiradi.
 *
 * `rows.map((_, i) => i + 1)` yozish juda oson va aynan shu qoidani
 * buzadi — shuning uchun bu yerda tartib raqami qatorning O'ZIDA
 * saqlanadi, indeksidan hisoblanmaydi.
 */
export function TestCasesEditor({
	rows,
	onChange,
	disabled,
}: {
	rows: TestCaseDto[];
	onChange: (next: TestCaseDto[]) => void;
	disabled?: boolean;
}) {
	function update(ordinal: number, patch: Partial<TestCaseDto>) {
		onChange(rows.map((row) => (row.ordinal === ordinal ? { ...row, ...patch } : row)));
	}

	function remove(ordinal: number) {
		onChange(rows.filter((row) => row.ordinal !== ordinal));
	}

	function add() {
		// Eng katta raqamdan keyingisi — bo'shliqlar to'ldirilmaydi.
		const next = rows.reduce((max, row) => Math.max(max, row.ordinal), 0) + 1;
		onChange([...rows, { ordinal: next, input: "", expected_output: "", is_sample: false }]);
	}

	const sampleCount = rows.filter((row) => row.is_sample).length;

	return (
		<section>
			<div className="flex flex-wrap items-center gap-3">
				<h2 className="text-lg font-bold">Testlar</h2>
				<span className="text-sm text-fg-muted">
					{rows.length} ta · {sampleCount} tasi namuna
				</span>
				<Button type="button" variant="outline" size="sm" className="ml-auto" onClick={add} disabled={disabled}>
					Test qo'shish
				</Button>
			</div>

			{rows.length === 0 && (
				<Panel className="mt-4 px-5 py-8 text-center">
					<p className="font-semibold">Test yo'q</p>
					<p className="mt-1 text-sm text-fg-muted">
						Masalani nashr qilish uchun kamida bitta test kerak.
					</p>
				</Panel>
			)}

			<div className="mt-4 flex flex-col gap-3">
				{rows
					// Ko'rsatishda tartib raqami bo'yicha saralanadi — qo'shish
					// tartibi emas.
					.slice()
					.sort((a, b) => a.ordinal - b.ordinal)
					.map((row) => (
						<Panel key={row.ordinal} className="p-4">
							<div className="flex flex-wrap items-center gap-3">
								<span className="font-mono text-[13px] font-bold text-fg-secondary">
									#{row.ordinal}
								</span>

								<label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
									<input
										type="checkbox"
										checked={row.is_sample}
										onChange={(e) => update(row.ordinal, { is_sample: e.target.checked })}
										disabled={disabled}
										className="size-4 cursor-pointer"
									/>
									Namuna
								</label>

								{row.is_sample && (
									<Badge tone="accent" size="sm">
										Shartda ko'rinadi
									</Badge>
								)}

								<button
									type="button"
									onClick={() => remove(row.ordinal)}
									disabled={disabled}
									className="ml-auto cursor-pointer text-sm font-semibold text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-50"
								>
									O'chirish
								</button>
							</div>

							<div className="mt-3 grid gap-3 sm:grid-cols-2">
								<div>
									<label className="block text-[11px] font-bold tracking-wide text-fg-subtle">
										KIRISH
									</label>
									<textarea
										value={row.input}
										onChange={(e) => update(row.ordinal, { input: e.target.value })}
										disabled={disabled}
										rows={4}
										spellCheck={false}
										autoCorrect="off"
										className={textareaClass}
									/>
								</div>
								<div>
									<label className="block text-[11px] font-bold tracking-wide text-fg-subtle">
										KUTILAYOTGAN CHIQISH
									</label>
									<textarea
										value={row.expected_output}
										onChange={(e) => update(row.ordinal, { expected_output: e.target.value })}
										disabled={disabled}
										rows={4}
										spellCheck={false}
										autoCorrect="off"
										className={textareaClass}
									/>
								</div>
							</div>
						</Panel>
					))}
			</div>

			{rows.length > 0 && (
				<p className="mt-3 text-sm text-fg-muted">
					Namuna testlari masala sahifasida hammaga ko'rinadi. Qolganlari
					yashirin — faqat baholashda ishlatiladi.
				</p>
			)}
		</section>
	);
}

const textareaClass =
	"mt-1 w-full resize-y rounded-control border border-border-strong bg-surface p-2.5 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:bg-surface-muted";
