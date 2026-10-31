function getDados() {
    const motos = (typeof Api !== 'undefined' && Api.cache && Api.cache.motos && Api.cache.motos.length)
        ? Api.cache.motos
        : JSON.parse(localStorage.getItem('oficina_motos') || '[]');
    return motos.map(m => ({
        placa: m.placa || '',
        modelo: m.modelo || '',
        marca: m.marca || '',
        ano: m.ano || '',
        proprietario: m.dono || '',
        status: 'Disponível'
    }));
}

let dadosAtuais = getDados();

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaMotos');
    if (!tbody) return;
    tbody.innerHTML = (!lista || lista.length === 0) ? '<tr><td colspan="6" class="p-6 text-center text-slate-500">Nenhuma moto encontrada.</td></tr>' : '';
    if (!lista) return;

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
    const texto = (document.getElementById('filtroTexto').value || '').toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    
    const todos = getDados();
    dadosAtuais = todos.filter(item => {
        const matchTexto = item.placa.toLowerCase().includes(texto) ||
                           item.modelo.toLowerCase().includes(texto) ||
                           item.proprietario.toLowerCase().includes(texto);
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
            await Api.carregar('motos');
            dadosAtuais = getDados();
            renderTabela(dadosAtuais);
        } catch (e) {
            console.warn('Servidor offline:', e);
        }
    }
});
