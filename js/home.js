/**
 * Dashboard sahifasidagi statistika va raqamlarni jonlantirish
 */
function updateDashboardStats() {
	// 1. Moliya sahifasida saqlangan hamma ma'lumotlarni olamiz
	// Agar baza bo'sh bo'lsa, bo'sh massiv [] qaytaradi
	const history = JSON.parse(localStorage.getItem('financeHistory')) || []

	let totalIn = 0 // Jami Kirim (Doxod)
	let totalOut = 0 // Jami Chiqim (Rasxod)

	// 2. Bazadagi har bir amalni aylanib chiqib hisoblaymiz
	history.forEach(item => {
		// Raqamni matn ko'rinishidan butun son ko'rinishiga o'tkazamiz
		const amount = parseInt(item.amount) || 0

		if (item.type === 'kirim') {
			totalIn += amount // Agar turi kirim bo'lsa qo'shamiz
		} else if (item.type === 'chiqim') {
			totalOut += amount // Agar turi chiqim bo'lsa qo'shamiz
		}
	})

	// 3. Sof balansni hisoblaymiz
	const currentBalance = totalIn - totalOut

	// 4. HTML elementlarini topamiz
	const incomeEl = document.getElementById('income')
	const expenseEl = document.getElementById('expense')
	const balanceEl = document.getElementById('balance')

	// 5. Natijalarni chiroyli formatda ekranga chiqaramiz
	// toLocaleString() - raqamlarni 12,628,349 ko'rinishida ajratib beradi
	if (incomeEl) {
		incomeEl.innerText = totalIn.toLocaleString() + ' UZS'
	}

	if (expenseEl) {
		expenseEl.innerText = totalOut.toLocaleString() + ' UZS'
	}

	if (balanceEl) {
		balanceEl.innerText = currentBalance.toLocaleString() + ' UZS'

		// Agar balans minusga kirib ketsa, raqamni qizil rangda ko'rsatamiz
		if (currentBalance < 0) {
			balanceEl.style.color = '#e74c3c' // Qizil rang
		} else {
			balanceEl.style.color = '#2ecc71' // Yashil rang (ixtiyoriy)
		}
	}
}

/**
 * Sahifa to'liq yuklangandan so'ng funksiyani ishga tushirish
 * DOMContentLoaded - bu window.onload'dan ko'ra tezroq va xavfsizroq usul
 */
document.addEventListener('DOMContentLoaded', () => {
	updateDashboardStats()
})
