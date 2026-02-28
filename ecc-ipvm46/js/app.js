let CRONO = [];
let PERFIL = "visitante";

/* ==================== LOGIN ==================== */

function iniciarLogin() {
    const modal = document.getElementById("login-modal");
    modal.classList.remove("hidden");

    document.getElementById("btn-login").onclick = () => {
        let perfil = document.getElementById("login-perfil").value;
        let senha = document.getElementById("login-senha").value;

        if ((perfil === "admin" || perfil === "equipe") && senha.trim() === "") {
            document.getElementById("login-erro").innerText = "Senha incorreta.";
            return;
        }

        PERFIL = perfil;
        modal.classList.add("hidden");

        abrirModulo("cronograma");
        render();
    };
}

/* ==================== NAVEGAÇÃO ==================== */

function abrirModulo(id) {
    document.querySelectorAll(".modulo").forEach(m => m.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

document.querySelectorAll("nav button").forEach(b => {
    b.onclick = () => abrirModulo(b.dataset.target);
});

/* ==================== CÁLCULO TEMPO ==================== */

function calcularTempo(ini, fim) {
    const [h1, m1] = ini.split(":").map(Number);
    const [h2, m2] = fim.split(":").map(Number);
    const total = (h2 * 60 + m2) - (h1 * 60 + m1);
    return total > 0 ? total : 0;
}

/* ==================== ADICIONAR ATIVIDADE ==================== */

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

/* ==================== RENDER DO CRONOGRAMA ==================== */

function renderCronograma() {
    let box = document.getElementById("listaCrono");
    box.innerHTML = "";

    CRONO.forEach((item, i) => {
        box.innerHTML += `
            <div class="crono-card">
                <strong>${item.dia} – ${item.atividade}</strong><br>
                Início: ${item.iniPrev} – Fim: ${item.fimPrev}<br>
                Tempo: ${item.tempoPrev} min<br>
                Local: ${item.local}<br>
                Obs: ${item.observacoes || "-"}
            </div>
        `;
    });
}

/* ==================== OUTROS MÓDULOS ==================== */

function renderDashboard() {
    document.getElementById("dashboard").innerHTML = "<h2>Dashboard</h2>";
}

function renderTimeline() {
    document.getElementById("timeline").innerHTML = "<h2>Timeline</h2>";
}

function renderAcoes() {
    document.getElementById("acoes").innerHTML = "<h2>Ações</h2>";
}

function renderImpressao() {
    document.getElementById("impressao").innerHTML = `
        <h2>Impressão</h2>
        <button class="btn-primary" onclick="window.print()">Imprimir</button>
    `;
}

function renderLink() {
    let url = window.location.href;
    document.getElementById("link").innerHTML = `
        <h2>QR Code</h2>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${url}">
    `;
}

/* ==================== RENDER GERAL ==================== */

function render() {
    renderCronograma();
    renderDashboard();
    renderTimeline();
    renderAcoes();
    renderImpressao();
    renderLink();
}

/* ==================== INICIAR ==================== */

iniciarLogin();