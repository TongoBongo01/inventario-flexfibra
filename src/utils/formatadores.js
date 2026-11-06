// Funções auxiliares para exibir dados na tela.

// Completa com zero à esquerda: 5 -> "05"
const doisDigitos = (numero) => String(numero).padStart(2, '0');

// "2026-09-21T14:05:00.000Z" -> "21/09/2026 às 11:05" (no fuso do celular)
export function formatarData(dataIso) {
  if (!dataIso) return '';
  const data = new Date(dataIso);
  const dia = doisDigitos(data.getDate());
  const mes = doisDigitos(data.getMonth() + 1);
  const hora = doisDigitos(data.getHours());
  const minuto = doisDigitos(data.getMinutes());
  return `${dia}/${mes}/${data.getFullYear()} às ${hora}:${minuto}`;
}

// "Carlos Lima" -> "CL"
export function iniciais(nome) {
  const partes = nome.trim().split(' ').filter((parte) => parte !== '');
  const primeira = partes[0] ? partes[0][0] : '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

// "Carlos Lima" -> "Carlos"
export function primeiroNome(nome) {
  return nome.trim().split(' ')[0];
}
