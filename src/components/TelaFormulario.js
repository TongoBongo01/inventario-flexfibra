// Tela de formulário que "sobe" quando o teclado aparece.
// Usada pelas telas abertas por cima das abas (que têm o cabeçalho azul da pilha).
import React from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { CORES } from '../theme/cores';

export default function TelaFormulario({ children }) {
  // O KeyboardAvoidingView mede a tela a partir de baixo do cabeçalho,
  // então precisa saber a altura dele para calcular quanto o teclado cobre.
  const alturaCabecalho = useHeaderHeight();

  return (
    // behavior="padding" nas duas plataformas: no Expo SDK 54 o Android desenha
    // a tela até as bordas (edge-to-edge) e não redimensiona mais sozinho com o teclado.
    <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={alturaCabecalho}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  conteudo: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
});
