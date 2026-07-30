import { getTranslations } from "next-intl/server";
import { buttonClass, Container } from "@binary/ui";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
	const t = await getTranslations("notFound");

	return (
		<Container className="py-24 text-center">
			<p className="font-mono text-sm text-fg-subtle">404</p>
			<h1 className="mt-2 text-[28px] font-bold">{t("title")}</h1>
			<p className="mx-auto mt-2 max-w-[440px] text-fg-muted">{t("hint")}</p>
			<div className="mt-6">
				<Link href="/masalalar" className={buttonClass({ variant: "outline" })}>
					{t("cta")}
				</Link>
			</div>
		</Container>
	);
}
