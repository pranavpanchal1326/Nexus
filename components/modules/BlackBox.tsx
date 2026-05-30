'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { SPRING } from '@/lib/motion'
import { useStats } from '@/hooks/useStats'

export function BlackBox() {
	const [isExporting, setIsExporting] = useState(false)
	const [exportError, setExportError] = useState<string | null>(null)
	const [lastExported, setLastExported] = useState<string | null>(null)

	const { data: stats } = useStats()

	// Estimate export size — rough calculation from activity counts
	const estimatedSizeKB = stats
		? Math.round(
				10 +
				(stats.journal_count * 0.8) +
				(stats.gym_count * 0.1) +
				(stats.duel_count * 0.05) +
				(stats.oracle_count * 1.2)
			)
		: null

	const handleExport = useCallback(async () => {
		if (isExporting) return

		setIsExporting(true)
		setExportError(null)

		try {
			const res = await fetch('/api/export', {
				method: 'GET',
				credentials: 'include',
			})

			if (!res.ok) {
				throw new Error(`Export failed: HTTP ${res.status}`)
			}

			// Trigger browser download
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			const now = new Date().toISOString().split('T')[0]
			const filename = `nexus-export-${now}.zip`

			const a = document.createElement('a')
			a.href = url
			a.download = filename
			a.click()

			URL.revokeObjectURL(url)
			setLastExported(new Date().toISOString())
		} catch (err) {
			setExportError(err instanceof Error ? err.message : 'Export failed')
		} finally {
			setIsExporting(false)
		}
	}, [isExporting])

	return (
		<div className="black-box card card--pad-lg">

			{/* Header */}
			<div className="black-box__header">
				<div className="black-box__title-group">
					<span className="black-box__label text-label">BLACK BOX</span>
					<h3 className="black-box__title">Data Sovereignty Export</h3>
				</div>
				<span className="black-box__badge">YOUR DATA</span>
			</div>

			{/* Description */}
			<p className="black-box__description">
				Everything NEXUS knows about you. Journal entries, gym logs,
				lexicon words, oracle sessions, activity history. One ZIP file.
				Yours to keep, move, or delete.
			</p>

			{/* File contents preview */}
			<div className="black-box__contents">
				{[
					{ file: 'profile.json', desc: 'Profile + XP + streak' },
					{ file: 'journal.json', desc: `${stats?.journal_count ?? '—'} entries` },
					{ file: 'gym.json', desc: `${stats?.gym_count ?? '—'} logs` },
					{ file: 'lexicon.json', desc: 'Full word lexicon' },
					{ file: 'oracle.json', desc: 'Chat history' },
					{ file: 'activity.json', desc: 'Daily stats' },
				].map(({ file, desc }) => (
					<div key={file} className="black-box__file-row">
						<span className="black-box__file-name">{file}</span>
						<span className="black-box__file-desc">{desc}</span>
					</div>
				))}
			</div>

			{/* Size estimate */}
			{estimatedSizeKB !== null && (
				<div className="black-box__meta">
					<span className="black-box__size text-caption">
						ESTIMATED SIZE: ~{estimatedSizeKB < 1024
							? `${estimatedSizeKB} KB`
							: `${(estimatedSizeKB / 1024).toFixed(1)} MB`
						}
					</span>
					{lastExported && (
						<span className="black-box__last-export text-caption">
							LAST EXPORTED: {new Date(lastExported).toLocaleDateString()}
						</span>
					)}
				</div>
			)}

			{/* Error */}
			{exportError && (
				<div className="black-box__error">{exportError}</div>
			)}

			{/* Export button */}
			<motion.button
				className={`black-box__btn ${isExporting ? 'black-box__btn--loading' : ''}`}
				onClick={handleExport}
				disabled={isExporting}
				{...(!isExporting ? { whileTap: { scale: 0.97 } } : {})}
				transition={SPRING.SNAP}
			>
				{isExporting ? (
					<>
						<span className="black-box__btn-spinner" />
						PACKAGING DATA...
					</>
				) : (
					'DOWNLOAD MY DATA'
				)}
			</motion.button>
		</div>
	)
}
