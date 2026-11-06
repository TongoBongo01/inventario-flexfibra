// Valores fixos usados em várias partes do app.

// Perfis de acesso
export const PERFIS = {
  ADMIN: 'admin',
  TECNICO: 'tecnico',
};

export const NOMES_PERFIS = {
  admin: 'Administrador',
  tecnico: 'Técnico',
};

// Situações possíveis de uma requisição
export const STATUS = {
  PENDENTE: 'pendente',
  APROVADA: 'aprovada',
  NEGADA: 'negada',
  CANCELADA: 'cancelada',
};

// Como cada situação aparece na tela (texto e cor da etiqueta)
export const INFO_STATUS = {
  pendente: { rotulo: 'Pendente', tipo: 'alerta' },
  aprovada: { rotulo: 'Aprovada', tipo: 'sucesso' },
  negada: { rotulo: 'Negada', tipo: 'perigo' },
  cancelada: { rotulo: 'Cancelada', tipo: 'neutro' },
};

// Categorias e unidades dos itens do estoque
export const CATEGORIAS = ['Equipamentos', 'Cabos', 'Conectores', 'Acessórios', 'Ferramentas'];

export const UNIDADES = ['un', 'm', 'rolo', 'cx'];

// Ícone (Ionicons) de cada categoria
export const ICONES_CATEGORIA = {
  Equipamentos: 'hardware-chip-outline',
  Cabos: 'git-commit-outline',
  Conectores: 'link-outline',
  Acessórios: 'extension-puzzle-outline',
  Ferramentas: 'construct-outline',
};
