function getDados() {
    const pecas = JSON.parse(localStorage.getItem('oficina_pecas') || '[]');
    return pecas.map(p => ({
        nome: p.codigoInterno,
        descricao: p.descricao,
        quantidade: 15,
        preco: 120.00,
        status: 'Normal'
    }));
}

let dadosAtuais = getDados();

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaPecas');
    tbody.innerHTML = lista.length === 0 ? '<tr><td colspan="5" class="p-6 text-center text-slate-500">Nenhuma peça encontrada.</td></tr>' : '';
    
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
    const texto = document.getElementById('filtroTexto').value.toLowerCase();
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
    const janela = window.open('', '_blank');
    janela.document.write(`
        <html><head><title>Relatório de Peças</title>
        <style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;}th{background:#E06666;color:white;}</style>
        </head><body>
        <h2>Relatório de Peças e Estoque - MOTORPOINT</h2>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <table><thead><tr><th>NOME / CÓDIGO</th><th>DESCRIÇÃO</th><th>QUANTIDADE</th><th>PREÇO (R$)</th><th>STATUS</th></tr></thead><tbody>
        ${dadosAtuais.map(i => `<tr><td>${i.nome}</td><td>${i.descricao}</td><td>${i.quantidade}</td><td>R$ ${i.preco.toFixed(2)}</td><td>${i.status}</td></tr>`).join('')}
        </tbody></table></body></html>
    `);
    janela.document.close();
    janela.print();
}

document.addEventListener('DOMContentLoaded', () => {
    renderTabela(dadosAtuais);
});