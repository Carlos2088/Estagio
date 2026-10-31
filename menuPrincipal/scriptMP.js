const LOGIN_URL = '../telaLogin/index.html';
const SESSAO_KEY = 'motorpoint_user_session';

const CORES = {
    amarelo: { hex: '#eab308', texto: '#1e293b', nome: 'Atenção' },
    laranja: { hex: '#f97316', texto: '#ffffff', nome: 'Pendente' },
    vermelho: { hex: '#ef4444', texto: '#ffffff', nome: 'Problema' },
    verde: { hex: '#10b981', texto: '#ffffff', nome: 'Concluído' },
    azul: { hex: '#3b82f6', texto: '#ffffff', nome: 'Informativo' }
};

const STATUS = {
    'Agendado': 'bg-sky-500/20 text-sky-400',
    'Em Andamento': 'bg-amber-500/20 text-amber-400',
    'Concluído': 'bg-emerald-500/20 text-emerald-400'
};

/* ================= Armazenamento ================= */
function ler(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) || padrao; }
    catch (e) { return padrao; }
}
function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) {}
}
function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

/* ================= Estado ================= */
let coresDias = ler('oficina_cores_dias', {});        // { '2026-10-17': 'verde' }
let agendamentos = ler('oficina_agendamentos', []);    // [{id, data, hora, servico, cliente, status}]
let mesVisivel = new Date(); mesVisivel.setDate(1);
const chaveData = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
let diaSelecionado = chaveData(new Date());

function formatarData(chave) {
    const [a, m, d] = chave.split('-');
    return `${d}/${m}/${a}`;
}

/* ================= Barra lateral ================= */
function toggleMenu(menuId, iconId, btn) {
    const menu = document.getElementById(menuId);
    const icon = document.getElementById(iconId);
    if (!menu) return;
    const aberto = menu.classList.toggle('hidden') === false;
    if (icon) icon.classList.toggle('rotate-180', aberto);
    if (btn) btn.setAttribute('aria-expanded', aberto);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth >= 1024) {
        const oculta = sidebar.classList.toggle('collapsed');
        gravar('oficina_sidebar_oculta', oculta);
        atualizarSetaSidebar(oculta);
    } else {
        sidebar.classList.toggle('-translate-x-full');
        document.getElementById('sidebarOverlay').classList.toggle('hidden');
    }
}

function atualizarSetaSidebar(oculta) {
    const icon = document.getElementById('sidebarToggleIcon');
    if (icon) icon.className = oculta ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
}

function destacarLinkAtual() {
    const paginaAtual = location.pathname.split('/').pop();
    if (!paginaAtual) return;
    document.querySelectorAll('.nav-link').forEach(link => {
        const destino = link.getAttribute('href').split('/').pop();
        if (destino !== paginaAtual) return;
        link.classList.add('bg-[#e06666]/15', 'text-white', 'font-semibold');
        link.classList.remove('text-slate-400', 'text-slate-300');
        const submenu = link.closest('[id$="Submenu"]');
        if (submenu) {
            submenu.classList.remove('hidden');
            const icon = document.getElementById(submenu.id + 'Icon');
            if (icon) icon.classList.add('rotate-180');
        }
    });
}

async function sairDoSistema() {
    if (!confirm('Deseja sair do sistema?')) return;
    if (typeof Api !== 'undefined' && Api.logout) {
        try { await Api.logout(); } catch (e) {}
    }
    localStorage.removeItem(SESSAO_KEY);
    window.location.replace(LOGIN_URL);
}

/* ================= Calendário ================= */
function mudarMes(delta) {
    mesVisivel.setMonth(mesVisivel.getMonth() + delta);
    renderCalendario();
}

function selecionarDia(chave) {
    diaSelecionado = chave;
    renderCalendario();
    renderAgendamentos();
}

async function definirCor(nomeCor) {
    if (nomeCor) coresDias[diaSelecionado] = nomeCor;
    else delete coresDias[diaSelecionado];
    gravar('oficina_cores_dias', coresDias);
    renderCalendario();
    if (typeof Api !== 'undefined' && Api.salvarConfig) {
        try { await Api.salvarConfig({ coresDias, agendamentos }); } catch (e) {}
    }
}

function renderPaleta() {
    const box = document.getElementById('paletaCores');
    if (!box) return;
    let html = '';
    for (const [nome, c] of Object.entries(CORES)) {
        html += `<button type="button" onclick="definirCor('${nome}')" class="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition">
            <span class="w-3 h-3 rounded-full" style="background:${c.hex}"></span><span>${c.nome}</span></button>`;
    }
    html += `<button type="button" onclick="definirCor(null)" class="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-400 transition"><i class="fa-solid fa-eraser mr-1"></i>Limpar</button>`;
    box.innerHTML = html;
}

function renderCalendario() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('monthLabel');
    if (!grid) return;

    const ano = mesVisivel.getFullYear();
    const mes = mesVisivel.getMonth();
    const hojeChave = chaveData(new Date());
    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();

    if (label) {
        const nome = mesVisivel.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        label.innerText = nome.charAt(0).toUpperCase() + nome.slice(1);
    }
    const selLabel = document.getElementById('diaSelecionadoLabel');
    if (selLabel) selLabel.innerText = formatarData(diaSelecionado);

    grid.innerHTML = '';
    for (let i = 0; i < primeiroDiaSemana; i++) grid.appendChild(document.createElement('div'));

    for (let d = 1; d <= diasNoMes; d++) {
        const chave = chaveData(new Date(ano, mes, d));
        const cor = CORES[coresDias[chave]];
        const temAg = agendamentos.some(a => a.data === chave);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'relative p-2 rounded-lg text-sm transition ' + (cor ? 'font-semibold' : 'text-slate-300 hover:bg-slate-800');
        btn.innerText = d;
        if (cor) { btn.style.background = cor.hex; btn.style.color = cor.texto; }

        const sombras = [];
        if (chave === hojeChave) sombras.push('inset 0 0 0 2px #e06666');
        if (chave === diaSelecionado) sombras.push('0 0 0 2px #f1f5f9');
        if (sombras.length) btn.style.boxShadow = sombras.join(',');

        if (temAg) {
            const ponto = document.createElement('span');
            ponto.className = 'absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full';
            ponto.style.background = cor ? cor.texto : '#e06666';
            btn.appendChild(ponto);
        }
        btn.onclick = () => selecionarDia(chave);
        grid.appendChild(btn);
    }
}

/* ================= Agendamentos ================= */
function renderAgendamentos() {
    const lista = document.getElementById('listaAgendamentos');
    const titulo = document.getElementById('tituloAgendamentos');
    if (!lista) return;

    const ehHoje = diaSelecionado === chaveData(new Date());
    if (titulo) titulo.innerText = ehHoje ? 'Agendamentos do Dia' : `Agendamentos de ${formatarData(diaSelecionado)}`;

    const doDia = agendamentos
        .filter(a => a.data === diaSelecionado)
        .sort((a, b) => a.hora.localeCompare(b.hora));

    if (!doDia.length) {
        lista.innerHTML = `<p class="text-sm text-slate-500 text-center py-6">Nenhum agendamento para este dia. Clique no + para adicionar.</p>`;
        return;
    }

    lista.innerHTML = doDia.map(a => `
        <div class="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
            <div class="flex items-center space-x-4 min-w-0">
                <div class="bg-[#e06666]/10 text-[#e06666] font-bold px-3 py-2 rounded-lg text-sm">${esc(a.hora)}</div>
                <div class="min-w-0">
                    <h4 class="font-semibold text-slate-200 truncate">${esc(a.servico)}</h4>
                    ${a.cliente ? `<p class="text-xs text-slate-400">Cliente: ${esc(a.cliente)}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <button type="button" onclick="alternarStatus('${a.id}')" title="Clique para mudar o status" class="text-xs px-3 py-1 rounded-full ${STATUS[a.status]}">${esc(a.status)}</button>
                <button type="button" onclick="removerAgendamento('${a.id}')" class="w-8 h-8 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition" aria-label="Excluir"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('');
}

async function alternarStatus(id) {
    const ordem = Object.keys(STATUS);
    const ag = agendamentos.find(a => a.id === id);
    if (!ag) return;
    ag.status = ordem[(ordem.indexOf(ag.status) + 1) % ordem.length];
    gravar('oficina_agendamentos', agendamentos);
    renderAgendamentos();
    if (typeof Api !== 'undefined' && Api.salvarConfig) {
        try { await Api.salvarConfig({ agendamentos, coresDias }); } catch (e) {}
    }
}

async function removerAgendamento(id) {
    if (!confirm('Excluir este agendamento?')) return;
    agendamentos = agendamentos.filter(a => a.id !== id);
    gravar('oficina_agendamentos', agendamentos);
    renderAgendamentos();
    renderCalendario();
    if (typeof Api !== 'undefined' && Api.salvarConfig) {
        try { await Api.salvarConfig({ agendamentos, coresDias }); } catch (e) {}
    }
}

function abrirModal() {
    document.getElementById('modalData').innerText = formatarData(diaSelecionado);
    ['agHora', 'agServico', 'agCliente'].forEach(i => document.getElementById(i).value = '');
    document.getElementById('agErro').classList.add('hidden');
    const m = document.getElementById('modalAgendamento');
    m.classList.remove('hidden');
    m.classList.add('flex');
    document.getElementById('agHora').focus();
}

function fecharModal() {
    const m = document.getElementById('modalAgendamento');
    m.classList.add('hidden');
    m.classList.remove('flex');
}

async function salvarAgendamento() {
    const hora = document.getElementById('agHora').value;
    const servico = document.getElementById('agServico').value.trim();
    const cliente = document.getElementById('agCliente').value.trim();
    if (!hora || !servico) {
        document.getElementById('agErro').classList.remove('hidden');
        return;
    }
    agendamentos.push({ id: String(Date.now()), data: diaSelecionado, hora, servico, cliente, status: 'Agendado' });
    gravar('oficina_agendamentos', agendamentos);
    fecharModal();
    renderAgendamentos();
    renderCalendario();
    if (typeof Api !== 'undefined' && Api.salvarConfig) {
        try { await Api.salvarConfig({ agendamentos, coresDias }); } catch (e) {}
    }
}

function atualizarEstoque() {
    const pecas = (typeof Api !== 'undefined' && Api.cache.pecas && Api.cache.pecas.length)
        ? Api.cache.pecas
        : ler('oficina_pecas', []);
    const total = document.getElementById('totalPecas');
    const hoje = document.getElementById('totalPecasCadastradas');
    if (total) total.innerText = pecas.length;
    if (hoje) hoje.innerText = pecas.length;
}

/* ================= Inicialização ================= */
document.addEventListener('DOMContentLoaded', async () => {
    const dataEl = document.getElementById('currentDate');
    if (dataEl) {
        dataEl.innerText = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    if (ler('oficina_sidebar_oculta', false) && window.innerWidth >= 1024) {
        document.getElementById('sidebar').classList.add('collapsed');
        atualizarSetaSidebar(true);
    }

    // Carregar dados atualizados do back-end
    if (typeof Api !== 'undefined' && Api.carregar) {
        try {
            await Api.carregar('config', 'pecas');
            if (Api.cache.config) {
                coresDias = Api.cache.config.coresDias || {};
                agendamentos = Api.cache.config.agendamentos || [];
                gravar('oficina_cores_dias', coresDias);
                gravar('oficina_agendamentos', agendamentos);
            }
        } catch (e) {
            console.warn('Usando armazenamento local (servidor indisponível):', e);
        }
    }

    renderPaleta();
    renderCalendario();
    renderAgendamentos();
    destacarLinkAtual();
    atualizarEstoque();

    document.getElementById('modalAgendamento').addEventListener('click', (e) => {
        if (e.target.id === 'modalAgendamento') fecharModal();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });
});
