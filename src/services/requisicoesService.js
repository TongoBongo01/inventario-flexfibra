// Requisições de material: o técnico pede, o administrador aprova ou nega.
// Os pedidos ficam na coleção "requisicoes" do Firestore.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { exigirPerfil, obterUsuarioLogado, traduzirErro } from './authService';
import { PERFIS, STATUS } from '../data/constantes';

const requisicoesRef = collection(db, 'requisicoes');

// Datas em formato ISO podem ser comparadas como texto
const maisRecentesPrimeiro = (a, b) => b.criadaEm.localeCompare(a.criadaEm);

const converter = (documento) => ({ id: documento.id, ...documento.data() });

// ---------- TÉCNICO ----------

export async function criarRequisicao({ itemId, quantidade, observacao }) {
  const tecnico = await exigirPerfil(PERFIS.TECNICO);

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new Error('Informe uma quantidade válida.');
  }

  try {
    const item = await getDoc(doc(db, 'itens', itemId));
    if (!item.exists()) {
      throw new Error('Item não encontrado no estoque.');
    }

    const dadosItem = item.data();
    if (quantidade > dadosItem.quantidade) {
      throw new Error(`Quantidade indisponível. Em estoque: ${dadosItem.quantidade} ${dadosItem.unidade}.`);
    }

    const novaRequisicao = {
      itemId,
      itemNome: dadosItem.nome,
      unidade: dadosItem.unidade,
      quantidade,
      observacao: (observacao || '').trim(),
      tecnicoId: tecnico.id,
      tecnicoNome: tecnico.nome,
      status: STATUS.PENDENTE,
      criadaEm: new Date().toISOString(),
      respondidaEm: null,
      respondidaPorNome: null,
      motivoNegacao: '',
    };

    // O estoque NÃO é descontado aqui, só quando um administrador aprovar
    const gravado = await addDoc(requisicoesRef, novaRequisicao);
    return { id: gravado.id, ...novaRequisicao };
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

export async function listarMinhasRequisicoes() {
  const usuario = await obterUsuarioLogado();
  if (!usuario) {
    throw new Error('Sua sessão expirou. Faça login novamente.');
  }

  try {
    const consulta = await getDocs(query(requisicoesRef, where('tecnicoId', '==', usuario.id)));
    return consulta.docs.map(converter).sort(maisRecentesPrimeiro);
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

export async function cancelarRequisicao(id) {
  const tecnico = await exigirPerfil(PERFIS.TECNICO);

  try {
    const documento = await getDoc(doc(db, 'requisicoes', id));
    if (!documento.exists()) {
      throw new Error('Requisição não encontrada.');
    }

    const requisicao = documento.data();
    if (requisicao.status !== STATUS.PENDENTE) {
      throw new Error('Esta requisição já foi respondida.');
    }
    if (requisicao.tecnicoId !== tecnico.id) {
      throw new Error('Você só pode cancelar as suas próprias requisições.');
    }

    await updateDoc(doc(db, 'requisicoes', id), {
      status: STATUS.CANCELADA,
      respondidaEm: new Date().toISOString(),
    });
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

// ---------- ADMINISTRADOR ----------

export async function listarTodasRequisicoes() {
  await exigirPerfil(PERFIS.ADMIN);

  try {
    const consulta = await getDocs(requisicoesRef);
    return consulta.docs.map(converter).sort(maisRecentesPrimeiro);
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

export async function aprovarRequisicao(id) {
  const admin = await exigirPerfil(PERFIS.ADMIN);

  try {
    // Transação: ler a requisição e o item, conferir o saldo e gravar os dois.
    // Se dois administradores aprovarem ao mesmo tempo, o Firestore refaz a operação,
    // evitando que o estoque fique negativo.
    await runTransaction(db, async (transacao) => {
      const refRequisicao = doc(db, 'requisicoes', id);
      const documentoRequisicao = await transacao.get(refRequisicao);

      if (!documentoRequisicao.exists()) {
        throw new Error('Requisição não encontrada.');
      }

      const requisicao = documentoRequisicao.data();
      if (requisicao.status !== STATUS.PENDENTE) {
        throw new Error('Esta requisição já foi respondida.');
      }

      const refItem = doc(db, 'itens', requisicao.itemId);
      const documentoItem = await transacao.get(refItem);
      if (!documentoItem.exists()) {
        throw new Error('O item desta requisição não existe mais no estoque.');
      }

      const item = documentoItem.data();
      if (item.quantidade < requisicao.quantidade) {
        throw new Error(
          `Estoque insuficiente: há apenas ${item.quantidade} ${item.unidade} de ${item.nome}.`
        );
      }

      // 1) Dá baixa no estoque
      transacao.update(refItem, { quantidade: item.quantidade - requisicao.quantidade });

      // 2) Marca a requisição como aprovada
      transacao.update(refRequisicao, {
        status: STATUS.APROVADA,
        respondidaEm: new Date().toISOString(),
        respondidaPorNome: admin.nome,
      });
    });
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

export async function negarRequisicao(id, motivo) {
  const admin = await exigirPerfil(PERFIS.ADMIN);

  try {
    const documento = await getDoc(doc(db, 'requisicoes', id));
    if (!documento.exists()) {
      throw new Error('Requisição não encontrada.');
    }
    if (documento.data().status !== STATUS.PENDENTE) {
      throw new Error('Esta requisição já foi respondida.');
    }

    await updateDoc(doc(db, 'requisicoes', id), {
      status: STATUS.NEGADA,
      respondidaEm: new Date().toISOString(),
      respondidaPorNome: admin.nome,
      motivoNegacao: (motivo || '').trim(),
    });
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}
