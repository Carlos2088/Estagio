function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function getUsuarios() { return JSON.parse(localStorage.getItem('oficina_usuarios') || '[]'); }
function saveUsuarios(usuarios) { localStorage.setItem('oficina_usuarios', JSON.stringify(usuarios)); }

function salvarUsuario(e) {
    e.preventDefault();
    const id = document.getElementById('usuarioId').value;
    const email = document.getElementById('email').value.trim();

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
    if (id) {
        usuarios = usuarios.map(u => u.id === id ? novo : u);
        showToast('Usuário atualizado com sucesso!');
    } else {
        if (usuarios.some(u => u.email === novo.email)) {
            alert('Já existe um usuário cadastrado com este e-mail!');
            return;
        }
        usuarios.push(novo);
        showToast('Usuário cadastrado com sucesso!');
    }
    saveUsuarios(usuarios);
    resetForm();
}

function resetForm() {
    document.getElementById('usuarioForm').reset();
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
    document.getElementById('documento').value = u.documento;
    document.getElementById('cargo').value = u.cargo;
    document.getElementById('email').value = u.email;
    document.getElementById('senha').value = u.senha;
    document.getElementById('telefone').value = u.telefone;
    document.getElementById('nivelPermissao').value = u.nivelPermissao;
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