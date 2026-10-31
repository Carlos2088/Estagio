/* ============================================================
   MOTORPOINT - Integração com o back-end (substitui o localStorage)
   Abra o sistema pelo endereço do back-end (ex.: http://localhost:3000),
   para as telas e a API ficarem na mesma origem e o cookie de login funcionar.
   As telas leem os dados de Api.cache (carregado com Api.carregar) e gravam pelas funções abaixo.
   ============================================================ */
(function () {
  const LOGIN = '/telaLogin/index.html';
  const LISTAS = ['usuarios', 'motos', 'pecas', 'pedidos', 'vendas'];
  const cache = { usuarios: [], motos: [], pecas: [], pedidos: [], vendas: [], config: { agendamentos: [], coresDias: {} }, me: null };

  async function req(metodo, url, corpo) {
    let r;
    try {
      r = await fetch(url, {
        method: metodo, credentials: 'same-origin',
        headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : {},
        body: corpo !== undefined ? JSON.stringify(corpo) : undefined
      });
    } catch (e) {
      throw new Error('Não foi possível falar com o servidor. Abra o sistema pelo endereço do back-end (ex.: http://localhost:3000).');
    }
    let dados = {};
    try { dados = await r.json(); } catch (e) {}
    if (r.status === 401 && !url.includes('/auth/login') && !location.pathname.includes('/telaLogin/')) location.replace(LOGIN);
    if (!r.ok) { const err = new Error(dados.erro || 'Erro ' + r.status); err.status = r.status; throw err; }
    return dados;
  }

  // Mensagem do servidor -> campo da tela (ex.: "E-mail já cadastrado(a)." destaca o campo e-mail)
  const CAMPOS_ERRO = [[/e-mail/i, 'email'], [/documento/i, 'documento'], [/placa/i, 'placa'], [/chassi/i, 'chassi'], [/código interno/i, 'codigoInterno']];

  const Api = {
    cache,
    login: (usuario, senha) => req('POST', '/api/auth/login', { usuario, senha }),
    async logout() { try { await req('POST', '/api/auth/logout', {}); } catch (e) {} },
    async me() { cache.me = await req('GET', '/api/auth/me'); return cache.me; },
    // Api.carregar('usuarios', 'pecas', 'config', 'me', ...) busca no servidor e guarda em Api.cache
    async carregar(...recursos) {
      await Promise.all(recursos.map(async r => {
        if (r === 'me') await Api.me();
        else if (r === 'config') cache.config = await req('GET', '/api/config');
        else if (LISTAS.includes(r)) cache[r] = await req('GET', '/api/' + r);
      }));
    },
    // cadastros: tipo = 'usuarios' | 'motos' | 'pecas'
    async criar(tipo, dados) { const x = await req('POST', '/api/' + tipo, dados); cache[tipo].push(x); return x; },
    async atualizar(tipo, id, dados) { const x = await req('PUT', `/api/${tipo}/${id}`, dados); cache[tipo] = cache[tipo].map(r => r.id === id ? x : r); return x; },
    async excluir(tipo, id) { await req('DELETE', `/api/${tipo}/${id}`); cache[tipo] = cache[tipo].filter(r => r.id !== id); },
    // pedidos e vendas: o servidor muda status, estoque e numeração, então recarregamos depois
    async criarPedido(dados) { const x = await req('POST', '/api/pedidos', dados); await Api.carregar('pedidos'); return x; },
    async editarPedido(id, dados) { const x = await req('PUT', `/api/pedidos/${id}`, dados); await Api.carregar('pedidos'); return x; },
    async statusPedido(id, status) { const x = await req('PATCH', `/api/pedidos/${id}/status`, { status }); await Api.carregar('pedidos'); return x; },
    async vender(id) { const x = await req('POST', `/api/pedidos/${id}/vender`, {}); await Api.carregar('pedidos', 'vendas', 'pecas'); return x; },
    async cancelarVenda(id) { const x = await req('POST', `/api/vendas/${id}/cancelar`, {}); await Api.carregar('pedidos', 'vendas', 'pecas'); return x; },
    // agendamentos e cores do calendário
    async salvarConfig(config) { cache.config = await req('PATCH', '/api/config', config); return cache.config; },
    marcarErro(msg) {
      if (typeof mostrarErroCampo !== 'function' || typeof document === 'undefined') return;
      for (const [re, id] of CAMPOS_ERRO) {
        const el = document.getElementById(id);
        if (el && re.test(msg)) { mostrarErroCampo(el, msg); return; }
      }
    }
  };
  window.Api = Api;
})();