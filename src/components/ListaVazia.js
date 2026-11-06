// Aviso mostrado quando uma lista não tem nada para exibir.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CORES } from '../theme/cores';

export default function ListaVazia({ icone = 'file-tray-outline', mensagem }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icone} size={48} color="#BDC3C7" />
      <Text style={styles.texto}>{mensagem}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginTop: 50, paddingHorizontal: 30 },
  texto: { textAlign: 'center', color: CORES.textoSecundario, fontSize: 16, marginTop: 12 },
});
