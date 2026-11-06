// Operações com os itens do estoque, guardados na coleção "itens" do Firestore.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { exigirPerfil, traduzirErro } from './authService';
import { PERFIS, STATUS, CATEGORIAS, UNIDADES } from '../data/constantes';

const itensRef = collection(db, 'itens');

// Qualquer usuário logado pode consultar o estoque
export async function listarItens() {
  const consulta = await getDocs(itensRef);
  return consulta.docs
    .map((documento) => ({ id: documento.id, ...documento.data() }))
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function obterItem(id) {
  const documento = await getDoc(doc(db, 'itens', id));
  return documento.exists() ? { id: documento.id, ...documento.data() } : null;
}

// true quando o item chegou (ou passou) do estoque mínimo
export function estaComEstoqueBaixo(item) {
  return item.quantidade <= item.estoqueMinimo;
}

function validarItem({ nome, categoria, unidade, quantidade, estoqueMinimo }) {
  if (!nome || nome.trim().length < 2) {
    throw new Error('Informe o nome do item.');
  }
  if (!CATEGORIAS.includes(categoria)) {
    throw new Error('Selecione uma categoria.');
  }
  if (!UNIDADES.includes(unidade)) {
    throw new Error('Selecione uma unidade de medida.');
  }
  if (!Number.isInteger(quantidade) || quantidade < 0) {
    throw new Error('A quantidade deve ser um número inteiro (0 ou mais).');
  }
  if (!Number.isInteger(estoqueMinimo) || estoqueMinimo < 0) {
    throw new Error('O estoque mínimo deve ser um número inteiro (0 ou mais).');
  }
}

// Cria um item novo (sem id) ou atualiza um existente (com id). Só administradores.
export async function salvarItem({ id, nome, categoria, unidade, quantidade, estoqueMinimo }) {
  await exigirPerfil(PERFIS.ADMIN);
  validarItem({ nome, categoria, unidade, quantidade, estoqueMinimo });

  const nomeLimpo = nome.trim();
  const dados = { nome: nomeLimpo, categoria, unidade, quantidade, estoqueMinimo };

  try {
    // O Firestore não tem busca sem diferenciar maiúsculas, então comparamos na memória
    const existentes = await listarItens();
    const nomeRepetido = existentes.some(
      (item) => item.nome.toLowerCase() === nomeLimpo.toLowerCase() && item.id !== id
    );
    if (nomeRepetido) {
      throw new Error('Já existe um item com este nome.');
    }

    if (id) {
      await updateDoc(doc(db, 'itens', id), dados);
    } else {
      await addDoc(itensRef, dados);
    }
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}

export async function removerItem(id) {
  await exigirPerfil(PERFIS.ADMIN);

  try {
    // Não deixamos excluir um item que ainda está esperando aprovação
    const pendentes = await getDocs(
      query(collection(db, 'requisicoes'), where('itemId', '==', id), where('status', '==', STATUS.PENDENTE))
    );
    if (!pendentes.empty) {
      throw new Error('Este item tem requisições pendentes. Aprove ou negue antes de excluir.');
    }

    await deleteDoc(doc(db, 'itens', id));
  } catch (erro) {
    throw new Error(traduzirErro(erro));
  }
}
