// Prepara o "banco de dados" local na primeira vez que o app é aberto.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CHAVES, lerLista, salvarLista } from './armazenamento';
import { exigirPerfil, gerarHashSenha } from './authService';
import { PERFIS } from '../data/constantes';
import { USUARIOS_INICIAIS, ITENS_INICIAIS, criarRequisicoesIniciais } from '../data/dadosIniciais';

export async function inicializarBanco() {
  const usuarios = await lerLista(CHAVES.usuarios);
  if (usuarios.length > 0) return; // Já foi preparado antes

  // Troca a senha de cada usuário de exemplo pelo hash dela
  const usuariosComHash = await Promise.all(
    USUARIOS_INICIAIS.map(async ({ senha, ...usuario }) => ({
      ...usuario,
      senhaHash: await gerarHashSenha(usuario.email, senha),
      criadoEm: new Date().toISOString(),
    }))
  );

  await salvarLista(CHAVES.usuarios, usuariosComHash);
  await salvarLista(CHAVES.itens, ITENS_INICIAIS);
  await salvarLista(CHAVES.requisicoes, criarRequisicoesIniciais());
}

// Apaga tudo e volta para os dados de exemplo (útil para apresentar o trabalho)
export async function restaurarDadosDeExemplo() {
  await exigirPerfil(PERFIS.ADMIN);
  await AsyncStorage.multiRemove(Object.values(CHAVES));
  await inicializarBanco();
}
