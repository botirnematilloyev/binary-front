"use client";

import { useRef, useSyncExternalStore } from "react";
import { isThemeName, THEME_STORAGE_KEY, THEMES, type ThemeName } from "@binary/tokens";
import { cn } from "./cn";

/*
 * Joriy tema React holatida EMAS, `<html data-theme>` da yashaydi — uni
 * React'dan oldin `themeInitScript` qo'yadi. Komponent shu atributga
 * obuna bo'ladi: aks holda ikki haqiqat manbai paydo bo'lardi.
 */
const EVENT = "binary:theme-change";

function subscribe(onChange: () => void) {
	// `storage` — boshqa tabda tema almashtirilganda shu tab ham ergashadi.
	const onStorage = (event: StorageEvent) => {
		if (event.key === THEME_STORAGE_KEY && isThemeName(event.newValue)) {
			document.documentElement.dataset.theme = event.newValue;
			onChange();
		}
	};
	window.addEventListener(EVENT, onChange);
	window.addEventListener("storage", onStorage);
	return () => {
		window.removeEventListener(EVENT, onChange);
		window.removeEventListener("storage", onStorage);
	};
}

function getSnapshot(): ThemeName | null {
	const value = document.documentElement.dataset.theme;
	return isThemeName(value) ? value : null;
}

// Server qaysi tema tanlanganini bilmaydi — belgi hydration'dan keyin chiqadi.
const getServerSnapshot = () => null;

function applyTheme(name: ThemeName) {
	document.documentElement.dataset.theme = name;
	try {
		localStorage.setItem(THEME_STORAGE_KEY, name);
	} catch {
		// Maxfiy rejim: tema shu sahifa uchun baribir almashadi.
	}
	window.dispatchEvent(new Event(EVENT));
}

/**
 * Tema tanlagich — har tema mini-ko'rinish bilan (muharrir eskizi).
 *
 * `<details>` — til tanlagich bilan bir xil sabab: ochish/yopish,
 * klaviatura va `Escape` brauzerning o'zida.
 */
export function ThemeSwitcher({
	label,
	names,
	className,
}: {
	/** Skrin rider uchun yorliq, masalan "Mavzu". */
	label: string;
	/** Tarjima qilinadigan nomlar (brend nomlari — Night Owl, Aura — o'zgarmaydi). */
	names?: Partial<Record<ThemeName, string>>;
	className?: string;
}) {
	const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	const ref = useRef<HTMLDetailsElement>(null);
	const current = THEMES.find((t) => t.name === active);

	return (
		<details ref={ref} className={cn("relative", className)}>
			<summary
				title={label}
				className="flex size-[34px] cursor-pointer list-none items-center justify-center rounded-pill border border-border-default text-fg-secondary transition-colors hover:border-border-hover [&::-webkit-details-marker]:hidden"
			>
				<span className="sr-only">{label}</span>
				{current?.dark ? <MoonIcon /> : <SunIcon />}
			</summary>
			<ul className="absolute right-0 top-11 z-50 flex w-[244px] flex-col gap-1 rounded-card border border-border-default bg-surface p-1.5 shadow-popover">
				{THEMES.map((theme) => {
					const selected = theme.name === active;
					return (
						<li key={theme.name}>
							<button
								type="button"
								aria-pressed={selected}
								onClick={() => {
									applyTheme(theme.name);
									ref.current?.removeAttribute("open");
								}}
								className={cn(
									"flex w-full cursor-pointer items-center gap-3 rounded-control p-1.5 text-left transition-colors hover:bg-surface-hover",
									selected && "bg-surface-muted",
								)}
							>
								<ThemePreview preview={theme.preview} />
								<span className="text-sm font-semibold text-fg">
									{names?.[theme.name] ?? theme.label}
								</span>
								{selected && (
									<span aria-hidden className="ml-auto pr-1.5 text-accent">
										✓
									</span>
								)}
							</button>
						</li>
					);
				})}
			</ul>
		</details>
	);
}

function ThemePreview({
	preview,
}: {
	preview: { canvas: string; line: string; muted: string; accent: string };
}) {
	// Ranglar inline style'da: Tailwind arbitrary qiymatlari statik
	// skanerlanadi, bu yerdagi qiymatlar esa ma'lumotdan keladi.
	const bar = (width: number, color: string, opacity = 1) => (
		<span className="h-[3px] rounded-full" style={{ width, background: color, opacity }} />
	);
	return (
		<span
			aria-hidden
			className="flex h-[38px] w-[58px] shrink-0 flex-col justify-center gap-[5px] rounded-[6px] border border-border-strong px-2"
			style={{ background: preview.canvas }}
		>
			{bar(40, preview.line, 0.85)}
			<span className="flex gap-1 rounded-[2px] p-[2px]" style={{ background: preview.muted }}>
				{bar(18, preview.line, 0.6)}
				{bar(14, preview.line, 0.6)}
			</span>
			<span className="flex items-center gap-1">
				{bar(12, preview.accent)}
				{bar(10, preview.line, 0.7)}
				<span className="h-[6px] w-[2px]" style={{ background: preview.line }} />
			</span>
		</span>
	);
}

function SunIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
		</svg>
	);
}

function MoonIcon() {
	return (
		<svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	);
}
