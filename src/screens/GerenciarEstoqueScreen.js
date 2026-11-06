// Arquivo: src/screens/GerenciarEstoqueScreen.js
// Visão do ADMINISTRADOR: cadastra, edita e acompanha os itens do estoque.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Cabecalho from '../components/Cabecalho';
import CampoBusca from '../components/CampoBusca';
import Chips from '../components/Chips';
import CardItem from '../components/CardItem';
import ListaVazia from '../components/ListaVazia';
import { CORES } from '../theme/cores';
import { CATEGORIAS } from '../data/constantes';
import { listarItens, estaComEstoqueBaixo } from '../services/estoqueService';
import { mostrarAviso } from '../utils/alertas';

const FILTRO_BAIXO = 'baixo';

const OPCOES_FILTRO = [
  { valor: 'Todas', rotulo: 'Todas' },
  { valor: FILTRO_BAIXO, rotulo: 'Estoque baixo' },
  ...CATEGORIAS.map((categoria) => ({ valor: categoria, rotulo: categoria })),
];

export default function GerenciarEstoqueScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  const [atualizando, setAtualizando] = useState(false);

  const carregar = async () => {
    try {
      setItens(await listarItens());
    } catch (e) {
      mostrarAviso('Erro', 'Não foi possível carregar o estoque.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const atualizar = async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  };

  const passaNoFiltro = (item) => {
    if (filtro === 'Todas') return true;
    if (filtro === FILTRO_BAIXO) return estaComEstoqueBaixo(item);
    return item.categoria === filtro;
  };

  const itensFiltrados = itens.filter(
    (item) => passaNoFiltro(item) && item.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalBaixo = itens.filter(estaComEstoqueBaixo).length;

  return (
    <View style={styles.container}>
      <Cabecalho
        titulo="Gerenciar estoque"
        subtitulo={`${itens.length} itens cadastrados`}
        icone="add"
        rotuloIcone="Cadastrar novo item"
        onPressIcone={() => navigation.navigate('ItemForm')}
      />

      <View style={styles.busca}>
        <CampoBusca valor={busca} onAlterar={setBusca} placeholder="Buscar item..." />
        {totalBaixo > 0 ? (
          <Text style={styles.alerta}>
            ⚠️ {totalBaixo} {totalBaixo === 1 ? 'item está' : 'itens estão'} com estoque baixo ou zerado.
          </Text>
        ) : null}
      </View>
      <Chips opcoes={OPCOES_FILTRO} selecionado={filtro} onSelecionar={setFiltro} />

      <FlatList
        data={itensFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardItem item={item} onPress={() => navigation.navigate('ItemForm', { itemId: item.id })} />
        )}
        ListEmptyComponent={<ListaVazia icone="cube-outline" mensagem="Nenhum item encontrado." />}
        contentContainerStyle={styles.lista}
        refreshing={atualizando}
        onRefresh={atualizar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  busca: { padding: 16, paddingBottom: 12 },
  alerta: { color: CORES.alerta, fontSize: 13, marginTop: 10, fontWeight: 'bold' },
  lista: { paddingTop: 12, paddingBottom: 20 },
});
