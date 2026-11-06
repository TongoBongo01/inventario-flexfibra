// Campo de formulário com rótulo em cima.
// Todas as outras props (value, onChangeText, placeholder...) vão direto para o TextInput.
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { CORES } from '../theme/cores';

export default function CampoTexto({ label, style, ...propsDoInput }) {
  return (
    <View style={styles.grupo}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, propsDoInput.multiline && styles.multilinha, style]}
        placeholderTextColor={CORES.textoSecundario}
        {...propsDoInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: CORES.texto, marginBottom: 6 },
  input: {
    backgroundColor: CORES.branco,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: CORES.texto,
  },
  multilinha: { minHeight: 90, textAlignVertical: 'top' },
});
