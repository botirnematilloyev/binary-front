import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
	ApiError,
	problemsApi,
	submissionsApi,
	type ProblemDetailDto,
} from "@binary/api";
import { Badge, Container, Panel } from "@binary/ui";
import { difficultyTone, pickName } from "@/features/problem-catalog";
import { SubmitPanel } from "@/features/submission";
import { formatMemory, formatSeconds } from "@/shared/format";
import { buildAlternates } from "@/shared/i18n/alternates";
import { apiLangOf, segmentsFromApiLangs, type Locale } from "@/shared/i18n/locales";

export const revalidate = 300;

interface PageProps {
	params: Promise<{ locale: Locale; slug: string }>;
}

/**
 * Masalani bir marta oladi va natijani sahifa bilan BO'LISHADI.
 *
 * `generateMetadata` va sahifa komponenti ikkisi ham ma'lumotga muhtoj.
 * React `fetch` ni bir xil argumentlar uchun dedup qiladi, ya'ni bu
 * ikkita chaqiruv bitta HTTP so'rovga aylanadi. Shuning uchun "props
 * orqali uzatish" kabi qo'l bilan keshlash kerak emas.
 */
async function loadProblem(slug: string, locale: Locale): Promise<ProblemDetailDto> {
	try {
		return await problemsApi.getProblem(slug, apiLangOf(locale), { revalidate });
	} catch (error) {
		// Backend nashr qilinmagan masala uchun ham 404 qaytaradi, 403 emas —
		// aks holda mavjud emasligini tekshirib slug'larni sanab chiqish
		// mumkin bo'lardi. Frontend shu qarorni buzmasligi kerak.
		if (error instanceof ApiError && error.status === 404) notFound();
		throw error;
	}
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale, slug } = await params;
	const problem = await loadProblem(slug, locale);

	// Backend `statement.lang` da matn HAQIQATAN qaysi tilda qaytganini
	// aytadi — so'ralgan til emas. Tarjima bo'lmasa u `uz` ga tushadi, va
	// kanonik manzil ayni shu tilga ishora qilishi kerak: aks holda
	// `/ru/masalalar/x` va `/masalalar/x` bir xil matn bilan ikkita
	// o'z-o'zini kanonik deb e'lon qiluvchi URL bo'lib qoladi.
	const contentLocale = segmentsFromApiLangs([problem.statement.lang])[0] ?? "uz";

	return {
		title: problem.statement.title,
		description: summarize(problem.statement.legend),
		alternates: buildAlternates(
			{ pathname: "/masalalar/[slug]", params: { slug } },
			{
				canonicalLocale: contentLocale,
				availableLocales: segmentsFromApiLangs(problem.available_langs),
			},
		),
		openGraph: { title: problem.statement.title, type: "article" },
	};
}

export default async function ProblemPage({ params }: PageProps) {
	const { locale, slug } = await params;
	setRequestLocale(locale);

	// Masala va tillar ro'yxati bir-biriga bog'liq emas — parallel olinadi.
	// Tillar SERVERDA olinadi va `SubmitPanel` ga prop bo'lib beriladi:
	// shunda brauzer qo'shimcha so'rov yubormaydi. `revalidate` uzoq,
	// chunki til ro'yxati deyarli o'zgarmaydi (migratsiya bilan keladi).
	const [problem, languages] = await Promise.all([
		loadProblem(slug, locale),
		submissionsApi.listLanguages({ revalidate: 3600 }),
	]);
	const { statement } = problem;

	const t = await getTranslations("problem");
	const tDifficulty = await getTranslations("difficulty");

	return (
		<Container className="py-9">
			<article className="max-w-[760px]">
				<div className="flex items-center gap-2.5">
					<span className="font-mono text-[12.5px] text-fg-subtle">#{problem.id}</span>
					<Badge tone={difficultyTone(problem.difficulty)} size="sm">
						{tDifficulty(problem.difficulty)}
					</Badge>
				</div>

				<h1 className="mt-2 text-[28px] font-bold">{statement.title}</h1>

				<p className="mt-2 font-mono text-[12.5px] text-fg-muted">
					{t("time")}: {formatSeconds(problem.time_limit_ms)} · {t("memory")}:{" "}
					{formatMemory(problem.memory_limit_kb)}
				</p>

				{problem.topics.length > 0 && (
					<ul className="mt-3 flex flex-wrap gap-1.5">
						{problem.topics.map((topic) => (
							<li key={topic.id}>
								<Badge size="sm">{pickName(topic.name, apiLangOf(locale))}</Badge>
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
				<Section title={t("statement")}>{statement.legend}</Section>
				{statement.input_format && (
					<Section title={t("inputFormat")}>{statement.input_format}</Section>
				)}
				{statement.output_format && (
					<Section title={t("outputFormat")}>{statement.output_format}</Section>
				)}

				{problem.samples.length > 0 && (
					<section className="mt-7">
						<h2 className="text-lg font-bold">{t("samples")}</h2>
						<div className="mt-3 flex flex-col gap-3">
							{problem.samples.map((sample) => (
								<Panel key={sample.ordinal} className="grid sm:grid-cols-2">
									<Sample label={t("sampleInput")} value={sample.input} />
									<Sample
										label={t("sampleOutput")}
										value={sample.expected_output}
										className="border-t border-border-default sm:border-t-0 sm:border-l"
									/>
								</Panel>
							))}
						</div>
					</section>
				)}

				{statement.notes && <Section title={t("notes")}>{statement.notes}</Section>}

				<SubmitPanel slug={slug} languages={languages.languages} />
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

function summarize(legend: string): string {
	const flat = legend.replace(/\s+/g, " ").trim();
	return flat.length > 155 ? `${flat.slice(0, 152)}…` : flat;
}
