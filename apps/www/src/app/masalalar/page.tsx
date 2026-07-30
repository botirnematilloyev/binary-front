import type { Metadata } from "next";
import { problemsApi, taxonomyApi } from "@binary/api";
import { Container } from "@binary/ui";
import { ProblemTable, SubjectFilter, toProblemRow } from "@/features/problem-catalog";

export const metadata: Metadata = {
	title: "Masalalar",
	description:
		"Algoritmlar va matematikadan masalalar to'plami. Har biri uchun " +
		"vaqt va xotira limiti, namunali testlar va darhol tekshirish.",
};

/**
 * ISR: sahifa serverda bir marta yasaladi va 5 daqiqa keshda yashaydi.
 *
 * Nega SSR emas: katalog har so'rovda o'zgarmaydi, setter kuniga bir necha
 * masala qo'shadi. Nega SSG emas: yangi masala chiqqanda qayta build
 * kutish mumkin emas. ISR ikkisining o'rtasi va serverdagi 3 yadroni
 * ayaydi — bu mashinada judge ikkitasini olib turadi.
 */
export const revalidate = 300;

interface PageProps {
	searchParams: Promise<{ subject_id?: string; difficulty?: string; page?: string }>;
}

export default async function ProblemsPage({ searchParams }: PageProps) {
	const params = await searchParams;

	// URL'dan kelgan hamma narsa ishonchsiz: `?subject_id=abc` yoki
	// `?page=-5` bo'lishi mumkin. `undefined` ga aylantiramiz va API'ga
	// yubormaymiz — backend ham o'z tomonidan tekshiradi, lekin bu yerda
	// tozalash 400 xatosi o'rniga oddiy "filtr yo'q" holatini beradi.
	const subjectId = positiveInt(params.subject_id);
	const page = positiveInt(params.page) ?? 1;
	const lang = "uz";

	// Ikkita so'rov bir-biriga bog'liq emas, shuning uchun ketma-ket
	// kutmaymiz: `await` larni ketma-ket yozish sahifa yuklanishini
	// ikki barobar sekinlashtiradigan eng keng tarqalgan xato.
	const [list, subjects] = await Promise.all([
		problemsApi.listProblems({ page, subjectId, lang }, { revalidate }),
		taxonomyApi.listSubjects({ revalidate: 3600 }),
	]);

	const rows = list.problems.map(toProblemRow);

	return (
		<Container className="py-9">
			<h1 className="text-[26px] font-bold">Masalalar</h1>

			<div className="mt-6 grid gap-6 lg:grid-cols-[210px_1fr]">
				<aside>
					<SubjectFilter
						subjects={subjects.subjects}
						activeSubjectId={subjectId}
						lang={lang}
					/>
				</aside>
				<div>
					<ProblemTable rows={rows} />
				</div>
			</div>
		</Container>
	);
}

function positiveInt(raw: string | undefined): number | undefined {
	if (raw === undefined) return undefined;
	const value = Number(raw);
	return Number.isInteger(value) && value > 0 ? value : undefined;
}
