// Arquivo: src/screens/PerfilScreen.js
// Usada pelos dois perfis: mostra os dados do usuário, um resumo e o botão de sair.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Cabecalho from '../components/Cabecalho';
import Etiqueta from '../components/Etiqueta';
import Botao from '../components/Botao';
import { CORES } from '../theme/cores';
import { PERFIS, NOMES_PERFIS, STATUS } from '../data/constantes';
import { obterUsuarioLogado, fazerLogout } from '../services/authService';
import { listarMinhasRequisicoes, listarTodasRequisicoes } from '../services/requisicoesService';
import { restaurarDadosDeExemplo } from '../services/bancoInicial';
import { confirmar, mostrarAviso } from '../utils/alertas';
import { iniciais } from '../utils/formatadores';

function Numero({ valor, rotulo, cor }) {
  return (
    <View style={styles.numero}>
      <Text style={[styles.valor, { color: cor }]}>{valor}</Text>
      <Text style={styles.rotuloNumero}>{rotulo}</Text>
    </View>
  );
}

export default function PerfilScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [resumo, setResumo] = useState({ pendente: 0, aprovada: 0, negada: 0 });

  const carregar = async () => {
    try {
      const atual = await obterUsuarioLogado();
      if (!atual) {
        navigation.replace('Login');
        return;
      }
      setUsuario(atual);

      // Admin vê o resumo de todas as requisições; técnico, só das dele
      const lista =
        atual.perfil === PERFIS.ADMIN ? await listarTodasRequisicoes() : await listarMinhasRequisicoes();
      setResumo({
        pendente: lista.filter((r) => r.status === STATUS.PENDENTE).length,
        aprovada: lista.filter((r) => r.status === STATUS.APROVADA).length,
        negada: lista.filter((r) => r.status === STATUS.NEGADA).length,
      });
    } catch (e) {
      mostrarAviso('Erro', e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const sair = async () => {
    const ok = await confirmar('Sair', 'Deseja realmente sair da sua conta?', 'Sair');
    if (!ok) return;
    await fazerLogout();
    // Volta para o Login (a navegação sobe da aba para a pilha principal)
    navigation.replace('Login');
  };

  const restaurar = async () => {
    const ok = await confirmar(
      'Restaurar dados de exemplo',
      'TODOS os itens, usuários e requisições serão apagados e trocados pelos dados iniciais. Deseja continuar?',
      'Restaurar'
    );
    if (!ok) return;
    try {
      await restaurarDadosDeExemplo();
      mostrarAviso('Pronto!', 'Os dados de exemplo foram restaurados. Entre novamente.');
      navigation.replace('Login');
    } catch (e) {
      mostrarAviso('Erro', e.message);
    }
  };

  if (!usuario) {
    return <View style={styles.container} />;
  }

  const ehAdmin = usuario.perfil === PERFIS.ADMIN;

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Meu perfil" />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.textoAvatar}>{iniciais(usuario.nome)}</Text>
          </View>
          <Text style={styles.nome}>{usuario.nome}</Text>
          <Text style={styles.email}>{usuario.email}</Text>
          <Etiqueta texto={NOMES_PERFIS[usuario.perfil]} tipo={ehAdmin ? 'info' : 'neutro'} />
        </View>

        <Text style={styles.secao}>{ehAdmin ? 'Requisições da equipe' : 'Minhas requisições'}</Text>
        <View style={styles.numeros}>
          <Numero valor={resumo.pendente} rotulo="Pendentes" cor={CORES.alerta} />
          <Numero valor={resumo.aprovada} rotulo="Aprovadas" cor={CORES.sucesso} />
          <Numero valor={resumo.negada} rotulo="Negadas" cor={CORES.perigo} />
        </View>

        <Botao titulo="Sair da conta" icone="log-out-outline" variante="perigo" onPress={sair} style={styles.botao} />

        {ehAdmin ? (
          <Botao
            titulo="Restaurar dados de exemplo"
            icone="refresh"
            variante="contorno"
            onPress={restaurar}
            style={styles.botao}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  conteudo: { padding: 20, paddingBottom: 40, width: '100%', maxWidth: 560, alignSelf: 'center' },
  card: { backgroundColor: CORES.branco, borderRadius: 12, padding: 24, alignItems: 'center', elevation: 2, gap: 4 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CORES.primaria,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  textoAvatar: { color: CORES.branco, fontSize: 28, fontWeight: 'bold' },
  nome: { fontSize: 22, fontWeight: 'bold', color: CORES.texto },
  email: { fontSize: 15, color: CORES.textoSecundario, marginBottom: 8 },
  secao: { fontSize: 16, fontWeight: 'bold', color: CORES.texto, marginTop: 24, marginBottom: 10 },
  numeros: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  numero: { flex: 1, backgroundColor: CORES.branco, borderRadius: 10, paddingVertical: 16, alignItems: 'center', elevation: 1 },
  valor: { fontSize: 26, fontWeight: 'bold' },
  rotuloNumero: { fontSize: 13, color: CORES.textoSecundario, marginTop: 2 },
  botao: { marginBottom: 12 },
});
