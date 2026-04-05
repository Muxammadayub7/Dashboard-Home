const SHEET_ID = '1dFG3242L3t6f9W9odUWeeqj8QvCZjFaiJMk8-m11Afg'
const READ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=clients`

function formatCurrency(value) {
	const amount = Number(value) || 0
	return `${amount.toLocaleString('uz-UZ')} UZS`
}

function formatCompactCurrency(value) {
	const amount = Math.abs(Number(value) || 0)
	const sign = Number(value) < 0 ? '-' : ''

	if (amount >= 1000000) {
		return `${sign}${(amount / 1000000).toFixed(1)}M`
	}

	if (amount >= 1000) {
		return `${sign}${(amount / 1000).toFixed(0)}K`
	}

	return `${sign}${amount}`
}

function buildSparkline(value) {
	const amount = Math.abs(Number(value) || 0)
	const intensity = Math.max(0.25, Math.min(amount / 15000000, 1))
	const peak = 58 - intensity * 28
	const mid = 64 - intensity * 18
	return `0,78 18,72 34,${mid.toFixed(1)} 52,${(peak + 10).toFixed(1)} 70,${peak.toFixed(1)} 88,${(peak + 6).toFixed(1)} 106,${(peak - 4).toFixed(1)} 124,${(peak + 2).toFixed(1)} 142,${(peak - 10).toFixed(1)} 160,${(peak - 6).toFixed(1)} 178,${(peak - 12).toFixed(1)} 196,${(peak - 8).toFixed(1)}`
}

function setText(id, value) {
	const element = document.getElementById(id)
	if (element) element.innerText = value
}

function setPageLoading(isLoading) {
	const loader = document.getElementById('pageLoader')
	if (!loader) return

	loader.classList.toggle('show', isLoading)
	loader.setAttribute('aria-hidden', String(!isLoading))
}

function getNumericCell(cells, index) {
	const raw = cells[index]?.v
	const value = parseFloat(raw)
	return Number.isNaN(value) ? 0 : value
}

function parseClientRow(row) {
	const cells = row.c || []
	if (!cells[0] || cells[0].v === null) return null

	return {
		ism: String(cells[0]?.v || '').trim(),
		telefon: String(cells[1]?.f || cells[1]?.v || '').trim(),
		tarif: String(cells[2]?.v || '').trim(),
		tolangan: getNumericCell(cells, 6),
		qarz: getNumericCell(cells, 7),
	}
}

async function fetchSheetRows() {
	const response = await fetch(READ_URL)
	const text = await response.text()
	const json = JSON.parse(
		text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1),
	)
	return json.table.rows || []
}

function renderAnalysisChart(metrics) {
	const chart = document.getElementById('analysisChart')
	if (!chart) return

	chart.innerHTML = metrics
		.map(metric => {
			const fullValue = formatCurrency(metric.value)
			const shortValue = formatCompactCurrency(metric.value)
			const sparkline = buildSparkline(metric.value)
			return `
				<div class="chart-bar-group" title="${fullValue}">
					<div class="chart-bar-meta">
						<div class="chart-bar-value">${shortValue}</div>
						<div class="chart-bar-label">${metric.label}</div>
					</div>
					<div class="chart-bar-track">
						<svg class="chart-line" viewBox="0 0 196 84" preserveAspectRatio="none" aria-hidden="true">
							<polyline class="chart-line-fill" points="${sparkline} 196,84 0,84" style="fill:${metric.color};"></polyline>
							<polyline class="chart-line-path" points="${sparkline}" style="stroke:${metric.color};"></polyline>
						</svg>
					</div>
					<div class="chart-bar-subvalue">${fullValue}</div>
				</div>
			`
		})
		.join('')
}

function setupCardPressAnimation() {
	const cards = document.querySelectorAll('.card, .chart-container')

	cards.forEach(card => {
		card.tabIndex = 0

		const triggerPress = () => {
			card.classList.remove('is-bouncing')
			void card.offsetWidth
			card.classList.add('is-bouncing')
		}

		card.addEventListener('pointerdown', triggerPress)
		card.addEventListener('keydown', event => {
			if (event.key === 'Enter' || event.key === ' ') {
				triggerPress()
			}
		})
		card.addEventListener('animationend', () => {
			card.classList.remove('is-bouncing')
		})
	})
}

async function updateDashboardStats() {
	setText('totalSales', 'Yuklanmoqda...')
	setText('expense', 'Yuklanmoqda...')
	setText('balance', 'Yuklanmoqda...')

	try {
		const rows = await fetchSheetRows()

		let totalPaid = 0
		let totalDebt = 0
		let clientsCount = 0
		let debtorsCount = 0

		rows.forEach(row => {
			const client = parseClientRow(row)
			if (!client) return

			clientsCount += 1
			totalPaid += client.tolangan
			totalDebt += client.qarz

			if (client.qarz > 0) debtorsCount += 1
		})

		const totalSales = totalPaid + totalDebt
		const balance = totalPaid

		setText('totalSales', formatCurrency(totalSales))
		setText('expense', formatCurrency(totalDebt))
		setText('balance', formatCurrency(balance))
		setText('clientsCount', clientsCount)
		setText('debtorsCount', debtorsCount)

		renderAnalysisChart([
			{
				label: 'Jami sotuv',
				value: totalSales,
				color: '#44c2ff',
			},
			{
				label: 'Qarzdorlik',
				value: totalDebt,
				color: '#ff6b6b',
			},
			{
				label: 'Qoldiq',
				value: balance,
				color: '#4fffa3',
			},
		])
	} catch (error) {
		console.error('Dashboard ma\'lumotlarini olishda xatolik:', error)
		setText('totalSales', 'Xatolik')
		setText('expense', 'Xatolik')
		setText('balance', 'Xatolik')
		renderAnalysisChart([
			{ label: 'Xatolik', value: 0, color: '#7a7a7a' },
		])
	} finally {
		setPageLoading(false)
	}
}

document.addEventListener('DOMContentLoaded', () => {
	setPageLoading(true)
	setupCardPressAnimation()
	updateDashboardStats()
})
