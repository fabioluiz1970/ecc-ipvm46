let CRONO = [];
let PERFIL = "visitante";

/* LOGIN */
function iniciarLogin() {
    const modal = document.getElementById("login-modal");

    document.getElementById("btn-login").onclick = () => {
        PERFIL = document.getElementById("login-perfil").value;
        modal.style.display = "none";
        abrirModulo("cronograma");
        render();
    };
}

iniciarLogin();

/* MÓDULOS */
document.querySelectorAll("nav button").forEach(btn => {
    btn.onclick = () => abrirModulo(btn.dataset.target);
});

function abrirModulo(id) {
    document.querySelectorAll(".modulo").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

/* CALCULAR TEMPO */
function calcularTempo(ini, fim) {
    const [h1, m1] = ini.split(":").map(Number);
    const [h2, m2] = fim.split(":").map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
}

/* ADICIONAR ATIVIDADE */
function adicionarAtividade() {
    const nova = {
        dia: document.getElementById("dia").value,
        atividade: document.getElementById("atividade").value,
        local: document.getElementById("local").value,
        iniPrev: document.getElementById("iniPrev").value,
        fimPrev: document.getElementById("fimPrev").value,
        tempoPrev: calcularTempo(
            document.getElementById("iniPrev").value,
            document.getElementById("fimPrev").value
        ),
        observacoes: document.getElementById("obs").value,
        iniReal: "",
        fimReal: "",
        tempoReal: "",
        status: "não iniciado"
    };

    CRONO.push(nova);
    render();
}

/* RENDER CRONOGRAMA */
function renderCronograma() {
    const box = document.getElementById("listaCrono");
    box.innerHTML = "";

    CRONO.forEach(c => {
        box.innerHTML += `
        <div class="crono-card">
            <strong>${c.dia} – ${c.atividade}</strong><br>
            ${c.iniPrev} → ${c.fimPrev} (${c.tempoPrev} min)<br>
            Local: ${c.local}<br>
            Obs: ${c.observacoes}
        </div>
        `;
    });
}

/* OUTROS MÓDULOS */
function renderDashboard() {
    document.getElementById("dashboard").innerHTML = `<h2>Dashboard</h2>`;
}
function renderTimeline() {
    document.getElementById("timeline").innerHTML = `<h2>Timeline</h2>`;
}
function renderAcoes() {
    document.getElementById("acoes").innerHTML = `<h2>Ações</h2>`;
}
function renderImpressao() {
    document.getElementById("impressao").innerHTML = `
        <h2>Impressão</h2>
        <button class="btn-primary" onclick="window.print()">Imprimir</button>
    `;
}
function renderLink() {
    const url = window.location.href;
    document.getElementById("link").innerHTML = `
        <h2>QR Code</h2>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${url}">
    `;
}

/* RENDER GERAL */
function render() {
    renderCronograma();
    renderDashboard();
    renderTimeline();
    renderAcoes();
    renderImpressao();
    renderLink();
}
