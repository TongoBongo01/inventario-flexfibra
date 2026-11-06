// Cartão de uma requisição. Os botões de ação (aprovar, negar, cancelar)
// são passados como "children" pela tela que usa o cartão.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Etiqueta from './Etiqueta';
import { CORES } from '../theme/cores';
import { INFO_STATUS, STATUS } from '../data/constantes';
import { formatarData } from '../utils/formatadores';

function Linha({ icone, texto, cor = CORES.textoSecundario }) {
  return (
    <View style={styles.linha}>
      <Ionicons name={icone} size={16} color={cor} />
      <Text style={[styles.textoLinha, { color: cor }]}>{texto}</Text>
    </View>
  );
}

// Texto que explica quem respondeu e quando
function textoResposta(requisicao) {
  const quando = formatarData(requisicao.respondidaEm);
  if (requisicao.status === STATUS.APROVADA) return `Aprovada por ${requisicao.respondidaPorNome} em ${quando}`;
  if (requisicao.status === STATUS.NEGADA) return `Negada por ${requisicao.respondidaPorNome} em ${quando}`;
  if (requisicao.status === STATUS.CANCELADA) return `Cancelada pelo técnico em ${quando}`;
  return '';
}

// Props:
//  requisicao       -> objeto da requisição
//  mostrarTecnico   -> exibe o nome de quem pediu (visão do administrador)
//  estoqueAtual     -> quantidade disponível hoje (visão do administrador)
export default function CardRequisicao({ requisicao, mostrarTecnico = false, estoqueAtual, children }) {
  const info = INFO_STATUS[requisicao.status];
  const pendente = requisicao.status === STATUS.PENDENTE;
  const estoqueInsuficiente = estoqueAtual !== undefined && estoqueAtual < requisicao.quantidade;

  return (
    <View style={styles.card}>
      <View style={styles.topo}>
        <Text style={styles.item}>{requisicao.itemNome}</Text>
        <Etiqueta texto={info.rotulo} tipo={info.tipo} />
      </View>

      <Text style={styles.quantidade}>
        {requisicao.quantidade} {requisicao.unidade}
      </Text>

      {mostrarTecnico ? <Linha icone="person-outline" texto={requisicao.tecnicoNome} /> : null}
      <Linha icone="time-outline" texto={`Pedido em ${formatarData(requisicao.criadaEm)}`} />

      {pendente && estoqueAtual !== undefined ? (
        <Linha
          icone={estoqueInsuficiente ? 'warning-outline' : 'cube-outline'}
          texto={`Em estoque agora: ${estoqueAtual} ${requisicao.unidade}`}
          cor={estoqueInsuficiente ? CORES.perigo : CORES.textoSecundario}
        />
      ) : null}

      {requisicao.observacao ? (
        <View style={styles.caixaTexto}>
          <Text style={styles.rotulo}>Observação do técnico</Text>
          <Text style={styles.observacao}>{requisicao.observacao}</Text>
        </View>
      ) : null}

      {!pendente ? <Linha icone="checkmark-done-outline" texto={textoResposta(requisicao)} /> : null}

      {requisicao.motivoNegacao ? (
        <View style={[styles.caixaTexto, styles.caixaMotivo]}>
          <Text style={[styles.rotulo, { color: CORES.perigo }]}>Motivo da negação</Text>
          <Text style={styles.observacao}>{requisicao.motivoNegacao}</Text>
        </View>
      ) : null}

      {children ? <View style={styles.acoes}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: CORES.branco,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  item: { flex: 1, fontSize: 16, fontWeight: 'bold', color: CORES.texto },
  quantidade: { fontSize: 22, fontWeight: 'bold', color: CORES.primaria, marginVertical: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  textoLinha: { fontSize: 14, marginLeft: 6, flexShrink: 1 },
  caixaTexto: { backgroundColor: CORES.fundo, borderRadius: 8, padding: 10, marginTop: 10 },
  caixaMotivo: { backgroundColor: CORES.perigoClaro },
  rotulo: { fontSize: 12, fontWeight: 'bold', color: CORES.textoSecundario, marginBottom: 2 },
  observacao: { fontSize: 14, color: CORES.texto },
  acoes: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
