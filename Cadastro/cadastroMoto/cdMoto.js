function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function getMotos() { return JSON.parse(localStorage.getItem('oficina_motos') || '[]'); }
function saveMotos(motos) { localStorage.setItem('oficina_motos', JSON.stringify(motos)); }

function salvarMoto(e) {
    e.preventDefault();
    const id = document.getElementById('motoId').value;
    const chassi = document.getElementById('chassi').value.trim();

    if (chassi.length !== 17) {
        alert('O chassi precisa ter exatamente 17 caracteres.');
        return;
    }

    const nova = {
        id: id ? id : Date.now().toString(),
        dono: document.getElementById('dono').value.trim(),
        marca: document.getElementById('marcaMoto').value.trim(),
        placa: document.getElementById('placa').value.trim(),
        cor: document.getElementById('cor').value.trim(),
        chassi: chassi,
        ano: document.getElementById('ano').value,
        modelo: document.getElementById('modelo').value.trim()
    };

    let motos = getMotos();
    if (id) {
        motos = motos.map(m => m.id === id ? nova : m);
        showToast('Moto atualizada com sucesso!');
    } else {
        if (motos.some(m => m.placa === nova.placa)) {
            alert('Já existe uma moto cadastrada com esta placa!');
            return;
        }
        motos.push(nova);
        showToast('Moto cadastrada com sucesso!');
    }
    saveMotos(motos);
    resetForm();
}

function resetForm() {
    document.getElementById('motoForm').reset();
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
    document.getElementById('placa').value = m.placa;
    document.getElementById('cor').value = m.cor;
    document.getElementById('chassi').value = m.chassi;
    document.getElementById('ano').value = m.ano;
    document.getElementById('modelo').value = m.modelo;
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