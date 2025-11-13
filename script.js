const DATA_KEY = "planningEventsData";
let eventos = {};
let ID_CONTADOR = 1;
let eventoSelecionadoID = null;

function loadEvents() {
    try {
        const storedData = localStorage.getItem(DATA_KEY);
        if (storedData) {
            const payload = JSON.parse(storedData);
            eventos = Object.keys(payload.eventos || {}).reduce((acc, key) => {
                acc[parseInt(key)] = payload.eventos[key];
                return acc;
            }, {});
            
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

function atualizarTabelaEventos() {
    const tbody = document.getElementById('eventos-tbody');
    tbody.innerHTML = '';
    
    const idsOrdenados = Object.keys(eventos).map(Number).sort((a, b) => a - b);

    for (const id_evento of idsOrdenados) {
        const dados = eventos[id_evento];
        const row = tbody.insertRow();
        row.id = `row-${id_evento}`;
        row.onclick = () => selecionarLinha(id_evento, row);

        if (id_evento === eventoSelecionadoID) {
            row.classList.add('selected');
        }

        row.insertCell().textContent = id_evento;
        row.insertCell().textContent = dados.nome || "";
        row.insertCell().textContent = dados.data || "";
        row.insertCell().textContent = dados.local || "";
        row.insertCell().textContent = dados.telefone || "";
        row.insertCell().textContent = dados.inscricoes ? dados.inscricoes.length : 0;
    }
    
    atualizarDisplaySelecao();
}

function selecionarLinha(id, rowElement) {
    document.querySelectorAll('#eventos-tbody tr').forEach(tr => {
        tr.classList.remove('selected');
    });

    rowElement.classList.add('selected');
    eventoSelecionadoID = id;

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

function abrirModal(id) {
    document.getElementById(id).style.display = 'block';
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}

function abrirModalAdicionarEvento() {
    const form = document.getElementById('form-evento');
    form.reset();
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

function abrirModalConsultarInscritos() {
    const evento = getEventoSelecionado();
    if (!evento) return;

    const inscritos = evento.inscricoes || [];
    const listaDiv = document.getElementById('lista-inscritos');
    
    document.getElementById('inscritos-titulo').textContent = `Inscritos: ${evento.nome}`;
    
    if (inscritos.length === 0) {
        listaDiv.innerHTML = `<p>Nenhum participante inscrito.</p>`;
    } else {
        const container = document.createElement('div');
        inscritos.forEach((p, index) => {
            const item = document.createElement('div');
            item.className = 'inscrito-item';
            
            const info = document.createElement('div');
            info.className = 'inscrito-info';
            info.innerHTML = `<strong>${p.nome}</strong><br><small>${p.email}</small>`;
            
            const btn = document.createElement('button');
            btn.className = 'btn-remove-part';
            btn.textContent = 'Remover';
            btn.onclick = () => removerParticipante(index);
            btn.setAttribute('aria-label', `Remover ${p.nome}`);
            
            item.appendChild(info);
            item.appendChild(btn);
            container.appendChild(item);
        });
        listaDiv.innerHTML = '';
        listaDiv.appendChild(container);
    }

    abrirModal('modal-inscritos');
}

function removerParticipante(index) {
    const evento = getEventoSelecionado();
    if (!evento) return;

    const inscrito = evento.inscricoes && evento.inscricoes[index];
    if (!inscrito) {
        alert("Participante não encontrado.");
        return;
    }

    if (!confirm(`Remover ${inscrito.nome} (${inscrito.email}) do evento '${evento.nome}'?`)) {
        return;
    }

    evento.inscricoes.splice(index, 1);
    saveEvents();
    atualizarTabelaEventos();

    abrirModalConsultarInscritos();

    alert(`${inscrito.nome} removido(a) de '${evento.nome}'.`);
}

function removerEventoSelecionado() {
    if (!eventoSelecionadoID || !eventos[eventoSelecionadoID]) {
        alert("Selecione um evento para remover.");
        return;
    }
    
    const nomeEvento = eventos[eventoSelecionadoID].nome;

    if (confirm(`Tem certeza que deseja remover o evento '${nomeEvento}' (ID ${eventoSelecionadoID})?`)) {
        delete eventos[eventoSelecionadoID];
        eventoSelecionadoID = null;
        saveEvents();
        atualizarTabelaEventos();
        alert(`Evento '${nomeEvento}' removido.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    atualizarTabelaEventos();
});
