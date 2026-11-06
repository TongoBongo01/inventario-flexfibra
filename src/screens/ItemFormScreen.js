// Arquivo: src/screens/ItemFormScreen.js
// Formulário do ADMINISTRADOR para criar ou editar um item.
// Sem parâmetro = novo item. Com { itemId } = edição.
import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import TelaFormulario from '../components/TelaFormulario';
import CampoTexto from '../components/CampoTexto';
import Chips from '../components/Chips';
import Botao from '../components/Botao';
import { CORES } from '../theme/cores';
import { CATEGORIAS, UNIDADES } from '../data/constantes';
import { obterItem, salvarItem, removerItem } from '../services/estoqueService';
import { confirmar, mostrarAviso } from '../utils/alertas';

const OPCOES_CATEGORIA = CATEGORIAS.map((c) => ({ valor: c, rotulo: c }));
const OPCOES_UNIDADE = UNIDADES.map((u) => ({ valor: u, rotulo: u }));

// Campo de texto vazio vira NaN, e o service recusa com uma mensagem clara
const paraNumero = (texto) => (texto === '' ? NaN : Number(texto));

export default function ItemFormScreen({ route, navigation }) {
  const itemId = route.params?.itemId;
  const editando = Boolean(itemId);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [unidade, setUnidade] = useState(UNIDADES[0]);
  const [quantidade, setQuantidade] = useState('0');
  const [estoqueMinimo, setEstoqueMinimo] = useState('0');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (editando) carregarItem();
  }, []);

  const carregarItem = async () => {
    const item = await obterItem(itemId);
    if (!item) {
      mostrarAviso('Ops!', 'Item não encontrado.');
      navigation.goBack();
      return;
    }
    setNome(item.nome);
    setCategoria(item.categoria);
    setUnidade(item.unidade);
    setQuantidade(String(item.quantidade));
    setEstoqueMinimo(String(item.estoqueMinimo));
  };

  const salvar = async () => {
    setErro('');
    setSalvando(true);
    try {
      await salvarItem({
        id: itemId,
        nome,
        categoria,
        unidade,
        quantidade: paraNumero(quantidade),
        estoqueMinimo: paraNumero(estoqueMinimo),
      });
      navigation.goBack();
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  };

  const excluir = async () => {
    const ok = await confirmar('Excluir item', `Deseja excluir "${nome}" do estoque?`, 'Excluir');
    if (!ok) return;
    try {
      await removerItem(itemId);
      navigation.goBack();
    } catch (e) {
      mostrarAviso('Não foi possível excluir', e.message);
    }
  };

  // Aceita só dígitos nos campos numéricos
  const somenteNumeros = (setter) => (texto) => setter(texto.replace(/\D/g, ''));

  return (
    <TelaFormulario>
      <CampoTexto label="Nome do item" placeholder="Ex.: ONU GPON Wi-Fi" value={nome} onChangeText={setNome} />

      <Text style={styles.label}>Categoria</Text>
      <Chips opcoes={OPCOES_CATEGORIA} selecionado={categoria} onSelecionar={setCategoria} quebrarLinha />

      <Text style={styles.label}>Unidade de medida</Text>
      <Chips opcoes={OPCOES_UNIDADE} selecionado={unidade} onSelecionar={setUnidade} quebrarLinha />

      <View style={styles.linha}>
        <View style={styles.coluna}>
          <CampoTexto
            label="Quantidade em estoque"
            keyboardType="numeric"
            value={quantidade}
            onChangeText={somenteNumeros(setQuantidade)}
            maxLength={7}
          />
        </View>
        <View style={styles.coluna}>
          <CampoTexto
            label="Estoque mínimo"
            keyboardType="numeric"
            value={estoqueMinimo}
            onChangeText={somenteNumeros(setEstoqueMinimo)}
            maxLength={7}
          />
        </View>
      </View>
      <Text style={styles.dica}>
        Quando a quantidade chegar no estoque mínimo, o item aparece como "Estoque baixo".
      </Text>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Botao titulo={editando ? 'Salvar alterações' : 'Cadastrar item'} icone="save" onPress={salvar} carregando={salvando} />

      {editando ? (
        <Botao titulo="Excluir item" icone="trash" variante="contornoPerigo" onPress={excluir} style={styles.botaoExcluir} />
      ) : null}
    </TelaFormulario>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: 'bold', color: CORES.texto, marginBottom: 8 },
  linha: { flexDirection: 'row', gap: 12 },
  coluna: { flex: 1 },
  dica: { fontSize: 13, color: CORES.textoSecundario, marginBottom: 20, marginTop: -6 },
  erro: { color: CORES.perigo, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  botaoExcluir: { marginTop: 12 },
});
