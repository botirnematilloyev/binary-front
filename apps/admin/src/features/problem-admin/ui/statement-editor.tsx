"use client";

import { useState } from "react";
import { Markdown, Panel } from "@binary/ui";
import type { StatementValues } from "../model";

/**
 * Shart muharriri — yozish va jonli oldindan ko'rish yonma-yon.
 *
 * Oldindan ko'rish AYNAN `@binary/ui` dagi `Markdown` komponentini
 * ishlatadi, ya'ni setter ko'rgan narsa foydalanuvchi ko'radigan narsa
 * bilan bir xil: shrift, formula, jadval, hammasi. Alohida "admin
 * uslubi" yozilsa, ikkisi vaqt o'tib bir-biridan uzoqlashardi va setter
 * noto'g'ri natijaga qarab ish qilardi.
 *
 * Til tanlash bu yerda YO'Q — u chaqiruvchining ishi. Muharrir ichida
 * `lang` ni almashtirish o'zbekcha matnni ruscha sifatida saqlab, mavjud
 * ruscha shartni bosib ketardi; til almashganda o'sha tildagi SAQLANGAN
 * matn yuklanishi kerak, buni esa faqat holatni tutib turgan komponent
 * qila oladi.
 */
export function StatementEditor({
	value,
	onChange,
	titleError,
	legendError,
}: {
	value: StatementValues;
	onChange: (next: StatementValues) => void;
	titleError?: string | undefined;
	legendError?: string | undefined;
}) {
	const [preview, setPreview] = useState(true);

	function set<K extends keyof StatementValues>(key: K, next: StatementValues[K]) {
		onChange({ ...value, [key]: next });
	}

	return (
		<div>
			<div className="flex items-end gap-3">
				<div className="flex-1">
					<label htmlFor="title" className="block text-sm font-semibold">
						Sarlavha
					</label>
					<input
						id="title"
						value={value.title}
						onChange={(e) => set("title", e.target.value)}
						placeholder="Ikki son ayirmasi"
						className={inputClass}
					/>
				</div>

				<label className="flex cursor-pointer items-center gap-2 pb-2 text-sm font-semibold whitespace-nowrap">
					<input
						type="checkbox"
						checked={preview}
						onChange={(e) => setPreview(e.target.checked)}
						className="size-4 cursor-pointer"
					/>
					Oldindan ko'rish
				</label>
			</div>
			{titleError && (
				<p role="alert" className="mt-1.5 text-sm text-danger">
					{titleError}
				</p>
			)}

			<div className={`mt-4 grid gap-4 ${preview ? "lg:grid-cols-2" : ""}`}>
				<div>
					<label className="block text-sm font-semibold" htmlFor="legend">
						Matn <span className="font-normal text-fg-muted">— Markdown va LaTeX</span>
					</label>
					<textarea
						id="legend"
						value={value.legend}
						onChange={(e) => set("legend", e.target.value)}
						rows={18}
						spellCheck={false}
						// Kod va formulalar uchun avtomatik tuzatish zararli:
						// qo'shtirnoqlarni "chiroyli" belgilarga almashtiradi.
						autoCorrect="off"
						autoCapitalize="off"
						placeholder={"Ikkita butun son $a$ va $b$ berilgan.\n\n$$S = a - b$$"}
						className="mt-1.5 w-full resize-y rounded-card border border-border-strong bg-surface p-3 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
					/>
					{legendError && (
						<p role="alert" className="mt-1.5 text-sm text-danger">
							{legendError}
						</p>
					)}
				</div>

				{preview && (
					<div>
						<p className="text-sm font-semibold text-fg-muted">
							Foydalanuvchi ko'radigan holat
						</p>
						<Panel className="mt-1.5 min-h-[200px] p-4">
							{value.legend.trim() === "" ? (
								<p className="text-sm text-fg-subtle">
									Matn yozilganda shu yerda ko'rinadi.
								</p>
							) : (
								<Markdown>{value.legend}</Markdown>
							)}
						</Panel>
					</div>
				)}
			</div>

			<div className="mt-4 grid gap-4 sm:grid-cols-2">
				<div>
					<label htmlFor="in" className="block text-sm font-semibold">
						Kirish formati
					</label>
					<input
						id="in"
						value={value.inputFormat}
						onChange={(e) => set("inputFormat", e.target.value)}
						placeholder="Bitta satrda $a$ va $b$"
						className={inputClass}
					/>
				</div>
				<div>
					<label htmlFor="out" className="block text-sm font-semibold">
						Chiqish formati
					</label>
					<input
						id="out"
						value={value.outputFormat}
						onChange={(e) => set("outputFormat", e.target.value)}
						placeholder="$a - b$"
						className={inputClass}
					/>
				</div>
			</div>

			<div className="mt-4">
				<label htmlFor="notes" className="block text-sm font-semibold">
					Izoh (ixtiyoriy)
				</label>
				<textarea
					id="notes"
					value={value.notes}
					onChange={(e) => set("notes", e.target.value)}
					rows={3}
					className="mt-1.5 w-full resize-y rounded-card border border-border-strong bg-surface p-3 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
				/>
			</div>
		</div>
	);
}

const inputClass =
	"mt-1.5 w-full rounded-control border border-border-strong bg-surface px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
