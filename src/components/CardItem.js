// Cartão de um item do estoque (usado pelo técnico e pelo administrador).
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Etiqueta from './Etiqueta';
import { CORES } from '../theme/cores';
import { ICONES_CATEGORIA } from '../data/constantes';
import { estaComEstoqueBaixo } from '../services/estoqueService';

export default function CardItem({ item, onPress, desabilitado = false }) {
  const semEstoque = item.quantidade <= 0;
  const estoqueBaixo = !semEstoque && estaComEstoqueBaixo(item);

  let corQuantidade = CORES.sucesso;
  if (semEstoque) corQuantidade = CORES.perigo;
  else if (estoqueBaixo) corQuantidade = CORES.alerta;

  return (
    <TouchableOpacity
      style={[styles.card, desabilitado && styles.desabilitado]}
      onPress={onPress}
      disabled={desabilitado || !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.icone}>
        <Ionicons name={ICONES_CATEGORIA[item.categoria] || 'cube-outline'} size={26} color={CORES.primaria} />
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.categoria}>{item.categoria}</Text>
        <View style={styles.linha}>
          <Text style={[styles.quantidade, { color: corQuantidade }]}>
            {item.quantidade} {item.unidade}
          </Text>
          {semEstoque ? <Etiqueta texto="Sem estoque" tipo="perigo" /> : null}
          {estoqueBaixo ? <Etiqueta texto="Estoque baixo" tipo="alerta" /> : null}
        </View>
      </View>

      {onPress && !desabilitado ? (
        <Ionicons name="chevron-forward" size={22} color={CORES.textoSecundario} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.branco,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  desabilitado: { opacity: 0.6 },
  icone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CORES.primariaClara,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  nome: { fontSize: 16, fontWeight: 'bold', color: CORES.texto },
  categoria: { fontSize: 13, color: CORES.textoSecundario, marginTop: 2 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  quantidade: { fontSize: 15, fontWeight: 'bold' },
});
