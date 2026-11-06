// Camada de acesso ao AsyncStorage (Módulo 10).
// Funciona como o nosso "banco de dados" local: cada "tabela" é uma lista
// de objetos guardada como texto JSON em uma chave.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHAVES = {
  usuarios: '@flexfibra_usuarios',
  itens: '@flexfibra_itens',
  requisicoes: '@flexfibra_requisicoes',
  sessao: '@flexfibra_sessao', // id do usuário logado
  ultimoEmail: '@flexfibra_ultimo_email',
};

// Lê uma lista salva. Se ainda não existir nada, devolve uma lista vazia.
export async function lerLista(chave) {
  const json = await AsyncStorage.getItem(chave);
  return json ? JSON.parse(json) : [];
}

// Salva a lista inteira (o AsyncStorage só guarda texto, por isso o JSON.stringify)
export async function salvarLista(chave, lista) {
  await AsyncStorage.setItem(chave, JSON.stringify(lista));
}

// Gera um id único a partir da data atual + um pedaço aleatório
export function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
