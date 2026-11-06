// Dados de exemplo gravados na PRIMEIRA vez que o app é aberto.
// Assim o app já começa com usuários, estoque e algumas requisições para testar.
import { PERFIS, STATUS } from './constantes';

// As senhas aqui são só para demonstração.
// Ao salvar, o app guarda apenas o HASH da senha (ver authService.js).
export const USUARIOS_INICIAIS = [
  { id: 'u-admin', nome: 'Ana Souza', email: 'admin@flexfibra.com', senha: 'admin123', perfil: PERFIS.ADMIN },
  { id: 'u-carlos', nome: 'Carlos Lima', email: 'tecnico@flexfibra.com', senha: 'tecnico123', perfil: PERFIS.TECNICO },
  { id: 'u-bruno', nome: 'Bruno Alves', email: 'bruno@flexfibra.com', senha: 'tecnico123', perfil: PERFIS.TECNICO },
];

export const ITENS_INICIAIS = [
  { id: 'i-onu', nome: 'ONU GPON Wi-Fi', categoria: 'Equipamentos', unidade: 'un', quantidade: 25, estoqueMinimo: 5 },
  { id: 'i-roteador', nome: 'Roteador Wi-Fi 6', categoria: 'Equipamentos', unidade: 'un', quantidade: 4, estoqueMinimo: 5 },
  { id: 'i-drop', nome: 'Cabo Drop Flat 1FO', categoria: 'Cabos', unidade: 'm', quantidade: 2000, estoqueMinimo: 300 },
  { id: 'i-cat6', nome: 'Cabo de Rede CAT6', categoria: 'Cabos', unidade: 'm', quantidade: 500, estoqueMinimo: 100 },
  { id: 'i-patch', nome: 'Patch Cord SC/APC 1,5m', categoria: 'Cabos', unidade: 'un', quantidade: 60, estoqueMinimo: 10 },
  { id: 'i-conector-sc', nome: 'Conector Rápido SC/APC', categoria: 'Conectores', unidade: 'un', quantidade: 280, estoqueMinimo: 50 },
  { id: 'i-rj45', nome: 'Conector RJ45 CAT6', categoria: 'Conectores', unidade: 'un', quantidade: 200, estoqueMinimo: 50 },
  { id: 'i-splitter', nome: 'Splitter Óptico 1x8', categoria: 'Acessórios', unidade: 'un', quantidade: 15, estoqueMinimo: 5 },
  { id: 'i-cto', nome: 'Caixa de Terminação Óptica (CTO)', categoria: 'Acessórios', unidade: 'un', quantidade: 0, estoqueMinimo: 3 },
  { id: 'i-esticador', nome: 'Esticador de Drop', categoria: 'Acessórios', unidade: 'un', quantidade: 150, estoqueMinimo: 30 },
  { id: 'i-fita', nome: 'Fita Isolante', categoria: 'Acessórios', unidade: 'rolo', quantidade: 40, estoqueMinimo: 10 },
  { id: 'i-alicate', nome: 'Alicate de Crimpar RJ45', categoria: 'Ferramentas', unidade: 'un', quantidade: 6, estoqueMinimo: 2 },
  { id: 'i-clivador', nome: 'Clivador de Fibra', categoria: 'Ferramentas', unidade: 'un', quantidade: 3, estoqueMinimo: 1 },
  { id: 'i-powermeter', nome: 'Power Meter Óptico', categoria: 'Ferramentas', unidade: 'un', quantidade: 2, estoqueMinimo: 1 },
];

// Gera uma data "X horas atrás" no formato ISO
const horasAtras = (horas) => new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

// É uma função (e não uma constante) para que as datas sejam calculadas na hora de gravar
export const criarRequisicoesIniciais = () => [
  {
    id: 'r-1', itemId: 'i-onu', itemNome: 'ONU GPON Wi-Fi', unidade: 'un', quantidade: 2,
    observacao: 'OS 4821 - instalação residencial', tecnicoId: 'u-carlos', tecnicoNome: 'Carlos Lima',
    status: STATUS.PENDENTE, criadaEm: horasAtras(1),
    respondidaEm: null, respondidaPorNome: null, motivoNegacao: '',
  },
  {
    id: 'r-2', itemId: 'i-drop', itemNome: 'Cabo Drop Flat 1FO', unidade: 'm', quantidade: 150,
    observacao: 'Troca de drop rompido', tecnicoId: 'u-bruno', tecnicoNome: 'Bruno Alves',
    status: STATUS.PENDENTE, criadaEm: horasAtras(3),
    respondidaEm: null, respondidaPorNome: null, motivoNegacao: '',
  },
  {
    id: 'r-3', itemId: 'i-conector-sc', itemNome: 'Conector Rápido SC/APC', unidade: 'un', quantidade: 20,
    observacao: 'Reposição da maleta', tecnicoId: 'u-carlos', tecnicoNome: 'Carlos Lima',
    status: STATUS.APROVADA, criadaEm: horasAtras(26),
    respondidaEm: horasAtras(25), respondidaPorNome: 'Ana Souza', motivoNegacao: '',
  },
  {
    id: 'r-4', itemId: 'i-powermeter', itemNome: 'Power Meter Óptico', unidade: 'un', quantidade: 1,
    observacao: '', tecnicoId: 'u-bruno', tecnicoNome: 'Bruno Alves',
    status: STATUS.NEGADA, criadaEm: horasAtras(50),
    respondidaEm: horasAtras(48), respondidaPorNome: 'Ana Souza',
    motivoNegacao: 'Equipamento em calibração. Use o da base.',
  },
];
