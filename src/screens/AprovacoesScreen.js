// Arquivo: src/screens/AprovacoesScreen.js
// Visão do ADMINISTRADOR: aprova ou nega as requisições dos técnicos.
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Cabecalho from '../components/Cabecalho';
import Chips from '../components/Chips';
import CardRequisicao from '../components/CardRequisicao';
import Botao from '../components/Botao';
import ListaVazia from '../components/ListaVazia';
import ModalNegar from '../components/ModalNegar';
import { CORES } from '../theme/cores';
import { STATUS } from '../data/constantes';
import {
  listarTodasRequisicoes,
  aprovarRequisicao,
  negarRequisicao,
} from '../services/requisicoesService';
import { listarItens } from '../services/estoqueService';
import { confirmar, mostrarAviso } from '../utils/alertas';

export default function AprovacoesScreen({ navigation }) {
  const [requisicoes, setRequisicoes] = useState([]);
  const [itens, setItens] = useState([]);
  const [filtro, setFiltro] = useState(STATUS.PENDENTE);
  const [atualizando, setAtualizando] = useState(false);
  const [processandoId, setProcessandoId] = useState(null);
  const [requisicaoNegando, setRequisicaoNegando] = useState(null); // abre o ModalNegar

  const carregar = async () => {
    try {
      // Busca as duas listas ao mesmo tempo
      const [listaRequisicoes, listaItens] = await Promise.all([listarTodasRequisicoes(), listarItens()]);
      setRequisicoes(listaRequisicoes);
      setItens(listaItens);

      // Mostra um "balãozinho" na aba com o número de pendentes
      const pendentes = listaRequisicoes.filter((r) => r.status === STATUS.PENDENTE).length;
      navigation.setOptions({ tabBarBadge: pendentes > 0 ? pendentes : undefined });
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

  // Quantidade disponível hoje do item pedido
  const estoqueDoItem = (itemId) => {
    const item = itens.find((i) => i.id === itemId);
    return item ? item.quantidade : 0;
  };

  const aprovar = async (requisicao) => {
    const ok = await confirmar(
      'Aprovar requisição',
      `Liberar ${requisicao.quantidade} ${requisicao.unidade} de ${requisicao.itemNome} para ${requisicao.tecnicoNome}? A quantidade será descontada do estoque.`,
      'Aprovar'
    );
    if (!ok) return;

    setProcessandoId(requisicao.id);
    try {
      await aprovarRequisicao(requisicao.id);
      await carregar();
    } catch (e) {
      mostrarAviso('Não foi possível aprovar', e.message);
    } finally {
      setProcessandoId(null);
    }
  };

  const confirmarNegacao = async (motivo) => {
    const requisicao = requisicaoNegando;
    setRequisicaoNegando(null); // fecha o modal
    setProcessandoId(requisicao.id);
    try {
      await negarRequisicao(requisicao.id, motivo);
      await carregar();
    } catch (e) {
      mostrarAviso('Não foi possível negar', e.message);
    } finally {
      setProcessandoId(null);
    }
  };

  const contar = (status) => requisicoes.filter((r) => r.status === status).length;

  const opcoesFiltro = [
    { valor: STATUS.PENDENTE, rotulo: `Pendentes (${contar(STATUS.PENDENTE)})` },
    { valor: STATUS.APROVADA, rotulo: `Aprovadas (${contar(STATUS.APROVADA)})` },
    { valor: STATUS.NEGADA, rotulo: `Negadas (${contar(STATUS.NEGADA)})` },
    { valor: 'todas', rotulo: `Todas (${requisicoes.length})` },
  ];

  const requisicoesFiltradas =
    filtro === 'todas' ? requisicoes : requisicoes.filter((r) => r.status === filtro);

  const pendentes = contar(STATUS.PENDENTE);

  return (
    <View style={styles.container}>
      <Cabecalho
        titulo="Requisições"
        subtitulo={
          pendentes > 0
            ? `${pendentes} ${pendentes === 1 ? 'pedido aguardando' : 'pedidos aguardando'} sua resposta`
            : 'Nenhum pedido aguardando resposta'
        }
      />

      <View style={styles.filtros}>
        <Chips opcoes={opcoesFiltro} selecionado={filtro} onSelecionar={setFiltro} />
      </View>

      <FlatList
        data={requisicoesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const pendente = item.status === STATUS.PENDENTE;
          const estoque = estoqueDoItem(item.itemId);
          const semEstoqueSuficiente = estoque < item.quantidade;
          const ocupado = processandoId === item.id;

          return (
            <CardRequisicao requisicao={item} mostrarTecnico estoqueAtual={pendente ? estoque : undefined}>
              {pendente ? (
                <>
                  <Botao
                    titulo="Negar"
                    icone="close"
                    variante="contornoPerigo"
                    pequeno
                    style={styles.botao}
                    desabilitado={ocupado}
                    onPress={() => setRequisicaoNegando(item)}
                  />
                  <Botao
                    titulo={semEstoqueSuficiente ? 'Sem estoque' : 'Aprovar'}
                    icone="checkmark"
                    variante="sucesso"
                    pequeno
                    style={styles.botao}
                    carregando={ocupado}
                    desabilitado={semEstoqueSuficiente}
                    onPress={() => aprovar(item)}
                  />
                </>
              ) : null}
            </CardRequisicao>
          );
        }}
        ListEmptyComponent={
          <ListaVazia
            icone="checkmark-done-circle-outline"
            mensagem={filtro === STATUS.PENDENTE ? 'Tudo em dia! Nenhum pedido pendente.' : 'Nenhuma requisição com este filtro.'}
          />
        }
        contentContainerStyle={styles.lista}
        refreshing={atualizando}
        onRefresh={atualizar}
      />

      <ModalNegar
        requisicao={requisicaoNegando}
        onCancelar={() => setRequisicaoNegando(null)}
        onConfirmar={confirmarNegacao}
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
