/* =======================================================
   1. UTILITÁRIOS E DADOS (OFFLINE)
======================================================== */
const load = (key, defaultVal) => JSON.parse(localStorage.getItem(key)) || defaultVal;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// O Cadastro agora é um objeto com 4 listas independentes
let params = load("ecc_params", { locais: [], equipes: [], atividades: [], acoes: [] });
let cronograma = load("ecc_cronograma", []);

/* =======================================================
   2. NAVEGAÇÃO DAS ABAS
======================================================== */
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
        renderAll();
    });
});

/* =======================================================
   3. CADASTRO DE PARÂMETROS (INCLUIR / EXCLUIR)
======================================================== */
function addParam(tipo, inputId) {
    const input = document.getElementById(inputId);
    const val = input.value.trim();
    if (val) {
        params[tipo].push(val);
        save("ecc_params", params);
        input.value = "";
        renderAll();
    }
}

function delParam(tipo, index) {
    if(confirm("Excluir este item?")) {
        params[tipo].splice(index, 1);
        save("ecc_params", params);
        renderAll();
    }
}

/* =======================================================
   4. CRONOGRAMA (PREVISTO)
======================================================== */
function calcularDuracao(inicio, fim) {
    if (!inicio || !fim) return "0h 0m";
    const [ih, im] = inicio.split(":").map(Number);
    const [fh, fm] = fim.split(":").map(Number);
    let totalMinutos = (fh * 60 + fm) - (ih * 60 + im);
    if (totalMinutos < 0) totalMinutos += 24 * 60; // Vira a meia-noite
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return `{m}m`;
}

document.getElementById("cronogramaForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const inicioPrev = document.getElementById("crono-inicio-prev").value;
    const fimPrev = document.getElementById("crono-fim-prev").value;

    const item = {
        id: Date.now(),
        numero: cronograma.length + 1,
        dia: document.getElementById("crono-dia").value,
        local: document.getElementById("crono-local").value,
        equipe: document.getElementById("crono-equipe").value,
        atividade: document.getElementById("crono-atividade").value,
        acao: document.getElementById("crono-acao").value,
        inicioPrev: inicioPrev,
        fimPrev: fimPrev,
        tempoPrev: calcularDuracao(inicioPrev, fimPrev),
        inicioReal: "",
        fimReal: "",
        obs: document.getElementById("crono-obs").value || ""
    };

    cronograma.push(item);
    save("ecc_cronograma", cronograma);
    this.reset();
    renderAll();
});

function deleteCronograma(id) {
    if(confirm("Deseja excluir esta atividade do cronograma?")) {
        cronograma = cronograma.filter(x => x.id !== id);
        cronograma.sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev)).forEach((x, i) => x.numero = i + 1); 
        save("ecc_cronograma", cronograma);
        renderAll();
    }
}

/* =======================================================
   5. LÓGICA DE STATUS GERENCIAL (SÁBADO / DOMINGO)
======================================================== */
function getStatus(item) {
    if (!item.inicioReal && !item.fimReal) return { classe: "st-nao-iniciado", texto: "Não Iniciado" };
    if (item.inicioReal && !item.fimReal) return { classe: "st-andamento", texto: "Em Andamento" };
    if (item.fimReal <= item.fimPrev) return { classe: "st-concluido", texto: "Concluído" };
    if (item.fimReal > item.fimPrev) return { classe: "st-atrasado", texto: "Atrasado" };
    return { classe: "st-nao-iniciado", texto: "Não Iniciado" };
}

function updateRealTime(id, field, value) {
    const item = cronograma.find(x => x.id === id);
    if (item) {
        item[field] = value;
        save("ecc_cronograma", cronograma);
        renderAll();
    }
}

function renderCards(dia, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    const lista = cronograma.filter(x => x.dia === dia).sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhuma atividade programada para este dia.</p>";
        return;
    }

    lista.forEach(item => {
        const status = getStatus(item);
        container.innerHTML += `
            <div class="card">
                <div class="card-header">
                    <h3>#{item.atividade}</h3>
                    <span class="status-badge {status.texto}</span>
                </div>
                <div class="card-info">
                    <p><strong>Equipe:</strong> {item.local}</p>
                    <p><strong>Ação:</strong> ${item.acao}</p>
                    <p><strong>Previsto:</strong> {item.fimPrev} (${item.tempoPrev})</p>
                    <p><strong>Obs:</strong> ${item.obs || "Nenhuma"}</p>
                </div>
                <div class="card-inputs">
                    <div>
                        <label>Início Real:</label> 
                        <input type="time" value="{item.id}, 'inicioReal', this.value)">
                    </div>
                    <div>
                        <label>Fim Real:</label> 
                        <input type="time" value="{item.id}, 'fimReal', this.value)">
                    </div>
                </div>
            </div>
        `;
    });
}

/* =======================================================
   6. RESUMO GERAL E TIMELINE
======================================================== */
function renderResumo() {
    const total = cronograma.length;
    const concluidos = cronograma.filter(x => getStatus(x).texto === "Concluído").length;
    const andamento = cronograma.filter(x => getStatus(x).texto === "Em Andamento").length;
    const atrasados = cronograma.filter(x => getStatus(x).texto === "Atrasado").length;

    document.getElementById("resumoContainer").innerHTML = `
        <div class="resumo-card"><h3>Total Atividades</h3><div class="resumo-num">${total}</div></div>
        <div class="resumo-card"><h3>Concluídas no Prazo</h3><div class="resumo-num" style="color:#28a745">${concluidos}</div></div>
        <div class="resumo-card"><h3>Em Andamento</h3><div class="resumo-num" style="color:#007bff">${andamento}</div></div>
        <div class="resumo-card"><h3>Atrasadas</h3><div class="resumo-num" style="color:#dc3545">${atrasados}</div></div>
    `;
}

function renderTimeline() {
    const dia = document.getElementById("timeline-dia").value;
    const container = document.getElementById("timelineContainer");
    container.innerHTML = "";
    
    const lista = cronograma.filter(x => x.dia === dia).sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev));

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhuma atividade para exibir na timeline.</p>";
        return;
    }

    lista.forEach(item => {
        const status = getStatus(item);
        const [ih, im] = item.inicioPrev.split(":").map(Number);
        const [fh, fm] = item.fimPrev.split(":").map(Number);
        let min = (fh * 60 + fm) - (ih * 60 + im);
        if (min < 0) min += 24 * 60;
        const width = Math.max(min * 2, 60); 

        container.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-time">{item.fimPrev}</div>
                <div class="timeline-bar-container">
                    <div class="timeline-bar {width}px;">
                        #{item.atividade}
                    </div>
                </div>
            </div>
        `;
    });
}

/* =======================================================
   7. FUNÇÃO MESTRE DE ATUALIZAÇÃO (RENDER ALL)
======================================================== */
function renderAll() {
    // 1. Renderiza Listas de Parâmetros (Cadastro)
    ['locais', 'equipes', 'atividades', 'acoes'].forEach(tipo => {
        const ul = document.getElementById(`list-${tipo}`);
        ul.innerHTML = "";
        params[tipo].forEach((val, i) => {
            ul.innerHTML += `<li>{tipo}', ${i})">X</button></li>`;
        });

        // 2. Atualiza os Selects no Cronograma
        const select = document.getElementById(`crono-{tipo.slice(0, -1)}` === 'crono-atividae' ? 'crono-atividade' : `crono-{tipo.slice(0, -1)}` === 'crono-locai' ? 'crono-local' : ''); // Tratamento de plural para singular
        
        // Tratamento limpo para os IDs dos selects
        let selectId = "";
        if(tipo === 'locais') selectId = 'crono-local';
        if(tipo === 'equipes') selectId = 'crono-equipe';
        if(tipo === 'atividades') selectId = 'crono-atividade';
        if(tipo === 'acoes') selectId = 'crono-acao';

        const domSelect = document.getElementById(selectId);
        if(domSelect) {
            domSelect.innerHTML = "<option value=''>Selecione...</option>";
            params[tipo].forEach(val => {
                domSelect.innerHTML += `<option value="{val}</option>`;
            });
        }
    });

    // 3. Renderiza a Lista do Cronograma
    const cronoDiv = document.getElementById("cronogramaLista");
    cronoDiv.innerHTML = "";
    cronograma.sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev)).forEach(item => {
        cronoDiv.innerHTML += `
            <div class="lista-item">
                <div>
                    <strong>#{item.atividade}</strong> 
                    <br> <small>{item.fimPrev} ({item.local} | Equipe: {item.acao}</small>
                </div>
                <button class="btn-excluir" onclick="deleteCronograma(${item.id})">Excluir</button>
            </div>`;
    });

    // 4. Renderiza as outras abas
    renderCards("sabado", "listaSabado");
    renderCards("domingo", "listaDomingo");
    renderResumo();
    renderTimeline();
}

/* =======================================================
   8. INICIALIZAÇÃO DO SISTEMA
======================================================== */
document.addEventListener("DOMContentLoaded", () => {
    renderAll();
});
