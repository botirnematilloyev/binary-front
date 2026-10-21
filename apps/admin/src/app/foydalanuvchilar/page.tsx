import { Container } from "@binary/ui";
import { AdminOnly } from "@/features/admin-auth";
import { UserList } from "@/features/user-admin";
import { AdminHeader } from "@/widgets/admin-header";

export default function UsersPage() {
	return (
		<>
			<AdminHeader />
			<Container className="py-8">
				<AdminOnly>
					<UserList />
				</AdminOnly>
			</Container>
		</>
	);
}
