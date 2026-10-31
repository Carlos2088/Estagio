function getDados() {
    const usuarios = (typeof Api !== 'undefined' && Api.cache && Api.cache.usuarios && Api.cache.usuarios.length)
        ? Api.cache.usuarios
        : JSON.parse(localStorage.getItem('oficina_usuarios') || '[]');
    const motos = (typeof Api !== 'undefined' && Api.cache && Api.cache.motos && Api.cache.motos.length)
        ? Api.cache.motos
        : JSON.parse(localStorage.getItem('oficina_motos') || '[]');
    
    return usuarios.map(u => {
        const uNome = (u.nome || '').toLowerCase();
        const motoDoCliente = motos.find(m => (m.dono || '').toLowerCase() === uNome);
        return {
            nome: u.nome || '',
            numero: u.telefone || '(44) 99999-9999',
            email: u.email || '',
            placa: motoDoCliente ? motoDoCliente.placa : 'N/A',
            status: 'Ativo'
        };
    });
}

let dadosAtuais = getDados();

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaClientes');
    if (!tbody) return;
    tbody.innerHTML = (!lista || lista.length === 0) ? '<tr><td colspan="5" class="p-6 text-center text-slate-500">Nenhum registro encontrado.</td></tr>' : '';
    if (!lista) return;

    lista.forEach(item => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="p-4 font-medium text-slate-100">${item.nome}</td>
                <td class="p-4 text-slate-400">${item.numero}</td>
                <td class="p-4 text-slate-400">${item.email}</td>
                <td class="p-4 font-mono text-xs text-[#E06666] font-semibold">${item.placa}</td>
                <td class="p-4 text-center"><span class="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">${item.status}</span></td>
            </tr>`;
    });
}

function aplicarFiltros() {
    const texto = (document.getElementById('filtroTexto').value || '').toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    
    const todos = getDados();
    dadosAtuais = todos.filter(item => {
        const matchTexto = item.nome.toLowerCase().includes(texto) ||
                           item.email.toLowerCase().includes(texto) ||
                           item.numero.includes(texto);
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
            await Api.carregar('usuarios', 'motos');
            dadosAtuais = getDados();
            renderTabela(dadosAtuais);
        } catch (e) {
            console.warn('Servidor offline:', e);
        }
    }
});

