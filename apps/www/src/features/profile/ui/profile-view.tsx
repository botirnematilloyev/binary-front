"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
	authApi,
	problemsApi,
	profileApi,
	submissionsApi,
	type ActivityDto,
	type MeDto,
	type SessionDto,
	type StatsDto,
	type SubmissionDto,
} from "@binary/api";
import { withFreshToken } from "@binary/session";
import { Badge, Panel } from "@binary/ui";
import { Link } from "@/i18n/navigation";
import { monthName, type Locale } from "@/shared/i18n/locales";
import { ACTIVITY_DAYS, acceptanceRate, describeError, initials } from "../model";
import { Devices } from "./devices";
import { EditForm } from "./edit-form";
import { Heatmap } from "./heatmap";

interface Data {
	me: MeDto;
	stats: StatsDto;
	activity: ActivityDto;
	submissions: SubmissionDto[];
	sessions: SessionDto[];
	problemCount: number;
}

type State =
	| { phase: "loading" }
	| { phase: "ready"; data: Data }
	| { phase: "error"; message: string };

/**
 * Profil sahifasi.
 *
 * Butunlay client komponent, katalogdan farqli. Sabab: bu yerdagi
 * hamma narsa TOKENGA bog'liq va faqat egasiga ko'rinadi, ya'ni
 * serverda render qilishdan foyda yo'q — SEO qiymati nol, va sahifani
 * keshlab ham bo'lmaydi.
 */
export function ProfileView({ apiLang }: { apiLang: string }) {
	const t = useTranslations("profile");
	const tVerdict = useTranslations("verdict");
	const format = useFormatter();
	const locale = useLocale() as Locale;

	const [state, setState] = useState<State>({ phase: "loading" });
	const [editing, setEditing] = useState(false);

	const load = useCallback(async () => {
		setState({ phase: "loading" });
		try {
			// Oltita so'rov ham bir-biriga bog'liq emas — ketma-ket
			// kutilsa, sahifa olti barobar sekin ochilardi.
			//
			// `listProblems` faqat JAMI son uchun: "12 / 48" dagi
			// maxrajni backend statistikasi bilmaydi, chunki u
			// `submissions` ustidan hisoblanadi.
			const [me, stats, activity, submissions, sessions, problems] = await withFreshToken(
				async (token) =>
					Promise.all([
						authApi.getMe({ token }),
						submissionsApi.getStats({ token }),
						submissionsApi.getActivity(ACTIVITY_DAYS, { token }),
						submissionsApi.listSubmissions({ perPage: 10, lang: apiLang }, { token }),
						profileApi.listSessions({ token }),
						// Faqat MAXRAJ uchun: "12 / 48" dagi 48 ni yechimlar
						// statistikasi bilmaydi — u `submissions` ustidan
						// hisoblanadi, jami masalalar esa katalogda.
						// `per_page=1` — javob eng kichik bo'lsin.
						problemsApi.listProblems({ perPage: 1, lang: apiLang }),
					]),
			);

			setState({
				phase: "ready",
				data: {
					me,
					stats,
					activity,
					submissions: submissions.submissions,
					sessions: sessions.sessions,
					problemCount: problems.total,
				},
			});
		} catch (cause) {
			setState({ phase: "error", message: describeError(cause) });
		}
	}, [apiLang]);

	useEffect(() => {
		void load();
	}, [load]);

	if (state.phase === "loading") {
		return <Panel className="h-64 animate-pulse bg-surface-subtle" />;
	}

	if (state.phase === "error") {
		return (
			<Panel className="px-5 py-6">
				<p className="text-fg-secondary">{state.message}</p>
			</Panel>
		);
	}

	const { me, stats, activity, submissions, sessions, problemCount } = state.data;
	const rate = acceptanceRate(stats);

	return (
		<div className="flex flex-col gap-6">
			{/* ── Sarlavha ── */}
			<div className="flex flex-wrap items-center gap-5">
				<span
					aria-hidden
					className="flex size-[72px] items-center justify-center rounded-full bg-fg font-display text-[24px] font-bold text-fg-inverted"
				>
					{initials(me.full_name, me.username)}
				</span>

				<div className="flex-1">
					<h1 className="text-[24px] font-bold">{me.full_name ?? me.username}</h1>
					<p className="mt-1 font-mono text-[13px] text-fg-muted">
						@{me.username} ·{" "}
						{/*
						 * Sana `format.dateTime` bilan emas: `uz` da u
						 * "2026 M07" berardi. `monthName` faqat o'zbekcha
						 * uchun o'z jadvalidan oladi, qolganida `Intl`.
						 */}
						{t("memberSince", {
							date: `${monthName(locale, new Date(me.created_at * 1000), "long")} ${new Date(
								me.created_at * 1000,
							).getUTCFullYear()}`,
						})}
					</p>
				</div>

				{!editing && (
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="cursor-pointer rounded-control border border-border-strong px-4 py-2 text-[13.5px] font-semibold transition-colors hover:border-border-hover"
					>
						{t("edit")}
					</button>
				)}
			</div>

			{editing && (
				<Panel className="p-5">
					<EditForm
						me={me}
						apiLang={apiLang}
						onCancel={() => setEditing(false)}
						onSaved={(next) => {
							setEditing(false);
							setState({ phase: "ready", data: { ...state.data, me: next } });
						}}
					/>
				</Panel>
			)}

			{/*
			 * Ikki ustun: chapda vaqt bo'yicha o'sadigan narsalar
			 * (kalendar, urinishlar tarixi), o'ngda esa qisqa
			 * ma'lumotlar.
			 *
			 * Bir ustunli variant butun kenglikka cho'zilgan panellar
			 * yasardi va ular ichida faqat chap chekka to'lardi —
			 * o'rtada kanyon qolardi. Ustunlarni bo'lish o'sha bo'sh
			 * joyni yo'q qiladi, panellarni toraytirmasdan.
			 *
			 * `lg:` dan pastda bitta ustun: 320px yon ustun telefonda
			 * baribir sig'maydi.
			 */}
			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
				<div className="flex min-w-0 flex-col gap-6">
					<Panel className="p-5">
						<Heatmap activity={activity} />
					</Panel>

					<Panel className="p-5">
						<p className="text-[11px] font-bold tracking-wide text-fg-subtle">
							{t("recentTitle")}
						</p>

						{submissions.length === 0 ? (
							<p className="mt-3 text-sm text-fg-muted">{t("recentEmpty")}</p>
						) : (
							<ul className="mt-3 flex flex-col">
								{submissions.map((submission) => (
									<li
										key={submission.id}
										/*
										 * Aniq ustunlar, `ml-auto` emas: oxirgi
										 * elementni chekkaga surib yuborish
										 * qatorni ikkiga bo'lib, o'rtasida bo'sh
										 * joy qoldirardi. Sarlavha `1fr` —
										 * qolganlari o'z kengligini oladi.
										 */
										className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 border-b border-border-default py-2 text-sm last:border-0"
									>
										{submission.problem ? (
											<Link
												href={{
													pathname: "/masalalar/[slug]",
													params: { slug: submission.problem.slug },
												}}
												className="truncate font-semibold hover:text-accent"
											>
												{submission.problem.title}
											</Link>
										) : (
											/*
											 * Masala o'chirilgan bo'lsa nom kelmaydi —
											 * yechim tarixi esa qoladi. Havola ham
											 * bo'lmaydi, chunki borish uchun joy yo'q.
											 */
											<span className="truncate font-semibold text-fg-muted">
												{t("deletedProblem")}
											</span>
										)}

										{submission.verdict !== null && (
											<Badge
												tone={submission.verdict === "accepted" ? "success" : "danger"}
												size="sm"
											>
												{tVerdict(submission.verdict)}
											</Badge>
										)}

										<span className="font-mono text-[12px] whitespace-nowrap text-fg-subtle">
											{submission.language.code} ·{" "}
											{format.dateTime(new Date(submission.created_at * 1000), {
												day: "2-digit",
												month: "2-digit",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</span>
									</li>
								))}
							</ul>
						)}
					</Panel>
				</div>

				<aside className="flex min-w-0 flex-col gap-6">
					{/* Ko'rsatkichlar 2×2: tor ustunda to'rttasi bir
					    qatorga sig'maydi va raqamlar qisilib ketardi. */}
					<div className="grid grid-cols-2 gap-3">
						<Tile value={`${stats.solved} / ${problemCount}`} label={t("solved")} accent />
						<Tile value={stats.attempted} label={t("attempted")} />
						<Tile value={stats.total} label={t("submissions")} />
						{/*
						 * Yechim bo'lmasa foiz o'rniga chiziqcha: "0%" hech
						 * narsa yubormagan odamni yomon ko'rsatardi.
						 */}
						<Tile value={rate === null ? "—" : `${rate}%`} label={t("acceptance")} />
					</div>

					{stats.by_language.length > 0 && (
						<Panel className="p-5">
							<p className="text-[11px] font-bold tracking-wide text-fg-subtle">
								{t("languagesTitle")}
							</p>
							<ul className="mt-3 flex flex-col gap-2">
								{stats.by_language.map((item) => (
									<li key={item.code} className="flex items-baseline justify-between gap-3 text-sm">
										<span className="truncate font-semibold">{item.name}</span>
										<span className="font-mono text-[12.5px] whitespace-nowrap">
											<span className="text-success">✓ {item.accepted}</span>
											<span className="text-fg-subtle"> / {item.total}</span>
										</span>
									</li>
								))}
							</ul>
						</Panel>
					)}

					<Panel className="p-5">
						<Devices sessions={sessions} onChanged={() => void load()} />
					</Panel>
				</aside>
			</div>
		</div>
	);
}

function Tile({
	value,
	label,
	accent = false,
}: {
	value: number | string;
	label: string;
	accent?: boolean;
}) {
	return (
		<Panel className="px-5 py-4">
			<p className={`font-mono text-[22px] font-semibold ${accent ? "text-accent" : ""}`}>
				{value}
			</p>
			<p className="mt-0.5 text-[12.5px] text-fg-muted">{label}</p>
		</Panel>
	);
}
