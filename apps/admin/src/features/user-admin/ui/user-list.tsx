"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminUsersApi, type AdminUserSummaryDto } from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Badge, Button, Panel } from "@binary/ui";
import {
	displayName,
	formatAgo,
	formatDate,
	formatDateTime,
	locationName,
	PROVIDER,
	ROLE,
} from "../model";

const PER_PAGE = 50;

type State =
	| { phase: "loading" }
	| { phase: "ready"; items: AdminUserSummaryDto[]; total: number }
	| { phase: "error" };

export function UserList() {
	const [input, setInput] = useState("");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [state, setState] = useState<State>({ phase: "loading" });

	// Har harfda so'rov yubormaslik uchun: 300 ms jimlikdan keyin qidiradi.
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearch(input.trim());
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [input]);

	const load = useCallback(async () => {
		setState({ phase: "loading" });
		try {
			const result = await withFreshToken((token) =>
				adminUsersApi.list({ page, perPage: PER_PAGE, query: search || undefined }, { token }),
			);
			setState({ phase: "ready", items: result.users, total: result.total });
		} catch {
			setState({ phase: "error" });
		}
	}, [page, search]);

	useEffect(() => {
		void load();
	}, [load]);

	const pages = state.phase === "ready" ? Math.max(1, Math.ceil(state.total / PER_PAGE)) : 1;

	return (
		<section>
			<div className="flex flex-wrap items-center gap-3">
				<h1 className="text-[22px] font-bold">Foydalanuvchilar</h1>
				{state.phase === "ready" && (
					<span className="font-mono text-sm text-fg-muted">{state.total}</span>
				)}

				<input
					type="search"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Username, ism, telefon yoki email"
					aria-label="Foydalanuvchini qidirish"
					className="ml-auto h-9 w-full max-w-[340px] rounded-control border border-border-default bg-canvas px-3 text-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent"
				/>
			</div>

			{state.phase === "loading" && <Panel className="mt-5 h-40 animate-pulse bg-surface-subtle" />}

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
					<p className="font-semibold">Hech kim topilmadi</p>
					<p className="mt-1 text-sm text-fg-muted">Qidiruv so'zini o'zgartirib ko'ring.</p>
				</Panel>
			)}

			{state.phase === "ready" && state.items.length > 0 && (
				<Panel className="mt-5">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[920px] border-collapse text-sm">
							<thead>
								<tr className="border-b border-border-default bg-surface-subtle text-left">
									<Th className="w-14">ID</Th>
									<Th>FOYDALANUVCHI</Th>
									<Th>ALOQA</Th>
									<Th className="w-40">VILOYAT</Th>
									<Th className="w-20 text-right">YECHGAN</Th>
									<Th className="w-20 text-right">URINISH</Th>
									<Th className="w-36">OXIRGI YECHIM</Th>
									<Th className="w-28">RO'YXAT</Th>
								</tr>
							</thead>
							<tbody>
								{state.items.map((user) => (
									<UserRow key={user.id} user={user} />
								))}
							</tbody>
						</table>
					</div>
				</Panel>
			)}

			{state.phase === "ready" && pages > 1 && (
				<div className="mt-4 flex items-center justify-end gap-3 text-sm">
					<Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
						Oldingi
					</Button>
					<span className="font-mono text-fg-muted">
						{page} / {pages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= pages}
						onClick={() => setPage(page + 1)}
					>
						Keyingi
					</Button>
				</div>
			)}
		</section>
	);
}

function UserRow({ user }: { user: AdminUserSummaryDto }) {
	const href = { pathname: "/foydalanuvchilar/korish", query: { id: user.id } } as const;

	return (
		<tr className="border-b border-border-default last:border-0 hover:bg-surface-subtle">
			<td className="px-4 py-2.5 font-mono text-[12.5px] text-fg-subtle">{user.id}</td>
			<td className="px-4 py-2.5">
				{/*
				 * Havola ism ustida, butun qatorda emas: qatordagi telefon va
				 * emailni nusxa olish uchun belgilash mumkin bo'lib qolsin.
				 */}
				<Link href={href} className="font-semibold hover:text-accent hover:underline">
					{displayName(user)}
				</Link>
				<div className="mt-0.5 flex items-center gap-2 font-mono text-[12px] text-fg-muted">
					@{user.username}
					{user.role !== "user" && (
						<Badge tone={ROLE[user.role].tone} size="sm">
							{ROLE[user.role].label}
						</Badge>
					)}
				</div>
			</td>
			<td className="px-4 py-2.5">
				{user.accounts.length === 0 ? (
					<span className="text-fg-subtle">—</span>
				) : (
					<ul className="space-y-0.5">
						{user.accounts.map((account) => (
							<li key={account.id} className="text-[12.5px]">
								<span className="text-fg-subtle">{PROVIDER[account.provider]}: </span>
								<span className="font-mono">{account.identifier}</span>
							</li>
						))}
					</ul>
				)}
			</td>
			<td className="px-4 py-2.5 text-fg-secondary">{locationName(user.region) ?? "—"}</td>
			<td className="px-4 py-2.5 text-right font-mono font-semibold">{user.solved}</td>
			<td className="px-4 py-2.5 text-right font-mono text-fg-muted">{user.submissions}</td>
			<td className="px-4 py-2.5 text-fg-secondary">
				{user.last_submission_at ? (
					<span title={formatDateTime(user.last_submission_at)}>
						{formatAgo(user.last_submission_at)}
					</span>
				) : (
					<span className="text-fg-subtle">—</span>
				)}
			</td>
			<td className="px-4 py-2.5 font-mono text-[12.5px] text-fg-muted">{formatDate(user.created_at)}</td>
		</tr>
	);
}

function Th({ children, className }: { children: string; className?: string }) {
	return (
		<th className={`px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle ${className ?? ""}`}>
			{children}
		</th>
	);
}
