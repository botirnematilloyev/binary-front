import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { cn } from "./cn";

// KaTeX o'z CSS'isiz formulalarni buzib ko'rsatadi (belgilar ustma-ust
// tushadi). Import shu yerda — komponent o'z-o'zicha to'liq bo'lishi
// uchun, ilova uni alohida eslab qolishi kerak emas.
import "katex/dist/katex.min.css";

/**
 * Xavfsizlik modeli — bu faylning eng muhim qismi.
 *
 * Shartni SETTER yozadi (`role = 2`), matn esa hamma foydalanuvchiga
 * ko'rsatiladi. Ya'ni bu klassik **stored XSS** yuzasi, va setter faqat
 * yarim ishonchli: u xodim emas, kontent muallifi.
 *
 * Uch qatlamli himoya:
 *
 * 1. **Xom HTML umuman qo'llab-quvvatlanmaydi.** `rehype-raw` ATAYLAB
 *    ulanmagan, ya'ni `react-markdown` matndagi `<script>` yoki
 *    `<img onerror=...>` ni teg sifatida emas, oddiy MATN sifatida
 *    ko'rsatadi. Asosiy himoya shu — qolgan ikkitasi zaxira.
 *
 * 2. **`rehype-sanitize`** — hosil bo'lgan daraxtni oq ro'yxat bo'yicha
 *    tozalaydi. Birinchi qatlam yetarli bo'lishi kerak, lekin bir kun
 *    kimdir `rehype-raw` qo'shsa (chunki "jadval kerak edi"), bu qatlam
 *    hali ham turadi.
 *
 * 3. **KaTeX `trust: false`** (standart) — `\href` va `\htmlData` kabi
 *    HTML chiqaradigan buyruqlar o'chirilgan. Usiz LaTeX orqali havola
 *    kiritish mumkin bo'lardi.
 */
const schema = {
	...defaultSchema,
	attributes: {
		...defaultSchema.attributes,
		/*
		 * `remark-math` formulalarni `class="math math-inline"` bilan
		 * belgilaydi va `rehype-katex` ularni AYNAN shu sinf bo'yicha
		 * topadi. Sanitize sinfni o'chirsa, formulalar jimgina oddiy
		 * matnga aylanadi — buzilmaydi, shunchaki noto'g'ri ko'rinadi.
		 */
		span: [...(defaultSchema.attributes?.span ?? []), ["className", "math", "math-inline"]],
		div: [...(defaultSchema.attributes?.div ?? []), ["className", "math", "math-display"]],
		// ```python kabi bloklar uchun.
		code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-./]],
	},
};

/*
 * Tartib muhim: `rehype-sanitize` `rehype-katex` DAN OLDIN.
 *
 * KaTeX o'nlab `<span>` va MathML chiqaradi; agar sanitize undan keyin
 * ishlasa, u shu chiqishni buzib tashlaydi va formulalar ko'rinmay
 * qoladi. KaTeX chiqishi esa bizning kodimiz tomonidan, tekshirilgan
 * matematik manbadan yasaladi — ya'ni ishonchli.
 */
const rehypePlugins = [
	[rehypeSanitize, schema],
	// `throwOnError: false` — setter noto'g'ri LaTeX yozsa butun sahifa
	// yiqilmasin. Xato formula qizil rangda o'zini ko'rsatadi, bu esa
	// setterga darhol qayerda xato qilganini aytadi.
	[rehypeKatex, { throwOnError: false }],
] as const;

/**
 * Element uslublari — global CSS emas, komponent ichida.
 *
 * `@tailwindcss/typography` qo'shish mumkin edi, lekin uning standart
 * palitrasi bizning issiq qog'oz temamizga mos kelmaydi va uni qayta
 * bo'yash plagin qo'shishdan uzunroq chiqardi.
 */
const components: Components = {
	h1: ({ children }) => <h2 className="mt-6 text-xl font-bold">{children}</h2>,
	h2: ({ children }) => <h3 className="mt-6 text-lg font-bold">{children}</h3>,
	h3: ({ children }) => <h4 className="mt-5 font-bold">{children}</h4>,
	p: ({ children }) => <p className="mt-3 leading-relaxed">{children}</p>,
	ul: ({ children }) => <ul className="mt-3 list-disc pl-5">{children}</ul>,
	ol: ({ children }) => <ol className="mt-3 list-decimal pl-5">{children}</ol>,
	li: ({ children }) => <li className="mt-1">{children}</li>,
	strong: ({ children }) => <strong className="font-bold text-fg">{children}</strong>,
	blockquote: ({ children }) => (
		<blockquote className="mt-3 border-l-2 border-border-strong pl-4 text-fg-muted">
			{children}
		</blockquote>
	),
	hr: () => <hr className="mt-6 border-border-default" />,
	a: ({ href, children }) => (
		// Tashqi havola — `noopener` shart: usiz ochilgan sahifa
		// `window.opener` orqali bizni boshqa manzilga yo'naltira oladi.
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer nofollow"
			className="text-accent underline underline-offset-2 hover:text-accent-hover"
		>
			{children}
		</a>
	),
	code: ({ className, children }) => {
		// `react-markdown` blok va satr ichidagi kodni bir xil `code`
		// elementi bilan beradi; farqni `language-*` sinfi ko'rsatadi.
		const isBlock = typeof className === "string" && className.startsWith("language-");
		if (isBlock) return <code className="font-mono text-[13px]">{children}</code>;
		return (
			<code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[13px]">
				{children}
			</code>
		);
	},
	pre: ({ children }) => (
		<pre className="mt-3 overflow-x-auto rounded-card border border-border-default bg-surface-subtle p-3">
			{children}
		</pre>
	),
	table: ({ children }) => (
		// Keng jadval sahifani gorizontal siljitmasligi kerak — o'z
		// konteyneri ichida siljiydi.
		<div className="mt-3 overflow-x-auto">
			<table className="w-full border-collapse text-sm">{children}</table>
		</div>
	),
	th: ({ children }) => (
		<th className="border border-border-default bg-surface-subtle px-3 py-1.5 text-left font-semibold">
			{children}
		</th>
	),
	td: ({ children }) => (
		<td className="border border-border-default px-3 py-1.5">{children}</td>
	),
	img: ({ src, alt }) => (
		// eslint-disable-next-line @next/next/no-img-element -- manba
		// setter yozgan markdown, ya'ni o'lchamlari oldindan noma'lum.
		<img src={typeof src === "string" ? src : ""} alt={alt ?? ""} className="mt-3 max-w-full rounded-card" />
	),
};

/**
 * Masala sharti va boshqa setter yozgan matnlar uchun render.
 *
 * Server komponentida ishlaydi: brauzerga `react-markdown` ham, KaTeX
 * ham YUBORILMAYDI — faqat tayyor HTML va KaTeX CSS'i. Bu SEO uchun ham
 * muhim, chunki qidiruv tizimi shartni to'liq ko'radi.
 */
export function Markdown({ children, className }: { children: string; className?: string }) {
	return (
		<div className={cn("text-[15.5px] text-fg-secondary", className)}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkMath]}
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- plagin
				// juftliklari uchun `unified` turlari `as const` bilan mos kelmaydi.
				rehypePlugins={rehypePlugins as any}
				components={components}
			>
				{children}
			</ReactMarkdown>
		</div>
	);
}
