// Arquivo: src/screens/NovaRequisicaoScreen.js
// O técnico escolhe a quantidade e envia o pedido para aprovação.
// Recebe o id do item pela rota: navigation.navigate('NovaRequisicao', { itemId })
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TelaFormulario from '../components/TelaFormulario';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';
import { CORES } from '../theme/cores';
import { ICONES_CATEGORIA } from '../data/constantes';
import { obterItem } from '../services/estoqueService';
import { criarRequisicao } from '../services/requisicoesService';
import { mostrarAviso } from '../utils/alertas';

export default function NovaRequisicaoScreen({ route, navigation }) {
  const { itemId } = route.params;

  const [item, setItem] = useState(null);
  const [quantidade, setQuantidade] = useState('1');
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarItem();
  }, []);

  const carregarItem = async () => {
    const encontrado = await obterItem(itemId);
    if (!encontrado) {
      mostrarAviso('Ops!', 'Este item não existe mais no estoque.');
      navigation.goBack();
      return;
    }
    setItem(encontrado);
  };

  // Botões "-" e "+": mantêm a quantidade entre 1 e o disponível
  const alterarQuantidade = (diferenca) => {
    const atual = parseInt(quantidade, 10) || 0;
    const nova = Math.min(Math.max(atual + diferenca, 1), item.quantidade);
    setQuantidade(String(nova));
  };

  const enviar = async () => {
    const numero = parseInt(quantidade, 10);
    if (!numero || numero <= 0) {
      setErro('Informe uma quantidade maior que zero.');
      return;
    }
    if (numero > item.quantidade) {
      setErro(`Só há ${item.quantidade} ${item.unidade} disponíveis.`);
      return;
    }

    setErro('');
    setEnviando(true);
    try {
      await criarRequisicao({ itemId, quantidade: numero, observacao });
      mostrarAviso(
        'Requisição enviada!',
        'Agora é só aguardar a resposta de um administrador. Acompanhe na aba "Requisições".'
      );
      navigation.goBack();
    } catch (e) {
      setErro(e.message);
      setEnviando(false);
    }
  };

  if (!item) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={CORES.primaria} />
      </View>
    );
  }

  return (
    <TelaFormulario>
      <View style={styles.resumo}>
        <View style={styles.icone}>
          <Ionicons name={ICONES_CATEGORIA[item.categoria] || 'cube-outline'} size={30} color={CORES.primaria} />
        </View>
        <Text style={styles.nome}>{item.nome}</Text>
        <Text style={styles.categoria}>{item.categoria}</Text>
        <Text style={styles.disponivel}>
          Disponível: <Text style={styles.negrito}>{item.quantidade} {item.unidade}</Text>
        </Text>
      </View>

      <Text style={styles.label}>Quantidade ({item.unidade})</Text>
      <View style={styles.contador}>
        <TouchableOpacity style={styles.botaoContador} onPress={() => alterarQuantidade(-1)} accessibilityLabel="Diminuir">
          <Ionicons name="remove" size={26} color={CORES.primaria} />
        </TouchableOpacity>
        <TextInput
          style={styles.inputQuantidade}
          keyboardType="numeric"
          value={quantidade}
          // Aceita só números
          onChangeText={(texto) => setQuantidade(texto.replace(/\D/g, ''))}
          maxLength={6}
        />
        <TouchableOpacity style={styles.botaoContador} onPress={() => alterarQuantidade(1)} accessibilityLabel="Aumentar">
          <Ionicons name="add" size={26} color={CORES.primaria} />
        </TouchableOpacity>
      </View>

      <CampoTexto
        label="Observação (opcional)"
        placeholder="Ex.: OS 1234 - instalação na Rua das Flores"
        value={observacao}
        onChangeText={setObservacao}
        multiline
      />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Botao titulo="Enviar requisição" icone="send" onPress={enviar} carregando={enviando} />
    </TelaFormulario>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CORES.fundo },
  resumo: { backgroundColor: CORES.branco, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 24, elevation: 2 },
  icone: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: CORES.primariaClara,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  nome: { fontSize: 20, fontWeight: 'bold', color: CORES.texto, textAlign: 'center' },
  categoria: { fontSize: 14, color: CORES.textoSecundario, marginTop: 2 },
  disponivel: { fontSize: 16, color: CORES.texto, marginTop: 10 },
  negrito: { fontWeight: 'bold', color: CORES.sucesso },
  label: { fontSize: 14, fontWeight: 'bold', color: CORES.texto, marginBottom: 6 },
  contador: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  botaoContador: {
    width: 52,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: CORES.primaria,
    backgroundColor: CORES.branco,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputQuantidade: {
    flex: 1,
    height: 52,
    marginHorizontal: 10,
    backgroundColor: CORES.branco,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: CORES.texto,
  },
  erro: { color: CORES.perigo, fontSize: 14, marginBottom: 12, textAlign: 'center' },
});
