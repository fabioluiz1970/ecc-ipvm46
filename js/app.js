/* =======================================================
   1. UTILITÁRIOS E DADOS (OFFLINE)
======================================================== */
const load = (key, defaultVal) => JSON.parse(localStorage.getItem(key)) || defaultVal;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// Cadastro: Listas independentes
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
   3. CADASTRO DE PARÂMETROS (BALDES / CHIPS)
======================================================== */
function addBase(tipo, inputId) {
    const input = document.getElementById(inputId);
    const val = input.value.trim();
    if (val && !params[tipo].includes(val)) {
        params[tipo].push(val);
        save("ecc_params", params);
        input.value = "";
        renderAll();
    }
}

function editBase(tipo, index) {
    const novoValor = prompt("Alterar valor:", params[tipo][index]);
    if (novoValor && novoValor.trim() !== "") {
        params[tipo][index] = novoValor.trim();
        save("ecc_params", params);
        renderAll();
    }
}

function delBase(tipo, index) {
    if(confirm("Excluir este item?")) {
        params[tipo].splice(index, 1);
        save("ecc_params", params);
        renderAll();
    }
}

/* =======================================================
   4. CRONOGRAMA GERAL (TABELA, TEMPO E CRUD)
======================================================== */
function calcularDuracao(inicio, fim) {
    if (!inicio || !fim) return "0h 00m";
    const [ih, im] = inicio.split(":").map(Number);
    const [fh, fm] = fim.split(":").map(Number);
    let totalMinutos = (fh * 60 + fm) - (ih * 60 + im);
    if (totalMinutos < 0) totalMinutos += 24 * 60; 
    const h = Math.floor(totalMinutos / 60);
    const m = totalMinutos % 60;
    return `{m.toString().padStart(2, '0')}m`;
}

document.getElementById("cronogramaForm").addEventListener("submit", function(e) {
    e.preventDefault();
    
    const idEdit = document.getElementById("crono-id").value;
    const inicioPrev = document.getElementById("crono-inicio").value;
    const fimPrev = document.getElementById("crono-fim").value;

    const itemData = {
        dia: document.getElementById("crono-dia").value,
        local: document.getElementById("crono-local").value,
        equipe: document.getElementById("crono-equipe").value,
        atividade: document.getElementById("crono-atividade").value,
        // Ação foi removida do cronograma conforme solicitado
        inicioPrev: inicioPrev,
        fimPrev: fimPrev,
        tempoPrev: calcularDuracao(inicioPrev, fimPrev),
        obs: document.getElementById("crono-obs").value || ""
    };

    if (idEdit) {
        // Modo Alterar
        const index = cronograma.findIndex(x => x.id == idEdit);
        if(index !== -1) {
            itemData.id = cronograma[index].id;
            itemData.numero = cronograma[index].numero;
            itemData.inicioReal = cronograma[index].inicioReal;
            itemData.fimReal = cronograma[index].fimReal;
            cronograma[index] = itemData;
        }
        document.getElementById("btn-salvar-crono").innerText = "Incluir no Cronograma";
        document.getElementById("crono-id").value = "";
    } else {
        // Modo Incluir
        itemData.id = Date.now();
        itemData.numero = cronograma.length + 1;
        itemData.inicioReal = "";
        itemData.fimReal = "";
        cronograma.push(itemData);
    }

    save("ecc_cronograma", cronograma);
    this.reset();
    renderAll();
});

function editCronograma(id) {
    const item = cronograma.find(x => x.id === id);
    if(!item) return;

    document.getElementById("crono-id").value = item.id;
    document.getElementById("crono-dia").value = item.dia;
    document.getElementById("crono-atividade").value = item.atividade;
    document.getElementById("crono-equipe").value = item.equipe;
    document.getElementById("crono-local").value = item.local;
    document.getElementById("crono-inicio").value = item.inicioPrev;
    document.getElementById("crono-fim").value = item.fimPrev;
    document.getElementById("crono-obs").value = item.obs;

    document.getElementById("btn-salvar-crono").innerText = "Salvar Alteração";
    document.getElementById("cronograma").scrollIntoView();
}

function deleteCronograma(id) {
    if(confirm("Deseja excluir esta atividade do cronograma?")) {
        cronograma = cronograma.filter(x => x.id !== id);
        cronograma.sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev)).forEach((x, i) => x.numero = i + 1); 
        save("ecc_cronograma", cronograma);
        renderAll();
    }
}

/* =======================================================
   5. SÁBADO E DOMINGO (STATUS E HORA REAL)
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
                    <h3>Nº {item.atividade}</h3>
                    <span class="status-badge {status.texto}</span>
                </div>
                <div class="card-info">
                    <p><strong>Equipe:</strong> {item.local}</p>
                    <p><strong>Previsto:</strong> {item.fimPrev} <span class="tempo-badge">${item.tempoPrev}</span></p>
                    <p><strong>Obs:</strong> ${item.obs || "-"}</p>
                </div>
                <div class="card-inputs">
                    <div><label>Início Real:</label> <input type="time" value="{item.id}, 'inicioReal', this.value)"></div>
                    <div><label>Fim Real:</label> <input type="time" value="{item.id}, 'fimReal', this.value)"></div>
                </div>
            </div>
        `;
    });
}

/* =======================================================
   6. RESUMO E TIMELINE
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
    if (lista.length === 0) return;

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
                        Nº {item.atividade}
                    </div>
                </div>
            </div>
        `;
    });
}

/* =======================================================
   7. BACKUP E RESTAURAÇÃO (REPOSITÓRIO)
======================================================== */
function exportarBases() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(params));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "ecc_bases_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importarBases(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.locais && importedData.equipes && importedData.atividades) {
                params = importedData;
                save("ecc_params", params);
                renderAll();
                alert("Bases importadas com sucesso!");
            } else {
                alert("Arquivo de backup inválido.");
            }
        } catch (err) {
            alert("Erro ao ler o arquivo.");
        }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reseta o input file
}

/* =======================================================
   8. RENDERIZAÇÃO GERAL (ATUALIZA TUDO)
======================================================== */
function renderAll() {
    // 1. Renderiza Listas do Cadastro (Estilo Chips/Baldes)
    ['locais', 'equipes', 'atividades', 'acoes'].forEach(tipo => {
        const divLista = document.getElementById(`lista-${tipo}`);
        if(divLista) {
            divLista.innerHTML = "";
            params[tipo].forEach((val, i) => {
                divLista.innerHTML += `
                    <div class="chip">
                        <span onclick="editBase('{i})" title="Clique para alterar">${val}</span>
                        <button onclick="delBase('{i})" title="Excluir">&times;</button>
                    </div>`;
            });
        }
    });

    // 2. Atualiza Selects do Cronograma (Corrigido o bug de carregamento)
    const mapeamento = { 'locais': 'crono-local', 'equipes': 'crono-equipe', 'atividades': 'crono-atividade', 'acoes': 'crono-acao' };
    for (let tipo in mapeamento) {
        const domSelect = document.getElementById(mapeamento[tipo]);
        if(domSelect) {
            domSelect.innerHTML = "<option value=''>Selecione...</option>";
            params[tipo].forEach(val => domSelect.innerHTML += `<option value="{val}</option>`);
        }
    }

    // 3. Renderiza Tabela do Cronograma
    const tbody = document.getElementById("tabela-cronograma-body");
    if(tbody) {
        tbody.innerHTML = "";
        cronograma.sort((a, b) => a.inicioPrev.localeCompare(b.inicioPrev)).forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${item.numero}</strong></td>
                    <td style="text-transform: capitalize;">${item.dia}</td>
                    <td>${item.atividade}</td>
                    <td>${item.equipe}</td>
                    <td>${item.local}</td>
                    <td>${item.inicioPrev}</td>
                    <td>${item.fimPrev}</td>
                    <td><span class="tempo-badge">${item.tempoPrev}</span></td>
                    <td>${item.obs}</td>
                    <td style="min-width: 140px;">
                        <button class="btn-alterar" onclick="editCronograma(${item.id})">Alterar</button>
                        <button class="btn-excluir" onclick="deleteCronograma(${item.id})">Excluir</button>
                    </td>
                </tr>`;
        });
    }

    // 4. Renderiza o resto
    renderCards("sabado", "listaSabado");
    renderCards("domingo", "listaDomingo");
    renderResumo();
    renderTimeline();
}

// Inicializa
document.addEventListener("DOMContentLoaded", renderAll);