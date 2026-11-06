// Grupo de "pílulas" selecionáveis (usado em filtros e em formulários).
// opcoes: [{ valor: 'pendente', rotulo: 'Pendentes' }, ...]
import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CORES } from '../theme/cores';

export default function Chips({ opcoes, selecionado, onSelecionar, quebrarLinha = false }) {
  const pilulas = opcoes.map((opcao) => {
    const ativo = opcao.valor === selecionado;
    return (
      <TouchableOpacity
        key={opcao.valor}
        style={[styles.chip, ativo && styles.chipAtivo]}
        onPress={() => onSelecionar(opcao.valor)}
        accessibilityState={{ selected: ativo }}
      >
        <Text style={[styles.texto, ativo && styles.textoAtivo]}>{opcao.rotulo}</Text>
      </TouchableOpacity>
    );
  });

  // Em formulários as pílulas quebram linha; em filtros, rolam para o lado
  if (quebrarLinha) {
    return <View style={styles.grade}>{pilulas}</View>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.rolagem}
      contentContainerStyle={styles.linha}
    >
      {pilulas}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // No Android, um ScrollView pode encolher quando a lista de baixo é grande.
  // flexShrink: 0 garante que a barra de filtros mantenha a altura certa.
  rolagem: { flexGrow: 0, flexShrink: 0 },
  linha: { paddingHorizontal: 16, gap: 8 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    backgroundColor: CORES.branco,
  },
  chipAtivo: { backgroundColor: CORES.primaria, borderColor: CORES.primaria },
  texto: { color: CORES.texto, fontSize: 14 },
  textoAtivo: { color: CORES.branco, fontWeight: 'bold' },
});
