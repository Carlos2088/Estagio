function showToast(msg, erro) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.toggle('bg-red-600', !!erro);
    t.classList.toggle('bg-emerald-600', !erro);
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function getMotos() { return JSON.parse(localStorage.getItem('oficina_motos') || '[]'); }
function saveMotos(motos) { localStorage.setItem('oficina_motos', JSON.stringify(motos)); }

function salvarMoto(e) {
    e.preventDefault();
    if (!validarFormMoto()) {
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    const id = document.getElementById('motoId').value;
    const chassi = document.getElementById('chassi').value.trim().toUpperCase();

    const nova = {
        id: id ? id : Date.now().toString(),
        dono: document.getElementById('dono').value.trim(),
        marca: document.getElementById('marcaMoto').value.trim(),
        placa: document.getElementById('placa').value.trim().toUpperCase(),
        cor: document.getElementById('cor').value.trim(),
        chassi: chassi,
        ano: document.getElementById('ano').value,
        modelo: document.getElementById('modelo').value.trim()
    };

    let motos = getMotos();
    const outras = motos.filter(m => m.id !== nova.id);
    const alfanum = s => String(s || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (outras.some(m => alfanum(m.placa) === alfanum(nova.placa))) {
        mostrarErroCampo(document.getElementById('placa'), 'Já existe uma moto cadastrada com esta placa.');
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    if (outras.some(m => String(m.chassi || '').toUpperCase() === nova.chassi)) {
        mostrarErroCampo(document.getElementById('chassi'), 'Já existe uma moto cadastrada com este chassi.');
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    if (id) {
        motos = motos.map(m => m.id === id ? nova : m);
        showToast('Moto atualizada com sucesso!');
    } else {
        motos.push(nova);
        showToast('Moto cadastrada com sucesso!');
    }
    saveMotos(motos);
    resetForm();
}

function resetForm() {
    document.getElementById('motoForm').reset();
    limparErrosCampos(document.getElementById('motoForm'));
    document.getElementById('motoId').value = '';
}

function openModal() {
    document.getElementById('consultaModal').classList.remove('hidden');
    renderTabela(getMotos());
}

function closeModal() { document.getElementById('consultaModal').classList.add('hidden'); }

function renderTabela(dados) {
    const tbody = document.getElementById('tabelaMotos');
    tbody.innerHTML = dados.length === 0 ? '<tr><td colspan="5" class="py-6 text-center text-slate-500">Nenhuma moto cadastrada.</td></tr>' : '';
    dados.forEach(m => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3.5 font-medium text-slate-100">${m.placa}</td>
                <td class="py-3.5 text-slate-400">${m.modelo}</td>
                <td class="py-3.5 text-slate-400">${m.dono}</td>
                <td class="py-3.5"><span class="bg-[#E06666]/10 text-[#E06666] px-2.5 py-1 rounded-md text-xs font-medium">${m.ano}</span></td>
                <td class="py-3.5 text-right space-x-3">
                    <button onclick="editarMoto('${m.id}')" class="text-blue-400 hover:text-blue-300 transition"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="excluirMoto('${m.id}')" class="text-red-400 hover:text-red-300 transition"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

function filtrarMotos() {
    const termo = document.getElementById('searchMoto').value.toLowerCase();
    const motos = getMotos();
    const filtradas = motos.filter(m => m.placa.toLowerCase().includes(termo) || m.dono.toLowerCase().includes(termo) || m.modelo.toLowerCase().includes(termo));
    renderTabela(filtradas);
}

function editarMoto(id) {
    const m = getMotos().find(item => item.id === id);
    if (!m) return;
    document.getElementById('motoId').value = m.id;
    document.getElementById('dono').value = m.dono;
    document.getElementById('marcaMoto').value = m.marca;
    document.getElementById('placa').value = mascaraPlaca(m.placa);
    document.getElementById('cor').value = m.cor;
    document.getElementById('chassi').value = m.chassi;
    document.getElementById('ano').value = m.ano;
    document.getElementById('modelo').value = m.modelo;
    limparErrosCampos(document.getElementById('motoForm'));
    closeModal();
    showToast('Moto carregada para edição.');
}

function excluirMoto(id) {
    if (confirm('Deseja realmente excluir esta moto?')) {
        let motos = getMotos().filter(m => m.id !== id);
        saveMotos(motos);
        renderTabela(motos);
        showToast('Moto excluída com sucesso!');
    }
}

/* ===== Validações do formulário ===== */
function camposMoto() {
    const $ = id => document.getElementById(id);
    return [
        ['dono', validarClienteCadastrado],
        ['marcaMoto', validarMarcaMoto],
        ['placa', validarPlaca],
        ['cor', validarCor],
        ['chassi', v => validarChassi(v, $('ano').value)],
        ['ano', validarAnoFabricacao],
        ['modelo', validarModelo]
    ];
}
function validarFormMoto() { return validarLista(camposMoto()); }

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    $('marcaMoto').innerHTML = '<option value="">Selecione...</option>' + MARCAS_MOTO.map(m => `<option value="${m}">${m}</option>`).join('');
    $('ano').max = new Date().getFullYear();

    // sugestões de clientes já cadastrados no campo "Dono"
    const dl = document.createElement('datalist');
    dl.id = 'listaDonos';
    document.body.appendChild(dl);
    $('dono').setAttribute('list', 'listaDonos');
    const atualizarDonos = () => { dl.innerHTML = nomesClientesCadastrados().map(n => `<option value="${n.replace(/"/g, '&quot;')}">`).join(''); };
    atualizarDonos();
    $('dono').addEventListener('focus', atualizarDonos);

    aplicarMascaraFn('placa', mascaraPlaca);
    aplicarMascaraFn('chassi', mascaraChassi);
    ligarValidacaoCampos(camposMoto());
    // ao mudar o ano, reconfere o chassi (o 10º caractere precisa combinar com o ano)
    $('ano').addEventListener('change', () => { if ($('chassi').value.trim()) mostrarErroCampo($('chassi'), validarChassi($('chassi').value, $('ano').value).msg); });
});