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
				<table className="w-full min-w-[760px] border-collapse text-sm">
					<thead>
						<tr className="border-b border-border-default bg-surface-subtle text-left">
							<Th className="w-20">{t("columnRank")}</Th>
							<Th>{t("columnUser")}</Th>
							<Th className="w-36 text-right">{t("columnSolved")}</Th>
							<Th className="w-36 text-right">{t("columnRating")}</Th>
							<Th className="w-36 text-right">{t("columnChange")}</Th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => (
							<tr
								key={row.userId}
								className="h-[84px] border-b border-border-default last:border-0 transition-colors hover:bg-surface-subtle"
							>
								<td className="px-6 font-mono text-[15px] text-fg-muted">{row.rank}</td>
								<td className="px-4 py-4">
									<div className="flex min-w-0 items-center gap-4">
										<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-fg text-[12px] font-bold text-canvas">
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
								<td className="px-4 text-right font-mono text-[15px] text-fg-muted">
									{row.solved}
								</td>
								<td className="px-4 text-right font-mono text-[16px] font-bold text-fg">
									{row.rating}
								</td>
								<td
									className={`px-6 text-right font-mono text-[15px] ${
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
			className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-fg-subtle ${className ?? ""}`}
		>
			{children}
		</th>
	);
}
