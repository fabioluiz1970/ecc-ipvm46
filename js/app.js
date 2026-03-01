/* =======================================================
   1. LOCAL STORAGE (BANCO LOCAL)
======================================================== */
const load = (key, def) => JSON.parse(localStorage.getItem(key)) || def;
const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

let params = load("ECC_PARAMS", { locais: [], equipes: [], atividades: [], acoes: [] });
let cronograma = load("ECC_CRONO", []);

/* =======================================================
   2. NAVEGAÇÃO ENTRE ABAS
======================================================== */
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");

        renderAll();
    });
});

/* =======================================================
   3. ACCORDION – ABRIR/FECHAR
======================================================== */
function toggleAcc(el){
    const body = el.nextElementSibling;
    body.style.display = body.style.display === "block" ? "none" : "block";
}

/* =======================================================
   4. CADASTRO BASE – INCLUIR, ALTERAR, EXCLUIR
======================================================== */
function addBase(tipo, inputId){
    const input = document.getElementById(inputId);
    const val = input.value.trim();

    if(val && !params[tipo].includes(val)){
        params[tipo].push(val);
        save("ECC_PARAMS", params);
        input.value = "";
        renderAll();
    }
}

function editBase(tipo, index){
    const novo = prompt("Alterar item:", params[tipo][index]);
    if(novo && novo.trim()){
        params[tipo][index] = novo.trim();
        save("ECC_PARAMS", params);
        renderAll();
    }
}

function delBase(tipo, index){
    if(confirm("Excluir este item?")){
        params[tipo].splice(index, 1);
        save("ECC_PARAMS", params);
        renderAll();
    }
}

/* =======================================================
   5. CRONOGRAMA – CALCULAR TEMPO
======================================================== */
function calcularDuracao(inicio, fim){
    if(!inicio || !fim) return "0h 00m";

    let [ih, im] = inicio.split(":").map(Number);
    let [fh, fm] = fim.split(":").map(Number);

    let min = (fh*60 + fm) - (ih*60 + im);
    if(min < 0) min += 1440;

    const h = Math.floor(min / 60);
    const m = min % 60;

    return `{m.toString().padStart(2,"0")}m`;
}

/* =======================================================
   6. CRONOGRAMA – INCLUIR / ALTERAR LINHA
======================================================== */
document.getElementById("cronogramaForm").addEventListener("submit", e => {
    e.preventDefault();

    const idEdit = document.getElementById("crono-id").value;
    const inicioPrev = document.getElementById("crono-inicio").value;
    const fimPrev = document.getElementById("crono-fim").value;

    const item = {
        dia: document.getElementById("crono-dia").value,
        atividade: document.getElementById("crono-atividade").value,
        equipe: document.getElementById("crono-equipe").value,
        local: document.getElementById("crono-local").value,
        inicioPrev,
        fimPrev,
        tempoPrev: calcularDuracao(inicioPrev, fimPrev),
        obs: document.getElementById("crono-obs").value,
        inicioReal: "",
        fimReal: ""
    };

    if(idEdit){  
        // editar
        const idx = cronograma.findIndex(x => x.id == idEdit);
        item.id = cronograma[idx].id;
        item.numero = cronograma[idx].numero;
        item.inicioReal = cronograma[idx].inicioReal;
        item.fimReal = cronograma[idx].fimReal;
        cronograma[idx] = item;

        document.getElementById("btn-salvar-crono").innerText = "Incluir no Cronograma";
        document.getElementById("crono-id").value = "";
    } else {
        // incluir
        item.id = Date.now();
        item.numero = cronograma.length + 1;
        cronograma.push(item);
    }

    save("ECC_CRONO", cronograma);
    e.target.reset();
    renderAll();
});

/* =======================================================
   7. CRONOGRAMA – BOTÕES
======================================================== */
function editCrono(id){
    const item = cronograma.find(x => x.id == id);

    document.getElementById("crono-id").value = id;
    document.getElementById("crono-dia").value = item.dia;
    document.getElementById("crono-atividade").value = item.atividade;
    document.getElementById("crono-equipe").value = item.equipe;
    document.getElementById("crono-local").value = item.local;
    document.getElementById("crono-inicio").value = item.inicioPrev;
    document.getElementById("crono-fim").value = item.fimPrev;
    document.getElementById("crono-obs").value = item.obs;

    document.getElementById("btn-salvar-crono").innerText = "Salvar Alteração";
}

function deleteCrono(id){
    if(confirm("Excluir atividade?")){
        cronograma = cronograma.filter(x => x.id !== id);

        // renumerar
        cronograma.forEach((x,i) => x.numero = i+1);

        save("ECC_CRONO", cronograma);
        renderAll();
    }
}

/* =======================================================
   8. STATUS / TEMPOS (Cards e Timeline)
======================================================== */
function minutos(hhmm){
    if(!hhmm) return null;
    const [h,m] = hhmm.split(":").map(Number);
    return h*60 + m;
}

function getStatus(item){
    const inicioP = minutos(item.inicioPrev);
    const fimP    = minutos(item.fimPrev);
    const inicioR = minutos(item.inicioReal);
    const fimR    = minutos(item.fimReal);

    const agora = new Date();
    const minAgora = agora.getHours()*60 + agora.getMinutes();

    // Não iniciado
    if(!inicioR) return { classe:"st-nao-iniciado", texto:"Não iniciado" };

    // Em andamento
    if(inicioR && !fimR){
        return { classe:"st-andamento", texto:"Em andamento" };
    }

    // Concluído no prazo
    if(fimR <= fimP){
        return { classe:"st-concluido", texto:"Concluído" };
    }

    // Atrasado
    return { classe:"st-atrasado", texto:"Atrasado" };
}

function calcInfoTempo(item){
    const inicioP = minutos(item.inicioPrev);
    const fimP    = minutos(item.fimPrev);
    const inicioR = minutos(item.inicioReal);
    const fimR    = minutos(item.fimReal);

    const agora = new Date();
    const now = agora.getHours()*60 + agora.getMinutes();

    // Ainda não iniciou
    if(!inicioR){
        if(now < inicioP){
            return `Inicia em ${inicioP - now} min`;
        }
        return `Previsto iniciar há ${now - inicioP} min`;
    }

    // Em andamento (não tem fim real)
    if(inicioR && !fimR){
        const totalPrev = fimP - inicioR;
        const passou = now - inicioR;
        const falta = totalPrev - passou;

        if(falta >= 0){
            return `Faltam ${falta} min`;
        } else {
            return `${Math.abs(falta)} min de atraso`;
        }
    }

    // Concluído → calcular diferença
    const delta = fimR - fimP;
    if(delta > 0) return `${delta} min de atraso`;
    if(delta < 0) return `${Math.abs(delta)} min adiantado`;
    return `No horário exato`;
}

/* =======================================================
   9. RENDER – TABELA CRONOGRAMA
======================================================== */
function renderTabela(){
    const tbody = document.getElementById("tabela-cronograma-body");
    tbody.innerHTML = "";

    cronograma
        .sort((a,b)=>a.inicioPrev.localeCompare(b.inicioPrev))
        .forEach(item=>{
            tbody.innerHTML+=`
                <tr>
                    <td>${item.numero}</td>
                    <td>${item.dia}</td>
                    <td>${item.atividade}</td>
                    <td>${item.equipe}</td>
                    <td>${item.local}</td>
                    <td>${item.inicioPrev}</td>
                    <td>${item.fimPrev}</td>
                    <td><span class="tempo-badge">${item.tempoPrev}</span></td>
                    <td>${item.obs || "-"}</td>
                    <td>
                        <button class="edit" onclick="editCrono(${item.id})">✎</button>
                        <button class="del" onclick="deleteCrono(${item.id})">🗑</button>
                    </td>
                </tr>
            `;
        });
}

/* =======================================================
   10. RENDER – CARDS EXECUÇÃO
======================================================== */
function renderCards(dia, target){
    const container = document.getElementById(target);
    container.innerHTML = "";

    cronograma
    .filter(x=>x.dia===dia)
    .sort((a,b)=>a.inicioPrev.localeCompare(b.inicioPrev))
    .forEach(item=>{
        const st = getStatus(item);
        const info = calcInfoTempo(item);

        container.innerHTML+=`
            <div class="card">
                <h3>Nº {item.atividade}</h3>
                <p><strong>Equipe:</strong> ${item.equipe}</p>
                <p><strong>Local:</strong> ${item.local}</p>
                <p><strong>Previsto:</strong> {item.fimPrev} (${item.tempoPrev})</p>

                <p><strong>Status:</strong> 
                    <span class="status-badge {st.texto}</span>
                </p>

                <p><strong>Tempo:</strong> ${info}</p>

                <p><strong>Obs:</strong> ${item.obs || "-"}</p>

                <p><strong>Real:</strong></p>
                <input type="time" value="{item.id},'inicioReal',this.value)">
                <input type="time" value="{item.id},'fimReal',this.value)">
            </div>
        `;
    });
}

function updateReal(id, campo, valor){
    const item = cronograma.find(x=>x.id===id);
    if(item){
        item[campo] = valor;
        save("ECC_CRONO", cronograma);
        renderAll();
    }
}

/* =======================================================
   11. TIMELINE EXECUTIVA
======================================================== */
function renderTimeline(){
    const dia = document.getElementById("timeline-dia").value;
    const div = document.getElementById("timelineContainer");
    div.innerHTML = "";

    cronograma
    .filter(x=>x.dia===dia)
    .sort((a,b)=>a.inicioPrev.localeCompare(b.inicioPrev))
    .forEach(item=>{
        const st = getStatus(item);
        const info = calcInfoTempo(item);

        const ini = minutos(item.inicioPrev);
        const fim = minutos(item.fimPrev);

        let dur = fim - ini;
        if(dur < 0) dur += 1440;
        const px = Math.max(dur * 2, 40);

        div.innerHTML += `
            <div class="timeline-item">
                <div class="timeline-time">{item.fimPrev}</div>
                <div class="timeline-bar-container">
                    <div class="timeline-bar {px}px;">
                        {item.atividade} (${info})
                    </div>
                </div>
            </div>
        `;
    });
}

/* =======================================================
   12. RESUMO
======================================================== */
function renderResumo(){
    const total = cronograma.length;
    const concluidos = cronograma.filter(x=>getStatus(x).classe==="st-concluido").length;
    const andamento = cronograma.filter(x=>getStatus(x).classe==="st-andamento").length;
    const atrasados = cronograma.filter(x=>getStatus(x).classe==="st-atrasado").length;

    document.getElementById("resumoContainer").innerHTML = `
        <div class="resumo-card"><h3>Total</h3><div class="resumo-num">${total}</div></div>
        <div class="resumo-card"><h3>Concluídas</h3><div class="resumo-num" style="color:#28a745">${concluidos}</div></div>
        <div class="resumo-card"><h3>Andamento</h3><div class="resumo-num" style="color:#007bff">${andamento}</div></div>
        <div class="resumo-card"><h3>Atrasadas</h3><div class="resumo-num" style="color:#dc3545">${atrasados}</div></div>
    `;
}

/* =======================================================
   13. BACKUP / IMPORTAÇÃO
======================================================== */
function exportarDados(){
    const dados = {
        params,
        cronograma
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "ECC_BACKUP.json";
    a.click();
}

function importarDados(evt){
    const file = evt.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = e =>{
        try{
            const obj = JSON.parse(e.target.result);
            params = obj.params;
            cronograma = obj.cronograma;
            save("ECC_PARAMS", params);
            save("ECC_CRONO", cronograma);
            alert("Backup importado com sucesso!");
            renderAll();
        }catch{
            alert("Arquivo inválido.");
        }
    };
    reader.readAsText(file);
}

/* =======================================================
   14. RENDER GLOBAL
======================================================== */
function renderAll(){

    /* CADASTROS */
    const tipos = ["locais","equipes","atividades","acoes"];
    tipos.forEach(tipo=>{
        const area = document.getElementById(`lista-${tipo}`);
        if(area){
            area.innerHTML = "";
            params[tipo].forEach((txt,i)=>{
                area.innerHTML += `
                    <div class="chip-item">
                        <span class="chip-text" onclick="editBase('{i})">${txt}</span>
                        <div class="chip-actions">
                            <button class="btn-edit" onclick="editBase('{i})">✎</button>
                            <button class="btn-del" onclick="delBase('{i})">🗑</button>
                        </div>
                    </div>
                `;
            });
        }
    });

    /* SELECTS DO CRONOGRAMA */
    document.getElementById("crono-local").innerHTML =
        params.locais.map(l=>`<option value="{l}</option>`).join("");

    document.getElementById("crono-equipe").innerHTML =
        params.equipes.map(l=>`<option value="{l}</option>`).join("");

    document.getElementById("crono-atividade").innerHTML =
        params.atividades.map(l=>`<option value="{l}</option>`).join("");

    /* TABELA */
    renderTabela();

    /* CARDS */
    renderCards("sabado","listaSabado");
    renderCards("domingo","listaDomingo");

    /* RESUMO */
    renderResumo();

    /* TIMELINE */
    renderTimeline();
}

/* Inicializa */
renderAll();