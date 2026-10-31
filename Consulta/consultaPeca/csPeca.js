function getDados() {
    const pecas = (typeof Api !== 'undefined' && Api.cache && Api.cache.pecas && Api.cache.pecas.length)
        ? Api.cache.pecas
        : JSON.parse(localStorage.getItem('oficina_pecas') || '[]');
    return pecas.map(p => ({
        nome: p.codigoInterno || '',
        descricao: p.descricao || '',
        quantidade: Number(p.quantidade) || 0,
        preco: Number(p.precoVenda) || 0,
        status: (Number(p.quantidade) || 0) === 0 ? 'Sem estoque' : (Number(p.quantidade) <= 5 ? 'Baixo' : 'Normal')
    }));
}

let dadosAtuais = getDados();

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaPecas');
    if (!tbody) return;
    tbody.innerHTML = (!lista || lista.length === 0) ? '<tr><td colspan="5" class="p-6 text-center text-slate-500">Nenhuma peça encontrada.</td></tr>' : '';
    if (!lista) return;

    lista.forEach(item => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="p-4 font-mono font-bold text-[#E06666]">${item.nome}</td>
                <td class="p-4 text-slate-300">${item.descricao}</td>
                <td class="p-4 text-center font-semibold text-slate-100">${item.quantidade}</td>
                <td class="p-4 text-right text-emerald-400 font-medium">R$ ${item.preco.toFixed(2)}</td>
                <td class="p-4 text-center"><span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">${item.status}</span></td>
            </tr>`;
    });
}

function aplicarFiltros() {
    const texto = (document.getElementById('filtroTexto').value || '').toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    
    const todos = getDados();
    dadosAtuais = todos.filter(item => {
        const matchTexto = item.nome.toLowerCase().includes(texto) || item.descricao.toLowerCase().includes(texto);
        const matchStatus = status === '' || item.status === status;
        return matchTexto && matchStatus;
    });
    renderTabela(dadosAtuais);
}

function limparFiltros() {
    document.getElementById('filtroTexto').value = '';
    document.getElementById('filtroStatus').value = '';
    dadosAtuais = getDados();
    renderTabela(dadosAtuais);
}

function gerarRelatorio() {
    window.print();
}

document.addEventListener('DOMContentLoaded', async () => {
    renderTabela(dadosAtuais);
    if (typeof Api !== 'undefined' && Api.carregar) {
        try {
            await Api.carregar('pecas');
            dadosAtuais = getDados();
            renderTabela(dadosAtuais);
        } catch (e) {
            console.warn('Servidor offline:', e);
        }
    }
});
