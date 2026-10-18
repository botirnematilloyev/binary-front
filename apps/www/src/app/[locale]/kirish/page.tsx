import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container, Panel } from "@binary/ui";
import { LoginForm } from "@/features/auth";
import { buildAlternates } from "@/shared/i18n/alternates";
import type { Locale } from "@/shared/i18n/locales";

const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT ?? "binary_uz_admin_bot";

interface PageProps {
	params: Promise<{ locale: Locale }>;
	searchParams: Promise<{ next?: string; code?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "auth" });

	return {
		title: t("title"),
		description: t("metaDescription"),
		alternates: buildAlternates({ pathname: "/kirish" }, { canonicalLocale: locale }),
		// Login sahifasi qidiruvda kerak emas: u foydalanuvchi izlaydigan
		// kontent emas, va indekslanishi crawl budjetini bekorga yeydi.
		// `follow` qoldirildi — sahifadagi havolalar baribir yurib chiqilsin.
		robots: { index: false, follow: true },
	};
}

export default async function LoginPage({ params, searchParams }: PageProps) {
	const { locale } = await params;
	setRequestLocale(locale);

	// `code` — botdagi «Kirish» tugmasi shu yerga `/login?code=…` orqali
	// olib keladi (next.config.ts dagi redirect).
	const { next, code } = await searchParams;
	const t = await getTranslations("auth");

	return (
		<Container className="py-14">
			<div className="mx-auto max-w-[460px]">
				<h1 className="text-[28px] font-bold">{t("title")}</h1>
				<p className="mt-2 text-fg-secondary">{t("lead")}</p>

				<Panel className="mt-6 p-5">
					<ol className="flex flex-col gap-2 text-sm text-fg-secondary">
						{/*
						 * Qadamlarda `<code>/login</code>` bor, ya'ni matn ichida
						 * teg. `t.rich` shuning uchun: HTML'ni satr sifatida
						 * qo'shib `dangerouslySetInnerHTML` bilan chiqarish
						 * tarjima fayllarini XSS vektoriga aylantirardi.
						 */}
						<Step index={1}>{t.rich("step1", { code: codeTag })}</Step>
						<Step index={2}>{t("step2")}</Step>
						<Step index={3}>{t("step3")}</Step>
					</ol>

					<a
						href={`https://t.me/${botUsername}`}
						target="_blank"
						// `noopener` shart: usiz ochilgan sahifa `window.opener`
						// orqali bizning sahifani boshqa manzilga yo'naltira oladi.
						rel="noopener noreferrer"
						className="mt-4 inline-flex items-center gap-2 rounded-control border border-border-strong px-3.5 py-2 text-sm font-semibold transition-colors hover:border-border-hover"
					>
						{t("openBot")} ↗
					</a>

					<LoginForm next={next} initialCode={code} />
				</Panel>
			</div>
		</Container>
	);
}

function codeTag(chunks: React.ReactNode) {
	return (
		<code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[13px]">
			{chunks}
		</code>
	);
}

function Step({ index, children }: { index: number; children: React.ReactNode }) {
	return (
		<li className="flex gap-2.5">
			<span
				aria-hidden
				className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[11px] font-bold text-fg-muted"
			>
				{index}
			</span>
			<span>{children}</span>
		</li>
	);
}
