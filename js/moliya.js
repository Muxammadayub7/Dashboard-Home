// 🔗 1. KONFIGURATSIYA
const SHEET_ID = '1dFG3242L3t6f9W9odUWeeqj8QvCZjFaiJMk8-m11Afg'
const READ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=clients`
const POST_URL =
	'https://script.google.com/macros/s/AKfycbx8Vy2VdLJhPe_PxSe8IXC7aUGpxv-y2G8MkVOBmvrc491WlvhMIvoTSa68ObQStfwF/exec'

let allData = []

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

// 🚀 3. MA'LUMOTLARNI SHEETS'DAN OLISH (READ)
async function initDashboard() {
	const tableBody = document.getElementById('tableBody')
	if (tableBody)
		tableBody.innerHTML =
			'<tr><td colspan="5" style="text-align:center;">Yuklanmoqda... ⏳</td></tr>'

	try {
		const res = await fetch(READ_URL)
		const text = await res.text()
		const json = JSON.parse(
			text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1),
		)
		const rows = json.table.rows

		let totalPaid = 0
		let totalDebt = 0
		let html = ''
		allData = []

		rows.forEach(row => {
			const c = row.c
			if (!c || !c[0] || c[0].v === null) return

			// ⚠️ REAL USTUNLAR (image_55337d.png asosida):
			// A(0)=Ism, B(1)=Tel, G(6)=Jami to'langan, H(7)=Debt
			const user = {
				ism: c[0]?.v || '',
				telefon: c[1]?.v || '',
				tolangan: parseFloat(c[6]?.v) || 0, // G ustun
				qarz: parseFloat(c[7]?.v) || 0, // H ustun
			}

			allData.push(user)
			totalPaid += user.tolangan
			totalDebt += user.qarz

			html += `
        <tr>
          <td>${new Date().toLocaleDateString()}</td>
          <td><b>${user.ism}</b></td>
          <td>${user.telefon}</td>
          <td style="color:#20c997; font-weight:bold;">+${user.tolangan.toLocaleString()} UZS</td>
          <td style="color:${user.qarz > 0 ? '#fa5252' : '#20c997'}; font-weight:bold;">
            ${user.qarz.toLocaleString()} UZS
          </td>
        </tr>`
		})

		if (tableBody)
			tableBody.innerHTML =
				html || '<tr><td colspan="5">Ma\'lumot topilmadi</td></tr>'
		updateStatsUI(totalPaid, totalDebt)
	} catch (err) {
		console.error('Xatolik:', err)
	}
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
		saveBtn.innerText = 'Saqlash...'
	}

	try {
		await fetch(POST_URL, {
			method: 'POST',
			mode: 'no-cors',
			body: JSON.stringify(data),
		})

		alert('Saqlandi! ✅')
		closeModal()

		// Formani tozalash
		inputs.forEach(input => {
			if (input.type !== 'select-one') input.value = ''
		})

		setTimeout(initDashboard, 1500)
	} catch (err) {
		alert('Xatolik yuz berdi ❌')
		console.error(err)
	} finally {
		if (saveBtn) {
			saveBtn.disabled = false
			saveBtn.innerText = 'Saqlash'
		}
	}
}

document.addEventListener('DOMContentLoaded', initDashboard)
