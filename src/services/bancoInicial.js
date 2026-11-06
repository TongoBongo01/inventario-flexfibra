// Carga dos dados de demonstração no Firestore.
//
// Os usuários NÃO são criados aqui: contas do Firebase Authentication são criadas
// pelo cadastro do aplicativo ou pelo script scripts/semear.mjs, executado uma vez.
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { exigirPerfil, traduzirErro } from './authService';
import { PERFIS } from '../data/constantes';
import { ITENS_INICIAIS } from '../data/dadosIniciais';

// Apaga uma coleção inteira em lotes (o Firestore não apaga coleções de uma vez)
async function limparColecao(nome) {
  const consulta = await getDocs(collection(db, nome));
  if (consulta.empty) return;

  const lote = writeBatch(db);
  consulta.docs.forEach((documento) => lote.delete(documento.ref));
  await lote.commit();
}

// Apaga itens e requisições e grava novamente a lista de exemplo.
// Útil para deixar o aplicativo no estado inicial antes de uma apresentação.
export async function restaurarDadosDeExemplo() {
  await exigirPerfil(PERFIS.ADMIN);

  try {
    await limparColecao('requisicoes');
    await limparColecao('itens');

    const lote = writeBatch(db);
    ITENS_INICIAIS.forEach((item) => {
      lote.set(doc(collection(db, 'itens')), item);
    });
    await lote.commit();
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}
