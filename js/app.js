/* =======================================================
   1. LOCAL STORAGE (BANCO LOCAL)
======================================================== */
const load = (k, def) => JSON.parse(localStorage.getItem(k)) || def;
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let params = load("ECC_PARAMS", { locais: [], equipes: [], atividades: [], acoes: [] });
let cronograma = load("ECC_CRONO", []);

/* =======================================================
   2. NAVEGAÇÃO ENTRE TELAS (MENU INFERIOR)
======================================================== */
function openScreen(screen){
    document.querySelectorAll(".app-screen").forEach(s => s.classList.remove("active"));
    document.getElementById(screen).classList.add("active");
}

/* Execução – alternância Sábado/Domingo */
function setExec(dia){
    document.getElementById("listaSabado").style.display = (dia === "sabado") ? "block" : "none";
    document.getElementById("listaDomingo").style.display = (dia === "domingo") ? "block" : "none";
}

/* =======================================================
   3. CONFIGURAÇÃO DO ACCORDION
======================================================== */
function toggleAcc(selector){
    const box = document.querySelector(selector);
    box.style.display = box.style.display === "block" ? "none" : "block";
}

/* =======================================================
   4. CADASTRO BASE – INCLUIR, ALTERAR, EXCLUIR
======================================================== */
function addBase(tipo, inputId){
    const val = document.getElementById(inputId).value.trim();
    if(!val) return;
    if(!params[tipo].includes(val)){
        params[tipo].push(val);
        save("ECC_PARAMS", params);
    }
    document.getElementById(inputId).value = "";
    renderAll();
}

function editBase(tipo, index){
    const novo = prompt("Alterar valor:", params[tipo][index]);
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
   5. CÁLCULO DE TEMPO (FIM – INÍCIO)
======================================================== */
function calcularDuracao(ini, fim){
    if(!ini || !fim) return "0h 00m";
    let [ih, im] = ini.split(":").map(Number);
    let [fh, fm] = fim.split(":").map(Number);

    let min = (fh*60+fm) - (ih*60+im);
    if(min < 0) min += 1440;

    let h = Math.floor(min / 60);
    let m = min % 60;

    return `{m.toString().padStart(2,"0")}m`;
}
function minutos(hhmm){
    if(!hhmm) return null;
    let [h,m] = hhmm.split(":").map(Number);
    return h*60 + m;
}

/* =======================================================
   6. CRONOGRAMA – INCLUIR / ALTERAR
======================================================== */
document.getElementById("cronogramaForm").addEventListener("submit", e =>{
    e.preventDefault();

    const idEdicao = document.getElementById("crono-id").value;

    const obj = {
        dia: document.getElementById("crono-dia").value,
        atividade: document.getElementById("crono-atividade").value,
        equipe: document.getElementById("crono-equipe").value,
        local: document.getElementById("crono-local").value,
        inicioPrev: document.getElementById("crono-inicio").value,
        fimPrev: document.getElementById("crono-fim").value,
        tempoPrev: calcularDuracao(
            document.getElementById("crono-inicio").value,
            document.getElementById("crono-fim").value
        ),
        obs: document.getElementById("crono-obs").value,
        inicioReal:"",
        fimReal:""
    };

    if(idEdicao){
        // Salvar alteração
        let idx = cronograma.findIndex(x => x.id == idEdicao);
        obj.id = cronograma[idx].id;
        obj.numero = cronograma[idx].numero;
        obj.inicioReal = cronograma[idx].inicioReal;
        obj.fimReal = cronograma[idx].fimReal;
        cronograma[idx] = obj;

        document.getElementById("btn-salvar-crono").innerText = "Incluir";
        document.getElementById("crono-id").value = "";
    } else {
        // Novo
        obj.id = Date.now();
        obj.numero = cronograma.length + 1;
        cronograma.push(obj);
    }

    save("ECC_CRONO", cronograma);
    e.target.reset();
    renderAll();
});

/* Botões da tabela */
function editCrono(id){
    const item = cronograma.find(x=>x.id === id);

    document.getElementById("crono-id").value     = item.id;
    document.getElementById("crono-dia").value    = item.dia;
    document.getElementById("crono-atividade").value = item.atividade;
    document.getElementById("crono-equipe").value    = item.equipe;
    document.getElementById("crono-local").value     = item.local;
    document.getElementById("crono-inicio").value    = item.inicioPrev;
    document.getElementById("crono-fim").value       = item.fimPrev;
    document.getElementById("crono-obs").value       = item.obs;

    document.getElementById("btn-salvar-crono").innerText = "Salvar";
}

function deleteCrono(id){
    if(confirm("Excluir atividade?")){
        cronograma = cronograma.filter(x => x.id !== id);
        cronograma.forEach((x,i)=> x.numero = i+1 );
        save("ECC_CRONO", cronograma);
        renderAll();
    }
}

/* =======================================================
   7. EXECUÇÃO – STATUS + TEMPOS
======================================================== */
function getStatus(item){
    let iP = minutos(item.inicioPrev);
    let fP = minutos(item.fimPrev);
    let iR = minutos(item.inicioReal);
    let fR = minutos(item.fimReal);

    if(!iR) return {classe:"st-nao-iniciado", texto:"Não iniciado"};

    if(iR && !fR) return {classe:"st-andamento", texto:"Em andamento"};

    if(fR <= fP) return {classe:"st-concluido", texto:"Concluído"};

    return {classe:"st-atrasado", texto:"Atrasado"};
}

function calcTempoExec(item){
    let iP = minutos(item.inicioPrev);
    let fP = minutos(item.fimPrev);
    let iR = minutos(item.inicioReal);
    let fR = minutos(item.fimReal);
    let now = new Date();
    let n = now.getHours()*60 + now.getMinutes();

    if(!iR){
        if(n < iP) return `Inicia em ${iP-n} min`;
        return `Atrasado ${n-iP} min p/ iniciar`;
    }

    if(iR && !fR){
        let tPrev = fP - iR;
        let tRun = n - iR;
        let faltam = tPrev - tRun;

        if(faltam >= 0) return `Faltam ${faltam} min`;
        return `${Math.abs(faltam)} min de atraso`;
    }

    // Concluído
    let diff = fR - fP;
    if(diff < 0) return `${Math.abs(diff)} min adiantado`;
    if(diff > 0) return `${diff} min atraso`;
    return `No horário`;
}

function updateRealTime(id, campo, val){
    let item = cronograma.find(x=>x.id===id);
    if(item){
        item[campo] = val;
        save("ECC_CRONO", cronograma);
        renderAll();
    }
}

/* =======================================================
   8. RENDER – EXECUÇÃO (CARDS)
======================================================== */
function renderCards(dia, target){
    const div = document.getElementById(target);
    div.innerHTML = "";

    cronograma
        .filter(x=>x.dia===dia)
        .sort((a,b)=>a.inicioPrev.localeCompare(b.inicioPrev))
        .forEach(item=>{
            const st = getStatus(item);
            const info = calcTempoExec(item);

            div.innerHTML += `
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

                    <label>Real:</label>
                    <input type="time" value="${item.inicioReal}" 
                        onchange="updateRealTime(${item.id},'inicioReal',this.value)">
                    <input type="time" value="${item.fimReal}" 
                        onchange="updateRealTime(${item.id},'fimReal',this.value)">
                </div>
            `;
        });
}

/* =======================================================
   9. RENDER – TIMELINE
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
            const info = calcTempoExec(item);

            let i = minutos(item.inicioPrev);
            let f = minutos(item.fimPrev);
            let dur = f - i;
            if(dur < 0) dur += 1440;
            let px = Math.max(dur * 2, 50);

            div.innerHTML += `
                <div class="timeline-item">
                    <div class="timeline-time">{item.fimPrev}</div>
                    <div class="timeline-bar-container">
                        <div class="timeline-bar ${st.classe.replace('st-','st-')+'-bar'}" 
                             style="width:${px}px">
                            {item.atividade} (${info})
                        </div>
                    </div>
                </div>
            `;
        });
}

/* =======================================================
   10. RESUMO
======================================================== */
function renderResumo(){
    let total = cronograma.length;
    let concluidos = cronograma.filter(x=>getStatus(x).classe==="st-concluido").length;
    let andamento = cronograma.filter(x=>getStatus(x).classe==="st-andamento").length;
    let atrasados = cronograma.filter(x=>getStatus(x).classe==="st-atrasado").length;

    document.getElementById("resumoContainer").innerHTML = `
        <div class="resumo-card"><h3>Total</h3><div class="resumo-num">${total}</div></div>
        <div class="resumo-card"><h3>Concluídas</h3><div class="resumo-num">${concluidos}</div></div>
        <div class="resumo-card"><h3>Andamento</h3><div class="resumo-num">${andamento}</div></div>
        <div class="resumo-card"><h3>Atrasadas</h3><div class="resumo-num">${atrasados}</div></div>
    `;
}

/* =======================================================
   11. BACKUP / IMPORTAÇÃO
======================================================== */
function exportarDados(){
    let blob = new Blob([JSON.stringify({params, cronograma}, null, 2)], {
        type:"application/json"
    });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "ECC_BACKUP.json";
    a.click();
}

function importarDados(e){
    const file = e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = evt=>{
        try{
            let dados = JSON.parse(evt.target.result);
            params = dados.params;
            cronograma = dados.cronograma;
            save("ECC_PARAMS", params);
            save("ECC_CRONO", cronograma);
            alert("Dados importados com sucesso!");
            renderAll();
        }catch{
            alert("Erro no arquivo.");
        }
    };
    reader.readAsText(file);
}

/* =======================================================
   12. RENDER GLOBAL
======================================================== */
function renderAll(){

    /* Render Cadastro Base */
    const grupos = ["locais","equipes","atividades","acoes"];
    grupos.forEach(tipo=>{
        let div = document.getElementById("rep-"+tipo);
        div.innerHTML = "";
        params[tipo].forEach((txt,i)=>{
            div.innerHTML += `
                <div class="rep-item">
                    <span class="rep-text" onclick="editBase('{i})">${txt}</span>
                    <div class="rep-actions">
                        <button class="rep-edit" onclick="editBase('{i})">✎</button>
                        <button class="rep-del" onclick="delBase('{i})">🗑</button>
                    </div>
                </div>
            `;
        });
    });

    /* Carregar selects */
    document.getElementById("crono-atividade").innerHTML =
        params.atividades.map(x=>`<option>${x}</option>`).join("");

    document.getElementById("crono-equipe").innerHTML =
        params.equipes.map(x=>`<option>${x}</option>`).join("");

    document.getElementById("crono-local").innerHTML =
        params.locais.map(x=>`<option>${x}</option>`).join("");

    /* Tabela Cronograma */
    renderTabela();

    /* Execução */
    renderCards("sabado","listaSabado");
    renderCards("domingo","listaDomingo");

    /* Resumo */
    renderResumo();

    /* Timeline */
    renderTimeline();
}

/* Inicialização */
renderAll();
setExec("sabado");
openScreen("cronograma");