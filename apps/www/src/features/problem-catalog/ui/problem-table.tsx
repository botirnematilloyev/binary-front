import Link from "next/link";
import { Badge, Panel } from "@binary/ui";
import type { ProblemRow } from "../model";

/**
 * Shablonda jadvalda MAVZU va YECHDI ustunlari ham bor. Ular hozir
 * QO'SHILMAYDI: ro'yxat javobida mavzular yo'q, "yechdi" hisoblagichi esa
 * backendda ataylab kesilgan (`problem_stats` — tezlik uchun, keyinroq).
 * Bo'sh yoki to'qib chiqarilgan ustun jadvalni to'ldiradi, lekin
 * foydalanuvchiga yolg'on aytadi.
 */
export function ProblemTable({ rows }: { rows: ProblemRow[] }) {
	if (rows.length === 0) {
		return (
			<Panel className="px-6 py-14 text-center">
				<p className="font-semibold">Masala topilmadi</p>
				<p className="mt-1 text-sm text-fg-muted">
					Filtrlarni o'zgartirib ko'ring.
				</p>
			</Panel>
		);
	}

	return (
		<Panel>
			{/* `role="table"` emas, haqiqiy `<table>`: skrin rider ustun
			    sarlavhasini kataklar bilan bog'lay olishi uchun. */}
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="border-b border-border-default bg-surface-subtle text-left">
						<th className="w-16 px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle">
							ID
						</th>
						<th className="px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle">
							MASALA
						</th>
						<th className="w-28 px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle">
							QIYINLIK
						</th>
						<th className="w-40 px-4 py-2.5 text-right text-[11px] font-bold tracking-wide text-fg-subtle">
							LIMIT
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr
							key={row.id}
							className="border-b border-border-default last:border-0 transition-colors hover:bg-surface-subtle"
						>
							<td className="px-4 py-3 font-mono text-[12.5px] text-fg-subtle">
								{row.id}
							</td>
							<td className="px-4 py-3">
								{/*
								 * Havola butun qatorni emas, sarlavhani o'raydi.
								 * `<tr>` ni `onClick` bilan bosiladigan qilish
								 * shablonda shunday, lekin u klaviatura bilan
								 * yurib bo'lmaydigan va yangi tabda ocholmaydigan
								 * element yasaydi.
								 */}
								<Link
									href={`/masalalar/${row.slug}`}
									className="font-semibold text-fg hover:text-accent"
								>
									{row.title}
								</Link>
							</td>
							<td className="px-4 py-3">
								<Badge tone={row.difficultyTone} size="sm">
									{row.difficultyLabel}
								</Badge>
							</td>
							<td className="px-4 py-3 text-right font-mono text-[12px] text-fg-muted">
								{row.limits}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</Panel>
	);
}
