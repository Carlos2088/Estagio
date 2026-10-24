function showToast(msg, erro) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.toggle('bg-red-600', !!erro);
    t.classList.toggle('bg-emerald-600', !erro);
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function getPecas() { return JSON.parse(localStorage.getItem('oficina_pecas') || '[]'); }
function savePecas(pecas) { localStorage.setItem('oficina_pecas', JSON.stringify(pecas)); }

function salvarPeca(e) {
    e.preventDefault();
    if (!validarFormPeca()) {
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    const id = document.getElementById('pecaId').value;
    const nova = {
        id: id ? id : Date.now().toString(),
        codigoInterno: document.getElementById('codigoInterno').value.trim().toUpperCase(),
        codigoOriginal: document.getElementById('codigoOriginal').value.trim().toUpperCase(),
        marca: document.getElementById('marca').value.trim(),
        fornecedor: document.getElementById('fornecedor').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        aplicacao: document.getElementById('aplicacao').value.trim(),
        unidadeMedida: document.getElementById('unidadeMedida').value,
        localizacao: document.getElementById('localizacao').value.trim(),
        quantidade: parseInt(document.getElementById('quantidade').value, 10) || 0,
        precoVenda: parseFloat(document.getElementById('precoVenda').value) || 0
    };

    let pecas = getPecas();
    if (pecas.some(p => p.id !== nova.id && String(p.codigoInterno || '').toUpperCase() === nova.codigoInterno)) {
        mostrarErroCampo(document.getElementById('codigoInterno'), 'Já existe uma peça cadastrada com este Código Interno.');
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    if (id) {
        pecas = pecas.map(p => p.id === id ? nova : p);
        showToast('Peça atualizada com sucesso!');
    } else {
        pecas.push(nova);
        showToast('Peça cadastrada com sucesso!');
    }
    savePecas(pecas);
    resetForm();
}

function resetForm() {
    document.getElementById('pecaForm').reset();
    limparErrosCampos(document.getElementById('pecaForm'));
    document.getElementById('pecaId').value = '';
}

function openModal() {
    document.getElementById('consultaModal').classList.remove('hidden');
    renderTabela(getPecas());
}

function closeModal() { document.getElementById('consultaModal').classList.add('hidden'); }

function renderTabela(dados) {
    const tbody = document.getElementById('tabelaPecas');
    tbody.innerHTML = dados.length === 0 ? '<tr><td colspan="5" class="py-6 text-center text-slate-500">Nenhuma peça cadastrada.</td></tr>' : '';
    dados.forEach(p => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3.5 font-medium text-slate-100">${p.codigoInterno}</td>
                <td class="py-3.5 text-slate-400">${p.descricao}</td>
                <td class="py-3.5 text-slate-400">${p.marca}</td>
                <td class="py-3.5"><span class="bg-[#E06666]/10 text-[#E06666] px-2.5 py-1 rounded-md text-xs font-medium">${p.localizacao}</span></td>
                <td class="py-3.5 text-right space-x-3">
                    <button onclick="editarPeca('${p.id}')" class="text-blue-400 hover:text-blue-300 transition"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="excluirPeca('${p.id}')" class="text-red-400 hover:text-red-300 transition"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

function filtrarPecas() {
    const termo = document.getElementById('searchPeca').value.toLowerCase();
    const pecas = getPecas();
    const filtradas = pecas.filter(p => p.codigoInterno.toLowerCase().includes(termo) || p.descricao.toLowerCase().includes(termo) || p.marca.toLowerCase().includes(termo));
    renderTabela(filtradas);
}

function editarPeca(id) {
    const p = getPecas().find(item => item.id === id);
    if (!p) return;
    document.getElementById('pecaId').value = p.id;
    document.getElementById('codigoInterno').value = p.codigoInterno;
    document.getElementById('codigoOriginal').value = p.codigoOriginal;
    document.getElementById('marca').value = p.marca;
    document.getElementById('fornecedor').value = p.fornecedor;
    document.getElementById('descricao').value = p.descricao;
    document.getElementById('aplicacao').value = p.aplicacao;
    document.getElementById('unidadeMedida').value = p.unidadeMedida;
    document.getElementById('localizacao').value = p.localizacao;
    document.getElementById('quantidade').value = p.quantidade || 0;
    document.getElementById('precoVenda').value = p.precoVenda || '';
    limparErrosCampos(document.getElementById('pecaForm'));
    closeModal();
    showToast('Peça carregada para edição.');
}

function excluirPeca(id) {
    if (confirm('Deseja realmente excluir esta peça?')) {
        let pecas = getPecas().filter(p => p.id !== id);
        savePecas(pecas);
        renderTabela(pecas);
        showToast('Peça excluída com sucesso!');
    }
}

/* ===== Validações do formulário ===== */
const CAMPOS_PECA = [
    ['codigoInterno', v => validarCodigo(v, 'Código Interno', true, 3, 20)],
    ['codigoOriginal', v => validarCodigo(v, 'Código Original', false, 3, 30)],
    ['marca', v => validarTexto(v, 'a marca', true, 2, 40, true)],
    ['fornecedor', v => validarTexto(v, 'o fornecedor', false, 2, 60, true)],
    ['descricao', v => validarTexto(v, 'a descrição', true, 3, 80, true)],
    ['aplicacao', v => validarTexto(v, 'a aplicação', false, 3, 150, true)],
    ['unidadeMedida', validarUnidade],
    ['localizacao', v => validarTexto(v, 'a localização', true, 2, 30, false)],
    ['quantidade', v => validarInteiro(v, 'a quantidade', 0, 999999)],
    ['precoVenda', v => validarPreco(v, false)]
];
function validarFormPeca() { return validarLista(CAMPOS_PECA); }

document.addEventListener('DOMContentLoaded', () => {
    aplicarMascaraFn('codigoInterno', mascaraCodigo);
    aplicarMascaraFn('codigoOriginal', mascaraCodigo);
    ligarValidacaoCampos(CAMPOS_PECA);
});