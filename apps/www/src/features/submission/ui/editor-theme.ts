import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/*
 * Muharrir mavzusi — BITTA, hamma temalar uchun.
 *
 * Ranglar hex emas, `var(--binary-…)`: CodeMirror ularni oddiy CSS
 * qoidasiga aylantiradi, ya'ni `data-theme` almashganda muharrir ham
 * brauzerning o'zi tomonidan qayta bo'yaladi — React qayta render
 * qilmaydi va har tema uchun alohida kengaytma kerak bo'lmaydi.
 */
const chrome = EditorView.theme({
	"&": {
		color: "var(--binary-fg)",
		backgroundColor: "var(--binary-surface)",
	},
	".cm-content": { caretColor: "var(--binary-editor-cursor)" },
	".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--binary-editor-cursor)" },
	"&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
		{ backgroundColor: "var(--binary-editor-selection)" },
	".cm-activeLine": { backgroundColor: "var(--binary-editor-active-line)" },
	".cm-gutters": {
		backgroundColor: "var(--binary-surface)",
		color: "var(--binary-fg-subtle)",
		border: "none",
	},
	".cm-activeLineGutter": {
		backgroundColor: "var(--binary-editor-active-line)",
		color: "var(--binary-fg-secondary)",
	},
	"&.cm-focused .cm-matchingBracket": {
		backgroundColor: "var(--binary-editor-selection)",
		outline: "1px solid var(--binary-border-hover)",
	},
	"&.cm-focused .cm-nonmatchingBracket": { color: "var(--binary-danger)" },
	".cm-searchMatch": { backgroundColor: "var(--binary-warning-tint)" },
});

const highlight = HighlightStyle.define([
	{ tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.definitionKeyword], color: "var(--binary-syntax-keyword)" },
	{ tag: [t.string, t.special(t.string), t.regexp, t.character], color: "var(--binary-syntax-string)" },
	{ tag: [t.number, t.bool, t.null, t.atom], color: "var(--binary-syntax-number)" },
	{ tag: [t.comment, t.lineComment, t.blockComment], color: "var(--binary-syntax-comment)", fontStyle: "italic" },
	{ tag: [t.function(t.variableName), t.function(t.propertyName), t.macroName], color: "var(--binary-syntax-function)" },
	{ tag: [t.typeName, t.className, t.namespace, t.standard(t.typeName)], color: "var(--binary-syntax-type)" },
	{ tag: [t.propertyName, t.attributeName], color: "var(--binary-syntax-property)" },
	{ tag: [t.operator, t.punctuation, t.processingInstruction], color: "var(--binary-syntax-operator)" },
	{ tag: [t.variableName, t.definition(t.variableName)], color: "var(--binary-fg)" },
	{ tag: t.invalid, color: "var(--binary-danger)" },
]);

export const editorTheme = [chrome, syntaxHighlighting(highlight)];
