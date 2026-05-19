'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStats } from '@/hooks/useStats'
import { OdometerNumber } from '@/components/ui'
import { Skeleton } from '@/components/ui'
import { SPRING } from '@/lib/motion'
import { playSound } from '@/lib/audio'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ArtifactModuleProps {
	/** Initial values from server — prevent flash before client data loads */
	initialStreak?: number
	initialXP?: number
}

const MILESTONES = [7, 30, 100, 365]

// ─── Streak milestone fireworks — visual burst on milestone hit ────────────────

function MilestoneBurst({ milestone }: { milestone: number }) {
	return (
		<motion.div
			className="artifact-milestone-burst"
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.05, 1, 0.95] }}
			transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
		>
			<span className="artifact-milestone-burst__number">{milestone}</span>
			<span className="artifact-milestone-burst__label">DAY STREAK</span>
		</motion.div>
	)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ArtifactModule({
	initialStreak = 0,
	initialXP = 0,
}: ArtifactModuleProps) {
	const { data: stats, isLoading, derived } = useStats()

	// Use initialValues until data loads — prevents layout shift
	const streak = stats?.current_streak ?? initialStreak
	const xp = stats?.cognitive_xp ?? initialXP
	const longestStreak = stats?.longest_streak ?? initialStreak

	// ─── Milestone detection ──────────────────────────────────────────────────
	const [activeMilestone, setActiveMilestone] = useState<number | null>(null)
	const prevStreakRef = useRef<number>(initialStreak)

	useEffect(() => {
		const prev = prevStreakRef.current
		if (streak === prev || streak === 0) return
		prevStreakRef.current = streak

		const hitMilestone = MILESTONES.find(m => streak >= m && prev < m)
		if (hitMilestone) {
			setActiveMilestone(hitMilestone)
			playSound('streak-milestone')
			setTimeout(() => setActiveMilestone(null), 3000)
		}
	}, [streak])

	// ─── Streak bar — percentage toward next milestone ────────────────────────
	const nextMilestone = derived?.nextMilestone ?? null
	const progressPercent = nextMilestone && streak > 0
		? Math.min(100, Math.round(
				((streak - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0)) /
				 (nextMilestone - (MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0))) * 100
			))
		: streak > 0 && !nextMilestone
		? 100
		: 0

	// ─── Streak status label ──────────────────────────────────────────────────
	const streakStatus = derived?.isAtPersonalBest && streak > 0
		? 'PERSONAL BEST'
		: streak === 0
		? 'BEGIN TODAY'
		: null

	return (
		<div className="artifact-module card card--pad-lg">

			{/* ─── Milestone burst overlay ──────────────────────────────────── */}
			<AnimatePresence>
				{activeMilestone && (
					<motion.div
						className="artifact-milestone-overlay"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<MilestoneBurst milestone={activeMilestone} />
					</motion.div>
				)}
			</AnimatePresence>

			{/* ─── Streak section ───────────────────────────────────────────── */}
			<div className="artifact-module__streak">

				{/* Streak number */}
				<div className="artifact-module__streak-number">
					{isLoading ? (
						<Skeleton variant="block" width={80} height={72} />
					) : (
						<OdometerNumber
							value={streak}
							className="artifact-streak-value"
							duration={0.2}
						/>
					)}

					<div className="artifact-module__streak-meta">
						<span className="artifact-streak-label text-label">
							DAY STREAK
						</span>
						{!isLoading && longestStreak > 0 && longestStreak !== streak && (
							<span className="artifact-streak-best text-caption">
								BEST: {longestStreak}
							</span>
						)}
					</div>
				</div>

				{/* Status badge */}
				<AnimatePresence>
					{!isLoading && streakStatus && (
						<motion.div
							className={`artifact-status-badge ${
								streakStatus === 'PERSONAL BEST'
									? 'artifact-status-badge--best'
									: 'artifact-status-badge--start'
							}`}
							initial={{ opacity: 0, scale: 0.9, y: 4 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={SPRING.SNAP}
						>
							{streakStatus}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Streak progress bar toward next milestone */}
				{!isLoading && nextMilestone && streak > 0 && (
					<div className="artifact-streak-progress">
						<div className="artifact-streak-progress__track">
							<motion.div
								className="artifact-streak-progress__fill"
								initial={{ width: '0%' }}
								animate={{ width: `${progressPercent}%` }}
								transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
							/>
						</div>
						<span className="artifact-streak-progress__label text-caption">
							{derived?.daysToNextMilestone} DAYS TO {nextMilestone}
						</span>
					</div>
				)}
			</div>

			{/* ─── Divider ──────────────────────────────────────────────────── */}
			<div className="artifact-module__divider" />

			{/* ─── XP section ───────────────────────────────────────────────── */}
			<div className="artifact-module__xp">

				{/* XP number */}
				{isLoading ? (
					<Skeleton variant="block" width={120} height={40} />
				) : (
					<OdometerNumber
						value={xp}
						className="artifact-xp-value"
						format={xp >= 10000}
						duration={0.18}
					/>
				)}

				<span className="artifact-xp-label text-label">COGNITIVE XP</span>

				{/* XP breakdown hint */}
				{!isLoading && stats && (
					<div className="artifact-xp-breakdown">
						{stats.journal_count > 0 && (
							<span className="artifact-xp-source">
								{stats.journal_count} entries
							</span>
						)}
						{stats.duel_count > 0 && (
							<span className="artifact-xp-source">
								{stats.duel_count} duels
							</span>
						)}
						{stats.gym_count > 0 && (
							<span className="artifact-xp-source">
								{stats.gym_count} sessions
							</span>
						)}
					</div>
				)}
			</div>

		</div>
	)
}
