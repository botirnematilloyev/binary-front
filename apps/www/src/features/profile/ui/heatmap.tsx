"use client";

import { useTranslations } from "next-intl";
import type { ActivityDto } from "@binary/api";
import { ACTIVITY_DAYS, buildHeatmap } from "../model";

/**
 * Faollik kalendari — 42.uz va RoboContest'dagi kabi.
 *
 * `grid-auto-flow: column` + 7 qatorli to'r: kataklar ustma-ust
 * (hafta bo'yicha) to'ldiriladi va yangi ustun keyingi haftadan
 * boshlanadi. Bu GitHub'dan kelgan naqsh va foydalanuvchi uni
 * tushuntirishsiz o'qiydi.
 *
 * Ranglar `bg-*` tokenlari orqali emas, `data-level` atributi va CSS
 * o'zgaruvchilari bilan: besh daraja uchun beshta Tailwind sinfini
 * shartli yozish satrni o'qib bo'lmaydigan qilardi.
 */
export function Heatmap({ activity }: { activity: ActivityDto }) {
	const t = useTranslations("profile");
	const cells = buildHeatmap(activity, ACTIVITY_DAYS);
	const total = activity.days.reduce((sum, day) => sum + day.count, 0);

	return (
		<section>
			<p className="text-[11px] font-bold tracking-wide text-fg-subtle">
				{t("activityTitle")}
			</p>

			<div className="mt-3 overflow-x-auto">
				<div
					className="grid grid-flow-col grid-rows-7 gap-[3px]"
					style={{ gridAutoColumns: "11px" }}
					role="img"
					aria-label={t("activityCount", { count: total })}
				>
					{cells.map((cell) => (
						<span
							key={cell.day}
							data-level={cell.level}
							// `title` — bosishsiz ko'rinadigan yagona izoh.
							// Skrin rider uchun butun to'r bitta `img`, chunki
							// 182 ta katakni birma-bir o'qish foydasiz.
							title={`${cell.day}: ${cell.count}`}
							className="size-[11px] rounded-[2.5px] bg-surface-muted data-[level=1]:bg-success/30 data-[level=2]:bg-success/50 data-[level=3]:bg-success/75 data-[level=4]:bg-success"
						/>
					))}
				</div>
			</div>

			<p className="mt-2 text-[12.5px] text-fg-muted">
				{t("activityCount", { count: total })}
			</p>
		</section>
	);
}
