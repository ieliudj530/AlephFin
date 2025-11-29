/* AlephFin Lab - Logic v5.0 (Fixed & Robust) */

let auditChart = null;
let simChart = null;
let invChart = null;
let amoChart = null;
let levChart = null; // Gráfico Apalancamiento

// Configuración Visual (Verde Financiero)
Chart.defaults.color = '#6b7280';
Chart.defaults.font.family = "'Segoe UI', Roboto, sans-serif";
Chart.defaults.scale.grid.color = '#f3f4f6';

// --- NAVEGACIÓN ---
function showView(viewId) {
    // 1. Ocultar todas las vistas
    const views = ['view-home', 'view-audit', 'view-sim-interest', 'view-investment', 'view-amortization', 'view-strategies'];
    views.forEach(id => document.getElementById(id).classList.add('d-none'));
    
    // 2. Mostrar la elegida
    document.getElementById(`view-${viewId}`).classList.remove('d-none');
    
    // 3. Activar menú
    document.querySelectorAll('.list-group-item').forEach(li => li.classList.remove('active'));
    const navItem = document.getElementById(`nav-${viewId}`);
    if(navItem) navItem.classList.add('active');

    // 4. Inicializar gráficas vacías para evitar huecos blancos
    if (viewId === 'sim-interest' && !simChart) initEmptyChart('simChart', 'line', 'Define capital y tiempo');
    if (viewId === 'amortization' && !amoChart) initEmptyChart('amortizationChart', 'bar', 'Define el préstamo');
    if (viewId === 'investment' && !invChart) initEmptyChart('invChart', 'line', 'Define tu ahorro');
    if (viewId === 'strategies' && !levChart) initEmptyChart('levChart', 'bar', 'Define el negocio');
}

function initEmptyChart(canvasId, type, msg) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const config = { 
        type: type, 
        data: { labels: [], datasets: [] }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true } }, 
            plugins: { title: { display: true, text: msg } } 
        } 
    };
    
    if (canvasId === 'simChart') simChart = new Chart(ctx, config);
    if (canvasId === 'invChart') invChart = new Chart(ctx, config);
    if (canvasId === 'amortizationChart') amoChart = new Chart(ctx, config);
    if (canvasId === 'levChart') levChart = new Chart(ctx, config);
}

function toggleMenu() { document.getElementById("wrapper").classList.toggle("toggled"); }
function toggleMenuMobile() { if(window.innerWidth < 768) document.getElementById("wrapper").classList.remove("toggled"); }

// ------------------------------------------------------------------
// 1. SIMULADOR INTERÉS SIMPLE VS COMPUESTO (CORREGIDO)
// ------------------------------------------------------------------
function runSim() {
    // Usamos '|| 0' para que si está vacío no devuelva NaN (Not a Number)
    const P = parseFloat(document.getElementById('inpCapital').value) || 0;
    const r = parseFloat(document.getElementById('inpRate').value) || 0;
    const t = parseInt(document.getElementById('inpTime').value) || 0;

    // Validación suave: Si todo es 0, no calculamos, pero no rompemos la app
    if (P === 0 && r === 0 && t === 0) return;

    let labels = [], sData = [], cData = [];
    
    for (let i = 0; i <= t; i++) {
        labels.push("Año " + i);
        // Interés Simple: M = C * (1 + i*t)
        sData.push(P * (1 + (r/100 * i)));
        // Interés Compuesto: M = C * (1 + i)^t
        cData.push(P * Math.pow(1 + r/100, i));
    }

    // Actualizar Textos
    document.getElementById('valSimple').innerText = formatMoney(sData[t]);
    document.getElementById('valCompound').innerText = formatMoney(cData[t]);

    // Dibujar Gráfica
    const ctx = document.getElementById('simChart').getContext('2d');
    if (simChart) simChart.destroy();

    simChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Compuesto (La Bola de Nieve)',
                    data: cData,
                    borderColor: '#10b981', // Verde
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3
                },
                {
                    label: 'Simple (Lineal)',
                    data: sData,
                    borderColor: '#6b7280', // Gris
                    borderDash: [5,5],
                    fill: false,
                    tension: 0,
                    pointRadius: 0
                }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${formatMoney(c.raw)}` } }
            }
        }
    });
}

// ------------------------------------------------------------------
// 2. ESTRATEGIAS (APALANCAMIENTO Y TARJETA)
// ------------------------------------------------------------------
function calcLeverage() {
    const amount = parseFloat(document.getElementById('levAmount').value) || 0;
    const costRate = parseFloat(document.getElementById('levCost').value) || 0;
    const roiRate = parseFloat(document.getElementById('levRoi').value) || 0;

    const costMoney = amount * (costRate / 100);
    const profitMoney = amount * (roiRate / 100);
    const netResult = profitMoney - costMoney;

    const resEl = document.getElementById('levResult');
    const msgEl = document.getElementById('levMessage');
    resEl.innerText = formatMoney(netResult);
    
    if (netResult > 0) {
        resEl.className = "display-4 fw-bold text-success";
        msgEl.innerHTML = "<i class='bi bi-check-circle me-1'></i>Deuda Buena: El activo paga la deuda.";
        msgEl.className = "badge bg-success fs-6 mt-2 p-2";
    } else {
        resEl.className = "display-4 fw-bold text-danger";
        msgEl.innerHTML = "<i class='bi bi-x-circle me-1'></i>Deuda Mala: Estás perdiendo dinero.";
        msgEl.className = "badge bg-danger fs-6 mt-2 p-2";
    }

    const ctx = document.getElementById('levChart').getContext('2d');
    if (levChart) levChart.destroy();
    levChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Costo Anual Préstamo', 'Ganancia Anual Negocio'],
            datasets: [{
                label: 'Flujo de Dinero',
                data: [costMoney, profitMoney],
                backgroundColor: ['#ef4444', '#10b981'],
                borderRadius: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function calcCreditCard() {
    const spend = parseFloat(document.getElementById('ccSpend').value) || 0;
    const rate = parseFloat(document.getElementById('ccRate').value) || 0;
    
    // Estrategia Jinete Libre:
    // Dinero promedio flotante = Gasto Mensual * (45 días / 365 días) * 12 meses
    // Simplificado: Gasto * Tasa * (45/360) * 12
    const earnings = (spend * (rate/100) * (45/360)) * 12;
    
    document.getElementById('ccResult').innerText = formatMoney(earnings);
}

// ------------------------------------------------------------------
// 3. AMORTIZACIÓN (HACKEAR DEUDA)
// ------------------------------------------------------------------
function calcAmortization() {
    const P = parseFloat(document.getElementById('amoAmount').value) || 0;
    const i_anual = parseFloat(document.getElementById('amoRate').value) || 0;
    const n = parseInt(document.getElementById('amoMonths').value) || 0;
    const extra = parseFloat(document.getElementById('amoExtra').value) || 0;
    
    if (P === 0 || i_anual === 0 || n === 0) return;

    const i = (i_anual / 100) / 12; 
    const isPrice = document.getElementById('sysPrice').checked;

    const base = calcAmoLoop(P, i, n, isPrice, 0);
    const real = calcAmoLoop(P, i, n, isPrice, extra);

    document.getElementById('valQuota').innerText = formatMoney(real.firstQuota);
    
    // Alerta de Ahorro
    const alertBox = document.getElementById('savingsAlert');
    if (extra > 0 && real.months < n) {
        const savedMoney = base.totalInteres - real.totalInteres;
        const savedTime = n - real.months;
        document.getElementById('saveInterest').innerText = formatMoney(savedMoney);
        document.getElementById('saveTime').innerText = savedTime;
        alertBox.classList.remove('d-none');
    } else {
        alertBox.classList.add('d-none');
    }

    renderAmoTable(real.table);
    renderAmoChart(real.table);
}

function calcAmoLoop(P, i, n, isPrice, extra) {
    let table = [], saldo = P, totalInteres = 0;
    let cuotaFija = (isPrice && i>0) ? P*(i*Math.pow(1+i,n))/(Math.pow(1+i,n)-1) : P/n;
    let amortConstante = P/n;
    let firstQuota = 0;

    // Loop con límite de seguridad (n + 20 años extra)
    for (let mes = 1; mes <= n + 240; mes++) {
        if(saldo <= 0.1) break; // Deuda pagada

        let interes = saldo * i;
        let capital;

        if (isPrice) {
            capital = cuotaFija - interes;
            if (capital < 0) capital = 0;
        } else {
            capital = amortConstante;
        }

        let capitalReal = capital + extra;
        if (capitalReal > saldo) capitalReal = saldo;

        let cuota = interes + capitalReal;
        saldo -= capitalReal;
        totalInteres += interes;

        if(mes === 1) firstQuota = cuota;
        table.push({ mes, cuota, interes, capital: capitalReal, saldo });
    }
    return { table, totalInteres, firstQuota, months: table.length };
}

function renderAmoTable(data) {
    const tbody = document.querySelector('#amortizationTable tbody');
    tbody.innerHTML = '';
    let sums = {c:0, i:0, k:0};
    data.forEach(r => {
        sums.c+=r.cuota; sums.i+=r.interes; sums.k+=r.capital;
        tbody.innerHTML += `<tr><td class="text-center fw-bold text-muted">${r.mes}</td><td>${formatMoney(r.cuota)}</td><td class="text-danger">${formatMoney(r.interes)}</td><td class="text-success">${formatMoney(r.capital)}</td><td class="text-muted">${formatMoney(r.saldo)}</td></tr>`;
    });
    tbody.innerHTML += `<tr class="table-dark text-white"><td class="text-center">TOTAL</td><td>${formatMoney(sums.c)}</td><td class="text-danger fw-bold">${formatMoney(sums.i)}</td><td class="text-success fw-bold">${formatMoney(sums.k)}</td><td>-</td></tr>`;
}

function renderAmoChart(data) {
    const ctx = document.getElementById('amortizationChart').getContext('2d');
    if (amoChart) amoChart.destroy();
    amoChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.mes),
            datasets: [
                { label: 'Interés Pagado', data: data.map(d => d.interes), backgroundColor: '#ef4444' },
                { label: 'Capital Pagado', data: data.map(d => d.capital), backgroundColor: '#10b981' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } }
    });
}

// ------------------------------------------------------------------
// 4. PLAN DE RETIRO
// ------------------------------------------------------------------
function calcInvestment() {
    const P = parseFloat(document.getElementById('invInitial').value) || 0;
    const M = parseFloat(document.getElementById('invMonthly').value) || 0;
    const r_anual = parseFloat(document.getElementById('invRate').value) || 0;
    const t_years = parseFloat(document.getElementById('invYears').value) || 0;

    if (t_years === 0) return;

    const r = (r_anual / 100) / 12;
    const n = t_years * 12;

    let labels = [], dataTotal = [], dataContrib = [];
    let currentTotal = P, currentContrib = P;

    for (let i = 0; i <= n; i++) {
        if(i % 12 === 0) labels.push("Año " + (i/12)); else labels.push("");
        
        dataTotal.push(currentTotal);
        dataContrib.push(currentContrib);

        if (i < n) {
            currentTotal = (currentTotal + M) * (1 + r);
            currentContrib += M;
        }
    }

    const finalTotal = dataTotal[dataTotal.length-1];
    const finalContrib = dataContrib[dataContrib.length-1];

    document.getElementById('valTotalContrib').innerText = formatMoney(finalContrib);
    document.getElementById('valTotalInterest').innerText = formatMoney(finalTotal - finalContrib);

    const ctx = document.getElementById('invChart').getContext('2d');
    if (invChart) invChart.destroy();
    invChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.filter(l => l !== ""),
            datasets: [
                { label: 'Dinero Total', data: dataTotal.filter((_,i)=>i%12===0), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.2)', fill: true },
                { label: 'Tus Aportes', data: dataContrib.filter((_,i)=>i%12===0), borderColor: '#374151', backgroundColor: 'rgba(0,0,0,0.05)', fill: true }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ------------------------------------------------------------------
// 5. AUDITORÍA REAL (TWR / MWR)
// ------------------------------------------------------------------
document.getElementById('fileInput').addEventListener('change', (evt) => {
    const file = evt.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        processPortfolioData(json);
    };
    reader.readAsArrayBuffer(file);
});

function processPortfolioData(rows) {
    const rawData = rows.filter(r => r.length >= 3 && !isNaN(parseDateExcel(r[0]).getTime()));
    const transactions = rawData.map(r => ({ date: parseDateExcel(r[0]), flow: parseFloat(r[1]) || 0, balance: parseFloat(r[2]) || 0 })).sort((a,b) => a.date - b.date);

    if (transactions.length < 2) return alert("Faltan datos en el Excel.");

    const twr = calculateTWR(transactions);
    const mwr = calculateXIRR(transactions);
    const profit = transactions[transactions.length-1].balance - transactions.reduce((s, t) => s + t.flow, 0);

    document.getElementById('val-twr').innerText = (twr * 100).toFixed(2) + "%";
    document.getElementById('val-mwr').innerText = (mwr * 100).toFixed(2) + "%";
    document.getElementById('val-profit').innerText = formatMoney(profit);
    document.getElementById('val-profit').className = `display-6 fw-bold mt-2 ${profit >= 0 ? 'text-success' : 'text-danger'}`;

    const ctx = document.getElementById('auditChart').getContext('2d');
    if (auditChart) auditChart.destroy();
    let costs = [], run = 0; transactions.forEach(d => { run += d.flow; costs.push(run); });
    
    auditChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: transactions.map(d => d.date.toLocaleDateString()),
            datasets: [
                { label: 'Valor Cartera', data: transactions.map(d => d.balance), borderColor: '#10b981', fill: true, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
                { label: 'Costo Neto', data: costs, borderColor: '#333', borderDash: [5,5], fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    document.getElementById('upload-area').classList.add('d-none');
    document.getElementById('results-area').classList.remove('d-none');
}

function calculateTWR(data) {
    let g = 1.0;
    for (let i = 1; i < data.length; i++) {
        const start = data[i-1].balance;
        const end = data[i].balance - data[i].flow;
        if (start > 0) g *= (1 + (end - start) / start);
    }
    return g - 1;
}

function calculateXIRR(data) {
    let x0 = 0.1; const t0 = data[0].date;
    const cfs = data.map(d => ({ v: -d.flow, d: (d.date-t0)/86400000 }));
    cfs.push({ v: data[data.length-1].balance, d: (data[data.length-1].date-t0)/86400000 });
    for(let i=0; i<100; i++) {
        let fv=0, fd=0;
        for(const c of cfs) {
            if(c.v === 0) continue;
            const f = Math.pow(1+x0, c.d/365);
            fv += c.v/f; fd += -c.v*(c.d/365)/(f*(1+x0));
        }
        const x1 = x0 - fv/fd;
        if(Math.abs(x1-x0)<1e-6) return x1;
        x0 = x1;
    }
    return x0;
}

// --- UTILS ---
function formatMoney(v) { return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(v); }
function parseDateExcel(val) { if(typeof val==='number') return new Date(Math.round((val-25569)*86400*1000)); return new Date(val); }
function downloadTemplate() { const csv = "data:text/csv;charset=utf-8,Fecha,Flujo,Saldo\n2023-01-01,1000,1000\n2023-02-01,500,1550"; const l = document.createElement("a"); l.href = encodeURI(csv); l.download = "plantilla.csv"; document.body.appendChild(l); l.click(); }
document.addEventListener('DOMContentLoaded', () => { const mb = document.getElementById('menu-toggle'); if(mb) mb.addEventListener('click', (e) => { e.preventDefault(); toggleMenu(); }); });