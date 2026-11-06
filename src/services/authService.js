// Tudo sobre usuários: login, logout, sessão, cadastro e permissões.
// A autenticação é feita pelo Firebase Authentication (e-mail e senha) e o
// perfil de acesso (admin ou tecnico) fica na coleção "usuarios" do Firestore.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, credenciaisFirebase } from './firebaseConfig';
import { PERFIS } from '../data/constantes';

const CHAVE_ULTIMO_EMAIL = '@flexfibra_ultimo_email';

export function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

// O Firebase devolve erros em inglês e com códigos. Aqui viram mensagens para o usuário.
export function traduzirErro(erro) {
  const codigo = erro?.code || '';

  if (codigo.includes('invalid-credential') || codigo.includes('wrong-password') || codigo.includes('user-not-found')) {
    // A mensagem é a mesma para e-mail ou senha errados,
    // assim ninguém descobre quais e-mails estão cadastrados.
    return 'E-mail ou senha incorretos.';
  }
  if (codigo.includes('invalid-email')) return 'Informe um e-mail válido.';
  if (codigo.includes('email-already-in-use')) return 'Já existe um usuário com este e-mail.';
  if (codigo.includes('weak-password')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (codigo.includes('network-request-failed')) return 'Sem conexão com a internet. Verifique sua rede.';
  if (codigo.includes('too-many-requests')) return 'Muitas tentativas seguidas. Aguarde alguns minutos.';
  if (codigo.includes('permission-denied')) return 'Você não tem permissão para esta ação.';
  if (codigo.includes('unavailable')) return 'Não foi possível falar com o servidor. Verifique sua internet.';

  return erro?.message || 'Não foi possível concluir a operação.';
}

// Junta os dados da conta (Auth) com o perfil guardado no Firestore
async function carregarPerfil(contaFirebase) {
  const documento = await getDoc(doc(db, 'usuarios', contaFirebase.uid));
  if (!documento.exists()) return null;

  return { id: contaFirebase.uid, email: contaFirebase.email, ...documento.data() };
}

// Ao abrir o app, o Firebase leva um instante para restaurar a sessão salva.
// Esta função espera essa primeira resposta.
export function aguardarAutenticacao() {
  return new Promise((resolve) => {
    const cancelar = onAuthStateChanged(auth, (conta) => {
      cancelar();
      resolve(conta);
    });
  });
}

// ---------- LOGIN / SESSÃO ----------

export async function fazerLogin(email, senha) {
  try {
    const credencial = await signInWithEmailAndPassword(auth, normalizarEmail(email), senha);
    const usuario = await carregarPerfil(credencial.user);

    // Conta existe no Firebase, mas não tem (ou perdeu) o cadastro no aplicativo
    if (!usuario) {
      await signOut(auth);
      throw new Error('Esta conta não tem acesso ao aplicativo. Procure um administrador.');
    }

    await AsyncStorage.setItem(CHAVE_ULTIMO_EMAIL, usuario.email);
    return usuario;
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

export async function fazerLogout() {
  await signOut(auth);
}

export async function obterUltimoEmail() {
  const email = await AsyncStorage.getItem(CHAVE_ULTIMO_EMAIL);
  return email || '';
}

// Devolve o usuário logado (com o perfil) ou null se ninguém estiver logado
export async function obterUsuarioLogado() {
  const conta = auth.currentUser || (await aguardarAutenticacao());
  if (!conta) return null;

  return carregarPerfil(conta);
}

// Garante que quem está chamando tem o perfil certo.
// Esta é a verificação do aplicativo; as regras do Firestore repetem a checagem no servidor.
export async function exigirPerfil(perfil) {
  const usuario = await obterUsuarioLogado();
  if (!usuario) {
    throw new Error('Sua sessão expirou. Faça login novamente.');
  }
  if (usuario.perfil !== perfil) {
    throw new Error(
      perfil === PERFIS.ADMIN
        ? 'Apenas administradores podem realizar esta ação.'
        : 'Apenas técnicos podem realizar esta ação.'
    );
  }
  return usuario;
}

// ---------- CADASTRO DE USUÁRIOS ----------

function validarDados({ nome, email, senha }) {
  if (!nome || nome.trim().length < 3) {
    throw new Error('Informe o nome completo (mínimo de 3 letras).');
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw new Error('Informe um e-mail válido.');
  }
  if (!senha || senha.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }
}

// Cadastro público (link "Cadastre-se" do login): SEMPRE cria um técnico.
export async function cadastrarTecnico({ nome, email, senha }) {
  validarDados({ nome, email, senha });
  const emailNormalizado = normalizarEmail(email);

  try {
    const credencial = await createUserWithEmailAndPassword(auth, emailNormalizado, senha);
    const novoUsuario = {
      nome: nome.trim(),
      email: emailNormalizado,
      perfil: PERFIS.TECNICO,
      criadoEm: new Date().toISOString(),
    };

    await setDoc(doc(db, 'usuarios', credencial.user.uid), novoUsuario);
    return { id: credencial.user.uid, ...novoUsuario };
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

// Cadastro feito por um administrador: pode escolher o perfil.
export async function criarUsuario({ nome, email, senha, perfil }) {
  await exigirPerfil(PERFIS.ADMIN);
  validarDados({ nome, email, senha });

  if (perfil !== PERFIS.ADMIN && perfil !== PERFIS.TECNICO) {
    throw new Error('Selecione um perfil válido.');
  }

  const emailNormalizado = normalizarEmail(email);

  // Criar uma conta deixa ela logada automaticamente, o que derrubaria a sessão
  // do administrador. Por isso usamos um segundo app temporário só para o cadastro.
  const appTemporario = initializeApp(credenciaisFirebase, `cadastro-${Date.now()}`);
  const authTemporario = getAuth(appTemporario);

  try {
    const credencial = await createUserWithEmailAndPassword(authTemporario, emailNormalizado, senha);
    const novoUsuario = {
      nome: nome.trim(),
      email: emailNormalizado,
      perfil,
      criadoEm: new Date().toISOString(),
    };

    // A gravação usa a sessão do administrador (db), e não a do app temporário
    await setDoc(doc(db, 'usuarios', credencial.user.uid), novoUsuario);
    return { id: credencial.user.uid, ...novoUsuario };
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  } finally {
    await signOut(authTemporario).catch(() => {});
    await deleteApp(appTemporario).catch(() => {});
  }
}

export async function listarUsuarios() {
  await exigirPerfil(PERFIS.ADMIN);

  const consulta = await getDocs(collection(db, 'usuarios'));
  return consulta.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

// Remove o acesso ao aplicativo apagando o cadastro do usuário.
// A conta continua existindo no Firebase Authentication: apagá-la de vez exige
// acesso administrativo ao projeto, feito pelo console do Firebase.
export async function removerUsuario(id) {
  const admin = await exigirPerfil(PERFIS.ADMIN);
  if (id === admin.id) {
    throw new Error('Você não pode remover a sua própria conta.');
  }

  try {
    await deleteDoc(doc(db, 'usuarios', id));
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}
