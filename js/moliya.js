// 🔗 1. KONFIGURATSIYA
const SHEET_ID = '1dFG3242L3t6f9W9odUWeeqj8QvCZjFaiJMk8-m11Afg'
const READ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=clients`
const POST_URL =
	'https://script.google.com/macros/s/AKfycbws6x5Ji-edi-46QqgN73ImuxPeQn6xYUKBB8xW03rjBDoSLvOqK8eOEsUMbcRJvGU/exec'

let allData = []

function getNumericCell(cells, index) {
	const raw = cells[index]?.v
	const value = parseFloat(raw)
	return Number.isNaN(value) ? 0 : value
}

function formatSheetDate(cell) {
	if (!cell) return new Date().toLocaleDateString('uz-UZ')
	if (cell.f) return String(cell.f)

	const value = cell.v
	if (value instanceof Date) {
		return value.toLocaleDateString('uz-UZ')
	}

	if (typeof value === 'string' || typeof value === 'number') {
		return String(value)
	}

	return new Date().toLocaleDateString('uz-UZ')
}

function parseClientRow(row, rowPosition = 0) {
	const c = row.c || []
	if (!c[0] || c[0].v === null) return null

	return {
		sheetRowNumber: rowPosition + 2,
		ism: String(c[0]?.v || '').trim(),
		telefon: String(c[1]?.f || c[1]?.v || '').trim(),
		tarif: String(c[2]?.v || '').trim(),
		tolangan: getNumericCell(c, 3),
		qarz: getNumericCell(c, 4),
		sana: formatSheetDate(c[5]),
	}
}

async function fetchSheetRows() {
	const res = await fetch(READ_URL)
	const text = await res.text()
	const json = JSON.parse(
		text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1),
	)
	return json.table.rows || []
}

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

async function postClientToSheet(data) {
	const body = new URLSearchParams()
	body.append('ism', data.ism)
	body.append('telefon', data.telefon)
	body.append('tarif', data.tarif)
	body.append('tolangan', String(data.tolangan))
	body.append('qarz', String(data.qarz))

	await fetch(POST_URL, {
		method: 'POST',
		mode: 'no-cors',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
		},
		body: body.toString(),
	})
}

async function postDeleteToSheet(data) {
	const body = new URLSearchParams()
	body.append('action', 'delete')
	body.append('rowNumber', String(data.sheetRowNumber || ''))
	body.append('ism', data.ism)
	body.append('telefon', data.telefon)
	body.append('tarif', data.tarif)
	body.append('tolangan', String(data.tolangan))
	body.append('qarz', String(data.qarz))
	body.append('sana', String(data.sana || ''))

	await fetch(POST_URL, {
		method: 'POST',
		mode: 'no-cors',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
		},
		body: body.toString(),
	})
}

function isMatchingClient(client, expectedData) {
	return (
		client.ism.toLowerCase() === String(expectedData.ism || '').trim().toLowerCase() &&
		client.telefon === String(expectedData.telefon || '').trim() &&
		client.tarif === String(expectedData.tarif || '').trim() &&
		client.tolangan === expectedData.tolangan &&
		client.qarz === expectedData.qarz &&
		String(client.sana || '').trim() === String(expectedData.sana || '').trim()
	)
}

function countMatchingClients(rows, expectedData) {
	return rows.filter(client => isMatchingClient(client, expectedData)).length
}

async function waitForClientSync(expectedData, initialRowCount, timeoutMs = 15000) {
	const startedAt = Date.now()

	while (Date.now() - startedAt < timeoutMs) {
		const rows = await fetchSheetRows()
		const parsedRows = rows.map(parseClientRow).filter(Boolean)
		const hasNewRow = parsedRows.length > initialRowCount
		const lastClient = parsedRows[parsedRows.length - 1]
		const isSynced =
			hasNewRow && lastClient && isMatchingClient(lastClient, expectedData)

		if (isSynced) return true
		await delay(500)
	}

	return false
}

async function waitForClientDelete(expectedData, initialMatchCount, timeoutMs = 15000) {
	const startedAt = Date.now()

	while (Date.now() - startedAt < timeoutMs) {
		const rows = await fetchSheetRows()
		const parsedRows = rows
			.map((row, rowPosition) => parseClientRow(row, rowPosition))
			.filter(Boolean)
		const currentMatchCount = countMatchingClients(parsedRows, expectedData)

		if (currentMatchCount < initialMatchCount) return true
		await delay(500)
	}

	return false
}

// 🚀 2. MODAL VA INPUTLARNI BOSHQARISH
function openModal() {
	const modal = document.getElementById('financeModal')
	if (modal) modal.style.display = 'block'
	togglePhoneInput()
}

function closeModal() {
	const modal = document.getElementById('financeModal')
	if (modal) modal.style.display = 'none'
}

function togglePhoneInput() {
	const type = document.getElementById('type').value
	const phoneInput = document.getElementById('phone')
	const tarifSelect = document.getElementById('tarif')
	const tarifLabel = document.querySelector('.label-tarif')

	const isKirim = type === 'kirim'
	if (phoneInput) phoneInput.style.display = isKirim ? 'block' : 'none'
	if (tarifSelect) tarifSelect.style.display = isKirim ? 'block' : 'none'
	if (tarifLabel) tarifLabel.style.display = isKirim ? 'block' : 'none'
}

function formatPhoneValue(value) {
	const digits = String(value || '')
		.replace(/\D/g, '')
		.slice(0, 9)

	const parts = []
	if (digits.length > 0) parts.push(digits.slice(0, 2))
	if (digits.length > 2) parts.push(digits.slice(2, 5))
	if (digits.length > 5) parts.push(digits.slice(5, 7))
	if (digits.length > 7) parts.push(digits.slice(7, 9))

	return parts.join(' ')
}

function setupPhoneFormatter() {
	const phoneInput = document.getElementById('phone')
	if (!phoneInput) return

	phoneInput.addEventListener('input', event => {
		event.target.value = formatPhoneValue(event.target.value)
	})
}

// 🚀 3. MA'LUMOTLARNI SHEETS'DAN OLISH (READ)
async function initDashboard() {
	const tableBody = document.getElementById('tableBody')
	if (tableBody)
		tableBody.innerHTML =
			'<tr><td colspan="6" style="text-align:center;">Yuklanmoqda... ⏳</td></tr>'

	try {
		const rows = await fetchSheetRows()

		let totalPaid = 0
		let totalDebt = 0
		let html = ''
		allData = []

		rows.forEach((row, rowPosition) => {
			const user = parseClientRow(row, rowPosition)
			if (!user) return

			const rowIndex = allData.length
			allData.push(user)
			totalPaid += user.tolangan
			totalDebt += user.qarz

			html += `
        <tr>
          <td>${user.sana}</td>
          <td>${user.telefon}</td>
          <td><b>${user.ism}</b></td>
          <td style="color:#20c997; font-weight:bold;">+${user.tolangan.toLocaleString()} UZS</td>
          <td><span class="${user.qarz > 0 ? 'type-out' : 'type-in'}">${user.qarz > 0 ? 'Qarz bor' : 'To\'langan'}</span></td>
          <td><button class="btn-delete-row" data-row-index="${rowIndex}">O'chirish</button></td>
        </tr>`
		})

		if (tableBody)
			tableBody.innerHTML =
				html || '<tr><td colspan="6">Ma\'lumot topilmadi</td></tr>'
		setupDeleteButtons()
		updateStatsUI(totalPaid, totalDebt)
	} catch (err) {
		console.error('Xatolik:', err)
	}
}

function setupDeleteButtons() {
	const buttons = document.querySelectorAll('.btn-delete-row')

	buttons.forEach(button => {
		button.addEventListener('click', async event => {
			const rowElement = event.currentTarget.closest('tr')
			const rowIndex = Number(event.currentTarget.dataset.rowIndex)
			const client = allData[rowIndex]
			if (!client) return

			const confirmed = window.confirm(
				`${client.ism} yozuvini o'chirmoqchimisiz?`,
			)
			if (!confirmed) return

			const beforeRows = await fetchSheetRows()
			const beforeParsedRows = beforeRows
				.map((row, rowPosition) => parseClientRow(row, rowPosition))
				.filter(Boolean)
			const initialMatchCount = countMatchingClients(beforeParsedRows, client)

			event.currentTarget.disabled = true
			event.currentTarget.innerText = 'O‘chmoqda...'

			try {
				await postDeleteToSheet(client)
				const deleted = await waitForClientDelete(client, initialMatchCount)

				if (!deleted) {
					throw new Error('Yozuv o‘chmadi yoki kechikdi')
				}

				if (rowElement) {
					rowElement.classList.add('row-removing')
					await delay(280)
				}

				await initDashboard()
				alert('Yozuv o‘chirildi ✅')
			} catch (error) {
				alert('O‘chirishda xatolik yuz berdi ❌')
				console.error(error)
				event.currentTarget.disabled = false
				event.currentTarget.innerText = "O'chirish"
			}
		})
	})
}

// 📊 4. STATISTIKA PANELINI YANGILASH
function updateStatsUI(paid, debt) {
	const cashEl = document.getElementById('cash')
	const debtEl = document.getElementById('debt')
	// Sheets-dagi summalarini chiqaradi
	if (cashEl) cashEl.innerText = paid.toLocaleString() + ' UZS'
	if (debtEl) debtEl.innerText = debt.toLocaleString() + ' UZS'
}

// ➕ 5. YANGI AMALIYOT QO'SHISH (FormData bilan)
async function addClient() {
	const modal = document.getElementById('financeModal')
	const saveBtn = document.querySelector('.save-btn')

	// 🚀 Formadagi barcha input va selectlardan ma'lumot yig'ish
	const inputs = modal.querySelectorAll('input, select')
	const formData = {}
	inputs.forEach(input => {
		if (input.id) formData[input.id] = input.value
	})

	// Validatsiya: Ism va Summa kiritilishi shart
	if (!formData.ism || !formData.amount) {
		alert('Iltimos, ism va summani kiriting!')
		return
	}

	const data = {
		ism: formData.ism,
		telefon: formData.phone || '',
		tarif: formData.tarif || 'GOLD',
		tolangan: parseInt(formData.amount) || 0,
		qarz: 0,
	}

	if (saveBtn) {
		saveBtn.disabled = true
		saveBtn.innerText = 'Yuborildi...'
	}

	try {
		const beforeRows = await fetchSheetRows()

		await postClientToSheet(data)

		if (saveBtn) {
			saveBtn.innerText = 'Tekshirilmoqda...'
		}

		const synced = await waitForClientSync(data, beforeRows.length)

		if (!synced) {
			throw new Error('Yozuv Sheetsda vaqtida ko‘rinmadi')
		}

		await initDashboard()

		alert('Saqlandi va Sheetsga tushdi ✅')
		closeModal()

		inputs.forEach(input => {
			if (input.type !== 'select-one') input.value = ''
		})
	} catch (err) {
		alert('Sheetsga tushmadi yoki kechikdi ❌')
		console.error(err)
	} finally {
		if (saveBtn) {
			saveBtn.disabled = false
			saveBtn.innerText = 'Saqlash'
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	setupPhoneFormatter()
	initDashboard()
})
