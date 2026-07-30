"use client";

import { useSession } from "@binary/session";
import { Container } from "@binary/ui";

export function AdminHeader() {
	const { user, signOut } = useSession();

	return (
		<header className="border-b border-border-default bg-canvas">
			<Container className="flex h-[62px] items-center gap-6">
				<span className="font-display text-[15px] font-bold">binary.uz · admin</span>

				<div className="ml-auto flex items-center gap-3">
					<span className="text-sm text-fg-muted">
						{user?.full_name ?? user?.username}
						{user && (
							<span className="ml-2 text-[11px] font-bold tracking-wide text-fg-subtle uppercase">
								{user.role}
							</span>
						)}
					</span>
					<button
						type="button"
						onClick={() => void signOut()}
						className="cursor-pointer rounded-control border border-border-strong px-3 py-1.5 text-[13px] font-semibold transition-colors hover:border-border-hover"
					>
						Chiqish
					</button>
				</div>
			</Container>
		</header>
	);
}
