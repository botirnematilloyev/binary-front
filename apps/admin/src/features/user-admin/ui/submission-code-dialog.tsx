"use client";

import { useEffect, useRef, useState } from "react";
import { adminUsersApi, type AdminSubmissionDto } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Button } from "@binary/ui";
import { formatDateTime } from "../model";
import { VerdictBadge } from "./verdict-badge";

type State =
	| { phase: "loading" }
	| { phase: "ready"; submission: AdminSubmissionDto }
	| { phase: "error" };

/**
 * Yechim kodi — modal oynada.
 *
 * Ro'yxat javobida kod YO'Q (har qatorda bir necha KB matn keraksiz
 * yuk bo'lardi), shuning uchun u oyna ochilganda alohida so'raladi.
 * Native `<dialog>`: Esc, fokus tuzog'i va fon bloklash brauzerdan.
 */
export function SubmissionCodeDialog({ id, onClose }: { id: number; onClose: () => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	const [state, setState] = useState<State>({ phase: "loading" });
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		ref.current?.showModal();
	}, []);

	useEffect(() => {
		let cancelled = false;
		setState({ phase: "loading" });
		withFreshToken((token) => adminUsersApi.getSubmission(id, { lang: "uz" }, { token }))
			.then((submission) => !cancelled && setState({ phase: "ready", submission }))
			.catch(() => !cancelled && setState({ phase: "error" }));
		return () => {
			cancelled = true;
		};
	}, [id]);

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			// Clipboard ruxsati yo'q — kodni qo'lda belgilash mumkin.
		}
	};

	return (
		<dialog
			ref={ref}
			onClose={onClose}
			// Fon ustiga bosilganda yopiladi: bosish `<dialog>` ning o'ziga
			// tushadi, ichidagi kontentga emas.
			onClick={(e) => e.target === ref.current && ref.current.close()}
			className="m-auto w-[min(920px,calc(100vw-32px))] rounded-card border border-border-default bg-canvas p-0 text-fg shadow-xl backdrop:bg-black/50"
		>
			<div className="flex items-start gap-3 border-b border-border-default px-5 py-4">
				<div className="min-w-0">
					<h2 className="text-[16px] font-bold">
						Yechim #{id}
						{state.phase === "ready" && state.submission.problem && (
							<span className="font-normal text-fg-secondary"> · {state.submission.problem.title}</span>
						)}
					</h2>
					{state.phase === "ready" && (
						<div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px] text-fg-muted">
							<VerdictBadge submission={state.submission} />
							<span>
								{state.submission.language.name} {state.submission.language.version}
							</span>
							{state.submission.time_ms !== null && <span>· {state.submission.time_ms} ms</span>}
							{state.submission.memory_kb !== null && <span>· {state.submission.memory_kb} KB</span>}
							<span>· {formatDateTime(state.submission.created_at)}</span>
						</div>
					)}
				</div>
				<button
					type="button"
					onClick={() => ref.current?.close()}
					aria-label="Yopish"
					className="ml-auto cursor-pointer rounded-control px-2 py-1 text-lg leading-none text-fg-muted hover:bg-surface-hover hover:text-fg"
				>
					×
				</button>
			</div>

			<div className="max-h-[70vh] overflow-auto p-5">
				{state.phase === "loading" && <div className="h-48 animate-pulse rounded-card bg-surface-muted" />}

				{state.phase === "error" && <p className="text-fg-secondary">Yechimni yuklab bo'lmadi.</p>}

				{state.phase === "ready" && (
					<>
						<div className="flex justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={() => void copy(state.submission.source_code ?? "")}
							>
								{copied ? "Nusxalandi" : "Nusxa olish"}
							</Button>
						</div>
						<pre className="mt-2 overflow-x-auto rounded-control border border-border-default bg-surface-subtle p-4 font-mono text-[13px] leading-relaxed">
							<code>{state.submission.source_code}</code>
						</pre>

						{state.submission.compile_output && (
							<>
								<h3 className="mt-4 text-[11px] font-bold tracking-wide text-fg-subtle uppercase">
									Kompilyator chiqishi
								</h3>
								<pre className="mt-2 overflow-x-auto rounded-control border border-border-default bg-surface-subtle p-4 font-mono text-[12.5px] text-danger">
									{state.submission.compile_output}
								</pre>
							</>
						)}
					</>
				)}
			</div>
		</dialog>
	);
}
