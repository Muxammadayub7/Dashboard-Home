const LOGIN_USERNAME = 'dashboard2026'
const LOGIN_PASSWORD = 'dashboard-2026'

function setPageLoading(isLoading) {
	const loader = document.getElementById('pageLoader')
	const loginBtn = document.getElementById('loginBtn')

	if (loader) {
		loader.classList.toggle('show', isLoading)
		loader.setAttribute('aria-hidden', String(!isLoading))
	}

	if (loginBtn) {
		loginBtn.disabled = isLoading
		loginBtn.innerText = isLoading ? 'Yuklanmoqda...' : 'Kirish'
	}
}

function redirectIfLoggedIn() {
	if (sessionStorage.getItem('isLoggedIn') === 'true') {
		setPageLoading(true)
		window.location.replace('home.html')
	}
}

function checkLogin() {
	const user = document.getElementById('username').value.trim()
	const pass = document.getElementById('password').value.trim()
	const errorEl = document.getElementById('error')

	if (user === LOGIN_USERNAME && pass === LOGIN_PASSWORD) {
		setPageLoading(true)
		sessionStorage.setItem('isLoggedIn', 'true')
		localStorage.removeItem('isLoggedIn')
		window.location.replace('home.html')
	} else {
		setPageLoading(false)
		sessionStorage.removeItem('isLoggedIn')
		localStorage.removeItem('isLoggedIn')
		if (errorEl) errorEl.style.display = 'block'
	}
}

function setupLoginForm() {
	const usernameEl = document.getElementById('username')
	const passwordEl = document.getElementById('password')
	const errorEl = document.getElementById('error')

	;[usernameEl, passwordEl].forEach(input => {
		if (!input) return
		input.addEventListener('input', () => {
			if (errorEl) errorEl.style.display = 'none'
		})
	})
}

document.addEventListener('keypress', function (e) {
	if (e.key === 'Enter') {
		checkLogin()
	}
})

document.addEventListener('DOMContentLoaded', () => {
	setPageLoading(false)
	redirectIfLoggedIn()
	setupLoginForm()
})
