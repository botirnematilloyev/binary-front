import { getTranslations } from "next-intl/server";
import { Badge, Panel } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import type { ProblemRow } from "../model";

/**
 * Shablonda jadvalda MAVZU va YECHDI ustunlari ham bor. Ular hozir
 * QO'SHILMAYDI: ro'yxat javobida mavzular yo'q, "yechdi" hisoblagichi esa
 * backendda ataylab kesilgan (`problem_stats` — tezlik uchun, keyinroq).
 * Bo'sh yoki to'qib chiqarilgan ustun jadvalni to'ldiradi, lekin
 * foydalanuvchiga yolg'on aytadi.
 *
 * Server komponenti bo'lgani uchun tarjimani `getTranslations` beradi —
 * `useTranslations` client hook va bu yerda kerak emas.
 */
export async function ProblemTable({ rows }: { rows: ProblemRow[] }) {
	const t = await getTranslations("problems");
	const tDifficulty = await getTranslations("difficulty");

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
			{/* `role="table"` emas, haqiqiy `<table>`: skrin rider ustun
			    sarlavhasini kataklar bilan bog'lay olishi uchun. */}
			<table className="w-full border-collapse text-sm">
				<thead>
					<tr className="border-b border-border-default bg-surface-subtle text-left">
						<Th className="w-16">{t("columnId")}</Th>
						<Th>{t("columnProblem")}</Th>
						<Th className="w-28">{t("columnDifficulty")}</Th>
						<Th className="w-40 text-right">{t("columnLimits")}</Th>
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
									href={{ pathname: "/masalalar/[slug]", params: { slug: row.slug } }}
									className="font-semibold text-fg hover:text-accent"
								>
									{row.title}
								</Link>
							</td>
							<td className="px-4 py-3">
								<Badge tone={row.difficultyTone} size="sm">
									{tDifficulty(row.difficulty)}
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

function Th({ children, className }: { children: string; className?: string }) {
	return (
		<th
			className={`px-4 py-2.5 text-[11px] font-bold tracking-wide text-fg-subtle ${className ?? ""}`}
		>
			{children}
		</th>
	);
}
