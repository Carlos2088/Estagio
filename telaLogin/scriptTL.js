// Alternar visualização da senha
function toggleSenhaVisibility() {
    const senhaInput = document.getElementById('senha');
    const eyeIcon = document.getElementById('eyeIcon');
    const usuariosCadastrados = JSON.parse(localStorage.getItem('oficina_usuarios') || '[]');
    const entrada = usuarioInput.toLowerCase();

    const usuarioValido = (usuarioInput === 'admin' && senhaInput === '123456') ||
    usuariosCadastrados.some(u =>
        [u.email, u.nome, u.documento].some(c => c && String(c).toLowerCase() === entrada) &&
        u.senha === senhaInput
    );
    
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

// Autenticação e Validação
function realizarLogin(e) {
    e.preventDefault();

    const usuarioInput = document.getElementById('usuario').value.trim();
    const senhaInput = document.getElementById('senha').value;
    const lembrarCheckbox = document.getElementById('lembrar');
    const loginError = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    const btnSubmit = document.getElementById('btnSubmit');

    // Feedback visual de carregamento
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>Autenticando...</span>`;

    setTimeout(() => {
        // Busca usuários salvos no localStorage
        const usuariosCadastrados = JSON.parse(localStorage.getItem('oficina_usuarios') || '[]');

        // Regra de Validação: Aceita credencial 'admin' / '123456' OU usuários salvos
        const usuarioValido = (usuarioInput === 'admin' && senhaInput === '123456') ||
            usuariosCadastrados.some(u => 
                (u.email === usuarioInput || u.nome.toLowerCase() === usuarioInput.toLowerCase() || u.documento === usuarioInput) && 
                u.senha === senhaInput
            );

        if (usuarioValido) {
            if (lembrarCheckbox.checked) {
                localStorage.setItem('motorpoint_remembered_user', usuarioInput);
            } else {
                localStorage.removeItem('motorpoint_remembered_user');
            }

            // Salvar sessão simulada
            localStorage.setItem('motorpoint_user_session', JSON.stringify({
                usuario: usuarioInput,
                loginTime: new Date().toISOString()
            }));

            // Redireciona para o Menu Inicial
            window.location.href = '../menuPrincipal/index.html';
        } else {
            // Exibir mensagem de erro
            errorMessage.innerText = 'Usuário ou senha incorretos. Tente admin / 123456';
            loginError.classList.remove('hidden');

            // Restaurar botão
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<span>Entrar no Sistema</span> <i class="fa-solid fa-arrow-right"></i>`;
        }
    }, 800);
}

// Preencher automaticamente se houver 'lembrar'
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('motorpoint_remembered_user');
    if (savedUser) {
        document.getElementById('usuario').value = savedUser;
        document.getElementById('lembrar').checked = true;
    }
    
    if (localStorage.getItem('motorpoint_user_session')) {
    window.location.replace('../menuPrincipal/index.html');
}
});