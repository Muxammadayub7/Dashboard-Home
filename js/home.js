const SHEET_ID = '1dFG3242L3t6f9W9odUWeeqj8QvCZjFaiJMk8-m11Afg'
const READ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=clients`

function formatCurrency(value) {
	const amount = Number(value) || 0
	return `${amount.toLocaleString('uz-UZ')} UZS`
}

function setText(id, value) {
	const element = document.getElementById(id)
	if (element) element.innerText = value
}

function renderAnalysisChart(metrics) {
	const chart = document.getElementById('analysisChart')
	if (!chart) return

	const maxValue = Math.max(...metrics.map(metric => Math.abs(metric.value)), 1)

	chart.innerHTML = metrics
		.map(metric => {
			const height = Math.max((Math.abs(metric.value) / maxValue) * 100, 8)
			return `
				<div class="chart-bar-group">
					<div class="chart-bar-value">${formatCurrency(metric.value)}</div>
					<div class="chart-bar-track">
						<div class="chart-bar" style="height:${height}%; background:${metric.color};"></div>
					</div>
					<div class="chart-bar-label">${metric.label}</div>
				</div>
			`
		})
		.join('')
}

async function updateDashboardStats() {
	setText('totalSales', 'Yuklanmoqda...')
	setText('income', 'Yuklanmoqda...')
	setText('expense', 'Yuklanmoqda...')
	setText('balance', 'Yuklanmoqda...')

	try {
		const response = await fetch(READ_URL)
		const text = await response.text()
		const json = JSON.parse(
			text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1),
		)
		const rows = json.table.rows || []

		let totalPaid = 0
		let totalDebt = 0
		let clientsCount = 0
		let debtorsCount = 0

		rows.forEach(row => {
			const cells = row.c
			if (!cells || !cells[0] || cells[0].v === null) return

			const paid = parseFloat(cells[6]?.v) || 0
			const debt = parseFloat(cells[7]?.v) || 0

			clientsCount += 1
			totalPaid += paid
			totalDebt += debt

			if (debt > 0) debtorsCount += 1
		})

		const totalSales = totalPaid + totalDebt
		const balance = totalPaid - totalDebt

		setText('totalSales', formatCurrency(totalSales))
		setText('income', formatCurrency(totalPaid))
		setText('expense', formatCurrency(totalDebt))
		setText('balance', formatCurrency(balance))
		setText('clientsCount', clientsCount)
		setText('debtorsCount', debtorsCount)

		renderAnalysisChart([
			{
				label: 'Jami sotuv',
				value: totalSales,
				color: 'linear-gradient(180deg, #47b5ff, #1f78d1)',
			},
			{
				label: 'Doxod',
				value: totalPaid,
				color: 'linear-gradient(180deg, #72e08f, #2eaf5d)',
			},
			{
				label: 'Qarzdorlik',
				value: totalDebt,
				color: 'linear-gradient(180deg, #ff7b7b, #d83a3a)',
			},
			{
				label: 'Qoldiq',
				value: balance,
				color: 'linear-gradient(180deg, #ae7bff, #5d6bff)',
			},
		])
	} catch (error) {
		console.error('Dashboard ma\'lumotlarini olishda xatolik:', error)
		setText('totalSales', 'Xatolik')
		setText('income', 'Xatolik')
		setText('expense', 'Xatolik')
		setText('balance', 'Xatolik')
		renderAnalysisChart([
			{ label: 'Xatolik', value: 0, color: 'linear-gradient(180deg, #666, #444)' },
		])
	}
}

document.addEventListener('DOMContentLoaded', updateDashboardStats)
