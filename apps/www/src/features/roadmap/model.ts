import type { RoadmapNodeDto } from "@binary/api";
import { pickName } from "@/features/problem-catalog";

/*
 * Chizma o'lchamlari PIKSELDA va shu yerda.
 *
 * Ular CSS'da emas, chunki chiziqlar SVG'da chiziladi va ularning
 * boshlanish nuqtasi kartochkaning aniq joyiga tegishi kerak. CSS
 * (`grid`, `gap`) bilan joylashtirilsa, chiziqni chizish uchun
 * kartochkalarning haqiqiy o'lchamini DOM'dan o'lchash kerak bo'lardi —
 * ya'ni `ResizeObserver`, birinchi kadrda noto'g'ri chiziqlar va
 * o'lchash bilan chizish orasidagi sakrash. Hisoblab qo'yilgan
 * koordinatalar serverda ham, mijozda ham bir xil natija beradi.
 */
export const CARD_WIDTH = 196;
export const CARD_HEIGHT = 82;
const GAP_X = 26;
const GAP_Y = 58;

/**
 * Kartochka holati.
 *
 * `locked` — mavzu YOPIQ emas, faqat "hali navbati kelmagan": bosib
 * kirish mumkin. Bu ataylab: yo'l xaritasi tavsiya, to'siq emas.
 * Kimdir graflarni birinchi kundan o'rganmoqchi bo'lsa, unga
 * to'sqinlik qilish loyihaning ishi emas.
 */
export type CardState = "done" | "open" | "locked";

export interface RoadmapCard {
	id: number;
	slug: string;
	title: string;
	total: number;
	solved: number;
	state: CardState;
	x: number;
	y: number;
}

export interface RoadmapEdge {
	/** SVG `path` uchun tayyor `d` — komponent geometriya bilan ishlamaydi. */
	d: string;
	/** Ikkala uchi ham tugagan bo'lsa chiziq quyuqroq chiziladi. */
	done: boolean;
	key: string;
}

export interface RoadmapLayout {
	cards: RoadmapCard[];
	edges: RoadmapEdge[];
	width: number;
	height: number;
}

/**
 * Grafni koordinatalarga aylantiradi.
 *
 * Sathlar SERVERDAN keladi (`level`) — ular graf bo'yicha hisoblangan
 * va mijozda qayta hisoblanmaydi. Bu yerda faqat joylashtirish bor:
 * bir sathdagilar bitta qatorda, qator markazga tekislanadi.
 */
export function layoutRoadmap(nodes: RoadmapNodeDto[], apiLang: string): RoadmapLayout {
	const rows = groupByLevel(nodes);
	const widest = Math.max(1, ...rows.map((row) => row.length));
	const width = widest * CARD_WIDTH + (widest - 1) * GAP_X;

	const cards: RoadmapCard[] = [];
	const byID = new Map<number, RoadmapCard>();

	rows.forEach((row, level) => {
		const rowWidth = row.length * CARD_WIDTH + (row.length - 1) * GAP_X;
		// Qator markazga tekislanadi: chapga tekislansa, bitta
		// kartochkali sathlar chetda osilib qolardi va chiziqlar
		// yon tomonga cho'zilib ketardi.
		const offsetX = (width - rowWidth) / 2;

		row.forEach((node, index) => {
			const card: RoadmapCard = {
				id: node.id,
				slug: node.slug,
				title: pickName(node.name, apiLang),
				total: node.total,
				solved: node.solved,
				// Holat quyida, hamma kartochka yaratilgandan keyin
				// aniqlanadi: u talab qilingan mavzularning holatiga
				// bog'liq, ular esa yuqoriroq sathda.
				state: "locked",
				x: offsetX + index * (CARD_WIDTH + GAP_X),
				y: level * (CARD_HEIGHT + GAP_Y),
			};
			cards.push(card);
			byID.set(card.id, card);
		});
	});

	applyStates(nodes, byID);

	return {
		cards,
		edges: buildEdges(nodes, byID),
		width,
		height: rows.length * CARD_HEIGHT + Math.max(0, rows.length - 1) * GAP_Y,
	};
}

function groupByLevel(nodes: RoadmapNodeDto[]): RoadmapNodeDto[][] {
	const rows: RoadmapNodeDto[][] = [];
	for (const node of nodes) {
		// Sathlar uzluksiz kelmasligi mumkin emas (server Kahn bilan
		// hisoblaydi), lekin bo'sh qator hosil bo'lsa ham chizma
		// buzilmaydi — u shunchaki bo'sh joy bo'lib qoladi.
		while (rows.length <= node.level) rows.push([]);
		rows[node.level]!.push(node);
	}
	return rows;
}

/**
 * Har bir kartochkaning holati.
 *
 * "Ochiq" — hamma talablari TUGAGAN mavzu. Ya'ni holat mavzuning
 * o'zidan emas, uning oldingilaridan kelib chiqadi, va shuning uchun
 * kartochkalar sath tartibida (yuqoridan pastga) bir marta aylanib
 * chiqiladi: har bir mavzuga yetganda uning talablari allaqachon
 * hisoblangan bo'ladi.
 */
function applyStates(nodes: RoadmapNodeDto[], byID: Map<number, RoadmapCard>): void {
	for (const node of nodes) {
		const card = byID.get(node.id);
		if (card === undefined) continue;

		// Masalasi yo'q mavzu "tugagan" emas — unda hali yechadigan
		// narsa yo'q. Backend ham jamlarni aynan shu qoida bilan
		// sanaydi, ikkalasi bir xil bo'lishi kerak.
		if (card.total > 0 && card.solved === card.total) {
			card.state = "done";
			continue;
		}

		const ready = node.requires.every((id) => byID.get(id)?.state === "done");
		card.state = ready ? "open" : "locked";
	}
}

function buildEdges(nodes: RoadmapNodeDto[], byID: Map<number, RoadmapCard>): RoadmapEdge[] {
	const edges: RoadmapEdge[] = [];

	for (const node of nodes) {
		const to = byID.get(node.id);
		if (to === undefined) continue;

		for (const requiredID of node.requires) {
			const from = byID.get(requiredID);
			// Boshqa fandagi mavzuga bog'lanish: server buni sathlar
			// hisobida ham e'tiborsiz qoldiradi, ya'ni chiziq ham
			// chizilmaydi.
			if (from === undefined) continue;

			const x1 = from.x + CARD_WIDTH / 2;
			const y1 = from.y + CARD_HEIGHT;
			const x2 = to.x + CARD_WIDTH / 2;
			const y2 = to.y;

			// Kubik Bezier: boshlanishida pastga, oxirida yuqoriga
			// yo'nalgan. To'g'ri chiziq ham ishlagan bo'lardi, lekin
			// bir necha sath ustidan sakraydigan bog'lanishlar
			// kartochkalarni kesib o'tardi; egri chiziq esa ulardan
			// yumshoq aylanib o'tadi.
			const bend = Math.max(18, (y2 - y1) / 2);
			const d = `M ${x1} ${y1} C ${x1} ${y1 + bend}, ${x2} ${y2 - bend}, ${x2} ${y2}`;

			edges.push({
				d,
				done: from.state === "done" && to.state === "done",
				key: `${requiredID}-${node.id}`,
			});
		}
	}

	return edges;
}
