import type { SubjectDto } from "@binary/api";
import { Link } from "@/i18n/navigation";
import { pickName } from "@/features/problem-catalog";

/**
 * Fanlar bo'yicha almashtirgich.
 *
 * `<select>` emas, havolalar: fanlar ikkitagina va ular sahifaning
 * asosiy o'qi. Har biri o'z manziliga ega bo'lishi ham kerak —
 * "algoritmlar yo'l xaritasi" ni havola qilib yuborish mumkin bo'lsin.
 */
export function SubjectTabs({
	subjects,
	current,
	apiLang,
}: {
	subjects: SubjectDto[];
	current: string;
	apiLang: string;
}) {
	return (
		<div className="mt-6 flex flex-wrap gap-2">
			{subjects.map((subject) => (
				<Link
					key={subject.id}
					href={{ pathname: "/yol-xaritasi", query: { fan: subject.slug } }}
					data-active={subject.slug === current}
					className="rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-fg-muted data-[active=true]:border-fg data-[active=true]:bg-fg data-[active=true]:text-fg-inverted"
				>
					{pickName(subject.name, apiLang)}
				</Link>
			))}
		</div>
	);
}
