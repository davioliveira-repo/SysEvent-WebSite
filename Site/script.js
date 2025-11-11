// ---------------- Config e Estado Global ----------------
const DATA_KEY = "planningEventsData";
let eventos = {};
let ID_CONTADOR = 1;
let eventoSelecionadoID = null;

// ---------------- Persistência (Local Storage) ----------------
function loadEvents() {
    try {
        const storedData = localStorage.getItem(DATA_KEY);
        if (storedData) {
            const payload = JSON.parse(storedData);
            // JSON armazena chaves como string, converte de volta para int
            eventos = Object.keys(payload.eventos).reduce((acc, key) => {
                acc[parseInt(key)] = payload.eventos[key];
                return acc;
            }, {});
            
            // Garante que ID_CONTADOR seja um número válido
            const nextId = parseInt(payload.next_id);
            ID_CONTADOR = isNaN(nextId) ? 1 : nextId;

        } else {
            eventos = {};
            ID_CONTADOR = 1;
        }
    } catch (e) {
        console.error("Falha ao carregar dados:", e);
        alert("Falha ao carregar dados. Inicializando com dados vazios.");
        eventos = {};
        ID_CONTADOR = 1;
    }
}

function saveEvents() {
    try {
        // Converte chaves de ID para string (necessário para serialização JSON)
        const payload = { 
            eventos: eventos, 
            next_id: ID_CONTADOR 
        };
        localStorage.setItem(DATA_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error("Falha ao salvar dados:", e);
        alert("Falha ao salvar dados no navegador.");
    }
}

// ---------------- GUI: Tabela (Treeview) ----------------
function atualizarTabelaEventos() {
    const tbody = document.getElementById('eventos-tbody');
    tbody.innerHTML = ''; // Limpa as linhas existentes
    
    // Obtém as chaves (IDs) e ordena
    const idsOrdenados = Object.keys(eventos).map(Number).sort((a, b) => a - b);

    for (const id_evento of idsOrdenados) {
        const dados = eventos[id_evento];
        const row = tbody.insertRow();
        row.id = `row-${id_evento}`;
        row.onclick = () => selecionarLinha(id_evento, row);

        // Verifica se é o evento selecionado para aplicar a classe 'selected'
        if (id_evento === eventoSelecionadoID) {
            row.classList.add('selected');
        }

        // Colunas
        row.insertCell().textContent = id_evento; // Coluna #0 (ID)
        row.insertCell().textContent = dados.nome || "";
        row.insertCell().textContent = dados.data || "";
        row.insertCell().textContent = dados.local || "";
        row.insertCell().textContent = dados.telefone || "";
        row.insertCell().textContent = dados.inscricoes ? dados.inscricoes.length : 0;
    }
    
    // Atualiza o display de seleção após a tabela
    atualizarDisplaySelecao();
}

function selecionarLinha(id, rowElement) {
    // 1. Remove a seleção de todas as outras linhas
    document.querySelectorAll('#eventos-tbody tr').forEach(tr => {
        tr.classList.remove('selected');
    });

    // 2. Aplica a seleção à linha clicada
    rowElement.classList.add('selected');
    eventoSelecionadoID = id;

    // 3. Atualiza o badge
    atualizarDisplaySelecao();
}

function getEventoSelecionado() {
    if (!eventoSelecionadoID || !eventos[eventoSelecionadoID]) {
        alert("Selecione um evento na tabela.");
        return null;
    }
    return eventos[eventoSelecionadoID];
}

function atualizarDisplaySelecao() {
    const badge = document.getElementById('selecao-evento');
    if (eventoSelecionadoID && eventos[eventoSelecionadoID]) {
        badge.textContent = `Selecionado: ${eventos[eventoSelecionadoID].nome} (ID ${eventoSelecionadoID})`;
        badge.style.backgroundColor = 'var(--primary-color)';
    } else {
        badge.textContent = "Nenhum evento selecionado";
        badge.style.backgroundColor = 'var(--secondary-color)';
        eventoSelecionadoID = null;
    }
}

// ---------------- GUI: Modais ----------------
function abrirModal(id) {
    document.getElementById(id).style.display = 'block';
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

// ---------------- Ações: Adicionar Evento ----------------
function abrirModalAdicionarEvento() {
    const form = document.getElementById('form-evento');
    form.reset(); // Limpa o formulário
    abrirModal('modal-evento');
}

document.getElementById('form-evento').onsubmit = function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const data = document.getElementById('data').value.trim();
    const local = document.getElementById('local').value.trim();
    const telefone = document.getElementById('telefone').value.trim();

    if (!nome || !data || !local) {
        alert("Nome, Data e Local são obrigatórios.");
        return;
    }

    const novo = { 
        nome: nome, 
        data: data, 
        local: local, 
        telefone: telefone, 
        inscricoes: [] 
    };
    
    eventos[ID_CONTADOR] = novo;
    ID_CONTADOR += 1;
    saveEvents();
    atualizarTabelaEventos();
    alert(`Evento '${nome}' criado com sucesso.`);
    fecharModal('modal-evento');
};

// ---------------- Ações: Inscrever Participante ----------------
function abrirModalInscreverParticipante() {
    const evento = getEventoSelecionado();
    if (!evento) return;
    
    document.getElementById('inscricao-titulo').textContent = `Inscrever em: ${evento.nome}`;
    document.getElementById('form-inscricao').reset();
    abrirModal('modal-inscricao');
}

document.getElementById('form-inscricao').onsubmit = function(e) {
    e.preventDefault();

    const evento = getEventoSelecionado();
    if (!evento) return; 

    const nome = document.getElementById('participante-nome').value.trim();
    const email = document.getElementById('participante-email').value.trim();

    if (!nome || !email) {
        alert("Nome e Email são obrigatórios.");
        return;
    }

    const participante = { nome: nome, email: email };
    evento.inscricoes.push(participante);
    
    saveEvents();
    atualizarTabelaEventos();
    alert(`${nome} inscrito(a) em '${evento.nome}'.`);
    fecharModal('modal-inscricao');
};

// ---------------- Ações: Consultar Inscritos ----------------
function abrirModalConsultarInscritos() {
    const evento = getEventoSelecionado();
    if (!evento) return;

    const inscritos = evento.inscricoes || [];
    const listaDiv = document.getElementById('lista-inscritos');
    
    document.getElementById('inscritos-titulo').textContent = `Inscritos: ${evento.nome}`;
    
    let texto = `Evento: ${evento.nome} (ID ${eventoSelecionadoID})\nTotal de inscritos: ${inscritos.length}\n\n`;

    if (inscritos.length === 0) {
        texto += "Nenhum participante inscrito.";
    } else {
        inscritos.forEach(p => {
            texto += `- ${p.nome} (${p.email})\n`;
        });
    }

    // Exibe o texto formatado.
    listaDiv.innerHTML = `<p>${texto.replace(/\n/g, '<br>')}</p>`;

    abrirModal('modal-inscritos');
}

// ---------------- Ações: Remover Evento ----------------
function removerEventoSelecionado() {
    if (!eventoSelecionadoID || !eventos[eventoSelecionadoID]) {
        alert("Selecione um evento para remover.");
        return;
    }
    
    const nomeEvento = eventos[eventoSelecionadoID].nome;

    if (confirm(`Tem certeza que deseja remover o evento '${nomeEvento}' (ID ${eventoSelecionadoID})?`)) {
        delete eventos[eventoSelecionadoID];
        eventoSelecionadoID = null; // Limpa a seleção
        saveEvents();
        atualizarTabelaEventos();
        alert(`Evento '${nomeEvento}' removido.`);
    }
}

// ---------------- Inicialização ----------------
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    atualizarTabelaEventos();
});