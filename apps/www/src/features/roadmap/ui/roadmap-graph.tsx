import { useTranslations } from "next-intl";
import { cn } from "@binary/ui";
import type { RoadmapNodeDto } from "@binary/api";
import { Link } from "@/i18n/navigation";
import { CARD_HEIGHT, CARD_WIDTH, layoutRoadmap, type RoadmapCard } from "../model";

/**
 * Mavzular grafi.
 *
 * Kartochkalar ABSOLYUT joylashtirilgan, `grid` bilan emas. Sabab
 * chiziqlarda: ular SVG'da chiziladi va boshlanish nuqtasi
 * kartochkaning aniq joyiga tegishi kerak. Grid'da bu joyni faqat
 * DOM'ni o'lchab bilish mumkin, ya'ni birinchi kadrda chiziqlar
 * noto'g'ri chizilib, keyin sakrab joyiga tushardi.
 */
export function RoadmapGraph({
	nodes,
	apiLang,
}: {
	nodes: RoadmapNodeDto[];
	apiLang: string;
}) {
	const t = useTranslations("roadmap");
	const layout = layoutRoadmap(nodes, apiLang);

	if (layout.cards.length === 0) {
		return <p className="py-16 text-center text-fg-muted">{t("empty")}</p>;
	}

	// Kartochkalar sath bo'yicha guruhlanadi — tor ekrandagi ro'yxat uchun.
	// `layout.cards` sath tartibida keladi, `y` esa sathni bildiradi.
	const levels = new Map<number, RoadmapCard[]>();
	for (const card of layout.cards) {
		levels.set(card.y, [...(levels.get(card.y) ?? []), card]);
	}

	return (
		<>
			{/*
			 * `lg` dan pastda chizma O'RNIGA sathma-sath ro'yxat. Eng keng
			 * sath 4 ta kartochka (~860px) — telefonda ham, planshetda ham
			 * sig'maydi: bitta kartochkali sathlar markazda, ya'ni ekrandan
			 * tashqarida turib, foydalanuvchi bo'sh joyni ko'rardi.
			 * Chiziqlar bu yerda yo'q — tartibni sathlar ketma-ketligi
			 * aytib turadi.
			 */}
			<ol className="flex flex-col lg:hidden">
				{[...levels.values()].map((row, index) => (
					<li key={row[0]?.id ?? index} className="flex flex-col items-center">
						{index > 0 && (
							<span aria-hidden="true" className="h-5 w-px bg-border-default" />
						)}
						{/* Yolg'iz kartochka butun kenglikni oladi — aks holda u
						    chapda osilib, bog'lovchi chiziq bilan tekislanmasdi. */}
						<div
							className={cn(
								"grid w-full gap-2.5",
								row.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3",
							)}
						>
							{row.map((card) => (
								<Card key={card.id} card={card} />
							))}
						</div>
					</li>
				))}
			</ol>

			{/*
			 * Gorizontal aylantirish O'RAMDA, sahifada emas: chizma keng
			 * bo'lsa ham sahifaning o'zi yon tomonga siljimasligi kerak.
			 */}
			<div className="-mx-4 hidden overflow-x-auto px-4 pb-4 lg:block">
				<div
					className="relative mx-auto"
					style={{ width: layout.width, height: layout.height }}
				>
					<svg
						className="absolute inset-0 h-full w-full"
						viewBox={`0 0 ${layout.width} ${layout.height}`}
						/*
						 * Chiziqlar bezak: ular kartochkalardagi ma'lumotni
						 * takrorlaydi ("bu mavzudan keyin nima keladi"), va
						 * skrinrider uchun ularni o'qish faqat shovqin.
						 */
						aria-hidden="true"
					>
						{layout.edges.map((edge) => (
							<path
								key={edge.key}
								d={edge.d}
								fill="none"
								strokeWidth={1.5}
								/*
								 * Rang tokeni to'liq nomi bilan:
								 * `stroke-border` degan utility YO'Q (token
								 * `--color-border-default` deb ataladi) va u
								 * jimgina ishlamaydi — SVG'da `stroke` ning
								 * sukut qiymati `none`, ya'ni chiziq umuman
								 * chizilmasdi. Aynan shu xato birinchi
								 * urinishda chizmani chiziqsiz qoldirdi.
								 */
								className={
									edge.done ? "stroke-success" : "stroke-border-default"
								}
							/>
						))}
					</svg>

					{layout.cards.map((card) => (
						<Card key={card.id} card={card} placed />
					))}
				</div>
			</div>
		</>
	);
}

/**
 * `placed` — chizmadagi absolyut joylashuv; usiz kartochka oddiy oqimda
 * (tor ekrandagi ro'yxat uchun).
 */
function Card({ card, placed = false }: { card: RoadmapCard; placed?: boolean }) {
	const t = useTranslations("roadmap");

	const percent = card.total === 0 ? 0 : Math.round((card.solved / card.total) * 100);

	return (
		/*
		 * Kartochka — HAVOLA, tugma emas: u boshqa sahifaga olib boradi
		 * va o'rta tugma bilan yangi oynada ochilishi kerak.
		 *
		 * "Yopiq" mavzu ham bosiladi. Yo'l xaritasi — tavsiya, to'siq
		 * emas: kimdir tartibni buzib o'rganmoqchi bo'lsa, unga
		 * to'sqinlik qilish loyihaning ishi emas.
		 */
		<Link
			href={{ pathname: "/masalalar", query: { topic_id: String(card.id) } }}
			data-state={card.state}
			className={cn(
				"group flex flex-col justify-between rounded-xl border border-border-default bg-surface p-3 transition-colors hover:border-border-hover data-[state=done]:border-success data-[state=done]:bg-success-tint data-[state=open]:border-accent data-[state=locked]:bg-surface-muted",
				placed ? "absolute" : "min-h-[82px] gap-2",
			)}
			style={
				placed
					? { left: card.x, top: card.y, width: CARD_WIDTH, height: CARD_HEIGHT }
					: undefined
			}
		>
			<div className="flex items-start justify-between gap-2">
				<span className="line-clamp-2 text-[13.5px] leading-tight font-semibold group-data-[state=locked]:text-fg-secondary">
					{card.title}
				</span>

				{/*
				 * Belgi faqat tugagan mavzuda. "Ochiq" holat uchun ham
				 * biror belgi qo'yish mumkin edi, lekin unda uchta
				 * holatning uchtasi ham belgi bilan chiqib, chizma
				 * ikonkalarga to'lib ketardi — holatni RANG allaqachon
				 * aytib turibdi.
				 */}
				{card.state === "done" ? (
					<span className="shrink-0 text-success" aria-hidden="true">
						✓
					</span>
				) : null}
			</div>

			<div>
				<p className="font-mono text-[11.5px] text-fg-muted">
					{t("problems", { solved: card.solved, total: card.total })}
				</p>

				{/*
				 * Progress chizig'i faqat masalasi bor mavzuda: bo'sh
				 * mavzuda u har doim nol bo'lib turadi va "hech narsa
				 * qilinmagan" degan noto'g'ri taassurot beradi.
				 */}
				{card.total > 0 ? (
					<div className="mt-1.5 h-[3px] w-full rounded-full bg-surface-muted">
						<div
							className="h-full rounded-full bg-accent transition-[width] data-[state=done]:bg-success"
							data-state={card.state}
							style={{ width: `${percent}%` }}
						/>
					</div>
				) : null}
			</div>
		</Link>
	);
}
