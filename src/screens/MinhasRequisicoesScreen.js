// Arquivo: src/screens/MinhasRequisicoesScreen.js
// Visão do TÉCNICO: acompanha os próprios pedidos e pode cancelar os pendentes.
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Cabecalho from '../components/Cabecalho';
import Chips from '../components/Chips';
import CardRequisicao from '../components/CardRequisicao';
import Botao from '../components/Botao';
import ListaVazia from '../components/ListaVazia';
import { CORES } from '../theme/cores';
import { STATUS } from '../data/constantes';
import { listarMinhasRequisicoes, cancelarRequisicao } from '../services/requisicoesService';
import { confirmar, mostrarAviso } from '../utils/alertas';

export default function MinhasRequisicoesScreen() {
  const [requisicoes, setRequisicoes] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [atualizando, setAtualizando] = useState(false);
  const [cancelandoId, setCancelandoId] = useState(null);

  const carregar = async () => {
    try {
      setRequisicoes(await listarMinhasRequisicoes());
    } catch (e) {
      mostrarAviso('Erro', e.message);
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

  const cancelar = async (requisicao) => {
    const ok = await confirmar(
      'Cancelar requisição',
      `Deseja cancelar o pedido de ${requisicao.quantidade} ${requisicao.unidade} de ${requisicao.itemNome}?`,
      'Cancelar pedido'
    );
    if (!ok) return;

    setCancelandoId(requisicao.id);
    try {
      await cancelarRequisicao(requisicao.id);
      await carregar();
    } catch (e) {
      mostrarAviso('Não foi possível cancelar', e.message);
    } finally {
      setCancelandoId(null);
    }
  };

  // Conta quantas requisições existem em cada situação (para mostrar nos filtros)
  const contar = (status) => requisicoes.filter((r) => r.status === status).length;

  const opcoesFiltro = [
    { valor: 'todas', rotulo: `Todas (${requisicoes.length})` },
    { valor: STATUS.PENDENTE, rotulo: `Pendentes (${contar(STATUS.PENDENTE)})` },
    { valor: STATUS.APROVADA, rotulo: `Aprovadas (${contar(STATUS.APROVADA)})` },
    { valor: STATUS.NEGADA, rotulo: `Negadas (${contar(STATUS.NEGADA)})` },
  ];

  const requisicoesFiltradas =
    filtro === 'todas' ? requisicoes : requisicoes.filter((r) => r.status === filtro);

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Minhas requisições" subtitulo="Acompanhe a resposta dos seus pedidos" />

      <View style={styles.filtros}>
        <Chips opcoes={opcoesFiltro} selecionado={filtro} onSelecionar={setFiltro} />
      </View>

      <FlatList
        data={requisicoesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardRequisicao requisicao={item}>
            {item.status === STATUS.PENDENTE ? (
              <Botao
                titulo="Cancelar pedido"
                icone="close"
                variante="contornoPerigo"
                pequeno
                style={styles.botao}
                carregando={cancelandoId === item.id}
                onPress={() => cancelar(item)}
              />
            ) : null}
          </CardRequisicao>
        )}
        ListEmptyComponent={
          <ListaVazia
            icone="clipboard-outline"
            mensagem={
              requisicoes.length === 0
                ? 'Você ainda não fez nenhuma requisição. Vá até a aba Estoque para pedir material.'
                : 'Nenhuma requisição com este filtro.'
            }
          />
        }
        contentContainerStyle={styles.lista}
        refreshing={atualizando}
        onRefresh={atualizar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  filtros: { paddingTop: 16 },
  lista: { paddingTop: 12, paddingBottom: 20 },
  botao: { flex: 1 },
});
