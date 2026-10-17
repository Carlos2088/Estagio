function getDados() {
    const motos = JSON.parse(localStorage.getItem('oficina_motos') || '[]');
    return motos.map(m => ({
        placa: m.placa,
        modelo: m.modelo,
        marca: m.marca,
        ano: m.ano,
        proprietario: m.dono,
        status: 'Disponível'
    }));
}

let dadosAtuais = getDados();

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaMotos');
    tbody.innerHTML = lista.length === 0 ? '<tr><td colspan="6" class="p-6 text-center text-slate-500">Nenhuma moto encontrada.</td></tr>' : '';
    
    lista.forEach(item => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="p-4 font-mono font-bold text-[#E06666]">${item.placa}</td>
                <td class="p-4 font-medium text-slate-100">${item.modelo}</td>
                <td class="p-4 text-slate-400">${item.marca}</td>
                <td class="p-4 text-slate-400">${item.ano}</td>
                <td class="p-4 text-slate-300">${item.proprietario}</td>
                <td class="p-4 text-center"><span class="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">${item.status}</span></td>
            </tr>`;
    });
}

function aplicarFiltros() {
    const texto = document.getElementById('filtroTexto').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    
    const todos = getDados();
    dadosAtuais = todos.filter(item => {
        const matchTexto = item.placa.toLowerCase().includes(texto) || item.modelo.toLowerCase().includes(texto) || item.proprietario.toLowerCase().includes(texto);
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
        <html><head><title>Relatório de Motos</title>
        <style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;}th{background:#E06666;color:white;}</style>
        </head><body>
        <h2>Relatório de Motos - MOTORPOINT</h2>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <table><thead><tr><th>PLACA</th><th>MODELO</th><th>MARCA</th><th>ANO</th><th>PROPRIETÁRIO</th><th>STATUS</th></tr></thead><tbody>
        ${dadosAtuais.map(i => `<tr><td>${i.placa}</td><td>${i.modelo}</td><td>${i.marca}</td><td>${i.ano}</td><td>${i.proprietario}</td><td>${i.status}</td></tr>`).join('')}
        </tbody></table></body></html>
    `);
    janela.document.close();
    janela.print();
}

document.addEventListener('DOMContentLoaded', () => {
    renderTabela(dadosAtuais);
});