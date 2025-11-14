// --- Autenticação / Sessão ---
// Nota: a lista de usuários autorizados está somente no código (não exibida em lugar nenhum).
const AUTHORIZED_USERS = ["Davi Oliveira", "John Lennon"]; // mantida internamente
const AUTH_PASSWORD = "admin";

// Dados da aplicação
const DATA_KEY = "planningEventsData";
let eventos = {};
let ID_CONTADOR = 1;
let eventoSelecionadoID = null;

// ---------- Autenticação ----------
function isLoggedIn() {
    return sessionStorage.getItem('pl_user') !== null;
}
function getLoggedUser() {
    return sessionStorage.getItem('pl_user'); // usado internamente, não mostrado na UI
}
function isUserAuthorized() {
    const u = getLoggedUser();
    return u && AUTHORIZED_USERS.includes(u);
}

// Guardamos internamente o nome real no sessionStorage, mas a UI NÃO o revela.
function setLoggedUser(nome) {
    try {
        sessionStorage.setItem('pl_user', String(nome));
    } catch (e) {
        // no caso de storage bloqueado, limpar e seguir
        sessionStorage.removeItem('pl_user');
    }
    updateUIForAuth();
}

function logout() {
    sessionStorage.removeItem('pl_user');
    updateUIForAuth();
    alert('Sessão encerrada.');
}

function attemptLogin(nome, senha) {
    nome = (nome || "").trim();
    senha = (senha || "").trim();

    if (!nome) {
        alert("Informe um nome de usuário.");
        return false;
    }

    // validação interna — NÃO revelar nomes em mensagens públicas
    if (AUTHORIZED_USERS.includes(nome) && senha === AUTH_PASSWORD) {
        setLoggedUser(nome);
        fecharModal('modal-login');
        alert('Login realizado.'); // mensagem genérica, sem expor o nome
        return true;
    }

    alert("Credenciais inválidas. Você pode continuar como visitante para consultar eventos.");
    return false;
}

function continuarComoVisitante() {
    setLoggedUser("Visitante");
    fecharModal('modal-login');
}

// Atualiza botões e exibição de usuário conforme autorização
function updateUIForAuth() {
    const userDisplay = document.getElementById('user-display');
    const btnLogin = document.getElementById('btn-login');
    const btnLogout = document.getElementById('btn-logout');
    const btnAdicionar = document.getElementById('btn-adicionar');
    const btnRemoverEvt = document.getElementById('btn-remover-evento');
    const btnInscrever = document.getElementById('btn-inscrever');

    const user = getLoggedUser();

    // Na interface não mostramos o nome real. Apenas um estado genérico.
    if (user) {
        if (isUserAuthorized()) {
            userDisplay.textContent = 'Usuário: autenticado';
        } else {
            userDisplay.textContent = 'Usuário: visitante';
        }
        btnLogin.style.display = 'none';
        btnLogout.style.display = 'inline-block';
    } else {
        userDisplay.textContent = '';
        btnLogin.style.display = 'inline-block';
        btnLogout.style.display = 'none';
    }

    // Habilita/desabilita ações administrativas
    if (isUserAuthorized()) {
        btnAdicionar.disabled = false;
        btnRemoverEvt.disabled = false;
        btnInscrever.disabled = false;
        btnAdicionar.setAttribute('aria-hidden','false');
        btnRemoverEvt.setAttribute('aria-hidden','false');
        btnInscrever.setAttribute('aria-hidden','false');
    } else {
        // Usuários NÃO autorizados não podem adicionar, remover ou inscrever
        btnAdicionar.disabled = true;
        btnRemoverEvt.disabled = true;
        btnInscrever.disabled = true;
        btnAdicionar.setAttribute('aria-hidden','true');
        btnRemoverEvt.setAttribute('aria-hidden','true');
        btnInscrever.setAttribute('aria-hidden','true');
    }
}

// --- Storage (mesma lógica) ---
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
        eventos = {};
        ID_CONTADOR = 1;
    }
}

function saveEvents() {
    try {
        const payload = { eventos: eventos, next_id: ID_CONTADOR };
        localStorage.setItem(DATA_KEY, JSON.stringify(payload));
    } catch (e) {
        console.error("Falha ao salvar dados:", e);
    }
}

// --- Tabela / seleção ---
function atualizarTabelaEventos() {
    const tbody = document.getElementById('eventos-tbody');
    tbody.innerHTML = '';

    const idsOrdenados = Object.keys(eventos).map(Number).sort((a, b) => a - b);

    for (const id_evento of idsOrdenados) {
        const dados = eventos[id_evento];
        const row = tbody.insertRow();
        row.id = `row-${id_evento}`;
        row.onclick = () => selecionarLinha(id_evento, row);

        if (id_evento === eventoSelecionadoID) row.classList.add('selected');

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
    document.querySelectorAll('#eventos-tbody tr').forEach(tr => tr.classList.remove('selected'));
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

// --- Modais ---
function abrirModal(id) {
    document.getElementById(id).style.display = 'block';
}
function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
}
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = "none";
};

// --- Adicionar Evento ---
function abrirModalAdicionarEvento() {
    if (!isUserAuthorized()) {
        alert("Apenas usuários autorizados podem criar eventos. Faça login.");
        return;
    }
    document.getElementById('form-evento').reset();
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

    const novo = { nome, data, local, telefone, inscricoes: [] };
    eventos[ID_CONTADOR] = novo;
    ID_CONTADOR += 1;
    saveEvents();
    atualizarTabelaEventos();
    alert(`Evento criado.`);
    fecharModal('modal-evento');
};

// --- Inscrição em evento --- (somente autorizados)
function abrirModalInscreverParticipante() {
    if (!isUserAuthorized()) {
        alert("Apenas usuários autorizados podem inscrever participantes. Faça login.");
        return;
    }
    const evento = getEventoSelecionado();
    if (!evento) return;
    document.getElementById('inscricao-titulo').textContent = `Inscrever em: ${evento.nome}`;
    document.getElementById('form-inscricao').reset();
    abrirModal('modal-inscricao');
}

document.getElementById('form-inscricao').onsubmit = function(e) {
    e.preventDefault();
    if (!isUserAuthorized()) {
        alert("Ação negada: apenas usuários autorizados podem inscrever participantes.");
        fecharModal('modal-inscricao');
        return;
    }

    const evento = getEventoSelecionado();
    if (!evento) return;
    const nome = document.getElementById('participante-nome').value.trim();
    const email = document.getElementById('participante-email').value.trim();

    if (!nome || !email) {
        alert("Nome e Email são obrigatórios.");
        return;
    }

    evento.inscricoes.push({ nome, email });
    saveEvents();
    atualizarTabelaEventos();
    alert(`Inscrição realizada.`);
    fecharModal('modal-inscricao');
};

// --- Consultar e remover inscritos (remover somente autorizados) ---
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

            if (isUserAuthorized()) {
                const btn = document.createElement('button');
                btn.className = 'btn-remove-part';
                btn.textContent = 'Remover';
                btn.onclick = () => removerParticipante(index);
                btn.setAttribute('aria-label', `Remover ${p.nome}`);
                item.appendChild(info);
                item.appendChild(btn);
            } else {
                item.appendChild(info);
            }

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
    if (!isUserAuthorized()) {
        alert("Apenas usuários autorizados podem remover participantes.");
        return;
    }
    const inscrito = evento.inscricoes && evento.inscricoes[index];
    if (!inscrito) {
        alert("Participante não encontrado.");
        return;
    }
    if (!confirm(`Remover participante?`)) return;

    evento.inscricoes.splice(index, 1);
    saveEvents();
    atualizarTabelaEventos();
    abrirModalConsultarInscritos();
    alert(`Participante removido.`);
}

// --- Remover evento selecionado (somente autorizado) ---
function removerEventoSelecionado() {
    if (!eventoSelecionadoID || !eventos[eventoSelecionadoID]) {
        alert("Selecione um evento para remover.");
        return;
    }
    if (!isUserAuthorized()) {
        alert("Apenas usuários autorizados podem remover eventos. Faça login.");
        return;
    }

    const nomeEvento = eventos[eventoSelecionadoID].nome;
    if (!confirm(`Tem certeza que deseja remover o evento?`)) return;

    delete eventos[eventoSelecionadoID];
    eventoSelecionadoID = null;
    saveEvents();
    atualizarTabelaEventos();
    alert(`Evento removido.`);
}

// --- Login form handler ---
document.getElementById('form-login').onsubmit = function(e) {
    e.preventDefault();
    const nome = document.getElementById('login-nome').value;
    const senha = document.getElementById('login-senha').value;
    attemptLogin(nome, senha);
};

// --- Inicialização ao carregar a página ---
document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    atualizarTabelaEventos();
    updateUIForAuth();
});
