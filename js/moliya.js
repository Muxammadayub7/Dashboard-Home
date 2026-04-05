// 1. Modalni ochish va yopish
function openModal() {
	const modal = document.getElementById('financeModal')
	if (modal) {
		modal.style.display = 'block'
		togglePhoneInput()
	}
}

function closeModal() {
	const modal = document.getElementById('financeModal')
	if (modal) modal.style.display = 'none'
}

// 2. INPUTLARNI BOSHQARISH (JIHOZ BO'LSA YASHIRISH)
function togglePhoneInput() {
	const typeSelect = document.getElementById('type')
	const phoneInput = document.getElementById('phone')
	const descInput = document.getElementById('desc')
	const tarifSelect = document.getElementById('tarif')

	if (!typeSelect || !phoneInput || !descInput || !tarifSelect) return

	if (typeSelect.value === 'kirim') {
		phoneInput.style.display = 'block'
		tarifSelect.style.display = 'block'
		descInput.placeholder = 'Ism Familiya yoki Izoh'
	} else {
		phoneInput.style.display = 'none'
		phoneInput.value = ''
		tarifSelect.style.display = 'none'
		tarifSelect.value = ''
		descInput.placeholder =
			typeSelect.value === 'jihoz' ? 'Jihoz nomi' : 'Xarajat izohi'
	}
}

// 3. MA'LUMOTNI SAQLASH (MOLIYA + CLIENT BOG'LANISHI)
function saveTransaction() {
	const type = document.getElementById('type').value
	const desc = document.getElementById('desc').value // Bu ism bo'ladi
	const phone = document.getElementById('phone').value
	const amount = parseInt(document.getElementById('amount').value) || 0
	const tarif = document.getElementById('tarif').value

	if (!desc || !amount) {
		alert("Iltimos, barcha maydonlarni to'ldiring!")
		return
	}

	// A. Moliyaga saqlash
	const transaction = {
		id: Date.now(),
		date: new Date().toLocaleDateString(),
		type: type,
		desc: desc,
		phone: type === 'kirim' ? phone : 'Xarajat',
		amount: amount,
		tarif: tarif,
	}

	let history = JSON.parse(localStorage.getItem('financeHistory')) || []
	history.unshift(transaction)
	localStorage.setItem('financeHistory', JSON.stringify(history))

	// B. AGAR KIRIM BO'LSA, KLIENTLARNI YANGILASH
	if (type === 'kirim') {
		let clients = JSON.parse(localStorage.getItem('clients')) || []

		// Klientni ismi bo'yicha qidiramiz
		let clientIndex = clients.findIndex(
			c => c.ism.toLowerCase() === desc.toLowerCase(),
		)

		if (clientIndex !== -1) {
			// Bor klient bo'lsa, to'lovini qo'shamiz va qarzini kamaytiramiz
			clients[clientIndex].tolangan =
				(parseInt(clients[clientIndex].tolangan) || 0) + amount
			clients[clientIndex].qarz =
				(parseInt(clients[clientIndex].qarz) || 0) - amount
		} else {
			// Yangi klient bo'lsa qo'shamiz (Kurs narxi taxminan 4,200,000 deb olindi)
			const kursNarxi = 4200000
			clients.push({
				ism: desc,
				telefon: phone,
				tarif: tarif,
				tolangan: amount,
				qarz: kursNarxi - amount,
			})
		}
		localStorage.setItem('clients', JSON.stringify(clients))
	}

	closeModal()
	renderFinance()
}

// 4. JADVALNI CHIQARISH
function renderFinance() {
	const history = JSON.parse(localStorage.getItem('financeHistory')) || []
	const tbody = document.getElementById('financeBody')
	const totalInEl = document.getElementById('totalIn')
	const totalOutEl = document.getElementById('totalOut')

	let totalIn = 0
	let totalOut = 0
	if (tbody) tbody.innerHTML = ''

	history.forEach(item => {
		const sum = parseInt(item.amount) || 0
		if (item.type === 'kirim') totalIn += sum
		else totalOut += sum

		if (tbody) {
			tbody.innerHTML += `
            <tr>
                <td>${item.date}</td>
                <td><span class="${item.type === 'kirim' ? 'type-in' : 'type-out'}">${item.type.toUpperCase()}</span></td>
                <td>${item.desc} ${item.type === 'kirim' ? '(' + item.phone + ')' : ''}</td>
                <td class="${item.type === 'kirim' ? 'text-success' : 'text-danger'}">
                    ${item.type === 'kirim' ? '+' : '-'}${sum.toLocaleString()}
                </td>
                <td>✅ Yakunlandi</td>
            </tr>
        `
		}
	})

	if (totalInEl) totalInEl.innerText = totalIn.toLocaleString()
	if (totalOutEl) totalOutEl.innerText = totalOut.toLocaleString()
}

// 5. SAHIFA YUKLANGANDA
document.addEventListener('DOMContentLoaded', () => {
	renderFinance()
	const typeSelect = document.getElementById('type')
	if (typeSelect) {
		typeSelect.addEventListener('change', togglePhoneInput)
	}
})
