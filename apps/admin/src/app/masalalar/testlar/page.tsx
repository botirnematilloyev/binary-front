"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ApiError, adminProblemsApi, type ProblemStatus, type TestCaseDto } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Badge, Button, Container, Panel } from "@binary/ui";
import { saveErrorMessage, TestCasesEditor } from "@/features/problem-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function TestCasesPage() {
	return (
		<>
			<AdminHeader />
			<Suspense
				fallback={
					<Container className="py-8">
						<div className="h-40 animate-pulse rounded-card bg-surface-muted" />
					</Container>
				}
			>
				<TestCases />
			</Suspense>
		</>
	);
}

const STATUS_LABEL: Record<ProblemStatus, { label: string; tone: "neutral" | "success" | "warning" }> = {
	draft: { label: "Qoralama", tone: "neutral" },
	published: { label: "Nashrda", tone: "success" },
	archived: { label: "Arxiv", tone: "warning" },
};

type Load = { phase: "loading" } | { phase: "ready" } | { phase: "error"; message: string };

function TestCases() {
	const params = useSearchParams();
	const rawId = params.get("id");
	const id = rawId !== null && /^\d+$/.test(rawId) ? Number(rawId) : null;

	const [load, setLoad] = useState<Load>({ phase: "loading" });
	const [slug, setSlug] = useState("");
	const [status, setStatus] = useState<ProblemStatus>("draft");
	const [rows, setRows] = useState<TestCaseDto[]>([]);

	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchAll = useCallback(async (problemId: number) => {
		setLoad({ phase: "loading" });
		try {
			const [problem, tests] = await withFreshToken(async (token) =>
				Promise.all([
					adminProblemsApi.get(problemId, { token }),
					adminProblemsApi.listTestCases(problemId, { token }),
				]),
			);
			setSlug(problem.slug);
			setStatus(problem.status);
			setRows(tests.test_cases);
			setLoad({ phase: "ready" });
		} catch (cause) {
			setLoad({ phase: "error", message: saveErrorMessage(cause) });
		}
	}, []);

	useEffect(() => {
		if (id === null) {
			setLoad({ phase: "error", message: "Manzilda masala id'si ko'rsatilmagan." });
			return;
		}
		void fetchAll(id);
	}, [id, fetchAll]);

	async function saveTests() {
		if (id === null) return;
		setBusy(true);
		setError(null);
		setMessage(null);
		try {
			await withFreshToken((token) => adminProblemsApi.setTestCases(id, rows, { token }));
			setMessage("Testlar saqlandi.");
		} catch (cause) {
			setError(saveErrorMessage(cause));
		} finally {
			setBusy(false);
		}
	}

	async function changeStatus(action: "publish" | "unpublish") {
		if (id === null) return;
		setBusy(true);
		setError(null);
		setMessage(null);
		try {
			const updated = await withFreshToken((token) =>
				action === "publish"
					? adminProblemsApi.publish(id, { token })
					: adminProblemsApi.unpublish(id, { token }),
			);
			setStatus(updated.status);
			setMessage(action === "publish" ? "Masala nashr qilindi." : "Masala arxivga olindi.");
		} catch (cause) {
			setError(publishErrorMessage(cause));
		} finally {
			setBusy(false);
		}
	}

	if (load.phase === "loading") {
		return (
			<Container className="py-8">
				<div className="h-40 animate-pulse rounded-card bg-surface-muted" />
			</Container>
		);
	}

	if (load.phase === "error") {
		return (
			<Container className="py-8">
				<Panel className="p-6">
					<p className="text-fg-secondary">{load.message}</p>
					<div className="mt-4 flex gap-3">
						{id !== null && (
							<Button variant="outline" onClick={() => void fetchAll(id)}>
								Qayta urinish
							</Button>
						)}
						<Link href="/" className={linkButtonClass}>
							Ro'yxatga qaytish
						</Link>
					</div>
				</Panel>
			</Container>
		);
	}

	return (
		<Container className="py-8">
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-[22px] font-bold">Testlar va nashr</h1>
				<span className="font-mono text-[12.5px] text-fg-subtle">{slug}</span>
				<Badge tone={STATUS_LABEL[status].tone} size="sm">
					{STATUS_LABEL[status].label}
				</Badge>

				<div className="ml-auto flex gap-2">
					{id !== null && (
						<Link href={{ pathname: "/masalalar/tahrir", query: { id } }} className={linkButtonClass}>
							Shartni tahrirlash
						</Link>
					)}
					<Link href="/" className={linkButtonClass}>
						Ro'yxat
					</Link>
				</div>
			</div>

			<div className="mt-6">
				<TestCasesEditor rows={rows} onChange={setRows} disabled={busy} />
			</div>

			{error && (
				<p role="alert" className="mt-5 text-sm text-danger">
					{error}
				</p>
			)}
			{message && <p className="mt-5 text-sm font-semibold text-success">{message}</p>}

			<div className="mt-5 flex flex-wrap items-center gap-3">
				<Button type="button" onClick={() => void saveTests()} disabled={busy}>
					{busy ? "Bajarilyapti…" : "Testlarni saqlash"}
				</Button>

				{/*
				 * Nashr qilish testlarni saqlashdan ALOHIDA tugma.
				 *
				 * Birlashtirish jozibali edi ("saqla va nashr qil"), lekin
				 * ular boshqa-boshqa amallar: testni tuzatish nashr holatini
				 * o'zgartirmasligi kerak, va nashr qilingan masalaning
				 * testini tahrirlash uni qayta nashr qilishni talab qilmaydi.
				 */}
				{status === "published" ? (
					<Button type="button" variant="outline" onClick={() => void changeStatus("unpublish")} disabled={busy}>
						Arxivga olish
					</Button>
				) : (
					<Button type="button" variant="accent" onClick={() => void changeStatus("publish")} disabled={busy}>
						Nashr qilish
					</Button>
				)}

				<p className="text-sm text-fg-muted">
					Nashr qilish uchun shart va kamida bitta test bo'lishi shart.
				</p>
			</div>
		</Container>
	);
}

const linkButtonClass =
	"inline-flex items-center rounded-control border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-border-hover";

/**
 * Backend nashr qilishni ikki sababdan rad etadi va IKKALASI ham 422:
 * shart yo'q (`ErrNothingToPublish`) yoki test yo'q (`ErrNoTestCases`).
 * Statusdan qaysi biri ekanini bilib bo'lmaydi, xabar esa inglizcha —
 * shuning uchun ikkalasini qamrab oladigan matn beriladi. Bu noaniqlik
 * emas: setter uchun har ikkala holatda ham bajariladigan ish bir xil.
 */
function publishErrorMessage(cause: unknown): string {
	if (cause instanceof ApiError && cause.status === 422) {
		return "Nashr qilib bo'lmadi: shart yozilmagan yoki test qo'shilmagan.";
	}
	return saveErrorMessage(cause);
}
