/* ===== Configuração ===== */
const LOGIN_URL = '../telaLogin/index.html'; // ajuste para o nome real do arquivo do login
const SESSAO_KEY = 'motorpoint_user_session';
// Nomes possíveis dos campos da peça (ajuste se o seu cadastro usar outros)
const CAMPOS = {
  codigo: ['codigoInterno','codInterno','codigo','cod'],
  descricao: ['descricao','nome'],
  marca: ['marca'],
  qtd: ['quantidade','estoque','qtd','qtde','quantidadeEstoque','qtdEstoque'],
  preco: ['precoVenda','preco','valorVenda','valor']
};
const STATUS_PED = {'Em Análise':'bg-sky-500/20 text-sky-400','Pendente':'bg-amber-500/20 text-amber-400','Aprovado':'bg-emerald-500/20 text-emerald-400','Faturado':'bg-violet-500/20 text-violet-300','Cancelado':'bg-red-500/20 text-red-400'};
const STATUS_VEN = {'Concluída':'bg-emerald-500/20 text-emerald-400','Cancelada':'bg-red-500/20 text-red-400'};

/* ===== Utilidades ===== */
const $ = id => document.getElementById(id);
const ler = (k, p) => { try { return JSON.parse(localStorage.getItem(k)) || p; } catch (e) { return p; } };
const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const esc = t => { const d = document.createElement('div'); d.textContent = t == null ? '' : t; return d.innerHTML; };
const pick = (o, k) => { for (const c of CAMPOS[k]) if (o[c] !== undefined && o[c] !== '') return o[c]; };
const keyOf = (o, k) => CAMPOS[k].find(c => o[c] !== undefined && o[c] !== '') || CAMPOS[k][0];
const pid = p => String(p.id !== undefined ? p.id : (pick(p, 'codigo') || ''));
const num = v => { if (typeof v === 'number') return v; let s = String(v == null ? '' : v).replace(/[^\d,.-]/g, ''); if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.'); const n = parseFloat(s); return isNaN(n) ? 0 : n; };
const money = n => n.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
const fmtNum = n => String(n).padStart(4, '0');
const fmtData = iso => new Date(iso).toLocaleString('pt-BR', {dateStyle:'short', timeStyle:'short'});
const totalDe = itens => itens.reduce((s, i) => s + num(i.preco) * i.qtd, 0);
const clone = o => JSON.parse(JSON.stringify(o));
function toast(msg, erro) {
  const t = $('toast'); t.innerText = msg;
  t.className = 'fixed bottom-6 right-6 text-white px-6 py-3.5 rounded-xl shadow-2xl z-50 font-medium ' + (erro ? 'bg-red-600' : 'bg-emerald-600');
  setTimeout(() => t.classList.add('hidden'), 3500);
}

/* ===== Estado ===== */
let pedidos = ler('oficina_pedidos', []);
let vendas = ler('oficina_vendas', []);
let itens = [];
let editId = null;
let cfAcao = null;

/* ===== Barra lateral ===== */
function toggleMenu(id, icon) { const aberto = $(id).classList.toggle('hidden') === false; $(icon).classList.toggle('rotate-180', aberto); }
function toggleSidebar() {
  const s = $('sidebar');
  if (window.innerWidth >= 1024) {
    const oculta = s.classList.toggle('collapsed');
    gravar('oficina_sidebar_oculta', oculta);
    $('setaSidebar').className = oculta ? 'fa-solid fa-angles-right' : 'fa-solid fa-angles-left';
  } else { s.classList.toggle('-translate-x-full'); $('overlay').classList.toggle('hidden'); }
}
function sair() {
  if (!confirm('Deseja sair do sistema?')) return;
  localStorage.removeItem(SESSAO_KEY);
  window.location.replace(LOGIN_URL);
}

/* ===== Abas ===== */
const ABAS = ['novo', 'pedidos', 'vendas'];
function mostrarAba(nome) {
  ABAS.forEach(a => $('aba-' + a).classList.toggle('hidden', a !== nome));
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.aba === nome));
  document.querySelectorAll('[data-link-aba]').forEach(a => {
    ['ring-1', 'ring-[#e06666]'].forEach(c => a.classList.toggle(c, a.dataset.linkAba === nome));
  });
  if (nome === 'pedidos') renderPedidos();
  if (nome === 'vendas') renderVendas();
  try { if (location.hash !== '#' + nome) history.replaceState(null, '', '#' + nome); } catch (e) {}
}
window.addEventListener('hashchange', () => {
  const a = location.hash.slice(1);
  if (ABAS.includes(a)) mostrarAba(a);
});

/* ===== Formulário do pedido ===== */
// CPF/CNPJ e número são opcionais no pedido, mas, se preenchidos, precisam ser válidos
const CAMPOS_CLIENTE = [
  ['cDoc', v => v ? validarDocumento(v) : { ok: true, msg: '' }],
  ['cNumero', v => v ? validarTelefone(v) : { ok: true, msg: '' }]
];

function preencherVendedor() {
  const sessao = ler(SESSAO_KEY, null);
  const login = sessao && sessao.usuario ? String(sessao.usuario) : '';
  const u = ler('oficina_usuarios', []).find(x => [x.email, x.nome, x.documento].some(c => c && String(c).toLowerCase() === login.toLowerCase()));
  if (u) { $('vNome').value = u.nome || ''; $('vCargo').value = u.cargo || ''; }
  else if (login === 'admin') { $('vNome').value = 'admin'; $('vCargo').value = 'Administrador'; }
  else { $('vNome').value = login; $('vCargo').value = ''; }
}
function preencherCliente() {
  carregarMotos();
  const nome = $('cNome').value.trim().toLowerCase();
  const u = ler('oficina_usuarios', []).find(x => (x.nome || '').toLowerCase() === nome);
  if (u) { if (!$('cNumero').value) $('cNumero').value = mascaraTelefone(u.telefone); if (!$('cDoc').value) $('cDoc').value = mascaraDocumento(u.documento); }
}
function limparForm() {
  editId = null; itens = [];
  ['cNome','cNumero','cDoc','busca'].forEach(i => $(i).value = '');
  carregarMotos();
  $('bannerEdit').classList.add('hidden'); $('formErro').classList.add('hidden'); limparErrosCampos($('aba-novo'));
  $('tabNovoTxt').innerText = 'Novo Pedido'; $('btnSalvar').innerText = 'Salvar';
  preencherVendedor(); renderItens();
}
function erroForm(msg) { const e = $('formErro'); e.innerText = msg; e.classList.remove('hidden'); }

function renderBusca() {
  const box = $('resultados'), termo = $('busca').value.trim().toLowerCase();
  const pecas = ler('oficina_pecas', []).filter(p => !termo || [pick(p,'codigo'), pick(p,'descricao'), pick(p,'marca')].some(c => c && String(c).toLowerCase().includes(termo))).slice(0, 8);
  if (!pecas.length) { box.innerHTML = '<p class="p-4 text-sm text-slate-500 text-center">Nenhuma peça encontrada.</p>'; box.classList.remove('hidden'); return; }
  box.innerHTML = pecas.map(p => `
    <button type="button" onclick="adicionarItem('${esc(pid(p))}')" class="w-full text-left px-4 py-3 hover:bg-slate-800/60 border-b border-slate-800/60 last:border-0 flex items-center justify-between gap-3">
      <span class="min-w-0"><span class="block text-sm font-medium text-slate-100 truncate">${esc(pick(p,'descricao'))}</span>
      <span class="block text-xs text-slate-400">${esc(pick(p,'codigo'))} · ${esc(pick(p,'marca'))} · Estoque: ${num(pick(p,'qtd'))}</span></span>
      <i class="fa-solid fa-plus text-[#E06666]"></i>
    </button>`).join('');
  box.classList.remove('hidden');
}
document.addEventListener('click', e => { if (!e.target.closest('#busca') && !e.target.closest('#resultados')) $('resultados').classList.add('hidden'); });

function adicionarItem(id) {
  const p = ler('oficina_pecas', []).find(x => pid(x) === id);
  if (!p) return;
  const ex = itens.find(i => i.pecaId === id);
  if (ex) ex.qtd++;
  else itens.push({pecaId:id, codigo:pick(p,'codigo') || '', descricao:pick(p,'descricao') || '', marca:pick(p,'marca') || '', qtd:1, preco:num(pick(p,'preco'))});
  $('busca').value = ''; $('resultados').classList.add('hidden'); renderItens();
}
function mudarQtd(i, v) { itens[i].qtd = Math.max(1, parseInt(v) || 1); renderItens(); }
function removerItem(i) { itens.splice(i, 1); renderItens(); }
const STATUS_COR = {'Em Análise':'#38bdf8','Pendente':'#f59e0b','Aprovado':'#10b981','Faturado':'#a78bfa','Cancelado':'#ef4444','Concluída':'#10b981','Cancelada':'#ef4444'};
function vazio(icone, msg) { return `<div class="vazio"><i class="fa-solid ${icone}"></i>${msg}</div>`; }
function cardResumo(icone, cor, rotulo, valor, clique) {
  const tag = clique ? 'button type="button" onclick="' + clique + '"' : 'div';
  return `<${tag} class="card-resumo text-left"><span class="ico" style="background:${cor}26;color:${cor}"><i class="fa-solid ${icone}"></i></span>
    <span><span class="block text-xs text-slate-400">${rotulo}</span><span class="block text-lg font-bold text-slate-100">${valor}</span></span></${clique ? 'button' : 'div'}>`;
}
function atualizarContadores() { $('cntPedidos').innerText = pedidos.length; $('cntVendas').innerText = vendas.length; }

function renderItens() {
  const pecas = ler('oficina_pecas', []);
  $('listaItens').innerHTML = itens.length ? itens.map((it, i) => {
    const pc = pecas.find(x => pid(x) === it.pecaId), disp = pc ? num(pick(pc, 'qtd')) : 0;
    const falta = it.qtd > disp, sub = num(it.preco) * it.qtd;
    return `<div class="item-linha ${falta ? 'item-alerta' : ''}">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold truncate">${esc(it.descricao)}</p>
        <p class="text-xs text-slate-500 truncate">${esc(it.codigo)}${it.marca ? ' · ' + esc(it.marca) : ''}</p>
        <p class="text-xs ${falta ? 'text-amber-400' : 'text-emerald-400'}"><i class="fa-solid ${falta ? 'fa-triangle-exclamation' : 'fa-circle-check'} mr-1"></i>${falta ? 'Acima do estoque' : 'Em estoque'}: ${disp}</p>
      </div>
      <div class="flex flex-col items-end gap-1.5">
        <div class="stepper"><button type="button" onclick="mudarQtd(${i}, ${it.qtd - 1})">−</button>
          <input type="number" min="1" value="${it.qtd}" onchange="mudarQtd(${i}, this.value)"><button type="button" onclick="mudarQtd(${i}, ${it.qtd + 1})">+</button></div>
        <span class="text-xs text-slate-400">${num(it.preco) > 0 ? money(num(it.preco)) + ' un · <b class="text-slate-100">' + money(sub) + '</b>' : 'sem preço'}</span>
      </div>
      <button type="button" onclick="removerItem(${i})" class="text-slate-500 hover:text-red-400" title="Remover"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  }).join('') : vazio('fa-cart-plus', 'Pesquise uma peça acima para adicionar ao pedido.');
  const t = totalDe(itens), un = itens.reduce((s, i) => s + i.qtd, 0);
  $('resumoForm').innerHTML = `<div class="flex items-end justify-between gap-3">
    <div><p class="text-xs text-slate-400">${itens.length} item(ns) · ${un} unidade(s)</p><p class="text-xs text-slate-400 mt-1">Total do pedido</p></div>
    <p class="text-2xl font-bold text-slate-100">${t > 0 ? money(t) : '-'}</p></div>`;
}

function carregarMotos(sel) {
  const nome = semAcento($('cNome').value).trim().toLowerCase();
  const motos = ler('oficina_motos', []).filter(m => semAcento(m.dono).trim().toLowerCase() === nome);
  $('cMoto').innerHTML = '<option value="">Sem moto (venda balcão)</option>' +
    motos.map(m => `<option value="${esc(m.id)}">${esc(m.placa)} — ${esc(m.marca)} ${esc(m.modelo)}</option>`).join('');
  if (sel) $('cMoto').value = sel;
}
function motoSelecionada() {
  const id = $('cMoto').value;
  const m = id ? ler('oficina_motos', []).find(x => x.id === id) : null;
  return m ? { id: m.id, placa: m.placa, marca: m.marca, modelo: m.modelo } : null;
}

function salvarPedido() {
  const v = {nome:$('vNome').value.trim(), cargo:$('vCargo').value.trim()};
  const c = {nome:$('cNome').value.trim(), numero:$('cNumero').value.trim(), documento:$('cDoc').value.trim()};
  if (!v.nome || !c.nome) return erroForm('Informe o nome do vendedor e do cliente.');
  if (!validarLista(CAMPOS_CLIENTE)) return erroForm('Corrija os campos destacados em vermelho.');
  if (!itens.length) return erroForm('Adicione ao menos um item ao pedido.');
  if (editId) {
    const p = pedidos.find(x => x.id === editId);
    Object.assign(p, {vendedor:v, cliente:c, moto:motoSelecionada(), itens:clone(itens)});
    toast('Pedido #' + fmtNum(p.numero) + ' alterado.');
  } else {
    const numero = pedidos.reduce((m, p) => Math.max(m, p.numero), 0) + 1;
    pedidos.push({id:String(Date.now()), numero, data:new Date().toISOString(), vendedor:v, cliente:c, moto:motoSelecionada(), itens:clone(itens), status:'Em Análise'});
    toast('Pedido #' + fmtNum(numero) + ' registrado para análise.');
  }
  gravar('oficina_pedidos', pedidos);
  limparForm(); mostrarAba('pedidos');
}

/* ===== Lista de pedidos ===== */
function acoesPedido(p) {
  const b = (acao, txt, cor) => `<button type="button" onclick="acaoPedido('${p.id}','${acao}')" class="bt ${cor}">${txt}</button>`;
  const alt = b('alterar','Alterar','bg-slate-700 hover:bg-slate-600 text-slate-100');
  const pen = b('pendencia','Pendência','bg-amber-500/20 hover:bg-amber-500/30 text-amber-300');
  const apr = b('aprovar','Aprovar','bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300');
  const can = b('cancelar','Cancelar','bg-red-500/20 hover:bg-red-500/30 text-red-300');
  const ven = b('vender','Realizar venda','bg-[#E06666] hover:bg-[#c95252] text-white');
  if (p.status === 'Em Análise') return alt + pen + apr + can;
  if (p.status === 'Pendente') return alt + apr + can;
  if (p.status === 'Aprovado') return ven + pen + can;
  return '';
}
function filtrarStatus(s) { $('filtroStatus').value = s; renderPedidos(); }
function progresso(p) {
  if (p.status === 'Cancelado') return '<span class="text-xs text-red-400"><i class="fa-solid fa-ban mr-1"></i>Pedido cancelado</span>';
  const fluxo = ['Em Análise', 'Aprovado', 'Faturado'];
  const atual = p.status === 'Pendente' ? 0 : fluxo.indexOf(p.status);
  return '<div class="passos">' + fluxo.map((f, i) =>
    `<span class="passo ${i <= atual ? 'on' : ''} ${p.status === 'Pendente' && i === 0 ? 'pend' : ''}"><i></i>${p.status === 'Pendente' && i === 0 ? 'Pendente' : f}</span>`
  ).join('<span class="passo-linha"></span>') + '</div>';
}
function renderPedidos() {
  const f = $('filtroStatus').value, cont = st => pedidos.filter(p => p.status === st).length;
  $('resumoPedidos').innerHTML = cardResumo('fa-list', '#94a3b8', 'Todos', pedidos.length, "filtrarStatus('')") +
    [['Em Análise', 'fa-hourglass-half'], ['Pendente', 'fa-pause'], ['Aprovado', 'fa-circle-check'], ['Faturado', 'fa-receipt']]
      .map(([s, ic]) => cardResumo(ic, STATUS_COR[s], s, cont(s), `filtrarStatus('${s}')`)).join('');
  const lista = pedidos.filter(p => !f || p.status === f).sort((a, b) => b.numero - a.numero);
  $('listaPedidos').innerHTML = lista.length ? lista.map(p => {
    const t = totalDe(p.itens), qt = p.itens.reduce((s, i) => s + i.qtd, 0);
    return `<div class="pedido-card space-y-3" style="border-left-color:${STATUS_COR[p.status]}">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div><span class="font-bold">Pedido #${fmtNum(p.numero)}</span><span class="text-xs text-slate-400 ml-2">${fmtData(p.data)}</span></div>
        <span class="text-xs px-3 py-1 rounded-full ${STATUS_PED[p.status]}">${esc(p.status)}</span>
      </div>
      ${progresso(p)}
      <div class="text-sm text-slate-300 grid sm:grid-cols-2 gap-1">
        <p><i class="fa-solid fa-user text-slate-500 mr-2"></i>${esc(p.cliente.nome)} ${p.cliente.documento ? '· ' + esc(p.cliente.documento) : ''}${p.moto ? ' · <i class="fa-solid fa-motorcycle text-slate-500"></i> ' + esc(p.moto.placa) : ''}</p>
        <p><i class="fa-solid fa-id-badge text-slate-500 mr-2"></i>${esc(p.vendedor.nome)}${p.vendedor.cargo ? ' (' + esc(p.vendedor.cargo) + ')' : ''}</p>
      </div>
      <p class="text-xs text-slate-400">${p.itens.map(i => esc(i.descricao) + ' x' + i.qtd).join(' · ')}</p>
      <div class="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-slate-800">
        <span class="text-sm text-slate-400">${qt} un.${t > 0 ? ' · <b class="text-lg text-slate-100">' + money(t) + '</b>' : ''}</span>
        <div class="flex gap-2 flex-wrap">${acoesPedido(p)}</div>
      </div>
    </div>`;
  }).join('') : vazio('fa-clipboard-list', 'Nenhum pedido encontrado.');
  atualizarContadores();
}

function acaoPedido(id, acao) {
  const p = pedidos.find(x => x.id === id); if (!p) return;
  const n = '#' + fmtNum(p.numero);
  if (acao === 'alterar') {
    editId = id; itens = clone(p.itens);
    $('vNome').value = p.vendedor.nome; $('vCargo').value = p.vendedor.cargo;
    $('cNome').value = p.cliente.nome; $('cNumero').value = mascaraTelefone(p.cliente.numero); $('cDoc').value = mascaraDocumento(p.cliente.documento);
    limparErrosCampos($('aba-novo'));
    carregarMotos(p.moto ? p.moto.id : '');
    $('bannerTxt').innerText = 'Editando o pedido ' + n; $('bannerEdit').classList.remove('hidden');
    $('tabNovoTxt').innerText = 'Editar Pedido'; $('btnSalvar').innerText = 'Salvar alterações';
    renderItens(); mostrarAba('novo'); return;
  }
  if (acao === 'pendencia') { p.status = 'Pendente'; toast('Pedido ' + n + ' colocado em pendência.'); }
  else if (acao === 'aprovar') { p.status = 'Aprovado'; toast('Pedido ' + n + ' aprovado.'); }
  else if (acao === 'cancelar') {
    return abrirConfirm('Cancelar pedido ' + n, '<p>Deseja realmente cancelar este pedido? Essa ação não pode ser desfeita.</p>', 'Cancelar pedido', 'bg-red-600 hover:bg-red-700', () => {
      p.status = 'Cancelado'; gravar('oficina_pedidos', pedidos); renderPedidos(); toast('Pedido ' + n + ' cancelado.');
    });
  }
  else if (acao === 'vender') return abrirVenda(p);
  gravar('oficina_pedidos', pedidos); renderPedidos();
}

/* ===== Modal de confirmação ===== */
function abrirConfirm(titulo, corpo, txtOk, corOk, acao, bloquear) {
  $('cfTitulo').innerText = titulo; $('cfCorpo').innerHTML = corpo;
  const ok = $('cfOk'); ok.innerText = txtOk; ok.className = 'px-6 py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-40 disabled:cursor-not-allowed ' + corOk;
  ok.disabled = !!bloquear; cfAcao = acao;
  $('cfModal').classList.remove('hidden'); $('cfModal').classList.add('flex');
}
function fecharConfirm() { $('cfModal').classList.add('hidden'); $('cfModal').classList.remove('flex'); cfAcao = null; }
$('cfOk').onclick = () => { const a = cfAcao; fecharConfirm(); if (a) a(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharConfirm(); });

/* ===== Venda ===== */
function verificarEstoque(p) {
  const pecas = ler('oficina_pecas', []);
  return p.itens.map(i => { const pc = pecas.find(x => pid(x) === i.pecaId); const disp = pc ? num(pick(pc,'qtd')) : 0; return Object.assign({}, i, {disp, ok: !!pc && disp >= i.qtd}); });
}
function abrirVenda(p) {
  const aprovado = p.status === 'Aprovado', linhas = verificarEstoque(p);
  const tudoOk = aprovado && linhas.every(l => l.ok);
  const corpo = `
    <p>${aprovado ? '<i class="fa-solid fa-circle-check text-emerald-400"></i> Pedido aprovado' : '<i class="fa-solid fa-circle-xmark text-red-400"></i> Pedido não está aprovado'}</p>
    <p class="text-slate-400">Disponibilidade das peças em estoque:</p>
    <table class="w-full text-left text-xs"><thead><tr class="text-slate-500 border-b border-slate-800"><th class="pb-2">Peça</th><th class="pb-2 text-center">Pedido</th><th class="pb-2 text-center">Estoque</th><th class="pb-2 text-right"></th></tr></thead>
    <tbody class="divide-y divide-slate-800/60">${linhas.map(l => `<tr><td class="py-2">${esc(l.descricao)}</td><td class="text-center">${l.qtd}</td><td class="text-center">${l.disp}</td>
      <td class="text-right">${l.ok ? '<i class="fa-solid fa-check text-emerald-400"></i>' : '<span class="text-red-400">Insuficiente</span>'}</td></tr>`).join('')}</tbody></table>
    <p class="pt-2">${tudoOk ? 'Confirma a realização da venda? O estoque será atualizado.' : 'A venda não pode ser realizada até que o problema acima seja resolvido.'}</p>`;
  abrirConfirm('Realizar venda - Pedido #' + fmtNum(p.numero), corpo, 'Confirmar venda', 'bg-[#E06666] hover:bg-[#c95252]', () => realizarVenda(p.id), !tudoOk);
}
function realizarVenda(id) {
  const p = pedidos.find(x => x.id === id), linhas = verificarEstoque(p);
  if (!p || p.status !== 'Aprovado' || !linhas.every(l => l.ok)) return toast('Não foi possível realizar a venda: verifique aprovação e estoque.', true);
  const pecas = ler('oficina_pecas', []);
  linhas.forEach(l => { const pc = pecas.find(x => pid(x) === l.pecaId); const k = keyOf(pc, 'qtd'); pc[k] = num(pc[k]) - l.qtd; });
  gravar('oficina_pecas', pecas);
  const numero = vendas.reduce((m, v) => Math.max(m, v.numero), 0) + 1;
  vendas.push({id:String(Date.now()), numero, pedidoId:p.id, pedidoNumero:p.numero, data:new Date().toISOString(), vendedor:p.vendedor, cliente:p.cliente, moto:p.moto || null, itens:clone(p.itens), total:totalDe(p.itens), status:'Concluída'});
  p.status = 'Faturado';
  gravar('oficina_vendas', vendas); gravar('oficina_pedidos', pedidos);
  toast('Venda #' + fmtNum(numero) + ' registrada e estoque atualizado.');
  mostrarAba('vendas');
}

/* ===== Lista de vendas e cancelamento ===== */
function renderVendas() {
  const lista = vendas.slice().sort((a, b) => b.numero - a.numero);
  const ok = vendas.filter(v => v.status === 'Concluída'), total = ok.reduce((s, v) => s + v.total, 0);
  $('resumoVendas').innerHTML = cardResumo('fa-circle-check', '#10b981', 'Vendas concluídas', ok.length) +
    cardResumo('fa-sack-dollar', '#E06666', 'Total vendido', total > 0 ? money(total) : '-') +
    cardResumo('fa-ban', '#ef4444', 'Canceladas', vendas.length - ok.length);
  $('listaVendas').innerHTML = lista.length ? lista.map(v => `
    <div class="pedido-card space-y-3" style="border-left-color:${STATUS_COR[v.status]}">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div><span class="font-bold">Venda #${fmtNum(v.numero)}</span><span class="text-xs text-slate-400 ml-2">${fmtData(v.data)} · Pedido #${fmtNum(v.pedidoNumero)}</span></div>
        <span class="text-xs px-3 py-1 rounded-full ${STATUS_VEN[v.status]}">${esc(v.status)}</span>
      </div>
      <div class="text-sm text-slate-300 grid sm:grid-cols-2 gap-1">
        <p><i class="fa-solid fa-user text-slate-500 mr-2"></i>${esc(v.cliente.nome)}${v.moto ? ' · <i class="fa-solid fa-motorcycle text-slate-500"></i> ' + esc(v.moto.placa) : ''}</p>
        <p><i class="fa-solid fa-id-badge text-slate-500 mr-2"></i>${esc(v.vendedor.nome)}</p>
      </div>
      <p class="text-xs text-slate-400">${v.itens.map(i => esc(i.descricao) + ' x' + i.qtd).join(' · ')}</p>
      <div class="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-slate-800">
        <span class="text-sm text-slate-400">${v.itens.reduce((s, i) => s + i.qtd, 0)} un.${v.total > 0 ? ' · <b class="text-lg text-slate-100">' + money(v.total) + '</b>' : ''}</span>
        ${v.status === 'Concluída' ? `<button type="button" onclick="pedirCancelarVenda('${v.id}')" class="bt bg-red-500/20 hover:bg-red-500/30 text-red-300"><i class="fa-solid fa-ban mr-1"></i>Cancelar venda</button>` : ''}
      </div>
    </div>`).join('') : vazio('fa-receipt', 'Nenhuma venda registrada.');
  atualizarContadores();
}
function pedirCancelarVenda(id) {
  const v = vendas.find(x => x.id === id); if (!v) return;
  const un = v.itens.reduce((s, i) => s + i.qtd, 0);
  abrirConfirm('Cancelar venda #' + fmtNum(v.numero), `<p>Deseja realmente cancelar esta venda?</p><p class="text-slate-400">As ${un} unidade(s) serão devolvidas ao estoque e o pedido #${fmtNum(v.pedidoNumero)} será marcado como cancelado.</p>`, 'Confirmar cancelamento', 'bg-red-600 hover:bg-red-700', () => cancelarVenda(id));
}
function cancelarVenda(id) {
  const v = vendas.find(x => x.id === id); if (!v || v.status !== 'Concluída') return;
  const pecas = ler('oficina_pecas', []);
  v.itens.forEach(i => { const pc = pecas.find(x => pid(x) === i.pecaId); if (pc) { const k = keyOf(pc, 'qtd'); pc[k] = num(pc[k]) + i.qtd; } });
  gravar('oficina_pecas', pecas);
  v.status = 'Cancelada'; v.dataCancelamento = new Date().toISOString();
  const p = pedidos.find(x => x.id === v.pedidoId); if (p) p.status = 'Cancelado';
  gravar('oficina_vendas', vendas); gravar('oficina_pedidos', pedidos);
  renderVendas(); toast('Venda #' + fmtNum(v.numero) + ' cancelada. Peças devolvidas ao estoque.');
}

/* ===== Inicialização ===== */
document.addEventListener('DOMContentLoaded', () => {
  $('listaClientes').innerHTML = ler('oficina_usuarios', []).map(u => `<option value="${esc(u.nome)}">`).join('');
  if (ler('oficina_sidebar_oculta', false) && window.innerWidth >= 1024) { $('sidebar').classList.add('collapsed'); $('setaSidebar').className = 'fa-solid fa-angles-right'; }
  aplicarMascara('cDoc', 'documento'); aplicarMascara('cNumero', 'telefone');
  ligarValidacaoCampos(CAMPOS_CLIENTE);
  carregarMotos();
  $('cNome').addEventListener('input', () => carregarMotos($('cMoto').value));
  $('busca').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const b = document.querySelector('#resultados button'); if (b) b.click(); } });
  atualizarContadores();
  preencherVendedor(); renderItens();
  const h = location.hash.slice(1);
  mostrarAba(ABAS.includes(h) ? h : 'novo');
});