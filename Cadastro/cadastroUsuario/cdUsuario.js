function showToast(msg, erro) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.toggle('bg-red-600', !!erro);
    t.classList.toggle('bg-emerald-600', !erro);
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function getUsuarios() { return JSON.parse(localStorage.getItem('oficina_usuarios') || '[]'); }
function saveUsuarios(usuarios) { localStorage.setItem('oficina_usuarios', JSON.stringify(usuarios)); }

function salvarUsuario(e) {
    e.preventDefault();
    if (!validarFormUsuario()) {
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    const id = document.getElementById('usuarioId').value;
    const email = document.getElementById('email').value.trim().toLowerCase();

    const novo = {
        id: id ? id : Date.now().toString(),
        nome: document.getElementById('nome').value.trim(),
        dataNascimento: document.getElementById('dataNascimento').value,
        documento: document.getElementById('documento').value.trim(),
        cargo: document.getElementById('cargo').value.trim(),
        email: email,
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('telefone').value.trim(),
        nivelPermissao: document.getElementById('nivelPermissao').value
    };

    let usuarios = getUsuarios();
    const outros = usuarios.filter(u => u.id !== novo.id);
    if (outros.some(u => (u.email || '').toLowerCase() === novo.email)) {
        mostrarErroCampo(document.getElementById('email'), 'Já existe um usuário cadastrado com este e-mail.');
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    if (outros.some(u => u.documento === novo.documento)) {
        mostrarErroCampo(document.getElementById('documento'), 'Já existe um usuário cadastrado com este CPF/CNPJ.');
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    if (id) {
        usuarios = usuarios.map(u => u.id === id ? novo : u);
        showToast('Usuário atualizado com sucesso!');
    } else {
        usuarios.push(novo);
        showToast('Usuário cadastrado com sucesso!');
    }
    saveUsuarios(usuarios);
    resetForm();
}

function resetForm() {
    document.getElementById('usuarioForm').reset();
    limparErrosCampos(document.getElementById('usuarioForm'));
    document.getElementById('senha').dispatchEvent(new Event('input'));
    document.getElementById('usuarioId').value = '';
}

function openModal() {
    document.getElementById('consultaModal').classList.remove('hidden');
    renderTabela(getUsuarios());
}

function closeModal() { document.getElementById('consultaModal').classList.add('hidden'); }

function renderTabela(dados) {
    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = dados.length === 0 ? '<tr><td colspan="5" class="py-6 text-center text-slate-500">Nenhum usuário cadastrado.</td></tr>' : '';
    dados.forEach(u => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3.5 font-medium text-slate-100">${u.nome}</td>
                <td class="py-3.5 text-slate-400">${u.email}</td>
                <td class="py-3.5 text-slate-400">${u.telefone}</td>
                <td class="py-3.5"><span class="bg-[#E06666]/10 text-[#E06666] px-2.5 py-1 rounded-md text-xs font-medium">${u.cargo}</span></td>
                <td class="py-3.5 text-right space-x-3">
                    <button onclick="editarUsuario('${u.id}')" class="text-blue-400 hover:text-blue-300 transition"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="excluirUsuario('${u.id}')" class="text-red-400 hover:text-red-300 transition"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>`;
    });
}

function filtrarUsuarios() {
    const termo = document.getElementById('searchUsuario').value.toLowerCase();
    const usuarios = getUsuarios();
    const filtrados = usuarios.filter(u => u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo) || u.documento.includes(termo));
    renderTabela(filtrados);
}

function editarUsuario(id) {
    const u = getUsuarios().find(item => item.id === id);
    if (!u) return;
    document.getElementById('usuarioId').value = u.id;
    document.getElementById('nome').value = u.nome;
    document.getElementById('dataNascimento').value = u.dataNascimento;
    document.getElementById('documento').value = mascaraDocumento(u.documento);
    document.getElementById('cargo').value = u.cargo;
    document.getElementById('email').value = u.email;
    document.getElementById('senha').value = u.senha;
    document.getElementById('telefone').value = mascaraTelefone(u.telefone);
    document.getElementById('nivelPermissao').value = u.nivelPermissao;
    limparErrosCampos(document.getElementById('usuarioForm'));
    document.getElementById('senha').dispatchEvent(new Event('input'));
    closeModal();
    showToast('Usuário carregado para edição.');
}

function excluirUsuario(id) {
    if (confirm('Deseja realmente excluir este usuário?')) {
        let usuarios = getUsuarios().filter(u => u.id !== id);
        saveUsuarios(usuarios);
        renderTabela(usuarios);
        showToast('Usuário excluído com sucesso!');
    }
}

/* ===== Validações do formulário ===== */
function validarFormUsuario() {
    const obrigatorio = msg => v => v ? { ok: true, msg: '' } : { ok: false, msg };
    const campos = [
        ['nome', obrigatorio('Informe o nome.'), true],
        ['dataNascimento', validarNascimento, true],
        ['documento', validarDocumento, true],
        ['cargo', validarCargo, true],
        ['email', validarEmail, true],
        ['senha', validarSenha, false],
        ['telefone', validarTelefone, true],
        ['nivelPermissao', obrigatorio('Selecione o nível de permissão.'), true]
    ];
    let primeiro = null;
    campos.forEach(([id, fn, limpar]) => {
        const el = document.getElementById(id);
        const r = fn(limpar ? el.value.trim() : el.value);
        mostrarErroCampo(el, r.msg);
        if (!r.ok && !primeiro) primeiro = el;
    });
    if (primeiro) primeiro.focus();
    return !primeiro;
}

document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    $('cargo').innerHTML = '<option value="">Selecione...</option>' + CARGOS.map(c => `<option value="${c}">${c}</option>`).join('');
    const lim = limitesNascimento();
    $('dataNascimento').min = lim.min;
    $('dataNascimento').max = lim.max;
    aplicarMascara('documento', 'documento');
    aplicarMascara('telefone', 'telefone');
    checklistSenha('senha');

    [['dataNascimento', validarNascimento], ['documento', validarDocumento], ['cargo', validarCargo],
     ['email', validarEmail], ['telefone', validarTelefone]].forEach(([id, fn]) => {
        const el = $(id);
        el.addEventListener('blur', () => { if (el.value.trim()) mostrarErroCampo(el, fn(el.value.trim()).msg); });
        ['input', 'change'].forEach(ev => el.addEventListener(ev, () => {
            const p = el.parentElement.querySelector('.erro-campo[data-for="' + id + '"]');
            if (p && p.textContent) mostrarErroCampo(el, fn(el.value.trim()).msg);
        }));
    });
    $('senha').addEventListener('blur', () => { if ($('senha').value) mostrarErroCampo($('senha'), validarSenha($('senha').value).msg); });
});