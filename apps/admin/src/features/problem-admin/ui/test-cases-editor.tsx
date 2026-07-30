"use client";

import type { TestCaseDto } from "@binary/api";
import { Button, Panel } from "@binary/ui";

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
 * buzadi — shuning uchun tartib raqami qatorning O'ZIDA saqlanadi,
 * indeksidan hisoblanmaydi.
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

	const sorted = rows.slice().sort((a, b) => a.ordinal - b.ordinal);

	return (
		<div>
			<div className="flex flex-wrap items-center gap-3">
				<p className="text-sm text-fg-muted">
					Namuna testlari masala sahifasida ko'rinadi, qolganlari yashirin.
				</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="ml-auto"
					onClick={add}
					disabled={disabled}
				>
					Test qo'shish
				</Button>
			</div>

			{rows.length === 0 && (
				<Panel className="mt-3 px-5 py-8 text-center">
					<p className="font-semibold">Test yo'q</p>
					<p className="mt-1 text-sm text-fg-muted">
						Nashr qilish uchun kamida bitta test kerak.
					</p>
				</Panel>
			)}

			<div className="mt-3 flex flex-col gap-2">
				{sorted.map((row) => (
					<Panel key={row.ordinal} className="p-3">
						{/* Sarlavha qatori ixcham: raqam, namuna belgisi, o'chirish. */}
						<div className="flex items-center gap-3">
							<span className="font-mono text-[13px] font-bold text-fg-secondary">
								#{row.ordinal}
							</span>

							<label className="flex cursor-pointer items-center gap-2 text-sm">
								<input
									type="checkbox"
									checked={row.is_sample}
									onChange={(e) => update(row.ordinal, { is_sample: e.target.checked })}
									disabled={disabled}
									className="size-4 cursor-pointer"
								/>
								Namuna
							</label>

							<button
								type="button"
								onClick={() => remove(row.ordinal)}
								disabled={disabled}
								className="ml-auto cursor-pointer text-sm text-fg-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
							>
								O'chirish
							</button>
						</div>

						<div className="mt-2 grid gap-2 sm:grid-cols-2">
							<textarea
								value={row.input}
								onChange={(e) => update(row.ordinal, { input: e.target.value })}
								disabled={disabled}
								rows={2}
								spellCheck={false}
								autoCorrect="off"
								placeholder="kirish"
								className={textareaClass}
							/>
							<textarea
								value={row.expected_output}
								onChange={(e) => update(row.ordinal, { expected_output: e.target.value })}
								disabled={disabled}
								rows={2}
								spellCheck={false}
								autoCorrect="off"
								placeholder="kutilayotgan chiqish"
								className={textareaClass}
							/>
						</div>
					</Panel>
				))}
			</div>
		</div>
	);
}

const textareaClass =
	"w-full resize-y rounded-control border border-border-strong bg-surface p-2 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:bg-surface-muted";
