// Operações com os itens do estoque.
import { CHAVES, lerLista, salvarLista, gerarId } from './armazenamento';
import { exigirPerfil } from './authService';
import { PERFIS, STATUS, CATEGORIAS, UNIDADES } from '../data/constantes';

// Qualquer usuário logado pode consultar o estoque
export async function listarItens() {
  const itens = await lerLista(CHAVES.itens);
  return itens.sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function obterItem(id) {
  const itens = await lerLista(CHAVES.itens);
  return itens.find((item) => item.id === id) || null;
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

  const itens = await lerLista(CHAVES.itens);
  const nomeLimpo = nome.trim();

  const nomeRepetido = itens.some(
    (item) => item.nome.toLowerCase() === nomeLimpo.toLowerCase() && item.id !== id
  );
  if (nomeRepetido) {
    throw new Error('Já existe um item com este nome.');
  }

  const dados = { nome: nomeLimpo, categoria, unidade, quantidade, estoqueMinimo };

  if (id) {
    // Edição: troca apenas o item com o mesmo id
    const atualizados = itens.map((item) => (item.id === id ? { ...item, ...dados } : item));
    await salvarLista(CHAVES.itens, atualizados);
  } else {
    // Novo item
    await salvarLista(CHAVES.itens, [...itens, { id: gerarId(), ...dados }]);
  }
}

export async function removerItem(id) {
  await exigirPerfil(PERFIS.ADMIN);

  // Não deixamos excluir um item que ainda está esperando aprovação
  const requisicoes = await lerLista(CHAVES.requisicoes);
  const temPendente = requisicoes.some((r) => r.itemId === id && r.status === STATUS.PENDENTE);
  if (temPendente) {
    throw new Error('Este item tem requisições pendentes. Aprove ou negue antes de excluir.');
  }

  const itens = await lerLista(CHAVES.itens);
  await salvarLista(CHAVES.itens, itens.filter((item) => item.id !== id));
}
