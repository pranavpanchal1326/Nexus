'use client'
import { useMemo } from 'react'

interface HeatmapDay {
	date: string
	count: number
}

interface HeatmapProps {
	data: HeatmapDay[]
	isLoading?: boolean
}

export function Heatmap({ data, isLoading = false }: HeatmapProps) {
	const sorted = useMemo(() => {
		return [...data].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		)
	}, [data])

	const cells = useMemo(() => {
		if (isLoading) {
			return Array.from({ length: 365 }, (_, i) => ({
				date: `loading-${i}`,
				count: 0,
			}))
		}
		return sorted
	}, [sorted, isLoading])

	return (
		<div className="heatmap card card--pad-md">
			<div className="heatmap__header">
				<span className="heatmap__label text-label">ACTIVITY HEATMAP</span>
				{!isLoading && (
					<span className="heatmap__sub text-caption">LAST 365 DAYS</span>
				)}
			</div>
			<div className={`heatmap__grid ${isLoading ? 'heatmap__grid--loading' : ''}`}>
				{cells.map(day => (
					<div
						key={day.date}
						className={`heatmap__cell heatmap__cell--${day.count}`}
						title={isLoading ? undefined : `${day.date} - ${day.count}`}
						aria-hidden={isLoading}
					/>
				))}
			</div>
		</div>
	)
}
