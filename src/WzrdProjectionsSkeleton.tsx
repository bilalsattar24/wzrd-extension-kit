import React, { useMemo } from 'react';

export type WzrdProjectionsSkeletonProps = {
	/** Categories dummy table vs points totals. */
	projectionType: 'categories' | 'points';
	/** Sport-specific loading lines; one is picked at mount. */
	loadingMessages: string[];
	/** Dummy stat headers for the categories table. */
	dummyCategories?: string[];
	/**
	 * Extra class on the dummy table (Yahoo host classes belong in the sport repo).
	 */
	tableClassName?: string;
};

const DEFAULT_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Loading placeholder for matchup projections: overlay copy plus a dummy grid
 * that un-blurs over ~4s. Real numbers are not animated; this is swapped out
 * when the query finishes.
 *
 * @param props - Layout, messages, and optional dummy category labels.
 */
export function WzrdProjectionsSkeleton({
	projectionType,
	loadingMessages,
	dummyCategories = DEFAULT_CATEGORIES,
	tableClassName,
}: WzrdProjectionsSkeletonProps) {
	const loadingMessage = useMemo(() => {
		if (loadingMessages.length === 0) return 'Loading';
		const index = Math.floor(Math.random() * loadingMessages.length);
		return loadingMessages[index];
	}, [loadingMessages]);

	return (
		<div className="wz-relative wz-mb-8 wz-min-h-[140px]">
			<div className="wz-absolute wz-inset-0 wz-z-20 wz-flex wz-flex-col wz-items-center wz-justify-center">
				<div className="wz-flex wz-flex-col wz-items-center wz-rounded-2xl wz-border wz-border-white/50 wz-bg-white/60 wz-px-8 wz-py-4 wz-shadow-xl wz-backdrop-blur-sm">
					<div className="wz-mb-1 wz-text-4xl wz-font-black wz-tracking-tight wz-text-wzrd-text">
						WZRD Projections
					</div>
					<div className="wz-text-base wz-font-extrabold wz-italic wz-text-wzrd-text-muted">
						{loadingMessage}...
					</div>
				</div>
			</div>

			{projectionType === 'categories' ? (
				<div className="wz-animate-blur-reveal wz-opacity-0">
					<table
						className={tableClassName}
						style={{
							borderCollapse: 'separate',
							borderSpacing: 0,
							borderRadius: '8px',
							overflow: 'hidden',
							tableLayout: 'fixed',
							width: '100%',
						}}
					>
						<thead>
							<tr>
								<th className="wz-text-left" style={{ width: '180px' }}>
									Team
								</th>
								{dummyCategories.map((cat) => (
									<th key={cat} style={{ width: '60px' }}>
										{cat}
									</th>
								))}
								<th style={{ width: '60px' }}>WZRD</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="wz-font-bold wz-text-left">Loading Team...</td>
								{dummyCategories.map((cat, i) => (
									<td
										key={`t1-${cat}`}
										className="wz-text-center wz-font-bold"
										style={{
											backgroundColor: i % 2 === 0 ? '#ebffeb' : '#ffebeb',
											padding: '5px',
										}}
									>
										{i % 2 === 0 ? '5.2' : '3.1'}
									</td>
								))}
								<td className="wz-text-center" style={{ backgroundColor: '#ebffeb' }}>
									5
								</td>
							</tr>
							<tr>
								<td className="wz-font-bold wz-text-left">Loading Opponent...</td>
								{dummyCategories.map((cat, i) => (
									<td
										key={`t2-${cat}`}
										className="wz-text-center wz-font-bold"
										style={{
											backgroundColor: i % 2 === 0 ? '#ffebeb' : '#ebffeb',
										}}
									>
										{i % 2 === 0 ? '3.8' : '6.4'}
									</td>
								))}
								<td className="wz-text-center" style={{ backgroundColor: '#ffebeb' }}>
									4
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			) : (
				<div className="wz-animate-blur-reveal wz-opacity-0">
					<div className="wz-my-4 wz-flex wz-justify-center wz-gap-8">
						<div className="wz-text-center">
							<div className="wz-mb-1 wz-text-sm wz-font-bold">Loading Team...</div>
							<div
								className="wz-rounded wz-px-4 wz-py-2 wz-text-2xl wz-font-bold"
								style={{ backgroundColor: '#ebffeb' }}
							>
								450.5
							</div>
						</div>
						<div className="wz-flex wz-items-center wz-text-xl wz-font-bold">vs</div>
						<div className="wz-text-center">
							<div className="wz-mb-1 wz-text-sm wz-font-bold">Loading Opponent...</div>
							<div
								className="wz-rounded wz-px-4 wz-py-2 wz-text-2xl wz-font-bold"
								style={{ backgroundColor: '#ffebeb' }}
							>
								410.2
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
