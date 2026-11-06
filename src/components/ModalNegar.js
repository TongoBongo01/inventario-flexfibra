// Janela para o administrador informar o motivo ao negar uma requisição.
// (O Alert com campo de texto só existe no iPhone, por isso usamos um Modal.)
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, KeyboardAvoidingView } from 'react-native';
import CampoTexto from './CampoTexto';
import Botao from './Botao';
import { CORES } from '../theme/cores';

export default function ModalNegar({ requisicao, onCancelar, onConfirmar }) {
  const [motivo, setMotivo] = useState('');

  // Sempre que abrir para uma nova requisição, limpa o campo
  useEffect(() => {
    setMotivo('');
  }, [requisicao]);

  return (
    <Modal visible={requisicao !== null} transparent animationType="fade" onRequestClose={onCancelar}>
      <KeyboardAvoidingView style={styles.fundo} behavior="padding">
        <View style={styles.caixa}>
          <Text style={styles.titulo}>Negar requisição</Text>
          {requisicao ? (
            <Text style={styles.resumo}>
              {requisicao.quantidade} {requisicao.unidade} de {requisicao.itemNome} para{' '}
              {requisicao.tecnicoNome}
            </Text>
          ) : null}

          <CampoTexto
            label="Motivo (opcional)"
            placeholder="Ex.: material reservado para outra obra"
            value={motivo}
            onChangeText={setMotivo}
            multiline
          />

          <View style={styles.botoes}>
            <Botao titulo="Voltar" variante="contorno" onPress={onCancelar} style={styles.botao} />
            <Botao titulo="Negar" variante="perigo" onPress={() => onConfirmar(motivo)} style={styles.botao} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  caixa: { backgroundColor: CORES.branco, borderRadius: 12, padding: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  titulo: { fontSize: 20, fontWeight: 'bold', color: CORES.texto, marginBottom: 6 },
  resumo: { fontSize: 15, color: CORES.textoSecundario, marginBottom: 16 },
  botoes: { flexDirection: 'row', gap: 10 },
  botao: { flex: 1 },
});
