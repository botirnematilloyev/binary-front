"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
	ApiError,
	adminUsersApi,
	type AdminUserDetailDto,
	type LinkedAccountDto,
	type SolvedProblemDto,
	type StatsDto,
	type SubmissionDto,
} from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Badge, Button, cn, Panel } from "@binary/ui";
import {
	displayName,
	formatAgo,
	formatDateTime,
	locationName,
	PROVIDER,
	ROLE,
} from "../model";
import { SubmissionCodeDialog } from "./submission-code-dialog";
import { VerdictBadge } from "./verdict-badge";

const LANG = "uz";
const PER_PAGE = 50;

type Overview =
	| { phase: "loading" }
	| { phase: "ready"; user: AdminUserDetailDto; stats: StatsDto; solved: SolvedProblemDto[] }
	| { phase: "error"; notFound: boolean };

export function UserDetail({ id }: { id: number }) {
	const [overview, setOverview] = useState<Overview>({ phase: "loading" });

	const load = useCallback(async () => {
		setOverview({ phase: "loading" });
		try {
			// Uchala so'rov bir-biriga bog'liq emas — parallel.
			const [user, stats, solved] = await withFreshToken((token) =>
				Promise.all([
					adminUsersApi.get(id, { token }),
					adminUsersApi.stats(id, { token }),
					adminUsersApi.solved(id, { lang: LANG }, { token }),
				]),
			);
			setOverview({ phase: "ready", user, stats, solved: solved.problems });
		} catch (err) {
			setOverview({ phase: "error", notFound: err instanceof ApiError && err.status === 404 });
		}
	}, [id]);

	useEffect(() => {
		void load();
	}, [load]);

	if (overview.phase === "loading") {
		return <div className="h-64 animate-pulse rounded-card bg-surface-muted" />;
	}

	if (overview.phase === "error") {
		return (
			<Panel className="px-5 py-6">
				<p className="font-semibold">
					{overview.notFound ? "Foydalanuvchi topilmadi" : "Ma'lumotni yuklab bo'lmadi"}
				</p>
				<div className="mt-3 flex gap-2">
					<BackLink />
					{!overview.notFound && (
						<Button variant="outline" size="sm" onClick={() => void load()}>
							Qayta urinish
						</Button>
					)}
				</div>
			</Panel>
		);
	}

	const { user, stats, solved } = overview;

	return (
		<div className="space-y-6">
			<div>
				<BackLink />
				<div className="mt-3 flex flex-wrap items-center gap-3">
					<div className="flex size-12 items-center justify-center rounded-full bg-fg text-[15px] font-bold text-canvas">
						{initials(displayName(user))}
					</div>
					<div>
						<h1 className="text-[22px] leading-tight font-bold">{displayName(user)}</h1>
						<p className="font-mono text-[13px] text-fg-muted">
							@{user.username} · ID {user.id}
						</p>
					</div>
					<Badge tone={ROLE[user.role].tone} className="ml-1">
						{ROLE[user.role].label}
					</Badge>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
				<Panel className="p-5">
					<SectionTitle>Profil</SectionTitle>
					<dl className="mt-3 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-sm">
						<Field label="To'liq ism">{user.full_name ?? <Muted>kiritilmagan</Muted>}</Field>
						<Field label="Username">
							<span className="font-mono">@{user.username}</span>
						</Field>
						<Field label="Rol">{ROLE[user.role].label}</Field>
						<Field label="Viloyat">{locationName(user.region) ?? <Muted>—</Muted>}</Field>
						<Field label="Tuman">{locationName(user.district) ?? <Muted>—</Muted>}</Field>
						<Field label="Mentor">
							{user.mentor ? (
								<Link
									href={{ pathname: "/foydalanuvchilar/korish", query: { id: user.mentor.id } }}
									className="hover:text-accent hover:underline"
								>
									{displayName(user.mentor)}
								</Link>
							) : (
								<Muted>—</Muted>
							)}
						</Field>
						<Field label="Ro'yxatdan o'tgan">{formatDateTime(user.created_at)}</Field>
						<Field label="Profil yangilangan">{formatDateTime(user.updated_at)}</Field>
					</dl>
				</Panel>

				<Panel className="p-5">
					<SectionTitle>Statistika</SectionTitle>
					<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
						<Stat label="Yechgan" value={stats.solved} />
						<Stat label="Urinilgan masala" value={stats.attempted} />
						<Stat label="Jami yechim" value={stats.total} />
						<Stat label="Qabul qilingan" value={stats.accepted} />
					</div>
					<dl className="mt-4 grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-sm">
						<Field label="Birinchi yechim">
							{stats.first_at ? formatDateTime(stats.first_at) : <Muted>—</Muted>}
						</Field>
						<Field label="Oxirgi yechim">
							{stats.last_at ? formatDateTime(stats.last_at) : <Muted>—</Muted>}
						</Field>
						<Field label="Tillar">
							{stats.by_language.length === 0 ? (
								<Muted>—</Muted>
							) : (
								<span className="flex flex-wrap gap-1.5">
									{stats.by_language.map((lang) => (
										<Badge key={lang.code} size="sm">
											{lang.name} · {lang.accepted}/{lang.total}
										</Badge>
									))}
								</span>
							)}
						</Field>
					</dl>
				</Panel>
			</div>

			<Panel>
				<div className="px-5 pt-4">
					<SectionTitle>Bog'langan akkauntlar</SectionTitle>
				</div>
				{user.accounts.length === 0 ? (
					<p className="px-5 pt-2 pb-5 text-sm text-fg-muted">Akkaunt yo'q.</p>
				) : (
					<div className="mt-2 overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-sm">
							<thead>
								<tr className="border-y border-border-default bg-surface-subtle text-left">
									<Th className="w-28">TUR</Th>
									<Th>IDENTIFIKATOR</Th>
									<Th>QO'SHIMCHA</Th>
									<Th className="w-32">HOLAT</Th>
									<Th className="w-40">QO'SHILGAN</Th>
								</tr>
							</thead>
							<tbody>
								{user.accounts.map((account) => (
									<tr key={account.id} className="border-b border-border-default last:border-0">
										<td className="px-4 py-2.5 font-semibold">{PROVIDER[account.provider]}</td>
										<td className="px-4 py-2.5 font-mono">{account.identifier}</td>
										<td className="px-4 py-2.5 text-fg-secondary">{accountExtra(account) ?? <Muted>—</Muted>}</td>
										<td className="px-4 py-2.5">
											<Badge tone={account.is_verified ? "success" : "neutral"} size="sm">
												{account.is_verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
											</Badge>
										</td>
										<td className="px-4 py-2.5 text-fg-muted">{formatDateTime(account.created_at)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Panel>

			<Panel>
				<div className="px-5 pt-4">
					<SectionTitle>Faol sessiyalar</SectionTitle>
				</div>
				{user.sessions.length === 0 ? (
					<p className="px-5 pt-2 pb-5 text-sm text-fg-muted">Faol sessiya yo'q.</p>
				) : (
					<div className="mt-2 overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-sm">
							<thead>
								<tr className="border-y border-border-default bg-surface-subtle text-left">
									<Th>QURILMA</Th>
									<Th className="w-36">IP</Th>
									<Th className="w-40">OXIRGI FAOLLIK</Th>
									<Th className="w-40">KIRGAN</Th>
								</tr>
							</thead>
							<tbody>
								{user.sessions.map((session) => (
									<tr key={session.id} className="border-b border-border-default last:border-0">
										<td className="px-4 py-2.5">
											{session.device_name ?? <Muted>Noma'lum qurilma</Muted>}
											{(session.platform || session.os) && (
												<span className="ml-2 text-[12px] text-fg-muted">
													{[session.platform, session.os].filter(Boolean).join(" · ")}
												</span>
											)}
										</td>
										<td className="px-4 py-2.5 font-mono text-[12.5px] text-fg-muted">
											{session.ip_address ?? "—"}
										</td>
										<td className="px-4 py-2.5 text-fg-secondary">
											{session.last_active_at ? (
												<span title={formatDateTime(session.last_active_at)}>
													{formatAgo(session.last_active_at)}
												</span>
											) : (
												<Muted>—</Muted>
											)}
										</td>
										<td className="px-4 py-2.5 text-fg-muted">{formatDateTime(session.created_at)}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Panel>

			<Activity userId={user.id} solved={solved} total={stats.total} />
		</div>
	);
}

type Tab = "solved" | "submissions";

/**
 * Yechilgan masalalar va urinishlar — bitta panelda, ikki yorliq.
 *
 * Yechilgan masaladagi "urinishlar" tugmasi o'sha masala bo'yicha
 * filtrlangan urinishlarga o'tadi: admin odatda "bu masalani qanday
 * yechdi?" deb so'raydi va javob — o'sha masaladagi yechimlar tarixi.
 */
function Activity({
	userId,
	solved,
	total,
}: {
	userId: number;
	solved: SolvedProblemDto[];
	total: number;
}) {
	const [tab, setTab] = useState<Tab>("solved");
	const [problem, setProblem] = useState<{ id: number; title: string } | null>(null);

	return (
		<Panel>
			<div className="flex flex-wrap items-center gap-1.5 border-b border-border-default px-4 py-3">
				<TabButton active={tab === "solved"} onClick={() => setTab("solved")}>
					Yechgan masalalar · {solved.length}
				</TabButton>
				<TabButton
					active={tab === "submissions"}
					onClick={() => {
						setProblem(null);
						setTab("submissions");
					}}
				>
					Urinishlar · {total}
				</TabButton>

				{tab === "submissions" && problem && (
					<span className="ml-2 flex items-center gap-2 text-sm text-fg-secondary">
						Masala: <span className="font-semibold text-fg">{problem.title}</span>
						<button
							type="button"
							onClick={() => setProblem(null)}
							className="cursor-pointer text-[12.5px] text-accent hover:underline"
						>
							filtrni olib tashlash
						</button>
					</span>
				)}
			</div>

			{tab === "solved" ? (
				<SolvedTable
					items={solved}
					onShowAttempts={(item) => {
						setProblem({ id: item.problem_id, title: item.problem?.title ?? `#${item.problem_id}` });
						setTab("submissions");
					}}
				/>
			) : (
				<SubmissionsTable key={problem?.id ?? "all"} userId={userId} problemId={problem?.id} />
			)}
		</Panel>
	);
}

function SolvedTable({
	items,
	onShowAttempts,
}: {
	items: SolvedProblemDto[];
	onShowAttempts: (item: SolvedProblemDto) => void;
}) {
	if (items.length === 0) {
		return <p className="px-5 py-8 text-center text-sm text-fg-muted">Hali birorta masala yechilmagan.</p>;
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[520px] border-collapse text-sm">
				<thead>
					<tr className="border-b border-border-default bg-surface-subtle text-left">
						<Th className="w-14">ID</Th>
						<Th>MASALA</Th>
						<Th className="w-44">BIRINCHI QABUL</Th>
						<Th className="w-32 text-right">URINISHLAR</Th>
					</tr>
				</thead>
				<tbody>
					{items.map((item) => (
						<tr key={item.problem_id} className="border-b border-border-default last:border-0 hover:bg-surface-subtle">
							<td className="px-4 py-2.5 font-mono text-[12.5px] text-fg-subtle">{item.problem_id}</td>
							<td className="px-4 py-2.5">
								<ProblemCell problem={item.problem} id={item.problem_id} />
							</td>
							<td className="px-4 py-2.5 text-fg-secondary">{formatDateTime(item.first_accepted_at)}</td>
							<td className="px-4 py-2.5 text-right">
								<button
									type="button"
									onClick={() => onShowAttempts(item)}
									className="cursor-pointer font-mono font-semibold text-accent hover:underline"
									title="Shu masala bo'yicha urinishlarni ko'rish"
								>
									{item.attempts}
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

type Page =
	| { phase: "loading" }
	| { phase: "ready"; items: SubmissionDto[] }
	| { phase: "error" };

function SubmissionsTable({ userId, problemId }: { userId: number; problemId?: number | undefined }) {
	const [page, setPage] = useState(1);
	const [state, setState] = useState<Page>({ phase: "loading" });
	const [openId, setOpenId] = useState<number | null>(null);

	const load = useCallback(async () => {
		setState({ phase: "loading" });
		try {
			const result = await withFreshToken((token) =>
				adminUsersApi.submissions(
					userId,
					{ page, perPage: PER_PAGE, problemId, lang: LANG },
					{ token },
				),
			);
			setState({ phase: "ready", items: result.submissions });
		} catch {
			setState({ phase: "error" });
		}
	}, [userId, problemId, page]);

	useEffect(() => {
		void load();
	}, [load]);

	if (state.phase === "loading") {
		return <div className="m-4 h-32 animate-pulse rounded-card bg-surface-muted" />;
	}

	if (state.phase === "error") {
		return (
			<div className="px-5 py-6">
				<p className="text-fg-secondary">Urinishlarni yuklab bo'lmadi.</p>
				<Button variant="outline" size="sm" className="mt-3" onClick={() => void load()}>
					Qayta urinish
				</Button>
			</div>
		);
	}

	if (state.items.length === 0 && page === 1) {
		return <p className="px-5 py-8 text-center text-sm text-fg-muted">Urinish yo'q.</p>;
	}

	// Javobda `total` yo'q: to'liq sahifa kelgan bo'lsa, keyingisi bor deb hisoblanadi.
	const hasNext = state.items.length === PER_PAGE;

	return (
		<>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[960px] border-collapse text-sm">
					<thead>
						<tr className="border-b border-border-default bg-surface-subtle text-left">
							<Th className="w-16">ID</Th>
							<Th>MASALA</Th>
							<Th className="w-28">TIL</Th>
							<Th className="w-44">VERDIKT</Th>
							<Th className="w-20 text-right">VAQT</Th>
							<Th className="w-24 text-right">XOTIRA</Th>
							<Th className="w-40">SANA</Th>
							<Th className="w-20"> </Th>
						</tr>
					</thead>
					<tbody>
						{state.items.map((sub) => (
							<tr key={sub.id} className="border-b border-border-default last:border-0 hover:bg-surface-subtle">
								<td className="px-4 py-2.5 font-mono text-[12.5px] text-fg-subtle">{sub.id}</td>
								<td className="px-4 py-2.5">
									<ProblemCell problem={sub.problem ?? null} id={sub.problem_id} />
								</td>
								<td className="px-4 py-2.5 text-fg-secondary">{sub.language.name}</td>
								<td className="px-4 py-2.5">
									<VerdictBadge submission={sub} />
								</td>
								<td className="px-4 py-2.5 text-right font-mono text-[12.5px] text-fg-muted">
									{sub.time_ms !== null ? `${sub.time_ms} ms` : "—"}
								</td>
								<td className="px-4 py-2.5 text-right font-mono text-[12.5px] text-fg-muted">
									{sub.memory_kb !== null ? formatMemory(sub.memory_kb) : "—"}
								</td>
								<td className="px-4 py-2.5 text-fg-secondary">{formatDateTime(sub.created_at)}</td>
								<td className="px-4 py-2.5 text-right">
									<button
										type="button"
										onClick={() => setOpenId(sub.id)}
										className="cursor-pointer rounded-control border border-border-default px-2.5 py-1 text-[12.5px] font-semibold transition-colors hover:border-border-hover hover:bg-surface-hover"
									>
										Kod
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{(page > 1 || hasNext) && (
				<div className="flex items-center justify-end gap-3 border-t border-border-default px-4 py-3 text-sm">
					<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
						Oldingi
					</Button>
					<span className="font-mono text-fg-muted">{page}-sahifa</span>
					<Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage(page + 1)}>
						Keyingi
					</Button>
				</div>
			)}

			{openId !== null && <SubmissionCodeDialog id={openId} onClose={() => setOpenId(null)} />}
		</>
	);
}

function ProblemCell({ problem, id }: { problem: { slug: string; title: string } | null; id: number }) {
	if (!problem) return <Muted>O'chirilgan masala #{id}</Muted>;
	return (
		<>
			<div className="font-semibold">{problem.title}</div>
			<div className="font-mono text-[12px] text-fg-muted">{problem.slug}</div>
		</>
	);
}

function TabButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={active}
			className={cn(
				"cursor-pointer rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors",
				active
					? "bg-fg text-fg-inverted"
					: "border border-border-default text-fg-secondary hover:border-border-hover",
			)}
		>
			{children}
		</button>
	);
}

function BackLink() {
	return (
		<Link href="/foydalanuvchilar" className="text-sm font-semibold text-fg-secondary hover:text-fg">
			← Foydalanuvchilar
		</Link>
	);
}

function SectionTitle({ children }: { children: ReactNode }) {
	return <h2 className="text-[11px] font-bold tracking-wide text-fg-subtle uppercase">{children}</h2>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
	return (
		<>
			<dt className="text-fg-muted">{label}</dt>
			<dd className="min-w-0 break-words">{children}</dd>
		</>
	);
}

function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-control border border-border-default px-3 py-2.5">
			<div className="font-mono text-[20px] font-bold">{value}</div>
			<div className="text-[12px] text-fg-muted">{label}</div>
		</div>
	);
}

function Muted({ children }: { children: ReactNode }) {
	return <span className="text-fg-subtle">{children}</span>;
}

function Th({ children, className }: { children: string; className?: string }) {
	return (
		<th className={`px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle ${className ?? ""}`}>
			{children}
		</th>
	);
}

/** Telegram akkauntida username va ism metadata'da keladi. */
function accountExtra(account: LinkedAccountDto): string | null {
	const meta = account.metadata;
	if (!meta) return null;

	const parts: string[] = [];
	if (typeof meta["username"] === "string") parts.push(`@${meta["username"]}`);
	const name = [meta["first_name"], meta["last_name"]].filter((v) => typeof v === "string").join(" ");
	if (name) parts.push(name);
	return parts.length > 0 ? parts.join(" · ") : null;
}

function formatMemory(kb: number): string {
	return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function initials(name: string): string {
	const parts = name.replace(/^@/, "").split(/\s+/).filter(Boolean);
	return parts
		.slice(0, 2)
		.map((p) => Array.from(p)[0] ?? "")
		.join("")
		.toUpperCase();
}
