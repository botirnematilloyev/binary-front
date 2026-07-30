import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApiError, problemsApi, type ProblemDetailDto } from "@binary/api";
import { Badge, Container, Panel } from "@binary/ui";
import { formatMemory, formatSeconds, pickName } from "@/features/problem-catalog";

export const revalidate = 300;

interface PageProps {
	params: Promise<{ slug: string }>;
}

/**
 * Masalani bir marta oladi va natijani sahifa bilan BO'LISHADI.
 *
 * `generateMetadata` va sahifa komponenti ikkisi ham ma'lumotga muhtoj.
 * React `fetch` ni bir xil argumentlar uchun dedup qiladi, ya'ni bu
 * ikkita chaqiruv bitta HTTP so'rovga aylanadi. Shuning uchun "props
 * orqali uzatish" kabi qo'l bilan keshlash kerak emas.
 */
async function loadProblem(slug: string): Promise<ProblemDetailDto> {
	try {
		return await problemsApi.getProblem(slug, "uz", { revalidate });
	} catch (error) {
		// Backend nashr qilinmagan masala uchun ham 404 qaytaradi, 403 emas —
		// aks holda mavjud emasligini tekshirib slug'larni sanab chiqish
		// mumkin bo'lardi. Frontend shu qarorni buzmasligi kerak.
		if (error instanceof ApiError && error.status === 404) notFound();
		throw error;
	}
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { slug } = await params;
	const problem = await loadProblem(slug);

	const path = `/masalalar/${slug}`;

	return {
		title: problem.statement.title,
		description: summarize(problem.statement.legend),
		alternates: {
			// Kanonik manzil bittada bo'lishi shart: aks holda `?lang=ru`
			// va `?lang=uz` Google uchun ikkita alohida sahifa bo'lib
			// ko'rinadi va ikkalasi bir-birining reytingini yeydi.
			canonical: path,
			// Backend `available_langs` ni beradi — hreflang aynan shundan
			// quriladi, qo'lda yozilgan ro'yxatdan emas, chunki tarjimasi
			// yo'q tilni ko'rsatish Google'da xato hisoblanadi.
			languages: Object.fromEntries(
				problem.available_langs.map((lang) => [lang, `${path}?lang=${lang}`]),
			),
		},
		openGraph: { title: problem.statement.title, type: "article" },
	};
}

export default async function ProblemPage({ params }: PageProps) {
	const { slug } = await params;
	const problem = await loadProblem(slug);
	const { statement } = problem;

	return (
		<Container className="py-9">
			<article className="max-w-[760px]">
				<div className="flex items-center gap-2.5">
					<span className="font-mono text-[12.5px] text-fg-subtle">#{problem.id}</span>
					<Badge tone={difficultyTone(problem.difficulty)} size="sm">
						{difficultyLabel(problem.difficulty)}
					</Badge>
				</div>

				<h1 className="mt-2 text-[28px] font-bold">{statement.title}</h1>

				<p className="mt-2 font-mono text-[12.5px] text-fg-muted">
					Vaqt: {formatSeconds(problem.time_limit_ms)} · Xotira:{" "}
					{formatMemory(problem.memory_limit_kb)}
				</p>

				{problem.topics.length > 0 && (
					<ul className="mt-3 flex flex-wrap gap-1.5">
						{problem.topics.map((topic) => (
							<li key={topic.id}>
								<Badge size="sm">{pickName(topic.name, "uz")}</Badge>
							</li>
						))}
					</ul>
				)}

				{/*
				 * Shart hozircha oddiy matn sifatida chiqadi. Markdown + LaTeX
				 * render qilish alohida bosqich: remark/rehype zanjiri, KaTeX,
				 * va eng muhimi — setter yarim ishonchli, ya'ni sanitizatsiya
				 * qoidalarini qaror qilib olish kerak. Uni shu yerda shosha-pisha
				 * qilish stored XSS uchun ochiq yo'l qoldiradi.
				 */}
				<Section title="Shart">{statement.legend}</Section>
				{statement.input_format && (
					<Section title="Kirish formati">{statement.input_format}</Section>
				)}
				{statement.output_format && (
					<Section title="Chiqish formati">{statement.output_format}</Section>
				)}

				{problem.samples.length > 0 && (
					<section className="mt-7">
						<h2 className="text-lg font-bold">Namunalar</h2>
						<div className="mt-3 flex flex-col gap-3">
							{problem.samples.map((sample) => (
								<Panel key={sample.ordinal} className="grid sm:grid-cols-2">
									<Sample label="Kirish" value={sample.input} />
									<Sample
										label="Chiqish"
										value={sample.expected_output}
										className="border-t border-border-default sm:border-t-0 sm:border-l"
									/>
								</Panel>
							))}
						</div>
					</section>
				)}

				{statement.notes && <Section title="Izoh">{statement.notes}</Section>}
			</article>
		</Container>
	);
}

function Section({ title, children }: { title: string; children: string }) {
	return (
		<section className="mt-7">
			<h2 className="text-lg font-bold">{title}</h2>
			{/* `whitespace-pre-wrap`: shartdagi satr ko'chirishlari ma'noli. */}
			<p className="mt-2 whitespace-pre-wrap text-[15.5px] text-fg-secondary">
				{children}
			</p>
		</section>
	);
}

function Sample({
	label,
	value,
	className,
}: {
	label: string;
	value: string;
	className?: string;
}) {
	return (
		<div className={className}>
			<p className="border-b border-border-default bg-surface-subtle px-4 py-2 text-[11px] font-bold tracking-wide text-fg-subtle">
				{label}
			</p>
			<pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed">
				{value}
			</pre>
		</div>
	);
}

/*
 * Bu ikkitasi `problem-catalog` dagi map'larning egizagi. Ular hozir
 * takrorlanmoqda — ATAYLAB emas, va keyingi bosqichda `packages/ui` yoki
 * umumiy `problem` feature'iga chiqariladi. Uchinchi joyda kerak bo'lishi
 * — chiqarish uchun trigger.
 */
function difficultyLabel(difficulty: ProblemDetailDto["difficulty"]): string {
	return { easy: "Oson", medium: "O'rta", hard: "Qiyin" }[difficulty];
}

function difficultyTone(
	difficulty: ProblemDetailDto["difficulty"],
): "success" | "warning" | "danger" {
	return ({ easy: "success", medium: "warning", hard: "danger" } as const)[difficulty];
}

function summarize(legend: string): string {
	const flat = legend.replace(/\s+/g, " ").trim();
	return flat.length > 155 ? `${flat.slice(0, 152)}…` : flat;
}
