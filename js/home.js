// 🔗 Sening eng oxirgi (Version 8) URL-manziling
const WEB_APP_URL =
	'https://script.google.com/macros/s/AKfycbx8Vy2VdLJhPe_PxSe8IXC7aUGpxv-y2G8MkVOBmvrc491WlvhMIvoTSa68ObQStfwF/exec'

function updateDashboardStats() {
	// 1. Google'dan javob kelganda ishlaydigan funksiya
	window.handleResponse = function (data) {
		console.log("Sheetsdan kelgan ma'lumot:", data)

		const fmt = val => {
			if (!val || val === 'null' || val === 'undefined' || val === '')
				return '0 UZS'
			// Raqam bo'lmagan hamma narsani tozalaymiz (bo'sh joy, so'm va h.k)
			const cleanNum = String(val).replace(/[^0-9]/g, '')
			const num = parseInt(cleanNum) || 0
			return num.toLocaleString('uz-UZ') + ' UZS'
		}

		// 2. HTML ID-larni Google'dan kelgan kalitlar bilan bog'laymiz
		const mapping = {
			totalSales: data.sales, // doGet ichidagi 'sales'
			income: data.income, // doGet ichidagi 'income'
			expense: data.expense, // doGet ichidagi 'expense'
			balance: data.balance, // doGet ichidagi 'balance'
		}

		for (let id in mapping) {
			const el = document.getElementById(id)
			if (el) {
				el.innerText = fmt(mapping[id])
			}
		}
	}

	// 3. Script element yaratib, ma'lumotni chaqiramiz (JSONP usuli)
	const script = document.createElement('script')
	// t= parametri keshni oldini oladi, callback= bizning funksiyani ulaydi
	script.src = `${WEB_APP_URL}?callback=handleResponse&t=${new Date().getTime()}`
	document.body.appendChild(script)
}

document.addEventListener('DOMContentLoaded', updateDashboardStats)
