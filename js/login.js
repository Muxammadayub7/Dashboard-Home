function checkLogin() {
	const user = document.getElementById('username').value
	const pass = document.getElementById('password').value

	// Sen so'ragan login: dashboard2026 va parol: dashboard-2026
	if (user === 'dashboard2026' && pass === 'dashboard-2026') {
		localStorage.setItem('isLoggedIn', 'true') // Kirish muvaffaqiyatli
		window.location.href = 'home.html' // Dashboardga o'tish
	} else {
		const errorEl = document.getElementById('error')
		if (errorEl) errorEl.style.display = 'block'
	}
}

// Enter bosilganda ham kirish
document.addEventListener('keypress', function (e) {
	if (e.key === 'Enter') {
		checkLogin()
	}
})
