import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { leaderboardApi } from "@binary/api";
import { Container } from "@binary/ui";
import { LeaderboardTable, toLeaderboardRow } from "@/features/leaderboard";
import { buildAlternates } from "@/shared/i18n/alternates";
import type { Locale } from "@/shared/i18n/locales";

export const revalidate = 60;

interface PageProps {
	params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "leaderboard" });

	return {
		title: t("title"),
		description: t("metaDescription"),
		alternates: buildAlternates({ pathname: "/reyting" }, { canonicalLocale: locale }),
	};
}

export default async function LeaderboardPage({ params }: PageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	const t = await getTranslations("leaderboard");
	const leaderboard = await leaderboardApi.getLeaderboard(
		{ perPage: 100 },
		{ revalidate },
	);
	const rows = leaderboard.users.map(toLeaderboardRow);

	return (
		<Container className="py-9">
			<h1 className="text-[30px] font-bold">{t("title")}</h1>
			<div className="mt-7">
				<LeaderboardTable rows={rows} />
			</div>
		</Container>
	);
}
