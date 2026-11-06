// Botão reutilizável com variações de cor.
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CORES } from '../theme/cores';

const VARIANTES = {
  primario: { fundo: CORES.primaria, texto: CORES.branco, borda: CORES.primaria },
  sucesso: { fundo: CORES.sucesso, texto: CORES.branco, borda: CORES.sucesso },
  perigo: { fundo: CORES.perigo, texto: CORES.branco, borda: CORES.perigo },
  contorno: { fundo: CORES.branco, texto: CORES.primaria, borda: CORES.primaria },
  contornoPerigo: { fundo: CORES.branco, texto: CORES.perigo, borda: CORES.perigo },
};

export default function Botao({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  carregando = false,
  desabilitado = false,
  pequeno = false,
  style,
}) {
  const cores = VARIANTES[variante];
  const inativo = carregando || desabilitado;

  return (
    <TouchableOpacity
      style={[
        styles.botao,
        pequeno && styles.pequeno,
        { backgroundColor: cores.fundo, borderColor: cores.borda },
        inativo && styles.inativo,
        style,
      ]}
      onPress={onPress}
      disabled={inativo}
      activeOpacity={0.8}
    >
      {carregando ? (
        <ActivityIndicator color={cores.texto} />
      ) : (
        <>
          {icone ? <Ionicons name={icone} size={pequeno ? 16 : 20} color={cores.texto} style={styles.icone} /> : null}
          <Text style={[styles.texto, pequeno && styles.textoPequeno, { color: cores.texto }]}>{titulo}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    minHeight: 52,
  },
  pequeno: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 40 },
  inativo: { opacity: 0.5 },
  icone: { marginRight: 6 },
  texto: { fontWeight: 'bold', fontSize: 16 },
  textoPequeno: { fontSize: 14 },
});
