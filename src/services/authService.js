// Tudo sobre usuários: login, logout, sessão, cadastro e permissões.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { CHAVES, lerLista, salvarLista, gerarId } from './armazenamento';
import { PERFIS } from '../data/constantes';

export function normalizarEmail(email) {
  return email.trim().toLowerCase();
}

// Nunca guardamos a senha "pura". Salvamos só o hash SHA-256 dela.
// Juntamos o e-mail à senha para que duas pessoas com a mesma senha tenham hashes diferentes.
export async function gerarHashSenha(email, senha) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${normalizarEmail(email)}:${senha}`
  );
}

// Tira o hash da senha antes de entregar o usuário para as telas
function semSenha({ senhaHash, ...usuario }) {
  return usuario;
}

// ---------- LOGIN / SESSÃO ----------

export async function fazerLogin(email, senha) {
  const usuarios = await lerLista(CHAVES.usuarios);
  const usuario = usuarios.find((u) => u.email === normalizarEmail(email));
  const hash = await gerarHashSenha(email, senha);

  // A mensagem é a mesma para e-mail ou senha errados,
  // assim ninguém descobre quais e-mails estão cadastrados.
  if (!usuario || usuario.senhaHash !== hash) {
    throw new Error('E-mail ou senha incorretos.');
  }

  // Guarda a sessão no celular (o usuário continua logado mesmo fechando o app)
  await AsyncStorage.setItem(CHAVES.sessao, usuario.id);
  await AsyncStorage.setItem(CHAVES.ultimoEmail, usuario.email);
  return semSenha(usuario);
}

export async function fazerLogout() {
  await AsyncStorage.removeItem(CHAVES.sessao);
}

export async function obterUltimoEmail() {
  const email = await AsyncStorage.getItem(CHAVES.ultimoEmail);
  return email || '';
}

// Devolve o usuário logado ou null se ninguém estiver logado
export async function obterUsuarioLogado() {
  const id = await AsyncStorage.getItem(CHAVES.sessao);
  if (!id) return null;

  const usuarios = await lerLista(CHAVES.usuarios);
  const usuario = usuarios.find((u) => u.id === id);
  return usuario ? semSenha(usuario) : null;
}

// Garante que quem está chamando tem o perfil certo.
// Mesmo que uma tela seja aberta por engano, a regra de negócio fica protegida aqui.
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

function validarUsuario({ nome, email, senha }) {
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

async function inserirUsuario({ nome, email, senha, perfil }) {
  validarUsuario({ nome, email, senha });

  const usuarios = await lerLista(CHAVES.usuarios);
  const emailNormalizado = normalizarEmail(email);

  if (usuarios.some((u) => u.email === emailNormalizado)) {
    throw new Error('Já existe um usuário com este e-mail.');
  }

  const novoUsuario = {
    id: gerarId(),
    nome: nome.trim(),
    email: emailNormalizado,
    senhaHash: await gerarHashSenha(emailNormalizado, senha),
    perfil,
    criadoEm: new Date().toISOString(),
  };

  await salvarLista(CHAVES.usuarios, [...usuarios, novoUsuario]);
  return semSenha(novoUsuario);
}

// Cadastro público (link "Cadastre-se" do login): SEMPRE cria um técnico.
export async function cadastrarTecnico({ nome, email, senha }) {
  return inserirUsuario({ nome, email, senha, perfil: PERFIS.TECNICO });
}

// Cadastro feito por um administrador: pode escolher o perfil.
export async function criarUsuario({ nome, email, senha, perfil }) {
  await exigirPerfil(PERFIS.ADMIN);
  if (perfil !== PERFIS.ADMIN && perfil !== PERFIS.TECNICO) {
    throw new Error('Selecione um perfil válido.');
  }
  return inserirUsuario({ nome, email, senha, perfil });
}

export async function listarUsuarios() {
  await exigirPerfil(PERFIS.ADMIN);
  const usuarios = await lerLista(CHAVES.usuarios);
  return usuarios.map(semSenha).sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function removerUsuario(id) {
  const admin = await exigirPerfil(PERFIS.ADMIN);
  if (id === admin.id) {
    throw new Error('Você não pode remover a sua própria conta.');
  }
  const usuarios = await lerLista(CHAVES.usuarios);
  await salvarLista(CHAVES.usuarios, usuarios.filter((u) => u.id !== id));
}
