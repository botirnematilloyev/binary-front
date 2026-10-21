"use client";

import { useLocale, useTranslations } from "next-intl";
import type { ActivityDto } from "@binary/api";
import { monthName, weekdayName, type Locale } from "@/shared/i18n/locales";
import { ACTIVITY_DAYS, buildHeatmap, type HeatCell } from "../model";

/**
 * Katak kengligi. Oy sarlavhalari ham shu kenglikka tekislanadi, ya'ni
 * ular haftalar bilan bir chiziqda turadi. Oraliq (`gap-[3px]`) esa
 * Tailwind sinfida — ikkalasi bir joyda bo'lishi kerak edi, lekin
 * `gap` ni JS'dan berish uchun butun to'rni inline `style` ga
 * ko'chirish kerak bo'lardi.
 */
const CELL = 11;

/*
 * Hafta kunlari yorlig'i FAQAT toq qatorlarda.
 *
 * Yettala kunni yozish 11px balandlikdagi qatorlarga sig'maydi va to'r
 * o'qilmaydigan bo'lib qoladi. GitHub/GitLab ham shu yo'ldan boradi:
 * uchta nuqta yetarli, qolganini ko'z o'zi to'ldiradi.
 *
 * Indeks 0 = yakshanba, chunki `buildHeatmap` boshlanishni yakshanbaga
 * tekislaydi.
 */
const LABELLED_ROWS = [1, 3, 5];

/**
 * Faollik kalendari — 42.uz va GitLab'dagi kabi.
 *
 * Ilgari bu shunchaki kvadratlar to'plami edi: qaysi katak qaysi oyga
 * tegishli ekanini bilishning yo'li yo'q edi, ya'ni to'r chiroyli
 * ko'rinardi-yu, hech narsa aytmasdi. Endi uchta o'q bor — oy
 * sarlavhalari, hafta kunlari va shkala.
 *
 * Oy va kun nomlari `shared/i18n/locales` dagi `monthName`/`weekdayName`
 * orqali olinadi, to'g'ridan-to'g'ri `Intl` dan emas. Sabab: Chrome'da
 * `uz` uchun kalendar ma'lumoti yo'q va `Intl` `M07` bilan inglizcha
 * `Wed` ni qaytaradi — ya'ni sahifa aynan asosiy tilda buzilardi.
 */
export function Heatmap({ activity }: { activity: ActivityDto }) {
	const t = useTranslations("profile");
	const locale = useLocale() as Locale;

	const cells = buildHeatmap(activity, ACTIVITY_DAYS);
	const total = activity.days.reduce((sum, day) => sum + day.count, 0);
	const weeks = chunkWeeks(cells);

	return (
		<section>
			<p className="text-[11px] font-bold tracking-wide text-fg-subtle">
				{t("activityTitle")}
			</p>

			{/*
			 * `rtl` o'ram — tor ekranda aylantirish O'NG chetdan boshlanadi,
			 * ya'ni birinchi ko'rinadigani eng yangi haftalar (JS'siz).
			 * Ichkarida yo'nalish yana `ltr`.
			 */}
			<div className="mt-3 overflow-x-auto [direction:rtl]">
				<div className="flex w-max gap-2 [direction:ltr]">
					{/* Hafta kunlari. `pt` oy sarlavhalari balandligiga teng,
					    shunda birinchi qator o'z yorlig'i bilan tekislanadi. */}
					<div className="flex flex-col gap-[3px] pt-[18px]">
						{Array.from({ length: 7 }, (_, row) => (
							<span
								key={row}
								aria-hidden
								className="flex h-[11px] items-center text-[10px] leading-none text-fg-subtle"
							>
								{LABELLED_ROWS.includes(row) ? weekdayLabel(locale, row) : ""}
							</span>
						))}
					</div>

					<div>
						{/* Oy sarlavhalari: har ustun bitta haftaga to'g'ri
						    keladi va yorliq faqat oy ALMASHGAN ustunda
						    chiziladi. Matn kenglikdan oshib ketadi — bu
						    ataylab, aks holda "Sentabr" qisqarib ketardi. */}
						<div className="flex h-[18px] gap-[3px]">
							{weeks.map((week, index) => (
								<span
									key={week[0]?.day ?? index}
									aria-hidden
									className="shrink-0 text-[10px] whitespace-nowrap text-fg-muted"
									style={{ width: CELL }}
								>
									{startsNewMonth(weeks, index) ? monthLabel(locale, week) : ""}
								</span>
							))}
						</div>

						<div
							className="grid grid-flow-col grid-rows-7 gap-[3px]"
							style={{ gridAutoColumns: `${CELL}px` }}
							role="img"
							aria-label={t("activityCount", { count: total })}
						>
							{cells.map((cell) => (
								<span
									key={cell.day}
									data-level={cell.level}
									// `title` — bosishsiz ko'rinadigan yagona izoh.
									// Skrin rider uchun butun to'r bitta `img`,
									// chunki 182 ta katakni birma-bir o'qish foydasiz.
									title={`${cell.day}: ${cell.count}`}
									className="size-[11px] rounded-[2.5px] bg-surface-muted data-[level=1]:bg-success/30 data-[level=2]:bg-success/50 data-[level=3]:bg-success/75 data-[level=4]:bg-success"
								/>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
				<p className="text-[12.5px] text-fg-muted">
					{t("activityCount", { count: total })}
				</p>

				{/* Shkala: rang nimani bildirishini aytadigan yagona joy.
				    Usiz to'q yashil "ko'p" ekanini faqat taxmin qilish mumkin. */}
				<div className="ml-auto flex items-center gap-1.5 text-[11px] text-fg-subtle">
					<span>{t("activityLess")}</span>
					{[0, 1, 2, 3, 4].map((level) => (
						<span
							key={level}
							aria-hidden
							data-level={level}
							className="size-[11px] rounded-[2.5px] bg-surface-muted data-[level=1]:bg-success/30 data-[level=2]:bg-success/50 data-[level=3]:bg-success/75 data-[level=4]:bg-success"
						/>
					))}
					<span>{t("activityMore")}</span>
				</div>
			</div>
		</section>
	);
}

function chunkWeeks(cells: HeatCell[]): HeatCell[][] {
	const weeks: HeatCell[][] = [];
	for (let i = 0; i < cells.length; i += 7) {
		weeks.push(cells.slice(i, i + 7));
	}
	return weeks;
}

/**
 * Ustun yangi oyni boshlaydimi.
 *
 * Birinchi ustun ATAYLAB yorliqsiz: u deyarli har doim oyning o'rtasiga
 * tushadi, ya'ni "Iyun" yozuvi o'sha oyning boshi degan yolg'on taassurot
 * berardi.
 */
function startsNewMonth(weeks: HeatCell[][], index: number): boolean {
	if (index === 0) return false;

	const current = monthOf(weeks[index]);
	const previous = monthOf(weeks[index - 1]);
	return current !== null && current !== previous;
}

function monthOf(week: HeatCell[] | undefined): string | null {
	return week?.[0]?.day.slice(0, 7) ?? null;
}

function monthLabel(locale: Locale, week: HeatCell[]): string {
	const day = week[0]?.day;
	if (day === undefined) return "";
	return monthName(locale, new Date(`${day}T00:00:00Z`), "short");
}

function weekdayLabel(locale: Locale, row: number): string {
	// 2024-01-07 — yakshanba. Qatordan kunni shu nuqtadan sanaymiz,
	// ya'ni yorliqlar to'rning haqiqiy tartibiga bog'lanadi.
	return weekdayName(locale, new Date(Date.UTC(2024, 0, 7 + row)));
}
