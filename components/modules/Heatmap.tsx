'use client'
import {
	useRef,
	useEffect,
	useState,
	useCallback,
	useMemo,
	type MouseEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { heatmapCellTransition } from '@/lib/motion'
import type { HeatmapDay } from '@/hooks/useStats'
import {
	buildWeekColumns,
	buildMonthLabels,
	formatTooltipDate,
	getIntensityLabel,
} from '@/lib/heatmapHelpers'

interface HeatmapProps {
	data: HeatmapDay[]
	isLoading: boolean
	className?: string
}

interface TooltipState {
	visible: boolean
	content: string
	x: number
	y: number
}

const CELL_SIZE = 12
const CELL_GAP = 3
const DAYS_IN_WEEK = 7
const TOTAL_WEEKS = 53

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const INTENSITY_COLORS: Record<0 | 1 | 2 | 3 | 4, string> = {
	0: '#111111',
	1: 'rgba(232,255,71,0.15)',
	2: 'rgba(232,255,71,0.35)',
	3: 'rgba(232,255,71,0.60)',
	4: 'rgba(232,255,71,0.90)',
}

const INTENSITY_LABELS: Record<0 | 1 | 2 | 3 | 4, string> = {
	0: 'No activity',
	1: 'Light activity',
	2: 'Moderate activity',
	3: 'Active day',
	4: 'Very active day',
}

export function Heatmap({ data, isLoading, className }: HeatmapProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const tooltipRef = useRef<HTMLDivElement>(null)
	const [revealed, setRevealed] = useState(false)
	const [renderStatic, setRenderStatic] = useState(false)
	const [tooltip, setTooltip] = useState<TooltipState>({
		visible: false,
		content: '',
		x: 0,
		y: 0,
	})

	const columns = useMemo(() => buildWeekColumns(data), [data])
	const monthLabels = useMemo(() => buildMonthLabels(columns), [columns])
	const hasActivity = useMemo(() => data.some(day => day.count > 0), [data])
	const todayIso = useMemo(() => new Date().toISOString().split('T')[0] ?? '', [])

	useEffect(() => {
		const el = containerRef.current
		if (!el || revealed) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					setRevealed(true)
					observer.disconnect()
				}
			},
			{ threshold: 0.1 }
		)

		observer.observe(el)
		return () => observer.disconnect()
	}, [revealed])

	useEffect(() => {
		if (!revealed) return
		const timer = window.setTimeout(() => {
			setRenderStatic(true)
		}, 3000)
		return () => window.clearTimeout(timer)
	}, [revealed])

	useEffect(() => {
		if (!tooltip.visible) return
		const rect = containerRef.current?.getBoundingClientRect()
		const tip = tooltipRef.current
		if (!rect || !tip) return

		const padding = 8
		const halfWidth = tip.offsetWidth / 2
		const maxX = rect.width - halfWidth - padding
		const minX = halfWidth + padding
		const maxY = rect.height - tip.offsetHeight - padding
		const minY = padding

		let nextX = tooltip.x
		let nextY = tooltip.y

		if (nextX < minX) nextX = minX
		if (nextX > maxX) nextX = maxX
		if (nextY < minY) nextY = minY
		if (nextY > maxY) nextY = maxY

		if (nextX !== tooltip.x || nextY !== tooltip.y) {
			setTooltip(prev => ({ ...prev, x: nextX, y: nextY }))
		}
	}, [tooltip.visible, tooltip.content, tooltip.x, tooltip.y])

	const handleCellMouseEnter = useCallback((
		e: MouseEvent<HTMLDivElement>,
		day: HeatmapDay
	) => {
		const rect = containerRef.current?.getBoundingClientRect()
		if (!rect) return

		const intensityLabel = getIntensityLabel(day.count)
		const dateStr = formatTooltipDate(day.date)

		setTooltip({
			visible: true,
			content: `${dateStr} - ${intensityLabel}`,
			x: e.clientX - rect.left,
			y: e.clientY - rect.top - 36,
		})
	}, [])

	const handleCellMouseLeave = useCallback(() => {
		setTooltip(prev => ({ ...prev, visible: false }))
	}, [])

	if (isLoading) {
		return <HeatmapSkeleton />
	}

	if (!data.length || !hasActivity) {
		return <HeatmapEmpty />
	}

	return (
		<div
			ref={containerRef}
			className={`heatmap-wrapper ${className ?? ''}`}
		>
			<div className="heatmap-header">
				<span className="heatmap-title text-label">ACTIVITY - PAST YEAR</span>
				<HeatmapLegend />
			</div>

			<div className="heatmap-month-labels">
				{monthLabels.map(({ month, colIndex }) => (
					<span
						key={`${month}-${colIndex}`}
						className="heatmap-month-label"
						style={{
							left: colIndex * (CELL_SIZE + CELL_GAP),
						}}
					>
						{month}
					</span>
				))}
			</div>

			<div className="heatmap-grid-container">
				<div className="heatmap-day-labels">
					{DAY_LABELS.map((label, i) => (
						<span key={i} className="heatmap-day-label">
							{i === 1 || i === 3 || i === 5 ? label : ''}
						</span>
					))}
				</div>

				<div className="heatmap-grid" role="grid" aria-label="Activity heatmap">
					{columns.map(col => (
						<div
							key={col.weekIndex}
							className="heatmap-column"
							role="row"
						>
							{col.days.map((day, dayIndex) => (
								<HeatmapCell
									key={dayIndex}
									day={day}
									colIndex={col.weekIndex}
									revealed={revealed}
									renderStatic={renderStatic}
									todayIso={todayIso}
									onMouseEnter={handleCellMouseEnter}
									onMouseLeave={handleCellMouseLeave}
								/>
							))}
						</div>
					))}
				</div>
			</div>

			<AnimatePresence>
				{tooltip.visible && (
					<motion.div
						ref={tooltipRef}
						className="heatmap-tooltip"
						style={{ left: tooltip.x, top: tooltip.y }}
						initial={{ opacity: 0, y: 2 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 2 }}
						transition={{ duration: 0.1, ease: 'easeOut' }}
					>
						{tooltip.content}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

interface HeatmapCellProps {
	day: HeatmapDay | null
	colIndex: number
	revealed: boolean
	renderStatic: boolean
	todayIso: string
	onMouseEnter: (e: MouseEvent<HTMLDivElement>, day: HeatmapDay) => void
	onMouseLeave: () => void
}

function HeatmapCell({
	day,
	colIndex,
	revealed,
	renderStatic,
	todayIso,
	onMouseEnter,
	onMouseLeave,
}: HeatmapCellProps) {
	if (!day) {
		return (
			<div
				className="heatmap-cell heatmap-cell--empty"
				style={{ width: CELL_SIZE, height: CELL_SIZE }}
				aria-hidden="true"
			/>
		)
	}

	const intensity = Math.min(4, Math.max(0, day.count)) as 0 | 1 | 2 | 3 | 4
	const color = INTENSITY_COLORS[intensity]
	const isToday = day.date === todayIso
	const label = getIntensityLabel(day.count)
	const ariaLabel = isToday
		? `${day.date}: ${label} - today`
		: `${day.date}: ${label}`

	const isAnimationComplete =
		revealed && renderStatic && colIndex * 0.008 + 0.4 < 3

	if (isAnimationComplete) {
		return (
			<div
				className={`heatmap-cell ${isToday ? 'heatmap-cell--today' : ''}`}
				role="gridcell"
				aria-label={ariaLabel}
				tabIndex={0}
				style={{
					width: CELL_SIZE,
					height: CELL_SIZE,
					backgroundColor: color,
				}}
				onMouseEnter={(e) => onMouseEnter(e, day)}
				onMouseLeave={onMouseLeave}
			/>
		)
	}

	return (
		<motion.div
			className={`heatmap-cell ${isToday ? 'heatmap-cell--today' : ''}`}
			role="gridcell"
			aria-label={ariaLabel}
			tabIndex={0}
			style={{
				width: CELL_SIZE,
				height: CELL_SIZE,
				backgroundColor: color,
				opacity: 0,
			}}
			animate={revealed ? { opacity: 1 } : { opacity: 0 }}
			transition={heatmapCellTransition(colIndex)}
			onMouseEnter={(e) => onMouseEnter(e, day)}
			onMouseLeave={onMouseLeave}
		/>
	)
}

function HeatmapLegend() {
	return (
		<div className="heatmap-legend" aria-label="Activity intensity legend">
			<span className="heatmap-legend__label">Less</span>
			{([0, 1, 2, 3, 4] as const).map(level => (
				<div
					key={level}
					className="heatmap-legend__cell"
					style={{ backgroundColor: INTENSITY_COLORS[level] }}
					aria-label={INTENSITY_LABELS[level]}
					title={INTENSITY_LABELS[level]}
				/>
			))}
			<span className="heatmap-legend__label">More</span>
		</div>
	)
}

function HeatmapSkeleton() {
	return (
		<div className="heatmap-wrapper heatmap-wrapper--skeleton">
			<div className="heatmap-header">
				<span className="heatmap-title text-label">ACTIVITY - PAST YEAR</span>
			</div>
			<div className="heatmap-skeleton-grid">
				{Array.from({ length: TOTAL_WEEKS }, (_, colIdx) => (
					<div key={colIdx} className="heatmap-column">
						{Array.from({ length: DAYS_IN_WEEK }, (_, dayIdx) => (
							<div
								key={dayIdx}
								className="heatmap-cell heatmap-cell--skeleton"
								style={{
									width: CELL_SIZE,
									height: CELL_SIZE,
									animationDelay: `${colIdx * 8}ms`,
								}}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	)
}

function HeatmapEmpty() {
	return (
		<div className="heatmap-wrapper heatmap-wrapper--empty">
			<div className="heatmap-header">
				<span className="heatmap-title text-label">ACTIVITY - PAST YEAR</span>
			</div>
			<div className="heatmap-empty">
				<span className="heatmap-empty__glyph" aria-hidden="true">▦</span>
				<span className="heatmap-empty__text">
					Each square is a day. Fill them.
				</span>
			</div>
		</div>
	)
}
