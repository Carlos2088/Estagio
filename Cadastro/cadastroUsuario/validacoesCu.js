/* ============================================================
   MOTORPOINT - Validações compartilhadas
   Incluir nas telas com:  <script src="../../validacoes/validacoes.js"></script>
   (a partir de Cadastro/xxx ou Consulta/xxx; use ../ nas telas de 1 nível)
   ============================================================ */

// Cargos permitidos. Quando houver banco de dados, esta lista virá da tabela de cargos.
const CARGOS = ['Administrador', 'Gerente', 'Atendente', 'Vendedor', 'Mecânico', 'Cliente'];

const DDDS_VALIDOS = ['11','12','13','14','15','16','17','18','19','21','22','24','27','28','31','32','33','34','35','37','38',
  '41','42','43','44','45','46','47','48','49','51','53','54','55','61','62','63','64','65','66','67','68','69',
  '71','73','74','75','77','79','81','82','83','84','85','86','87','88','89','91','92','93','94','95','96','97','98','99'];

const ERROS_DOMINIO = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com',
  'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yaho.com': 'yahoo.com', 'yahoo.con': 'yahoo.com'
};

const vOk = () => ({ ok: true, msg: '' });
const vErro = msg => ({ ok: false, msg });
const soDigitos = v => String(v || '').replace(/\D/g, '');
const todosIguais = d => /^(.)\1+$/.test(d);

/* ---------- Data de nascimento ---------- */
function validarNascimento(valor) {
  if (!valor) return vErro('Informe a data de nascimento.');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) return vErro('Data inválida.');
  const [a, mes, dia] = [+m[1], +m[2], +m[3]];
  const dt = new Date(2000, 0, 1);
  dt.setFullYear(a, mes - 1, dia); // setFullYear evita que o ano 55 vire 1955
  if (dt.getFullYear() !== a || dt.getMonth() !== mes - 1 || dt.getDate() !== dia) return vErro('Essa data não existe no calendário.');
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  if (dt > hoje) return vErro('A data de nascimento não pode ser no futuro.');
  let idade = hoje.getFullYear() - a;
  if (hoje.getMonth() < mes - 1 || (hoje.getMonth() === mes - 1 && hoje.getDate() < dia)) idade--;
  if (idade > 120) return vErro('Data inválida: a idade máxima aceita é 120 anos.');
  return vOk();
}
function limitesNascimento() {
  const h = new Date(), p = n => String(n).padStart(2, '0');
  return { min: `${h.getFullYear() - 120}-${p(h.getMonth() + 1)}-${p(h.getDate())}`, max: `${h.getFullYear()}-${p(h.getMonth() + 1)}-${p(h.getDate())}` };
}

/* ---------- CPF / CNPJ ---------- */
function cpfValido(d) {
  if (d.length !== 11 || todosIguais(d)) return false;
  for (let t = 9; t < 11; t++) {
    let s = 0;
    for (let i = 0; i < t; i++) s += +d[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +d[t]) return false;
  }
  return true;
}
function cnpjValido(d) {
  if (d.length !== 14 || todosIguais(d)) return false;
  const dv = n => {
    const pesos = n === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let s = 0;
    for (let i = 0; i < n; i++) s += +d[i] * pesos[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === +d[12] && dv(13) === +d[13];
}
function mascaraDocumento(valor) {
  const d = soDigitos(valor).slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}
function validarDocumento(valor) {
  const v = String(valor || '').trim();
  if (!v) return vErro('Informe o CPF ou CNPJ.');
  const cpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v), cnpj = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(v);
  if (!cpf && !cnpj) return vErro('Formato inválido. Use 000.000.000-00 (CPF) ou 00.000.000/0000-00 (CNPJ).');
  const d = soDigitos(v);
  if (cpf && !cpfValido(d)) return vErro('CPF inválido: confira os números digitados.');
  if (cnpj && !cnpjValido(d)) return vErro('CNPJ inválido: confira os números digitados.');
  return vOk();
}

/* ---------- Telefone ---------- */
function mascaraTelefone(valor) {
  const d = soDigitos(valor).slice(0, 11);
  if (!d) return '';
  if (d.length <= 2) return '(' + d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function validarTelefone(valor) {
  const v = String(valor || '').trim();
  if (!v) return vErro('Informe o telefone.');
  const cel = /^\((\d{2})\) (9\d{4})-(\d{4})$/.exec(v), fixo = /^\((\d{2})\) ([2-5]\d{3})-(\d{4})$/.exec(v);
  const m = cel || fixo;
  if (!m) return vErro('Telefone inválido. Use (44) 99999-9999 (celular) ou (44) 3333-4444 (fixo).');
  if (!DDDS_VALIDOS.includes(m[1])) return vErro('DDD inexistente.');
  if (todosIguais(m[2] + m[3])) return vErro('Número de telefone inválido.');
  return vOk();
}

/* ---------- E-mail ---------- */
function validarEmail(valor) {
  const v = String(valor || '').trim().toLowerCase();
  if (!v) return vErro('Informe o e-mail.');
  const re = /^[a-z0-9]+([._%+-][a-z0-9]+)*@([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,24}$/;
  const [local, dominio] = v.split('@');
  if (v.length > 254 || !re.test(v) || local.length > 64) return vErro('E-mail inválido. Exemplo: nome@dominio.com');
  if (ERROS_DOMINIO[dominio]) return vErro(`Domínio suspeito. Você quis dizer ${ERROS_DOMINIO[dominio]}?`);
  return vOk();
}

/* ---------- Senha ---------- */
function regrasSenha(s) {
  s = String(s || '');
  return [
    { ok: s.length >= 10, txt: 'Mínimo de 10 caracteres' },
    { ok: /[A-Z]/.test(s), txt: 'Uma letra maiúscula' },
    { ok: /[a-z]/.test(s), txt: 'Uma letra minúscula' },
    { ok: /\d/.test(s), txt: 'Um número' },
    { ok: /[^A-Za-z0-9\s]/.test(s), txt: 'Um caractere especial (!@#$%...)' }
  ];
}
function validarSenha(valor) {
  if (!valor) return vErro('Informe a senha.');
  if (/\s/.test(valor)) return vErro('A senha não pode conter espaços.');
  const faltam = regrasSenha(valor).filter(r => !r.ok).map(r => r.txt.toLowerCase());
  return faltam.length ? vErro('A senha precisa ter: ' + faltam.join(', ') + '.') : vOk();
}

/* ---------- Cargo ---------- */
function validarCargo(valor) {
  if (!valor) return vErro('Selecione um cargo.');
  return CARGOS.includes(valor) ? vOk() : vErro('Cargo inválido. Escolha um da lista.');
}

/* ============ Ajudantes de tela (DOM) ============ */
function mostrarErroCampo(input, msg) {
  let p = input.parentElement.querySelector('.erro-campo[data-for="' + input.id + '"]');
  if (!p) {
    p = document.createElement('p');
    p.className = 'erro-campo text-xs text-red-400 mt-1';
    p.dataset.for = input.id;
    input.insertAdjacentElement('afterend', p);
  }
  p.textContent = msg || '';
  p.style.display = msg ? 'block' : 'none';
  input.style.borderColor = msg ? '#ef4444' : '';
}
function limparErrosCampos(form) {
  form.querySelectorAll('.erro-campo').forEach(p => { p.textContent = ''; p.style.display = 'none'; });
  form.querySelectorAll('input,select').forEach(i => { i.style.borderColor = ''; });
}
function aplicarMascara(id, tipo) {
  const el = document.getElementById(id);
  if (!el) return;
  const fn = tipo === 'documento' ? mascaraDocumento : mascaraTelefone;
  el.maxLength = tipo === 'documento' ? 18 : 15;
  el.inputMode = 'numeric';
  el.addEventListener('input', () => { el.value = fn(el.value); });
}
function checklistSenha(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const ul = document.createElement('ul');
  ul.className = 'mt-2 space-y-0.5 text-xs';
  el.insertAdjacentElement('afterend', ul);
  const atualizar = () => {
    ul.innerHTML = regrasSenha(el.value).map(r =>
      `<li class="${r.ok ? 'text-emerald-400' : 'text-slate-500'}">${r.ok ? '✓' : '○'} ${r.txt}</li>`).join('');
  };
  el.addEventListener('input', atualizar);
  atualizar();
}

/* ============================================================
   MOTOS
   ============================================================ */
// Marcas aceitas. Quando houver banco de dados, esta lista virá de uma tabela de marcas.
const MARCAS_MOTO = ['Honda', 'Yamaha', 'Suzuki', 'Kawasaki', 'Harley-Davidson', 'BMW', 'Triumph', 'Ducati', 'KTM', 'Royal Enfield',
  'Shineray', 'Haojue', 'Dafra', 'Kasinski', 'Traxx', 'Avelloz', 'Bajaj', 'MV Agusta', 'Aprilia', 'Piaggio', 'Vespa',
  'Husqvarna', 'Benelli', 'CFMoto', 'Voltz', 'Indian'];
const CORES_BASE = ['preto', 'branco', 'vermelho', 'azul', 'verde', 'amarelo', 'laranja', 'cinza', 'prata', 'grafite', 'chumbo',
  'marrom', 'bege', 'dourado', 'rosa', 'roxo', 'vinho', 'bordo', 'titanio', 'champagne', 'cobre', 'bronze', 'nero'];
// true = o 10º caractere do chassi (ano do modelo) precisa bater com o ano de fabricação informado (±1 ano)
const EXIGIR_ANO_NO_CHASSI = true;
const CODIGO_ANO_CHASSI = 'ABCDEFGHJKLMNPRSTVWXY123456789'; // ciclo de 30 anos: A=1980, A=2010, A=2040...

const semAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function mascaraPlaca(valor) {
  const s = String(valor || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
  return s.length >= 5 && /^[A-Z]{3}\d{2}/.test(s) ? s.slice(0, 3) + '-' + s.slice(3) : s;
}
function validarPlaca(valor) {
  const v = String(valor || '').trim().toUpperCase();
  if (!v) return vErro('Informe a placa.');
  if (!/^[A-Z]{3}-?\d{4}$/.test(v) && !/^[A-Z]{3}\d[A-Z]\d{2}$/.test(v)) return vErro('Placa inválida. Use ABC-1234 (modelo antigo) ou ABC1D23 (Mercosul).');
  return vOk();
}
function mascaraChassi(valor) { return String(valor || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17); }
function validarChassi(valor, anoFab) {
  const v = String(valor || '').trim().toUpperCase();
  if (!v) return vErro('Informe o chassi.');
  if (!/^[A-Z0-9]+$/.test(v)) return vErro('O chassi só pode ter letras e números.');
  if (v.length !== 17) return vErro(`O chassi precisa ter 17 caracteres (você digitou ${v.length}).`);
  if (/[IOQ]/.test(v)) return vErro('O chassi não pode conter as letras I, O ou Q.');
  if (todosIguais(v)) return vErro('Chassi inválido.');
  const i = CODIGO_ANO_CHASSI.indexOf(v[9]);
  if (i < 0) return vErro('O 10º caractere do chassi (ano do modelo) é inválido: não pode ser 0, U ou Z.');
  const a = parseInt(anoFab, 10);
  if (EXIGIR_ANO_NO_CHASSI && a >= 1981) {
    const anos = [1980 + i, 2010 + i, 2040 + i];
    if (!anos.some(y => y >= a && y <= a + 1)) {
      const prox = anos.reduce((p, y) => Math.abs(y - a) < Math.abs(p - a) ? y : p);
      return vErro(`O 10º caractere do chassi indica o ano ${prox}, mas o ano de fabricação informado é ${a}.`);
    }
  }
  return vOk();
}
function validarAnoFabricacao(valor) {
  const s = String(valor == null ? '' : valor).trim();
  if (!s) return vErro('Informe o ano de fabricação.');
  if (!/^\d{4}$/.test(s)) return vErro('Ano inválido. Use 4 dígitos (ex.: 2024).');
  const a = +s, atual = new Date().getFullYear();
  if (a < 1950) return vErro('Ano muito antigo (mínimo 1950).');
  if (a > atual) return vErro(`O ano de fabricação não pode ser maior que ${atual}.`);
  return vOk();
}
function validarMarcaMoto(valor) {
  if (!valor) return vErro('Selecione a marca.');
  return MARCAS_MOTO.includes(valor) ? vOk() : vErro('Marca inválida. Escolha uma da lista.');
}
function validarCor(valor) {
  const v = String(valor || '').trim();
  if (!v) return vErro('Informe a cor.');
  const palavras = semAcento(v).toLowerCase().split(/[\s\/-]+/).filter(Boolean);
  if (v.length < 3 || v.length > 30 || !palavras.every(p => /^[a-z]+$/.test(p)) || !palavras.some(p => CORES_BASE.includes(p))) {
    return vErro('Cor inválida. Informe uma cor, ex.: Preto Fosco, Vermelho Metálico.');
  }
  return vOk();
}
function validarModelo(valor) {
  const v = String(valor || '').trim();
  if (!v) return vErro('Informe o modelo.');
  return /^[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 .\-\/+]{1,39}$/.test(v) && /[A-Za-zÀ-ÿ0-9]{2}/.test(v) && !todosIguais(v.replace(/\s/g, ''))
    ? vOk() : vErro('Modelo inválido. Ex.: CB 500X, Fazer 250.');
}
function validarClienteCadastrado(valor) {
  const nome = semAcento(valor).trim().toLowerCase();
  if (!nome) return vErro('Informe o dono da moto.');
  let lista = [];
  try { lista = JSON.parse(localStorage.getItem('oficina_usuarios')) || []; } catch (e) {}
  if (!lista.length) return vErro('Nenhum cliente cadastrado. Cadastre o cliente antes de cadastrar a moto.');
  return lista.some(u => semAcento(u.nome).trim().toLowerCase() === nome) ? vOk() : vErro('Cliente não encontrado. Escolha um cliente já cadastrado.');
}

/* ============================================================
   PEÇAS
   ============================================================ */
const UNIDADES = ['UN', 'KG', 'L', 'PAR', 'JOGO'];

function mascaraCodigo(valor) { return String(valor || '').toUpperCase().replace(/[^A-Z0-9\-./]/g, ''); }
function validarCodigo(valor, rotulo, obrigatorio, min, max) {
  const v = String(valor || '').trim().toUpperCase();
  if (!v) return obrigatorio ? vErro(`Informe o ${rotulo}.`) : vOk();
  if (v.length < min || v.length > max) return vErro(`O ${rotulo} deve ter entre ${min} e ${max} caracteres.`);
  if (!/^[A-Z0-9]+([-./][A-Z0-9]+)*$/.test(v)) return vErro(`O ${rotulo} só pode ter letras, números e os separadores - . /`);
  return vOk();
}
function validarTexto(valor, rotulo, obrigatorio, min, max, exigirLetra) {
  const v = String(valor || '').trim();
  if (!v) return obrigatorio ? vErro(`Informe ${rotulo}.`) : vOk();
  if (v.length < min || v.length > max) return vErro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} deve ter entre ${min} e ${max} caracteres.`);
  if (!/^[A-Za-zÀ-ÿ0-9 .,\-\/&()'+%#º°"]+$/.test(v) || todosIguais(v.replace(/\s/g, '')) || (exigirLetra && !/[A-Za-zÀ-ÿ]{2}/.test(v))) {
    return vErro(`Valor inválido para ${rotulo}.`);
  }
  return vOk();
}
function validarUnidade(valor) {
  if (!valor) return vErro('Selecione a unidade de medida.');
  return UNIDADES.includes(valor) ? vOk() : vErro('Unidade de medida inválida.');
}
function validarInteiro(valor, rotulo, min, max) {
  const s = String(valor == null ? '' : valor).trim();
  if (!s) return vErro(`Informe ${rotulo}.`);
  if (!/^\d+$/.test(s)) return vErro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} deve ser um número inteiro, sem sinais ou decimais.`);
  const n = +s;
  return n < min || n > max ? vErro(`${rotulo[0].toUpperCase() + rotulo.slice(1)} deve estar entre ${min} e ${max}.`) : vOk();
}
function validarPreco(valor, obrigatorio) {
  const s = String(valor == null ? '' : valor).trim();
  if (!s) return obrigatorio ? vErro('Informe o preço de venda.') : vOk();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return vErro('Preço inválido. Use no máximo 2 casas decimais (ex.: 49.90).');
  const n = parseFloat(s);
  return n <= 0 || n > 999999.99 ? vErro('O preço deve ser maior que zero e menor que R$ 1.000.000,00.') : vOk();
}

/* ============ Ajudantes genéricos de formulário ============ */
// campos: [[id, funcaoValidadora, aparar?], ...]  (aparar = false mantém espaços, usado na senha)
function validarLista(campos) {
  let primeiro = null;
  campos.forEach(([id, fn, aparar]) => {
    const el = document.getElementById(id);
    const r = fn(aparar === false ? el.value : el.value.trim());
    mostrarErroCampo(el, r.msg);
    if (!r.ok && !primeiro) primeiro = el;
  });
  if (primeiro) primeiro.focus();
  return !primeiro;
}
function ligarValidacaoCampos(campos) {
  campos.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', () => { if (el.value.trim()) mostrarErroCampo(el, fn(el.value.trim()).msg); });
    ['input', 'change'].forEach(ev => el.addEventListener(ev, () => {
      const p = el.parentElement.querySelector('.erro-campo[data-for="' + id + '"]');
      if (p && p.textContent) mostrarErroCampo(el, fn(el.value.trim()).msg);
    }));
  });
}
function aplicarMascaraFn(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => { el.value = fn(el.value); });
}
function nomesClientesCadastrados() {
  try { return (JSON.parse(localStorage.getItem('oficina_usuarios')) || []).map(u => u.nome).filter(Boolean); } catch (e) { return []; }
}

if (typeof module !== 'undefined') {
  module.exports = { CARGOS, validarNascimento, validarDocumento, validarTelefone, validarEmail, validarSenha, validarCargo,
    mascaraDocumento, mascaraTelefone, cpfValido, cnpjValido, limitesNascimento,
    mascaraPlaca, validarPlaca, mascaraChassi, validarChassi, validarAnoFabricacao, validarMarcaMoto, validarCor, validarModelo,
    validarCodigo, validarTexto, validarUnidade, validarInteiro, validarPreco };
}