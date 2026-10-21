import type { SubmissionDto } from "@binary/api";
import { Badge } from "@binary/ui";
import { VERDICT } from "../model";

const STATUS_LABEL: Record<SubmissionDto["status"], string> = {
	queued: "Navbatda",
	running: "Tekshirilmoqda",
	done: "Tugadi",
	internal_error: "Tizim xatosi",
};

export function VerdictBadge({
	submission,
}: {
	submission: Pick<SubmissionDto, "status" | "verdict" | "failed_test">;
}) {
	if (submission.verdict) {
		const v = VERDICT[submission.verdict];
		return (
			<Badge tone={v.tone} size="sm">
				{v.label}
				{submission.failed_test !== null && submission.verdict !== "accepted" && (
					<span className="font-mono opacity-80">#{submission.failed_test}</span>
				)}
			</Badge>
		);
	}
	return (
		<Badge tone={submission.status === "internal_error" ? "danger" : "neutral"} size="sm">
			{STATUS_LABEL[submission.status]}
		</Badge>
	);
}
