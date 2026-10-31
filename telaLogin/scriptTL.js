// Alternar visualização da senha
function toggleSenhaVisibility() {
    const senhaInput = document.getElementById('senha');
    const eyeIcon = document.getElementById('eyeIcon');
    if (!senhaInput || !eyeIcon) return;

    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        senhaInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

// Função de Esqueceu a Senha
function esqueceuSenha(e) {
    e.preventDefault();
    alert('Para redefinir sua senha, entre em contato com o suporte ou administrador do sistema MOTORPOINT.');
}

// Autenticação e Validação integrada à API
async function realizarLogin(e) {
    e.preventDefault();

    const usuarioInput = document.getElementById('usuario').value.trim();
    const senhaInput = document.getElementById('senha').value;
    const lembrarCheckbox = document.getElementById('lembrar');
    const loginError = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    const btnSubmit = document.getElementById('btnSubmit');

    if (!usuarioInput || !senhaInput) return;

    loginError.classList.add('hidden');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>Autenticando...</span>`;

    try {
        const dados = await Api.login(usuarioInput, senhaInput);

        if (lembrarCheckbox && lembrarCheckbox.checked) {
            localStorage.setItem('motorpoint_remembered_user', usuarioInput);
        } else {
            localStorage.removeItem('motorpoint_remembered_user');
        }

        // Salvar dados da sessão local para exibição do usuário
        localStorage.setItem('motorpoint_user_session', JSON.stringify({
            usuario: dados.usuario || usuarioInput,
            perfil: dados.perfil || 'Administrador',
            loginTime: new Date().toISOString()
        }));

        // Redireciona para o Menu Inicial
        window.location.href = '../menuPrincipal/index.html';
    } catch (err) {
        errorMessage.innerText = err.message || 'Usuário ou senha incorretos.';
        loginError.classList.remove('hidden');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<span>Entrar no Sistema</span> <i class="fa-solid fa-arrow-right"></i>`;
    }
}

// Preencher automaticamente se houver 'lembrar' e inicializar listeners
window.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', realizarLogin);

    const btnOlho = document.getElementById('btnOlho');
    if (btnOlho) btnOlho.addEventListener('click', toggleSenhaVisibility);

    const linkEsqueceu = document.getElementById('linkEsqueceu');
    if (linkEsqueceu) linkEsqueceu.addEventListener('click', esqueceuSenha);

    const savedUser = localStorage.getItem('motorpoint_remembered_user');
    const lembrar = document.getElementById('lembrar');
    if (savedUser) {
        document.getElementById('usuario').value = savedUser;
        if (lembrar) lembrar.checked = true;
    }

    // Se já houver sessão ativa no back-end, avança direto
    try {
        if (typeof Api !== 'undefined' && Api.me) {
            const me = await Api.me();
            if (me && me.nome) {
                window.location.replace('../menuPrincipal/index.html');
            }
        }
    } catch (e) {
        // Usuário não autenticado, permanece no login
    }
});
