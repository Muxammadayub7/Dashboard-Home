// 🔗 1. KONFIGURATSIYA
const SHEET_ID = '1dFG3242L3t6f9W9odUWeeqj8QvCZjFaiJMk8-m11Afg';
const READ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=clients`;
const POST_URL =
	'https://script.google.com/macros/s/AKfycbz25cNXy1jriHUX2nT9k2_xI_ZOSEpJpoMjEstyH1-C82le4QuURt88gf6yGwpD5m-M/exec'

let allData = [];

function getNumericCell(cells, index) {
  const raw = cells[index]?.v;
  const value = parseFloat(raw);
  return Number.isNaN(value) ? 0 : value;
}

function formatSheetDate(cell) {
  if (!cell) return new Date().toLocaleDateString('uz-UZ');
  if (cell.f) return String(cell.f);

  const value = cell.v;
  if (value instanceof Date) {
    return value.toLocaleDateString('uz-UZ');
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return new Date().toLocaleDateString('uz-UZ');
}

function parseClientRow(row) {
  const c = row.c || [];
  if (!c[0] || c[0].v === null) return null;

  return {
    ism: String(c[0]?.v || '').trim(),
    telefon: String(c[1]?.f || c[1]?.v || '').trim(),
    tarif: String(c[2]?.v || '').trim(),
    tolangan: getNumericCell(c, 3),
    qarz: getNumericCell(c, 4),
    sana: formatSheetDate(c[5]),
  };
}

async function fetchSheetRows() {
  const res = await fetch(READ_URL);
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
  return json.table.rows || [];
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function postClientToSheet(data) {
  const body = new URLSearchParams();
  body.append('ism', data.ism);
  body.append('telefon', data.telefon);
  body.append('tarif', data.tarif);
  body.append('tolangan', String(data.tolangan));
  body.append('qarz', String(data.qarz));

  await fetch(POST_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
          body: body.toString(),
  });
}

function isMatchingClient(client, expectedData) {
  return (
    client.ism.toLowerCase() === String(expectedData.ism || '').trim().toLowerCase() &&
    client.telefon === String(expectedData.telefon || '').trim() &&
    client.tarif === String(expectedData.tarif || '').trim() &&
    client.tolangan === expectedData.tolangan &&
    client.qarz === expectedData.qarz
  );
}

async function waitForClientSync(expectedData, initialRowCount, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const rows = await fetchSheetRows();
    const parsedRows = rows.map(parseClientRow).filter(Boolean);
    const hasNewRow = parsedRows.length > initialRowCount;
    const lastClient = parsedRows[parsedRows.length - 1];
    const isSynced = hasNewRow && lastClient && isMatchingClient(lastClient, expectedData);

    if (isSynced) return true;
    await delay(500);
  }

  return false;
}

// 🚀 2. MODAL VA INPUTLARNI BOSHQARISH
function openModal() {
  const modal = document.getElementById('financeModal');
  if (modal) modal.style.display = 'block';
  togglePhoneInput(); 
}

function closeModal() {
  const modal = document.getElementById('financeModal');
  if (modal) modal.style.display = 'none';
}

function togglePhoneInput() {
  const type = document.getElementById('type').value;
  const phoneInput = document.getElementById('phone');
  const tarifSelect = document.getElementById('tarif');
  const tarifLabel = document.querySelector('.label-tarif');

  const isKirim = type === 'kirim';
  if (phoneInput) phoneInput.style.display = isKirim ? 'block' : 'none';
  if (tarifSelect) tarifSelect.style.display = isKirim ? 'block' : 'none';
  if (tarifLabel) tarifLabel.style.display = isKirim ? 'block' : 'none';
}

// 🚀 3. MA'LUMOTLARNI SHEETS'DAN OLISH (READ)
async function initDashboard() {
  const tableBody = document.getElementById('tableBody');
  if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yuklanmoqda... ⏳</td></tr>';

  try {
    const rows = await fetchSheetRows();

    let totalPaid = 0;
    let totalDebt = 0;
    let html = '';
    allData = [];

    rows.forEach((row) => {
      const user = parseClientRow(row);
      if (!user) return;

      const rowDelay = Math.min(allData.length * 60, 720);

      allData.push(user);
      totalPaid += user.tolangan;
      totalDebt += user.qarz;

      html += `
        <tr style="--row-delay:${rowDelay}ms">
          <td>${user.sana}</td>
          <td><b>${user.ism}</b></td>
          <td>${user.telefon}</td>
          <td><span class="badge-gold">${user.tarif || 'GOLD'}</span></td>
          <td style="color:#20c997; font-weight:bold;">+${user.tolangan.toLocaleString()} UZS</td>
          <td style="color:${user.qarz > 0 ? '#fa5252' : '#20c997'}; font-weight:bold;">
            ${user.qarz.toLocaleString()} UZS
          </td>
        </tr>`;
    });

    if (tableBody) tableBody.innerHTML = html || '<tr><td colspan="5">Ma\'lumot topilmadi</td></tr>';
    updateStatsUI(totalPaid, totalDebt);
  } catch (err) {
    console.error('Xatolik:', err);
  }
}

// 📊 4. STATISTIKA PANELINI YANGILASH
function updateStatsUI(paid, debt) {
  const cashEl = document.getElementById('cash');
  const debtEl = document.getElementById('debt');
  // Sheets-dagi summalarini chiqaradi
  if (cashEl) cashEl.innerText = paid.toLocaleString() + ' UZS';
  if (debtEl) debtEl.innerText = debt.toLocaleString() + ' UZS';
}

// ➕ 5. YANGI AMALIYOT QO'SHISH (FormData bilan)
async function addClient() {
  const modal = document.getElementById('financeModal');
  const saveBtn = document.querySelector('.save-btn');
  
  // 🚀 Formadagi barcha input va selectlardan ma'lumot yig'ish
  const inputs = modal.querySelectorAll('input, select');
  const formData = {};
  inputs.forEach(input => {
    if (input.id) formData[input.id] = input.value;
  });

  // Validatsiya: Ism va Summa kiritilishi shart
  if (!formData.ism || !formData.amount) {
    alert("Iltimos, ism va summani kiriting!");
    return;
  }

  const data = {
    ism: formData.ism,
    telefon: formData.phone || '',
    tarif: formData.tarif || 'GOLD',
    tolangan: parseInt(formData.amount) || 0,
    qarz: 0
  };

  if (saveBtn) { 
    saveBtn.disabled = true; 
    saveBtn.innerText = 'Yuborildi...'; 
  }

  try {
    const beforeRows = await fetchSheetRows();

    await postClientToSheet(data);

    if (saveBtn) {
      saveBtn.innerText = 'Tekshirilmoqda...';
    }

    const synced = await waitForClientSync(data, beforeRows.length);

    if (!synced) {
      throw new Error('Yozuv Sheetsda vaqtida ko‘rinmadi');
    }

    await initDashboard();

    alert("Saqlandi va Sheetsga tushdi ✅");
    closeModal();

    inputs.forEach(input => {
      if (input.type !== 'select-one') input.value = '';
    });
  } catch (err) {
    alert("Sheetsga tushmadi yoki kechikdi ❌");
    console.error(err);
  } finally {
    if (saveBtn) { 
      saveBtn.disabled = false; 
      saveBtn.innerText = 'Saqlash'; 
    }
  }
}

document.addEventListener('DOMContentLoaded', initDashboard);
