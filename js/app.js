// -------------------------
// UTILIDADES
// -------------------------
function load(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// -------------------------
// ABAS
// -------------------------
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));
        document.getElementById(btn.dataset.tab).classList.add("active");
    });
});

// Mostra a aba inicial
document.getElementById("cadastro").classList.add("active");

// -------------------------
// 1) CADASTRO
// -------------------------
let cadastro = load("cadastro");

function renderCadastro() {
    const container = document.getElementById("cadastroLista");
    container.innerHTML = "";

    cadastro.forEach((item, index) => {
        container.innerHTML += `
            <div class="lista-item lista-flex">
                <div>
                    <strong>{item.equipe}  
                    <br>Dia: {item.local}  
                    <br>Ação: ${item.acao}
                </div>

                <div class="lista-btns">
                    <button class="btn-editar" onclick="editarCadastro(${index})">Editar</button>
                    <button class="btn-excluir" onclick="excluirCadastro(${index})">Excluir</button>
                </div>
            </div>
        `;
    });

    atualizarSelectAtividades();
}

function atualizarSelectAtividades() {
    const select = document.getElementById("crono-atividade");
    select.innerHTML = `<option value="">Selecione</option>`;

    cadastro.forEach((item, index) => {
        select.innerHTML += `<option value="{item.atividade} (${item.equipe})</option>`;
    });
}

document.getElementById("cadastroForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const novo = {
        dia: document.getElementById("cad-dia").value,
        local: document.getElementById("cad-local").value,
        equipe: document.getElementById("cad-equipe").value,
        atividade: document.getElementById("cad-atividade").value,
        acao: document.getElementById("cad-acao").value
    };

    cadastro.push(novo);
    save("cadastro", cadastro);

    this.reset();
    renderCadastro();
});

function excluirCadastro(i) {
    cadastro.splice(i, 1);
    save("cadastro", cadastro);
    renderCadastro();
}

function editarCadastro(i) {
    const item = cadastro[i];

    document.getElementById("cad-dia").value = item.dia;
    document.getElementById("cad-local").value = item.local;
    document.getElementById("cad-equipe").value = item.equipe;
    document.getElementById("cad-atividade").value = item.atividade;
    document.getElementById("cad-acao").value = item.acao;

    cadastro.splice(i, 1);
    save("cadastro", cadastro);
    renderCadastro();
}

// -------------------------
// 2) CRONOGRAMA
// -------------------------
let cronograma = load("cronograma");

document.getElementById("cronogramaForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const atividadeIndex = document.getElementById("crono-atividade").value;
    const atividadeInfo = cadastro[atividadeIndex];

    const inicio = document.getElementById("crono-inicio").value;
    const fim = document.getElementById("crono-fim").value;

    const tempo = calcularTempo(inicio, fim);

    const novo = {
        id: Date.now(),
        dia: document.getElementById("crono-dia").value,
        atividade: atividadeInfo.atividade,
        equipe: atividadeInfo.equipe,
        local: document.getElementById("crono-local").value,
        observacao: document.getElementById("crono-obs").value,
        inicio: inicio,
        fim: fim,
        tempo: tempo
    };

    cronograma.push(novo);
    save("cronograma", cronograma);

    this.reset();
    renderCronograma();
    renderVisoes();
});

function calcularTempo(inicio, fim) {
    const [ih, im] = inicio.split(":");
    const [fh, fm] = fim.split(":");

    const minutosInicio = Number(ih) * 60 + Number(im);
    const minutosFim = Number(fh) * 60 + Number(fm);

    const diff = minutosFim - minutosInicio;
    const horas = Math.floor(diff / 60);
    const minutos = diff % 60;

    return `{minutos}min`;
}

function renderCronograma() {
    const container = document.getElementById("cronogramaLista");
    container.innerHTML = "";

    cronograma.forEach((item, index) => {
        container.innerHTML += `
            <div class="lista-item lista-flex">
                <div>
                    <strong>{item.equipe}  
                    <br>{item.fim} (${item.tempo})
                    <br>Dia: {item.local}
                    <br>Obs: ${item.observacao || "-"}
                </div>

                <div class="lista-btns">
                    <button class="btn-editar" onclick="editarCronograma(${index})">Editar</button>
                    <button class="btn-excluir" onclick="excluirCronograma(${index})">Excluir</button>
                </div>
            </div>
        `;
    });
}

function excluirCronograma(i) {
    cronograma.splice(i, 1);
    save("cronograma", cronograma);
    renderCronograma();
    renderVisoes();
}

function editarCronograma(i) {
    const item = cronograma[i];

    document.getElementById("crono-dia").value = item.dia;
    document.getElementById("crono-local").value = item.local;
    document.getElementById("crono-inicio").value = item.inicio;
    document.getElementById("crono-fim").value = item.fim;
    document.getElementById("crono-obs").value = item.observacao;

    // colocar a atividade de volta no select
    const indexAtividade = cadastro.findIndex(c => c.atividade === item.atividade);
    document.getElementById("crono-atividade").value = indexAtividade;

    cronograma.splice(i, 1);
    save("cronograma", cronograma);
    renderCronograma();
    renderVisoes();
}

// -------------------------
// 3) VISÕES (sábado e domingo)
// -------------------------
function renderVisoes() {
    const sabado = document.getElementById("listaSabado");
    const domingo = document.getElementById("listaDomingo");

    sabado.innerHTML = "";
    domingo.innerHTML = "";

    cronograma.forEach((item) => {
        const bloco = `
            <div class="lista-item">
                <strong>{item.equipe}
                <br>{item.fim} (${item.tempo})
                <br>Local: ${item.local}
                <br>Obs: ${item.observacao || "-"}
            </div>
        `;

        if (item.dia === "sabado") sabado.innerHTML += bloco;
        if (item.dia === "domingo") domingo.innerHTML += bloco;
    });
}

// -------------------------
// INICIALIZAR
// -------------------------
renderCadastro();
renderCronograma();
renderVisoes();