"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cpp } from "@codemirror/lang-cpp";
import { go } from "@codemirror/lang-go";
import { python } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";
import { editorTheme } from "./editor-theme";

/**
 * CodeMirror brauzerni talab qiladi (DOM, `window`), shuning uchun
 * `ssr: false`. Usiz Next uni serverda render qilishga urinadi va
 * sahifa yiqiladi.
 *
 * Yon foydasi: muharrir alohida chunk bo'lib, faqat masala sahifasi
 * ochilganda yuklanadi — katalog va bosh sahifa uni olib yurmaydi.
 */
const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
	ssr: false,
	loading: () => <div className="h-full animate-pulse rounded-card bg-surface-subtle" />,
});

/**
 * Til kodi → sintaksis kengaytmasi.
 *
 * Kalitlar backenddagi `languages.code` bilan bir xil (`py3`, `cpp17`,
 * `go`). Noma'lum til uchun kengaytma qo'shilmaydi — muharrir oddiy matn
 * rejimida ishlaydi. Bu ataylab: yangi til qo'shilganda sayt sinmaydi,
 * shunchaki bo'yalmagan bo'lib qoladi.
 */
const LANGUAGE_EXTENSIONS: Record<string, () => Extension> = {
	py3: python,
	cpp17: cpp,
	go: go,
};

export function CodeEditor({
	value,
	onChange,
	language,
	disabled,
}: {
	value: string;
	onChange: (next: string) => void;
	language: string;
	disabled?: boolean;
}) {
	const extensions = useMemo(() => {
		const build = LANGUAGE_EXTENSIONS[language];
		return build ? [build()] : [];
	}, [language]);

	return (
		<div className="h-full overflow-hidden rounded-card border border-border-strong bg-surface">
			<CodeMirror
				value={value}
				onChange={onChange}
				extensions={extensions}
				editable={!disabled}
				// O'z mavzumiz — tokenlarga bog'langan, temalar bilan almashadi.
				theme={editorTheme}
				height="100%"
				className="h-full text-[13px]"
				basicSetup={{
					lineNumbers: true,
					foldGutter: false,
					// Avtomatik to'ldirish O'CHIRILGAN: u musobaqa kodida
					// ko'proq xalaqit beradi (ochiladigan ro'yxat Enter'ni
					// tutib qoladi), va bizda til serverlari ham yo'q, ya'ni
					// takliflar baribir faqat kalit so'zlar bo'lardi.
					autocompletion: false,
					highlightActiveLine: true,
					highlightActiveLineGutter: true,
					bracketMatching: true,
					closeBrackets: true,
				}}
				// Tab bilan chekinish. Usiz Tab fokusni keyingi elementga
				// o'tkazadi — kod yozayotgan odam uchun bu muharrirdan chiqib
				// ketish degani. Escape bosib chiqish mumkin bo'lgani uchun
				// klaviatura bilan yuruvchi foydalanuvchi qamalib qolmaydi.
				indentWithTab
			/>
		</div>
	);
}
