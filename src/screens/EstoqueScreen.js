// Arquivo: src/screens/EstoqueScreen.js
// Visão do TÉCNICO: consulta o estoque e escolhe um item para requisitar.
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Cabecalho from '../components/Cabecalho';
import CampoBusca from '../components/CampoBusca';
import Chips from '../components/Chips';
import CardItem from '../components/CardItem';
import ListaVazia from '../components/ListaVazia';
import { CORES } from '../theme/cores';
import { CATEGORIAS } from '../data/constantes';
import { listarItens } from '../services/estoqueService';
import { obterUsuarioLogado } from '../services/authService';
import { mostrarAviso } from '../utils/alertas';
import { primeiroNome } from '../utils/formatadores';

const OPCOES_CATEGORIA = [
  { valor: 'Todas', rotulo: 'Todas' },
  ...CATEGORIAS.map((categoria) => ({ valor: categoria, rotulo: categoria })),
];

export default function EstoqueScreen({ navigation }) {
  const [itens, setItens] = useState([]);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [atualizando, setAtualizando] = useState(false);

  const carregar = async () => {
    try {
      const [lista, usuario] = await Promise.all([listarItens(), obterUsuarioLogado()]);
      setItens(lista);
      if (usuario) setNomeUsuario(primeiroNome(usuario.nome));
    } catch (e) {
      mostrarAviso('Erro', 'Não foi possível carregar o estoque.');
    }
  };

  // useFocusEffect: recarrega sempre que a tela aparece
  // (ex.: ao voltar depois de um administrador aprovar algo)
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  // "Puxar para atualizar"
  const atualizar = async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  };

  // OPERAÇÃO: filtra por categoria e pelo texto digitado
  const itensFiltrados = itens.filter(
    (item) =>
      (categoria === 'Todas' || item.categoria === categoria) &&
      item.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Cabecalho
        titulo="Estoque"
        subtitulo={nomeUsuario ? `Olá, ${nomeUsuario}! Toque em um item para requisitar.` : ''}
      />

      <View style={styles.busca}>
        <CampoBusca valor={busca} onAlterar={setBusca} placeholder="Buscar item (ex.: ONU, drop...)" />
      </View>
      <Chips opcoes={OPCOES_CATEGORIA} selecionado={categoria} onSelecionar={setCategoria} />

      <FlatList
        data={itensFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardItem
            item={item}
            desabilitado={item.quantidade <= 0}
            onPress={() => navigation.navigate('NovaRequisicao', { itemId: item.id })}
          />
        )}
        ListEmptyComponent={<ListaVazia icone="search-outline" mensagem="Nenhum item encontrado." />}
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
  lista: { paddingTop: 12, paddingBottom: 20 },
});
