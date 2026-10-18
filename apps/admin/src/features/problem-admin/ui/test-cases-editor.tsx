"use client";

import { useState } from "react";
import type { TestCaseDto } from "@binary/api";
import { Button, Panel } from "@binary/ui";
import { IconButton, TrashIcon } from "@/shared/ui/icon-button";

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
	const [jsonOpen, setJsonOpen] = useState(false);
	const [jsonText, setJsonText] = useState("");
	const [jsonError, setJsonError] = useState<string | null>(null);
	const [draft, setDraft] = useState<DraftTestCase>(emptyDraft);

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

	function updateDraft(patch: Partial<TestCaseDto>) {
		const nextDraft = { ...draft, ...patch };

		/*
		 * Draft qator UI uchun xolos. Foydalanuvchi haqiqatan yozishni
		 * boshlamaguncha uni `rows` ga qo'shmaymiz, aks holda bo'sh test
		 * backendga saqlanib ketishi mumkin.
		 */
		if (nextDraft.input.trim() === "" && nextDraft.expected_output.trim() === "") {
			setDraft(nextDraft);
			return;
		}

		const next = rows.reduce((max, row) => Math.max(max, row.ordinal), 0) + 1;
		onChange([
			...rows,
			{
				ordinal: next,
				...nextDraft,
			},
		]);
		setDraft(emptyDraft);
	}

	function importJson(mode: "append" | "replace") {
		setJsonError(null);

		try {
			const parsed = parseJsonTests(jsonText);
			const startOrdinal =
				mode === "append" ? rows.reduce((max, row) => Math.max(max, row.ordinal), 0) + 1 : 1;
			const imported = parsed.map((row, index) => ({
				...row,
				ordinal: startOrdinal + index,
			}));

			onChange(mode === "append" ? [...rows, ...imported] : imported);
			setJsonText("");
			setDraft(emptyDraft);
			setJsonOpen(false);
		} catch (error) {
			setJsonError(error instanceof Error ? error.message : "JSON o'qib bo'lmadi.");
		}
	}

	const sorted = rows.slice().sort((a, b) => a.ordinal - b.ordinal);
	const draftOrdinal = rows.reduce((max, row) => Math.max(max, row.ordinal), 0) + 1;
	const showDraft = sorted.length === 0 || !isBlankTest(sorted[sorted.length - 1]!);

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
					onClick={() => {
						setJsonOpen((open) => !open);
						setJsonError(null);
					}}
					disabled={disabled}
				>
					JSON
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={add}
					disabled={disabled}
				>
					Test qo'shish
				</Button>
			</div>

			{jsonOpen && (
				<Panel className="mt-3 p-3">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p className="font-semibold">JSON orqali kiritish</p>
							<p className="mt-1 text-sm text-fg-muted">
								<code>[&#123;"input":"5 3","output":"8"&#125;]</code> yoki{" "}
								<code>&#123;"tests":[...]&#125;</code> formatida kiriting.
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setJsonOpen(false)}
						>
							Yopish
						</Button>
					</div>

					<textarea
						value={jsonText}
						onChange={(e) => {
							setJsonText(e.target.value);
							setJsonError(null);
						}}
						disabled={disabled}
						rows={8}
						spellCheck={false}
						autoCorrect="off"
						placeholder={`[
  { "input": "5 3", "output": "8", "is_sample": true },
  { "input": "10 4", "expected_output": "14" }
]`}
						className={`${textareaClass} mt-3`}
					/>

					{jsonError && (
						<p role="alert" className="mt-2 text-sm font-semibold text-danger">
							{jsonError}
						</p>
					)}

					<div className="mt-3 flex flex-wrap justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => importJson("replace")}
							disabled={disabled || jsonText.trim() === ""}
						>
							Almashtirish
						</Button>
						<Button
							type="button"
							size="sm"
							onClick={() => importJson("append")}
							disabled={disabled || jsonText.trim() === ""}
						>
							Qo'shish
						</Button>
					</div>
				</Panel>
			)}

			<div className="mt-3 flex flex-col gap-2">
				{sorted.map((row) => (
					<TestCaseRow
						key={row.ordinal}
						row={row}
						disabled={disabled}
						onUpdate={(patch) => update(row.ordinal, patch)}
						onRemove={() => remove(row.ordinal)}
					/>
				))}

				{showDraft && (
					<TestCaseRow
						row={{
							ordinal: draftOrdinal,
							...draft,
						}}
						disabled={disabled}
						draft
						onUpdate={updateDraft}
					/>
				)}
			</div>
		</div>
	);
}

function TestCaseRow({
	row,
	disabled,
	draft = false,
	onUpdate,
	onRemove,
}: {
	row: TestCaseDto;
	disabled?: boolean | undefined;
	draft?: boolean;
	onUpdate: (patch: Partial<TestCaseDto>) => void;
	onRemove?: () => void;
}) {
	return (
		<Panel className={`p-3 ${draft ? "border-dashed bg-surface-subtle" : ""}`}>
			{/* Sarlavha qatori ixcham: raqam, namuna belgisi, o'chirish. */}
			<div className="flex items-center gap-3">
				<span className="font-mono text-[13px] font-bold text-fg-secondary">
					#{row.ordinal}
				</span>

				<label className="flex cursor-pointer items-center gap-2 text-sm">
					<input
						type="checkbox"
						checked={row.is_sample}
						onChange={(e) => onUpdate({ is_sample: e.target.checked })}
						disabled={disabled}
						className="size-4 cursor-pointer"
					/>
					Namuna
				</label>

				{draft ? (
					<span className="ml-auto text-xs font-semibold text-fg-subtle">
						Yangi test
					</span>
				) : (
					<IconButton
						label="O'chirish"
						tone="danger"
						icon={<TrashIcon />}
						onClick={onRemove}
						disabled={disabled}
						className="ml-auto"
					/>
				)}
			</div>

			<div className="mt-2 grid gap-2 sm:grid-cols-2">
				<textarea
					value={row.input}
					onChange={(e) => onUpdate({ input: e.target.value })}
					disabled={disabled}
					rows={2}
					spellCheck={false}
					autoCorrect="off"
					placeholder="kirish"
					className={textareaClass}
				/>
				<textarea
					value={row.expected_output}
					onChange={(e) => onUpdate({ expected_output: e.target.value })}
					disabled={disabled}
					rows={2}
					spellCheck={false}
					autoCorrect="off"
					placeholder="kutilayotgan chiqish"
					className={textareaClass}
				/>
			</div>
		</Panel>
	);
}

function isBlankTest(row: TestCaseDto) {
	return row.input.trim() === "" && row.expected_output.trim() === "";
}

type DraftTestCase = Omit<TestCaseDto, "ordinal">;

const emptyDraft: DraftTestCase = {
	input: "",
	expected_output: "",
	is_sample: false,
};

function parseJsonTests(source: string): Omit<TestCaseDto, "ordinal">[] {
	let parsed: unknown;

	try {
		parsed = JSON.parse(source);
	} catch {
		throw new Error("JSON sintaksisi noto'g'ri.");
	}

	const items = getJsonItems(parsed);

	if (items.length === 0) {
		throw new Error("JSON ichida test topilmadi.");
	}

	return items.map((item, index) => normalizeJsonTest(item, index));
}

function getJsonItems(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}

	if (value && typeof value === "object") {
		const object = value as Record<string, unknown>;
		const nested = object.tests ?? object.test_cases ?? object.cases;

		if (Array.isArray(nested)) {
			return nested;
		}

		if ("input" in object || "expected_output" in object || "output" in object) {
			return [object];
		}
	}

	throw new Error("Format: array yoki { tests: [...] } bo'lishi kerak.");
}

function normalizeJsonTest(item: unknown, index: number): Omit<TestCaseDto, "ordinal"> {
	if (Array.isArray(item)) {
		if (item.length < 2) {
			throw new Error(`${index + 1}-test array bo'lsa, [input, output] bo'lishi kerak.`);
		}

		return {
			input: textValue(item[0]),
			expected_output: textValue(item[1]),
			is_sample: Boolean(item[2]),
		};
	}

	if (!item || typeof item !== "object") {
		throw new Error(`${index + 1}-test obyekt bo'lishi kerak.`);
	}

	const object = item as Record<string, unknown>;
	const input = object.input ?? object.stdin;
	const output =
		object.expected_output ?? object.output ?? object.stdout ?? object.answer;

	if (input === undefined || output === undefined) {
		throw new Error(
			`${index + 1}-testda input va output/expected_output bo'lishi kerak.`,
		);
	}

	return {
		input: textValue(input),
		expected_output: textValue(output),
		is_sample: Boolean(object.is_sample ?? object.sample),
	};
}

function textValue(value: unknown) {
	if (value === null || value === undefined) {
		return "";
	}

	if (typeof value === "string") {
		return value;
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}

	return JSON.stringify(value, null, 2) ?? String(value);
}

const textareaClass =
	"w-full resize-y rounded-control border border-border-strong bg-surface p-2 font-mono text-[13px] leading-relaxed focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:bg-surface-muted";
