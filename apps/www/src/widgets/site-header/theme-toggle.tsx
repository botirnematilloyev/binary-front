"use client";

import { useTranslations } from "next-intl";
import { ThemeSwitcher } from "@binary/ui";

/** `ThemeSwitcher` ning tarjima qilingan o'rami — sarlavha server komponenti. */
export function ThemeToggle() {
	const t = useTranslations("theme");
	return <ThemeSwitcher label={t("label")} names={{ light: t("light") }} />;
}
