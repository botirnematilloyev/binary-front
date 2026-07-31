import { Container } from "@binary/ui";
import { TopicManager } from "@/features/topic-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function TopicsPage() {
	return (
		<>
			<AdminHeader />
			<Container className="py-8">
				<TopicManager />
			</Container>
		</>
	);
}
