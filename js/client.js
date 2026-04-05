// 1. Dastlabki (statik) ma'lumotlar massivi
const staticData = [
	{
		name: 'Vazira',
		phone: '94 480 53 51',
		tarif: 'GOLD',
		paid: 4800000,
		debt: -600000,
	},
	{
		name: 'Zulxumor',
		phone: '94 375 63 63',
		tarif: 'GOLD',
		paid: 3500000,
		debt: 700000,
	},
	// ... qolgan statik ma'lumotlaringni shu yerda qoldir
]

function initDashboard() {
	const tableBody = document.getElementById('tableBody')
	// 2. LocalStorage'dan yangi qo'shilgan klientlarni olamiz
	const localClients = JSON.parse(localStorage.getItem('clients')) || []

	// 3. Statik va dinamik ma'lumotlarni bitta ro'yxatga birlashtiramiz
	// Bunda statik massivdagi ismlarni localStorage'ga moslab formatlaymiz
	const formattedStatic = staticData.map(d => ({
		ism: d.name,
		telefon: d.phone,
		tarif: d.tarif,
		tolangan: d.paid,
		qarz: d.debt,
	}))

	// LocalStorage'dagi klientlar bilan statik klientlarni birlashtirish
	// (Ismi bir xil bo'lsa, localStorage'dagisini ustun qo'yish mantiqi ham qo'shilishi mumkin)
	const allClients = [...localClients]

	// Statik ma'lumotlarni qo'shish (agar u yerda hali yo'q bo'lsa)
	formattedStatic.forEach(s => {
		if (!allClients.find(c => c.ism.toLowerCase() === s.ism.toLowerCase())) {
			allClients.push(s)
		}
	})

	let totalPaid = 0
	let totalDebt = 0
	let htmlContent = ''

	allClients.forEach(user => {
		totalPaid += parseInt(user.tolangan) || 0
		totalDebt += parseInt(user.qarz) || 0

		const debtClass = user.qarz < 0 ? 'text-success' : 'text-danger' // Manfiy qarz - bu ortiqcha to'lov
		const tarifBadge = user.tarif === 'GOLD' ? 'badge-gold' : 'badge-standard'

		htmlContent += `
      <tr>
        <td><b>${user.ism}</b></td>
        <td>${user.telefon}</td>
        <td><span class="${tarifBadge}">${user.tarif}</span></td>
        <td>${(parseInt(user.tolangan) || 0).toLocaleString()} UZS</td>
        <td><span class="${debtClass}">${(parseInt(user.qarz) || 0).toLocaleString()} UZS</span></td>
      </tr>
    `
	})

	if (tableBody) tableBody.innerHTML = htmlContent

	// Tepadi statistika raqamlarini yangilash
	if (document.getElementById('cash'))
		document.getElementById('cash').innerText =
			totalPaid.toLocaleString() + ' UZS'
	if (document.getElementById('debt'))
		document.getElementById('debt').innerText =
			totalDebt.toLocaleString() + ' UZS'
	if (document.getElementById('total'))
		document.getElementById('total').innerText =
			(totalPaid + Math.max(0, totalDebt)).toLocaleString() + ' UZS'
}

// Sahifa yuklanganda ishga tushirish
document.addEventListener('DOMContentLoaded', initDashboard)
