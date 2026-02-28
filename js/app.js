/* -----------------------------------------
   UTILITÁRIOS — LOCALSTORAGE
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

        renderTudo();
    });
});

document.getElementById("cadastro").classList.add("active");

/* -----------------------------------------
   CADASTRO — INCLUIR BASES
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
   CADASTRO — LISTAR / EXCLUIR
------------------------------------------*/
function renderCadastro() {
    const div = document.getElementById("cadastroLista");
    div.innerHTML = "";

    cadastro.forEach(item => {
        div.innerHTML += `
            <div class="lista-item lista-flex">
                <div>
                    <strong>{item.equipe})
                    <br>Dia: {item.local}
                    <br>Ação: ${item.acao}
                </div>

                <div class="lista-btns">
                    <button class="btn-excluir" onclick="deleteCadastro(${item.id})">Excluir</button>
                </div>
            </div>
        `;
    });
}

function deleteCadastro(id) {
    cadastro = cadastro.filter(x => x.id !== id);
    save("cadastro", cadastro);
    renderCadastro();
    atualizarBasesNoCronograma();
}

/* -----------------------------------------
   CRONOGRAMA — PREENCHER BASES
------------------------------------------*/
function atualizarBasesNoCronograma() {
    const select = document.getElementById("crono-base");
    select.innerHTML = "<option value=''>Selecione</option>";

    cadastro.forEach(item => {
        select.innerHTML += `
            <option value="${item.id}">
                {item.equipe})
            </option>
        `;
    });
}

/* -----------------------------------------
   CRONOGRAMA — INCLUIR ATIVIDADE PREVISTA
------------------------------------------*/
document.getElementById("cronogramaForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const baseId = parseInt(document.getElementById("crono-base").value);
    const base = cadastro.find(x => x.id === baseId);

    if (!base) return alert("Selecione uma base válida.");

    const inicioPrev = document.getElementById("crono-inicio-prev").value;
    const fimPrev = document.getElementById("crono-fim-prev").value;

    const tempoPrev = calcularTempo(inicioPrev, fimPrev);

    const item = {
        id: Date.now(),
        numero: cronograma.length + 1,
        baseId: base.id,
        dia: base.dia,
        local: base.local,
        equipe: base.equipe,
        atividade: base.atividade,
        acao: base.acao,
        inicioPrev,
        fimPrev,
        tempoPrev,
        inicioReal: "",
        fimReal: "",
        obs: document.getElementById("crono-obs").value
    };

    cronograma.push(item);
    save("cronograma", cronograma);

    this.reset();
    renderCronograma();
});

/* -----------------------------------------
   CALCULAR TEMPO (PREVISTO)
------------------------------------------*/
function calcularTempo(inicio, fim) {
    const [ih, im] = inicio.split(":").map(Number);
    const [fh, fm] = fim.split(":").map(Number);

    const total = (fh * 60 + fm) - (ih * 60 + im);
    const h = Math.floor(total / 60);
    const m = total % 60;

    return `{m}m`;
}

/* -----------------------------------------
   CRONOGRAMA — LISTAGEM E EXCLUIR
------------------------------------------*/
function renderCronograma() {
    const div = document.getElementById("cronogramaLista");
    div.innerHTML = "";

    const lista = [...cronograma].sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    lista.forEach(item => {
        div.innerHTML += `
            <div class="lista-item lista-flex">
                <div>
                    <strong>{item.atividade}</strong> (${item.equipe})
                    <br>{item.fimPrev} (${item.tempoPrev})
                    <br>Local: ${item.local}
                    <br>Ação: ${item.acao}
                    <br>Obs: ${item.obs || "-"}
                </div>

                <div class="lista-btns">
                    <button class="btn-excluir" onclick="deleteCronograma(${item.id})">Excluir</button>
                </div>
            </div>
        `;
    });
}

function deleteCronograma(id) {
    cronograma = cronograma.filter(x => x.id !== id);

    // renumerar
    cronograma.forEach((x, i) => x.numero = i + 1);

    save("cronograma", cronograma);
    renderCronograma();
}

/* -----------------------------------------
   STATUS — REGRA FINAL (OPÇÃO A)
------------------------------------------*/
function statusAtividade(item) {
    if (!item.inicioReal && !item.fimReal) return "nao-iniciado";
    if (item.inicioReal && !item.fimReal) return "andamento";
    if (item.fimReal <= item.fimPrev) return "ok";
    if (item.fimReal > item.fimPrev) return "atrasado";
    return "nao-iniciado";
}

/* -----------------------------------------
   CARDS — EXECUÇÃO (SÁBADO E DOMINGO)
------------------------------------------*/
function renderDia(dia, divId) {
    const div = document.getElementById(divId);
    div.innerHTML = "";

    const lista = cronograma
        .filter(x => x.dia === dia)
        .sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    lista.forEach(item => {
        const st = statusAtividade(item);

        div.innerHTML += `
            <div class="card">
                <strong>{item.atividade}</strong> — ${item.equipe}
                <p>Local: ${item.local}</p>
                <p>Previsto: {item.fimPrev} (${item.tempoPrev})</p>

                <label>Início real:</label>
                <input type="time" value="{item.id}, this.value)">

                <label>Fim real:</label>
                <input type="time" value="{item.id}, this.value)">

                <p>Status: <span class="status status-{st}</span></p>
            </div>
        `;
    });
}

function setInicioReal(id, val) {
    const item = cronograma.find(x => x.id === id);
    item.inicioReal = val;
    save("cronograma", cronograma);
    renderTudo();
}

function setFimReal(id, val) {
    const item = cronograma.find(x => x.id === id);
    item.fimReal = val;
    save("cronograma", cronograma);
    renderTudo();
}

function renderSabado() { renderDia("sabado", "listaSabado"); }
function renderDomingo() { renderDia("domingo", "listaDomingo"); }

/* -----------------------------------------
   RESUMO GERAL
------------------------------------------*/
function renderResumo() {
    const div = document.getElementById("resumoContainer");

    const total = cronograma.length;
    const concluidas = cronograma.filter(x => statusAtividade(x) === "ok").length;
    const andamento = cronograma.filter(x => statusAtividade(x) === "andamento").length;
    const atrasadas = cronograma.filter(x => statusAtividade(x) === "atrasado").length;

    div.innerHTML = `
        <div class="resumo-card">
            <h3>Total de Atividades</h3>
            <div class="resumo-num">${total}</div>
        </div>

        <div class="resumo-card">
            <h3>Concluídas</h3>
            <div class="resumo-num">${concluidas}</div>
        </div>

        <div class="resumo-card">
            <h3>Em andamento</h3>
            <div class="resumo-num">${andamento}</div>
        </div>

        <div class="resumo-card">
            <h3>Atrasadas</h3>
            <div class="resumo-num">${atrasadas}</div>
        </div>
    `;
}

/* -----------------------------------------
   TIMELINE — BARRAS PROPORCIONAIS
------------------------------------------*/
function renderTimeline() {
    const diaSel = document.getElementById("timeline-dia").value;
    const div = document.getElementById("timelineContainer");
    div.innerHTML = "";

    const lista = cronograma
        .filter(x => x.dia === diaSel)
        .sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    lista.forEach(item => {
        const start = parseInt(item.inicioPrev.replace(":", ""));
        const end = parseInt(item.fimPrev.replace(":", ""));
        const duracao = Math.max((end - start) * 0.15, 20);

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
   REENDERIZA TUDO
------------------------------------------*/
function renderTudo() {
    renderCadastro();
    atualizarBasesNoCronograma();
    renderCronograma();
    renderSabado();
    renderDomingo();
    renderResumo();
    renderTimeline();
}

renderTudo();