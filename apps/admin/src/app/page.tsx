import { Container } from "@binary/ui";
import { ProblemList } from "@/features/problem-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function AdminHomePage() {
	return (
		<>
			<AdminHeader />
			<Container className="py-8">
				<ProblemList />
			</Container>
		</>
	);
}
