import { getTranslations } from "next-intl/server";
import { buttonClass, Container } from "@binary/ui";
import { Link } from "@/i18n/navigation";

const binaryMatrix = [
	"10001011111010001",
	"10001010001010001",
	"10001010001010001",
	"11111010001011111",
	"00001010001000001",
	"00001010001000001",
	"00001011111000001",
];
const hintKeys = ["checkUrl", "publishedOnly"] as const;

export default async function NotFound() {
	const t = await getTranslations("notFound");

	return (
		<Container className="py-16 sm:py-24">
			<section className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
				<div className="mx-auto w-full max-w-[480px]" aria-hidden="true">
					<div className="rounded-card border border-border-default bg-surface p-4 sm:p-6">
						<div className="grid gap-1.5 sm:gap-2">
							{binaryMatrix.map((row, rowIndex) => (
								<div
									key={rowIndex}
									className="grid gap-1.5 sm:gap-2"
									style={{
										gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
									}}
								>
									{row.split("").map((bit, columnIndex) => (
										<span
											key={`${rowIndex}-${columnIndex}`}
											className={`flex aspect-square items-center justify-center rounded-[5px] font-mono text-[10px] font-bold leading-none sm:rounded-[7px] sm:text-xs ${
												bit === "1"
													? "bg-fg text-fg-inverted"
													: "bg-surface-subtle text-fg-subtle/40"
											}`}
										>
											{bit}
										</span>
									))}
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="text-center lg:text-left">
					<p className="font-mono text-sm font-bold text-fg-subtle">
						{t("eyebrow")}
					</p>
					<h1 className="mt-3 text-4xl font-bold leading-tight text-fg sm:text-5xl">
						{t("title")}
					</h1>
					<p className="mx-auto mt-4 max-w-xl text-base leading-7 text-fg-muted lg:mx-0 lg:text-lg">
						{t("hint")}
					</p>

					<div className="mx-auto mt-6 grid max-w-xl gap-2 text-left lg:mx-0">
						{hintKeys.map((key) => (
							<div
								key={key}
								className="flex items-start gap-3 rounded-control border border-border-default bg-surface-subtle px-3 py-2.5 text-sm leading-6 text-fg-secondary"
							>
								<span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
								<span>{t(key)}</span>
							</div>
						))}
					</div>

					<div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
						<Link href="/masalalar" className={buttonClass({ size: "lg" })}>
							{t("cta")}
						</Link>
						<Link
							href="/yol-xaritasi"
							className={buttonClass({ variant: "outline", size: "lg" })}
						>
							{t("roadmapCta")}
						</Link>
					</div>
				</div>
			</section>
		</Container>
	);
}
