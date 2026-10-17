function getDados() {
    const usuarios = JSON.parse(localStorage.getItem('oficina_usuarios') || '[]');
    const motos = JSON.parse(localStorage.getItem('oficina_motos') || '[]');
    
    return usuarios.map(u => {
        const motoDoCliente = motos.find(m => m.dono.toLowerCase() === u.nome.toLowerCase());
        return {
            nome: u.nome,
            numero: u.telefone || '(44) 99999-9999',
            email: u.email,
            placa: motoDoCliente ? motoDoCliente.placa : 'N/A',
            status: 'Ativo'
        };
    });
}

let dadosAtuais = getDados();

function renderTabela(lista) {
    const tbody = document.getElementById('tabelaClientes');
    tbody.innerHTML = lista.length === 0 ? '<tr><td colspan="5" class="p-6 text-center text-slate-500">Nenhum registo encontrado.</td></tr>' : '';
    
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
    const texto = document.getElementById('filtroTexto').value.toLowerCase();
    const status = document.getElementById('filtroStatus').value;
    
    const todos = getDados();
    dadosAtuais = todos.filter(item => {
        const matchTexto = item.nome.toLowerCase().includes(texto) || item.email.toLowerCase().includes(texto) || item.numero.includes(texto);
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
        <html><head><title>Relatório de Clientes</title>
        <style>body{font-family:sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #ddd;padding:10px;text-align:left;}th{background:#E06666;color:white;}</style>
        </head><body>
        <h2>Relatório de Clientes / Usuários - MOTORPOINT</h2>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <table><thead><tr><th>NOME</th><th>NÚMERO</th><th>E-MAIL</th><th>PLACA</th><th>STATUS</th></tr></thead><tbody>
        ${dadosAtuais.map(i => `<tr><td>${i.nome}</td><td>${i.numero}</td><td>${i.email}</td><td>${i.placa}</td><td>${i.status}</td></tr>`).join('')}
        </tbody></table></body></html>
    `);
    janela.document.close();
    janela.print();
}

document.addEventListener('DOMContentLoaded', () => {
    renderTabela(dadosAtuais);
});