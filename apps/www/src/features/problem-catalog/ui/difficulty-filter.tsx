import { getTranslations } from "next-intl/server";
import { cn } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { DIFFICULTIES, filterQuery, type CatalogFilters, type CatalogQuery } from "../model";

/**
 * Qiyinlik filtri — chiplar, `<select>` emas.
 *
 * Shablonda bu ochiladigan ro'yxat. Undan voz kechildi, chunki `<select>`
 * o'zi hech qayerga o'tmaydi: uni ishlatish uchun `onChange` + `router.push`
 * kerak, ya'ni butun sahifa client komponentga aylanadi. Butun katalog
 * ataylab serverda render qilinadi va filtrlar oddiy havola — shu bilan
 * ulashish, orqaga qaytish va JS'siz ishlash bepul keladi.
 *
 * Uch qiymat bor-yo'g'i, ya'ni chiplar joyni ham yemaydi. `<select>` ga
 * qaytish sababi bo'lardi — qiymatlar o'ntadan oshsa.
 */
export async function DifficultyFilter({ filters }: { filters: CatalogFilters }) {
	const t = await getTranslations("problems");
	const tDifficulty = await getTranslations("difficulty");

	return (
		// `nav` emas, `div` + guruh yorlig'i: bu sahifalar orasidagi
		// navigatsiya emas, bitta ro'yxatning kesimi.
		<div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("difficulty")}>
			<span className="text-[11px] font-bold tracking-wide text-fg-subtle">
				{t("difficulty")}
			</span>

			<Chip query={filterQuery(filters, { difficulty: null })} active={filters.difficulty === undefined}>
				{t("all")}
			</Chip>

			{DIFFICULTIES.map((difficulty) => (
				<Chip
					key={difficulty}
					query={filterQuery(filters, { difficulty })}
					active={filters.difficulty === difficulty}
				>
					{tDifficulty(difficulty)}
				</Chip>
			))}
		</div>
	);
}

function Chip({
	query,
	active,
	children,
}: {
	query: CatalogQuery;
	active: boolean;
	children: string;
}) {
	return (
		<Link
			href={{ pathname: "/masalalar", query }}
			aria-current={active ? "true" : undefined}
			className={cn(
				"rounded-pill px-3 py-1.5 text-[13px] font-semibold transition-colors",
				active
					? "bg-fg text-fg-inverted"
					: "border border-border-default text-fg-secondary hover:border-border-hover",
			)}
		>
			{children}
		</Link>
	);
}
