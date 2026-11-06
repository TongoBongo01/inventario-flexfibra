// Requisições de material: o técnico pede, o administrador aprova ou nega.
import { CHAVES, lerLista, salvarLista, gerarId } from './armazenamento';
import { exigirPerfil, obterUsuarioLogado } from './authService';
import { PERFIS, STATUS } from '../data/constantes';

// Datas em formato ISO podem ser comparadas como texto
const maisRecentesPrimeiro = (a, b) => b.criadaEm.localeCompare(a.criadaEm);

// Só dá para responder/cancelar uma requisição que ainda está pendente
function garantirPendente(requisicao) {
  if (!requisicao) {
    throw new Error('Requisição não encontrada.');
  }
  if (requisicao.status !== STATUS.PENDENTE) {
    throw new Error('Esta requisição já foi respondida.');
  }
}

// ---------- TÉCNICO ----------

export async function criarRequisicao({ itemId, quantidade, observacao }) {
  const tecnico = await exigirPerfil(PERFIS.TECNICO);

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    throw new Error('Informe uma quantidade válida.');
  }

  const itens = await lerLista(CHAVES.itens);
  const item = itens.find((i) => i.id === itemId);
  if (!item) {
    throw new Error('Item não encontrado no estoque.');
  }
  if (quantidade > item.quantidade) {
    throw new Error(`Quantidade indisponível. Em estoque: ${item.quantidade} ${item.unidade}.`);
  }

  const novaRequisicao = {
    id: gerarId(),
    itemId: item.id,
    itemNome: item.nome,
    unidade: item.unidade,
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
  const requisicoes = await lerLista(CHAVES.requisicoes);
  await salvarLista(CHAVES.requisicoes, [...requisicoes, novaRequisicao]);
  return novaRequisicao;
}

export async function listarMinhasRequisicoes() {
  const usuario = await obterUsuarioLogado();
  if (!usuario) {
    throw new Error('Sua sessão expirou. Faça login novamente.');
  }
  const requisicoes = await lerLista(CHAVES.requisicoes);
  return requisicoes.filter((r) => r.tecnicoId === usuario.id).sort(maisRecentesPrimeiro);
}

export async function cancelarRequisicao(id) {
  const tecnico = await exigirPerfil(PERFIS.TECNICO);
  const requisicoes = await lerLista(CHAVES.requisicoes);
  const requisicao = requisicoes.find((r) => r.id === id);

  garantirPendente(requisicao);
  if (requisicao.tecnicoId !== tecnico.id) {
    throw new Error('Você só pode cancelar as suas próprias requisições.');
  }

  const atualizadas = requisicoes.map((r) =>
    r.id === id ? { ...r, status: STATUS.CANCELADA, respondidaEm: new Date().toISOString() } : r
  );
  await salvarLista(CHAVES.requisicoes, atualizadas);
}

// ---------- ADMINISTRADOR ----------

export async function listarTodasRequisicoes() {
  await exigirPerfil(PERFIS.ADMIN);
  const requisicoes = await lerLista(CHAVES.requisicoes);
  return requisicoes.sort(maisRecentesPrimeiro);
}

export async function aprovarRequisicao(id) {
  const admin = await exigirPerfil(PERFIS.ADMIN);
  const requisicoes = await lerLista(CHAVES.requisicoes);
  const requisicao = requisicoes.find((r) => r.id === id);
  garantirPendente(requisicao);

  // Confere o estoque no momento da aprovação (ele pode ter mudado desde o pedido)
  const itens = await lerLista(CHAVES.itens);
  const item = itens.find((i) => i.id === requisicao.itemId);
  if (!item) {
    throw new Error('O item desta requisição não existe mais no estoque.');
  }
  if (item.quantidade < requisicao.quantidade) {
    throw new Error(
      `Estoque insuficiente: há apenas ${item.quantidade} ${item.unidade} de ${item.nome}.`
    );
  }

  // 1) Dá baixa no estoque
  const itensAtualizados = itens.map((i) =>
    i.id === item.id ? { ...i, quantidade: i.quantidade - requisicao.quantidade } : i
  );
  await salvarLista(CHAVES.itens, itensAtualizados);

  // 2) Marca a requisição como aprovada
  const requisicoesAtualizadas = requisicoes.map((r) =>
    r.id === id
      ? {
          ...r,
          status: STATUS.APROVADA,
          respondidaEm: new Date().toISOString(),
          respondidaPorNome: admin.nome,
        }
      : r
  );
  await salvarLista(CHAVES.requisicoes, requisicoesAtualizadas);
}

export async function negarRequisicao(id, motivo) {
  const admin = await exigirPerfil(PERFIS.ADMIN);
  const requisicoes = await lerLista(CHAVES.requisicoes);
  const requisicao = requisicoes.find((r) => r.id === id);
  garantirPendente(requisicao);

  const atualizadas = requisicoes.map((r) =>
    r.id === id
      ? {
          ...r,
          status: STATUS.NEGADA,
          respondidaEm: new Date().toISOString(),
          respondidaPorNome: admin.nome,
          motivoNegacao: (motivo || '').trim(),
        }
      : r
  );
  await salvarLista(CHAVES.requisicoes, atualizadas);
}
