import type { BadgeProps } from "@binary/ui";
import type { SubmissionDto, Verdict } from "@binary/api";

/*
 * Verdikt → rang. To'liq `Record`, `default` shoxi bilan `switch` emas:
 * backend yangi verdikt qo'shsa (masalan `idleness_limit_exceeded`) bu
 * kompilyatsiyada ko'rinadi. Yorliqlar esa tarjima fayllarida, chunki
 * ular to'rt tilda boshqa-boshqa.
 *
 * `time_limit_exceeded` va `memory_limit_exceeded` SARIQ, qizil emas —
 * ataylab. Ular "yechim ishlaydi, lekin sekin" degani, ya'ni to'g'ri
 * yo'ldasan; `wrong_answer` esa "mantiq xato" degani. Rang shu farqni
 * ko'rsatishi kerak, aks holda foydalanuvchi ikkisini bir xil og'irlikda
 * qabul qiladi.
 */
const VERDICT_TONE: Record<Verdict, NonNullable<BadgeProps["tone"]>> = {
	accepted: "success",
	wrong_answer: "danger",
	time_limit_exceeded: "warning",
	memory_limit_exceeded: "warning",
	runtime_error: "danger",
	compile_error: "danger",
	output_limit_exceeded: "warning",
};

export function verdictTone(verdict: Verdict): NonNullable<BadgeProps["tone"]> {
	return VERDICT_TONE[verdict];
}

/**
 * Yechim hali tekshirilyaptimi.
 *
 * `is_final` ni o'qiydi, `status !== "done"` ni tekshirmaydi:
 * `internal_error` ham yakuniy holat, va `status` ro'yxati kelajakda
 * o'sishi mumkin. Backend bu maydonni aynan shu maqsadda beradi.
 */
export function isPending(submission: SubmissionDto): boolean {
	return !submission.is_final;
}
