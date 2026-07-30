"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
	adminProblemsApi,
	type AdminProblemSummaryDto,
	type ProblemStatus,
} from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Badge, Button, Panel } from "@binary/ui";

type Filter = ProblemStatus | "all";

type State =
	| { phase: "loading" }
	| { phase: "ready"; items: AdminProblemSummaryDto[] }
	| { phase: "error" };

const FILTERS: { value: Filter; label: string }[] = [
	{ value: "all", label: "Barchasi" },
	{ value: "draft", label: "Qoralama" },
	{ value: "published", label: "Nashr qilingan" },
	{ value: "archived", label: "Arxiv" },
];

/*
 * Holat → rang. To'liq `Record`: backend to'rtinchi holat qo'shsa
 * kompilyatsiyada ko'rinadi.
 *
 * Qoralama KULRANG, nashr qilingan YASHIL: setter bir qarashda qaysi
 * masala hali ko'rinmasligini bilishi kerak — bu paneldagi eng ko'p
 * beriladigan savol.
 */
const STATUS: Record<ProblemStatus, { label: string; tone: "neutral" | "success" | "warning" }> = {
	draft: { label: "Qoralama", tone: "neutral" },
	published: { label: "Nashrda", tone: "success" },
	archived: { label: "Arxiv", tone: "warning" },
};

const DIFFICULTY: Record<"easy" | "medium" | "hard", string> = {
	easy: "Oson",
	medium: "O'rta",
	hard: "Qiyin",
};

export function ProblemList() {
	const [filter, setFilter] = useState<Filter>("all");
	const [state, setState] = useState<State>({ phase: "loading" });

	const load = useCallback(async () => {
		setState({ phase: "loading" });
		try {
			const result = await withFreshToken((token) =>
				adminProblemsApi.list(
					// `all` — bu backend tushunadigan qiymat EMAS, shuning uchun
					// parametr umuman yuborilmaydi. Backendda admin ro'yxati
					// sukut bo'yicha holat bo'yicha filtrlamaydi.
					{ perPage: 100, ...(filter === "all" ? {} : { status: filter }) },
					{ token },
				),
			);
			setState({ phase: "ready", items: result.problems });
		} catch {
			setState({ phase: "error" });
		}
	}, [filter]);

	useEffect(() => {
		void load();
	}, [load]);

	return (
		<section>
			<div className="flex flex-wrap items-center gap-2">
				<h1 className="text-[22px] font-bold">Masalalar</h1>

				<Link
					href="/masalalar/yangi"
					className="ml-3 rounded-control bg-fg px-3.5 py-1.5 text-[13px] font-semibold text-fg-inverted transition-colors hover:bg-accent"
				>
					Yangi masala
				</Link>

				<div className="ml-auto flex gap-1.5">
					{FILTERS.map((item) => (
						<button
							key={item.value}
							type="button"
							onClick={() => setFilter(item.value)}
							aria-pressed={filter === item.value}
							className={`cursor-pointer rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors ${
								filter === item.value
									? "bg-fg text-fg-inverted"
									: "border border-border-default text-fg-secondary hover:border-border-hover"
							}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			{state.phase === "loading" && (
				<Panel className="mt-5 h-40 animate-pulse bg-surface-subtle" />
			)}

			{state.phase === "error" && (
				<Panel className="mt-5 px-5 py-6">
					<p className="text-fg-secondary">Ro'yxatni yuklab bo'lmadi.</p>
					<Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
						Qayta urinish
					</Button>
				</Panel>
			)}

			{state.phase === "ready" && state.items.length === 0 && (
				<Panel className="mt-5 px-5 py-10 text-center">
					<p className="font-semibold">Masala yo'q</p>
					<p className="mt-1 text-sm text-fg-muted">
						Bu filtr bo'yicha hech narsa topilmadi.
					</p>
				</Panel>
			)}

			{state.phase === "ready" && state.items.length > 0 && (
				<Panel className="mt-5">
					<table className="w-full border-collapse text-sm">
						<thead>
							<tr className="border-b border-border-default bg-surface-subtle text-left">
								<Th className="w-14">ID</Th>
								<Th>SARLAVHA</Th>
								<Th className="w-40">SLUG</Th>
								<Th className="w-24">QIYINLIK</Th>
								<Th className="w-28">HOLAT</Th>
							</tr>
						</thead>
						<tbody>
							{state.items.map((problem) => (
								<tr
									key={problem.id}
									className="border-b border-border-default last:border-0 hover:bg-surface-subtle"
								>
									<td className="px-4 py-2.5 font-mono text-[12.5px] text-fg-subtle">
										{problem.id}
									</td>
									<td className="px-4 py-2.5 font-semibold">{problem.title}</td>
									<td className="px-4 py-2.5 font-mono text-[12px] text-fg-muted">
										{problem.slug}
									</td>
									<td className="px-4 py-2.5">{DIFFICULTY[problem.difficulty]}</td>
									<td className="px-4 py-2.5">
										<Badge tone={STATUS[problem.status].tone} size="sm">
											{STATUS[problem.status].label}
										</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</Panel>
			)}
		</section>
	);
}

function Th({ children, className }: { children: string; className?: string }) {
	return (
		<th
			className={`px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle ${className ?? ""}`}
		>
			{children}
		</th>
	);
}
