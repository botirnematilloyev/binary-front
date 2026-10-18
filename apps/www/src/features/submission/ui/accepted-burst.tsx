"use client";

import { useEffect, type CSSProperties } from "react";

const pieces = [
	[-132, -92, -28, 0, "1", "success"],
	[-96, -128, 21, 35, "0", "accent"],
	[-58, -112, -12, 70, "1", "success"],
	[-18, -146, 36, 95, "", "line"],
	[36, -132, -22, 50, "1", "accent"],
	[82, -116, 18, 80, "0", "success"],
	[126, -82, 32, 20, "", "line"],
	[150, -28, -18, 105, "1", "success"],
	[118, 30, 24, 65, "0", "accent"],
	[78, 92, -34, 115, "", "line"],
	[28, 132, 19, 40, "1", "success"],
	[-28, 126, -16, 90, "0", "accent"],
	[-82, 94, 31, 55, "", "line"],
	[-126, 42, -25, 110, "1", "success"],
	[-150, -18, 16, 75, "0", "accent"],
	[-104, -54, 42, 125, "", "line"],
	[104, -58, -38, 130, "1", "success"],
	[58, 58, 28, 145, "0", "accent"],
] as const;

type PieceStyle = CSSProperties & {
	"--x": string;
	"--y": string;
	"--r": string;
	"--d": string;
};

export function AcceptedBurst({ onDone }: { onDone: () => void }) {
	useEffect(() => {
		const id = window.setTimeout(onDone, 2900);
		return () => window.clearTimeout(id);
	}, [onDone]);

	return (
		<div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 grid place-items-center">
			<div className="accepted-burst__veil" />
			<div className="accepted-burst">
				<div className="accepted-burst__ring" />
				<div className="accepted-burst__core">AC</div>
				{pieces.map(([x, y, rotate, delay, glyph, tone], index) => {
					const style: PieceStyle = {
						"--x": `${x}px`,
						"--y": `${y}px`,
						"--r": `${rotate}deg`,
						"--d": `${delay * 2}ms`,
					};

					return (
						<span
							key={index}
							style={style}
							data-tone={tone}
							className="accepted-burst__piece"
						>
							{glyph}
						</span>
					);
				})}
			</div>

			<style jsx>{`
				.accepted-burst__veil {
					position: absolute;
					inset: 0;
					background: rgb(255 255 255 / 0.22);
					backdrop-filter: blur(3px);
					animation: accepted-veil 2900ms ease both;
				}

				.accepted-burst {
					position: relative;
					width: 1px;
					height: 1px;
					filter: drop-shadow(0 24px 44px rgb(17 24 39 / 0.22));
				}

				.accepted-burst__ring {
					position: absolute;
					inset: -56px;
					border: 3px solid rgb(22 163 74 / 0.34);
					border-radius: 999px;
					animation: accepted-ring 1700ms cubic-bezier(0.16, 1, 0.3, 1) both;
				}

				.accepted-burst__core {
					position: absolute;
					left: -36px;
					top: -36px;
					display: grid;
					width: 72px;
					height: 72px;
					place-items: center;
					border-radius: 22px;
					background: rgb(22 163 74);
					color: white;
					font: 800 20px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
						"Liberation Mono", "Courier New", monospace;
					letter-spacing: 0;
					animation: accepted-core 2300ms cubic-bezier(0.16, 1, 0.3, 1) both;
				}

				.accepted-burst__piece {
					position: absolute;
					left: -14px;
					top: -14px;
					display: grid;
					width: 28px;
					height: 28px;
					place-items: center;
					border-radius: 8px;
					background: rgb(220 252 231);
					color: rgb(22 101 52);
					font: 800 15px/1 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
						"Liberation Mono", "Courier New", monospace;
					letter-spacing: 0;
					opacity: 0;
					transform: translate3d(0, 0, 0) scale(0.4) rotate(0deg);
					animation: accepted-piece 2300ms cubic-bezier(0.16, 1, 0.3, 1) both;
					animation-delay: var(--d);
				}

				.accepted-burst__piece[data-tone="accent"] {
					background: rgb(219 234 254);
					color: rgb(37 99 235);
				}

				.accepted-burst__piece[data-tone="line"] {
					width: 10px;
					height: 42px;
					border-radius: 999px;
					background: rgb(250 204 21);
					color: transparent;
				}

				@keyframes accepted-piece {
					0% {
						opacity: 0;
						transform: translate3d(0, 0, 0) scale(0.4) rotate(0deg);
					}
					14% {
						opacity: 1;
					}
					78% {
						opacity: 1;
					}
					100% {
						opacity: 0;
						transform: translate3d(calc(var(--x) * 1.3), calc(var(--y) * 1.3), 0)
							scale(1) rotate(var(--r));
					}
				}

				@keyframes accepted-ring {
					0% {
						opacity: 0.75;
						transform: scale(0.3);
					}
					100% {
						opacity: 0;
						transform: scale(3.2);
					}
				}

				@keyframes accepted-core {
					0% {
						opacity: 0;
						transform: scale(0.7);
					}
					18% {
						opacity: 1;
						transform: scale(1.08);
					}
					70% {
						opacity: 1;
						transform: scale(1);
					}
					100% {
						opacity: 0;
						transform: scale(0.86);
					}
				}

				@keyframes accepted-veil {
					0% {
						opacity: 0;
					}
					14% {
						opacity: 1;
					}
					72% {
						opacity: 1;
					}
					100% {
						opacity: 0;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.accepted-burst__piece,
					.accepted-burst__ring,
					.accepted-burst__core,
					.accepted-burst__veil {
						animation-duration: 1ms;
					}
				}
			`}</style>
		</div>
	);
}
