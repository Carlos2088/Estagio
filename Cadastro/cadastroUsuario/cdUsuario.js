function showToast(msg, erro) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.toggle('bg-red-600', !!erro);
    t.classList.toggle('bg-emerald-600', !erro);
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function getUsuarios() {
    if (typeof Api !== 'undefined' && Api.cache && Api.cache.usuarios && Api.cache.usuarios.length) {
        return Api.cache.usuarios;
    }
    return JSON.parse(localStorage.getItem('oficina_usuarios') || '[]');
}

function saveUsuarios(usuarios) {
    localStorage.setItem('oficina_usuarios', JSON.stringify(usuarios));
}

async function salvarUsuario(e) {
    e.preventDefault();
    if (!validarFormUsuario()) {
        showToast('Corrija os campos destacados em vermelho.', true);
        return;
    }
    const id = document.getElementById('usuarioId').value;
    const email = document.getElementById('email').value.trim().toLowerCase();

    const novo = {
        nome: document.getElementById('nome').value.trim(),
        dataNascimento: document.getElementById('dataNascimento').value,
        documento: document.getElementById('documento').value.trim(),
        cargo: document.getElementById('cargo').value.trim(),
        email: email,
        senha: document.getElementById('senha').value,
        telefone: document.getElementById('telefone').value.trim(),
        nivelPermissao: document.getElementById('nivelPermissao').value
    };

    try {
        if (typeof Api !== 'undefined') {
            if (id) {
                await Api.atualizar('usuarios', id, novo);
                showToast('Usuário atualizado com sucesso!');
            } else {
                await Api.criar('usuarios', novo);
                showToast('Usuário cadastrado com sucesso!');
            }
            saveUsuarios(Api.cache.usuarios);
        } else {
            // Fallback localStorage
            let usuarios = getUsuarios();
            if (id) {
                usuarios = usuarios.map(u => u.id === id ? { ...novo, id } : u);
                showToast('Usuário atualizado com sucesso!');
            } else {
                usuarios.push({ ...novo, id: Date.now().toString() });
                showToast('Usuário cadastrado com sucesso!');
            }
            saveUsuarios(usuarios);
        }
        resetForm();
    } catch (err) {
        if (typeof Api !== 'undefined' && Api.marcarErro) {
            Api.marcarErro(err.message);
        }
        showToast(err.message || 'Erro ao salvar usuário.', true);
    }
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

function closeModal() {
    document.getElementById('consultaModal').classList.add('hidden');
}

function renderTabela(dados) {
    const tbody = document.getElementById('tabelaUsuarios');
    tbody.innerHTML = (!dados || dados.length === 0) ? '<tr><td colspan="5" class="py-6 text-center text-slate-500">Nenhum usuário cadastrado.</td></tr>' : '';
    if (!dados) return;
    dados.forEach(u => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3.5 font-medium text-slate-100">${u.nome || ''}</td>
                <td class="py-3.5 text-slate-400">${u.email || ''}</td>
                <td class="py-3.5 text-slate-400">${u.telefone || ''}</td>
                <td class="py-3.5"><span class="bg-[#E06666]/10 text-[#E06666] px-2.5 py-1 rounded-md text-xs font-medium">${u.cargo || ''}</span></td>
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
    const filtrados = usuarios.filter(u =>
        (u.nome && u.nome.toLowerCase().includes(termo)) ||
        (u.email && u.email.toLowerCase().includes(termo)) ||
        (u.documento && u.documento.includes(termo))
    );
    renderTabela(filtrados);
}

function editarUsuario(id) {
    const u = getUsuarios().find(item => item.id === id);
    if (!u) return;
    document.getElementById('usuarioId').value = u.id;
    document.getElementById('nome').value = u.nome || '';
    document.getElementById('dataNascimento').value = u.dataNascimento || '';
    document.getElementById('documento').value = mascaraDocumento(u.documento || '');
    document.getElementById('cargo').value = u.cargo || '';
    document.getElementById('email').value = u.email || '';
    document.getElementById('senha').value = ''; // Senha é mantida no back se não preenchida
    document.getElementById('telefone').value = mascaraTelefone(u.telefone || '');
    document.getElementById('nivelPermissao').value = u.nivelPermissao || '';
    limparErrosCampos(document.getElementById('usuarioForm'));
    document.getElementById('senha').dispatchEvent(new Event('input'));
    closeModal();
    showToast('Usuário carregado para edição. (Deixe a senha em branco para não alterá-la)');
}

async function excluirUsuario(id) {
    if (confirm('Deseja realmente excluir este usuário?')) {
        try {
            if (typeof Api !== 'undefined') {
                await Api.excluir('usuarios', id);
                saveUsuarios(Api.cache.usuarios);
            } else {
                let usuarios = getUsuarios().filter(u => u.id !== id);
                saveUsuarios(usuarios);
            }
            renderTabela(getUsuarios());
            showToast('Usuário excluído com sucesso!');
        } catch (err) {
            showToast(err.message || 'Erro ao excluir usuário.', true);
        }
    }
}

/* ===== Validações do formulário ===== */
function validarFormUsuario() {
    const obrigatorio = msg => v => v ? { ok: true, msg: '' } : { ok: false, msg };
    const id = document.getElementById('usuarioId').value;
    const campos = [
        ['nome', obrigatorio('Informe o nome.'), true],
        ['dataNascimento', validarNascimento, true],
        ['documento', validarDocumento, true],
        ['cargo', validarCargo, true],
        ['email', validarEmail, true],
        // Na edição, a senha pode ser deixada em branco para manter a existente
        ['senha', (v) => id && !v ? { ok: true, msg: '' } : validarSenha(v), false],
        ['telefone', validarTelefone, true],
        ['nivelPermissao', obrigatorio('Selecione o nível de permissão.'), true]
    ];
    let primeiro = null;
    campos.forEach(([cid, fn, limpar]) => {
        const el = document.getElementById(cid);
        const r = fn(limpar ? el.value.trim() : el.value);
        mostrarErroCampo(el, r.msg);
        if (!r.ok && !primeiro) primeiro = el;
    });
    if (primeiro) primeiro.focus();
    return !primeiro;
}

document.addEventListener('DOMContentLoaded', async () => {
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
    $('senha').addEventListener('blur', () => {
        const isEditing = $('usuarioId').value;
        if (!isEditing || $('senha').value) {
            mostrarErroCampo($('senha'), validarSenha($('senha').value).msg);
        }
    });

    // Carregar dados da API
    if (typeof Api !== 'undefined' && Api.carregar) {
        try {
            await Api.carregar('usuarios');
            saveUsuarios(Api.cache.usuarios);
        } catch (e) {
            console.warn('Servidor offline, utilizando armazenamento local:', e);
        }
    }
});
