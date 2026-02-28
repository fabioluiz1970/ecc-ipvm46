/* -----------------------------------------
   UTILITÁRIOS DE LOCALSTORAGE
------------------------------------------*/
function load(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* -----------------------------------------
   DADOS PRINCIPAIS
------------------------------------------*/
let cadastro = load("cadastro");
let cronograma = load("cronograma");

/* -----------------------------------------
   CONTROLE DE ABAS
------------------------------------------*/
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");

        renderSabado();
        renderDomingo();
        renderResumo();
        renderTimeline();
    });
});

document.getElementById("cadastro").classList.add("active");

/* -----------------------------------------
   CADASTRO: CRIAÇÃO DE BASES
------------------------------------------*/
document.getElementById("cadastroForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const item = {
        id: Date.now(),
        dia: document.getElementById("cad-dia").value,
        local: document.getElementById("cad-local").value,
        equipe: document.getElementById("cad-equipe").value,
        atividade: document.getElementById("cad-atividade").value,
        acao: document.getElementById("cad-acao").value
    };

    cadastro.push(item);
    save("cadastro", cadastro);

    this.reset();
    renderCadastro();
    atualizarBasesNoCronograma();
});

/* -----------------------------------------
   RENDERIZAÇÃO DO CADASTRO
------------------------------------------*/
function renderCadastro() {
    const div = document.getElementById("cadastroLista");
    div.innerHTML = "";

    cadastro.forEach(item => {
        div.innerHTML += `
            <div class="lista-item">
                <strong>{item.equipe})
                <br>Dia: {item.local}
                <br>Ação: ${item.acao}
            </div>
        `;
    });
}

function atualizarBasesNoCronograma() {
    const select = document.getElementById("crono-base");
    select.innerHTML = `<option value="">Selecione</option>`;

    cadastro.forEach(item => {
        select.innerHTML += `
            <option value="${item.id}">
                {item.equipe})
            </option>
        `;
    });
}

/* -----------------------------------------
   CRONOGRAMA — ADICIONAR ATIVIDADE
------------------------------------------*/
document.getElementById("cronogramaForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const baseId = document.getElementById("crono-base").value;
    const base = cadastro.find(x => x.id == baseId);

    if (!base) return alert("Selecione uma base válida.");

    const inicioPrev = document.getElementById("crono-inicio-prev").value;
    const fimPrev = document.getElementById("crono-fim-prev").value;
    const inicioReal = document.getElementById("crono-inicio-real").value;
    const fimReal = document.getElementById("crono-fim-real").value;

    const item = {
        id: Date.now(),
        baseId: base.id,
        dia: base.dia,
        local: base.local,
        equipe: base.equipe,
        atividade: base.atividade,
        acao: base.acao,

        inicioPrev,
        fimPrev,
        inicioReal,
        fimReal,

        obs: document.getElementById("crono-obs").value
    };

    cronograma.push(item);
    save("cronograma", cronograma);

    this.reset();
    renderCronograma();
    renderSabado();
    renderDomingo();
    renderResumo();
    renderTimeline();
});

/* -----------------------------------------
   STATUS AUTOMÁTICO
------------------------------------------*/
function calcularStatus(item) {
    const agora = new Date();
    const horaAgora = agora.getHours().toString().padStart(2, "0") + ":" +
                      agora.getMinutes().toString().padStart(2, "0");

    if (!item.inicioReal && !item.fimReal) {
        return horaAgora < item.inicioPrev ? "nao-iniciado" : "atrasado";
    }

    if (item.inicioReal && !item.fimReal) return "andamento";
    if (item.fimReal && item.fimReal > item.fimPrev) return "atrasado";
    if (item.fimReal) return "concluido";

    return "nao-iniciado";
}

function corStatus(status) {
    return {
        "nao-iniciado": "status-nao-iniciado",
        "andamento": "status-andamento",
        "ok": "status-ok",
        "atrasado": "status-atrasado",
        "concluido": "status-concluido"
    }[status];
}

/* -----------------------------------------
   CRONOGRAMA — LISTAGEM GERAL
------------------------------------------*/
function renderCronograma() {
    const div = document.getElementById("cronogramaLista");
    div.innerHTML = "";

    const listaOrdenada = cronograma.sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    listaOrdenada.forEach(item => {
        const stats = calcularStatus(item);

        div.innerHTML += `
            <div class="lista-item">
                <strong>{item.equipe})
                <br>Previsto: {item.fimPrev}
                <br>Real: {item.fimReal || "-"}
                <br>Status: <span class="status {stats}</span>
                <br>Obs: ${item.obs || "-"}
            </div>
        `;
    });
}

/* -----------------------------------------
   ABA SÁBADO / DOMINGO
------------------------------------------*/
function renderDia(dia, divId) {
    const div = document.getElementById(divId);
    div.innerHTML = "";

    const lista = cronograma
        .filter(x => x.dia === dia)
        .sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    lista.forEach(item => {
        const stats = calcularStatus(item);

        div.innerHTML += `
            <div class="card">
                <strong>{item.equipe}
                <p>Local: ${item.local}</p>
                <p>Previsto: {item.fimPrev}</p>
                <p>Real: {item.fimReal || "-"}</p>
                <p>Status: <span class="status {stats}</span></p>
                <p>Obs: ${item.obs || "-"}</p>
            </div>
        `;
    });
}

function renderSabado() { renderDia("sabado", "listaSabado"); }
function renderDomingo() { renderDia("domingo", "listaDomingo"); }

/* -----------------------------------------
   RESUMO GERAL
------------------------------------------*/
function renderResumo() {
    const div = document.getElementById("resumoContainer");

    const total = cronograma.length;
    const concluidos = cronograma.filter(x => calcularStatus(x) === "concluido").length;
    const andamento = cronograma.filter(x => calcularStatus(x) === "andamento").length;
    const atrasados = cronograma.filter(x => calcularStatus(x) === "atrasado").length;

    div.innerHTML = `
        <div class="resumo-card">
            <h3>Total de Atividades</h3>
            <div class="resumo-num">${total}</div>
        </div>

        <div class="resumo-card">
            <h3>Concluídas</h3>
            <div class="resumo-num">${concluidos}</div>
        </div>

        <div class="resumo-card">
            <h3>Em andamento</h3>
            <div class="resumo-num">${andamento}</div>
        </div>

        <div class="resumo-card">
            <h3>Atrasadas</h3>
            <div class="resumo-num">${atrasados}</div>
        </div>
    `;
}

/* -----------------------------------------
   TIMELINE PROPORCIONAL
------------------------------------------*/
function renderTimeline() {
    const diaSelect = document.getElementById("timeline-dia").value;
    const div = document.getElementById("timelineContainer");
    div.innerHTML = "";

    const lista = cronograma
        .filter(x => x.dia === diaSelect)
        .sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    lista.forEach(item => {
        const start = parseInt(item.inicioPrev.replace(":", ""));
        const end = parseInt(item.fimPrev.replace(":", ""));
        const duracao = (end - start) * 0.2; // escala visual

        div.innerHTML += `
            <div class="timeline-item">
                <span class="timeline-time">${item.inicioPrev}</span>
                <div class="timeline-bar" style="width:${duracao}px"></div>
                <span class="timeline-time">${item.fimPrev}</span>
            </div>
        `;
    });
}

/* -----------------------------------------
   INICIALIZAÇÃO
------------------------------------------*/
renderCadastro();
atualizarBasesNoCronograma();
renderCronograma();
renderSabado();
renderDomingo();
renderResumo();
renderTimeline();