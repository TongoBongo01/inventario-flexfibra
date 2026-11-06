// Pequena etiqueta colorida (ex.: "Pendente", "Estoque baixo", "Administrador").
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CORES } from '../theme/cores';

const TIPOS = {
  sucesso: { fundo: CORES.sucessoClaro, texto: CORES.sucesso },
  perigo: { fundo: CORES.perigoClaro, texto: CORES.perigo },
  alerta: { fundo: CORES.alertaClaro, texto: CORES.alerta },
  info: { fundo: CORES.primariaClara, texto: CORES.primaria },
  neutro: { fundo: CORES.cinzaClaro, texto: CORES.textoSecundario },
};

export default function Etiqueta({ texto, tipo = 'neutro' }) {
  const cores = TIPOS[tipo];
  return (
    <View style={[styles.etiqueta, { backgroundColor: cores.fundo }]}>
      <Text style={[styles.texto, { color: cores.texto }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  etiqueta: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
  texto: { fontSize: 12, fontWeight: 'bold' },
});
