import { getTranslations } from "next-intl/server";
import { Panel } from "@binary/ui";
import type { LeaderboardRow } from "../model";

export async function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
	const t = await getTranslations("leaderboard");

	if (rows.length === 0) {
		return (
			<Panel className="px-6 py-14 text-center">
				<p className="font-semibold">{t("emptyTitle")}</p>
				<p className="mt-1 text-sm text-fg-muted">{t("emptyHint")}</p>
			</Panel>
		);
	}

	return (
		<Panel>
			<div className="overflow-x-auto">
				{/*
				 * Telefonda "O'zgarish" ustuni yashiriladi va qolganlari
				 * ixchamlashadi: ilgari jadval 760px dan tor bo'lmasdi, ya'ni
				 * mobilda reyting faqat yon tomonga surib o'qilardi.
				 */}
				<table className="w-full border-collapse text-sm md:min-w-[760px]">
					<thead>
						<tr className="border-b border-border-default bg-surface-subtle text-left">
							<Th className="w-12 sm:w-20">{t("columnRank")}</Th>
							<Th>{t("columnUser")}</Th>
							<Th className="w-16 text-right sm:w-36">{t("columnSolved")}</Th>
							<Th className="w-16 text-right sm:w-36">{t("columnRating")}</Th>
							<Th className="hidden w-36 text-right sm:table-cell">{t("columnChange")}</Th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={row.userId}
								className="h-[72px] border-b border-border-default last:border-0 transition-colors hover:bg-surface-subtle sm:h-[84px]"
							>
								<td className="px-3 font-mono text-[15px] text-fg-muted sm:px-6">{row.rank}</td>
								<td className="max-w-0 px-2 py-4 sm:px-4">
									<div className="flex min-w-0 items-center gap-3 sm:gap-4">
										<div className="hidden size-10 shrink-0 items-center justify-center rounded-full bg-fg text-[12px] font-bold text-canvas sm:flex">
											{row.initials}
										</div>
										<div className="min-w-0">
											<div className="truncate text-[15px] font-semibold text-fg">
												{row.displayName}
											</div>
											<div className="mt-0.5 truncate font-mono text-[13px] text-fg-muted">
												@{row.username}
											</div>
										</div>
									</div>
								</td>
								<td className="px-2 text-right font-mono text-[15px] text-fg-muted sm:px-4">
									{row.solved}
								</td>
								<td className="px-3 text-right font-mono text-[16px] font-bold text-fg sm:px-4">
									{row.rating}
								</td>
								<td
									className={`hidden px-6 text-right font-mono text-[15px] sm:table-cell ${
										row.change > 0 ? "text-success" : "text-fg-muted"
									}`}
								>
									{row.change > 0 ? `+${row.change}` : row.change}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Panel>
	);
}

function Th({ children, className }: { children: string; className?: string }) {
	return (
		<th
			className={`px-2 py-3 text-[11px] font-bold uppercase tracking-wide text-fg-subtle first:px-3 sm:px-4 sm:first:px-4 ${className ?? ""}`}
		>
			{children}
		</th>
	);
}
