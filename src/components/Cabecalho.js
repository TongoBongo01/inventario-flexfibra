// Cabeçalho azul usado no topo das telas das abas.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CORES } from '../theme/cores';

// Props: titulo, subtitulo (opcional), icone + onPressIcone (botão opcional à direita)
export default function Cabecalho({ titulo, subtitulo, icone, onPressIcone, rotuloIcone }) {
  return (
    // edges={['top']}: protege só o topo (a barra de abas já cuida da parte de baixo)
    <SafeAreaView edges={['top']} style={styles.area}>
      <View style={styles.conteudo}>
        <View style={styles.textos}>
          <Text style={styles.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        </View>

        {icone ? (
          <TouchableOpacity
            style={styles.botao}
            onPress={onPressIcone}
            accessibilityLabel={rotuloIcone}
          >
            <Ionicons name={icone} size={24} color={CORES.primaria} />
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  area: { backgroundColor: CORES.primaria },
  conteudo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 18 },
  textos: { flex: 1 },
  titulo: { color: CORES.branco, fontSize: 24, fontWeight: 'bold' },
  subtitulo: { color: '#BBDEFB', fontSize: 14, marginTop: 4 },
  botao: {
    backgroundColor: CORES.branco,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
