'use client'
import { motion } from 'framer-motion'
import { OdometerNumber, Skeleton } from '@/components/ui'

interface ArtifactModuleProps {
	streak: number
	xp: number
	longestStreak: number
	isLoading: boolean
	derived: {
		streakPercentOfBest: number
		isAtPersonalBest: boolean
		nextMilestone: number | null
		daysToNextMilestone: number | null
		totalActivity: number
	} | null
}

export function ArtifactModule({
	streak,
	xp,
	longestStreak,
	isLoading,
	derived,
}: ArtifactModuleProps) {
	return (
		<div className="artifact-module card card--pad-lg">
			<div className="artifact-module__streak">
				<div className="artifact-module__streak-number">
					{isLoading ? (
						<Skeleton variant="block" width={80} height={72} />
					) : (
						<OdometerNumber
							value={streak}
							className="artifact-streak-value"
						/>
					)}
					<div className="artifact-module__streak-meta">
						<span className="artifact-streak-label text-label">
							DAY STREAK
						</span>
						{!isLoading && longestStreak > 0 && (
							<span className="artifact-streak-best text-caption">
								BEST: {longestStreak}
							</span>
						)}
					</div>
				</div>

				{!isLoading && derived?.isAtPersonalBest && streak > 0 && (
					<motion.div
						className="artifact-personal-best"
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: 0.3, duration: 0.3 }}
					>
						<span className="artifact-personal-best__label">
							PERSONAL BEST
						</span>
					</motion.div>
				)}
			</div>

			<div className="artifact-module__divider" />

			<div className="artifact-module__xp">
				<div className="artifact-module__xp-top">
					{isLoading ? (
						<Skeleton variant="block" width={100} height={40} />
					) : (
						<OdometerNumber
							value={xp}
							className="artifact-xp-value"
						/>
					)}
					<span className="artifact-xp-label text-label">
						COGNITIVE XP
					</span>
				</div>

				{!isLoading && derived?.nextMilestone && (
					<div className="artifact-milestone">
						<div className="artifact-milestone__bar">
							<motion.div
								className="artifact-milestone__fill"
								initial={{ width: 0 }}
								animate={{
									width: `${derived.streakPercentOfBest}%`,
								}}
								transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
							/>
						</div>
						<span className="artifact-milestone__label text-caption">
							{derived.daysToNextMilestone} DAYS TO {derived.nextMilestone} DAY STREAK
						</span>
					</div>
				)}
			</div>
		</div>
	)
}
