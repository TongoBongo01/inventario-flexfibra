// Barra de pesquisa com ícone de lupa e botão para limpar.
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CORES } from '../theme/cores';

export default function CampoBusca({ valor, onAlterar, placeholder }) {
  return (
    <View style={styles.caixa}>
      <Ionicons name="search" size={20} color={CORES.textoSecundario} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={CORES.textoSecundario}
        value={valor}
        onChangeText={onAlterar}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {valor !== '' ? (
        <TouchableOpacity onPress={() => onAlterar('')} accessibilityLabel="Limpar busca">
          <Ionicons name="close-circle" size={20} color={CORES.textoSecundario} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.branco,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, fontSize: 16, marginLeft: 8, color: CORES.texto, height: '100%' },
});
