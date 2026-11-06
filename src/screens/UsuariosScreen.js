// Arquivo: src/screens/UsuariosScreen.js
// Visão do ADMINISTRADOR: lista, cadastra e remove usuários.
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Cabecalho from '../components/Cabecalho';
import CampoBusca from '../components/CampoBusca';
import Chips from '../components/Chips';
import Etiqueta from '../components/Etiqueta';
import ListaVazia from '../components/ListaVazia';
import { CORES } from '../theme/cores';
import { PERFIS, NOMES_PERFIS } from '../data/constantes';
import { listarUsuarios, removerUsuario, obterUsuarioLogado } from '../services/authService';
import { confirmar, mostrarAviso } from '../utils/alertas';
import { iniciais } from '../utils/formatadores';

export default function UsuariosScreen({ navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [meuId, setMeuId] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const carregar = async () => {
    try {
      const [lista, eu] = await Promise.all([listarUsuarios(), obterUsuarioLogado()]);
      setUsuarios(lista);
      setMeuId(eu ? eu.id : null);
    } catch (e) {
      mostrarAviso('Erro', e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [])
  );

  const remover = async (usuario) => {
    const ok = await confirmar(
      'Remover usuário',
      `Deseja remover ${usuario.nome}? O acesso ao app será bloqueado, mas o histórico de requisições é mantido.`,
      'Remover'
    );
    if (!ok) return;
    try {
      await removerUsuario(usuario.id);
      await carregar();
    } catch (e) {
      mostrarAviso('Não foi possível remover', e.message);
    }
  };

  const contar = (perfil) => usuarios.filter((u) => u.perfil === perfil).length;

  const opcoesFiltro = [
    { valor: 'todos', rotulo: `Todos (${usuarios.length})` },
    { valor: PERFIS.TECNICO, rotulo: `Técnicos (${contar(PERFIS.TECNICO)})` },
    { valor: PERFIS.ADMIN, rotulo: `Administradores (${contar(PERFIS.ADMIN)})` },
  ];

  const termo = busca.toLowerCase();
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      (filtro === 'todos' || u.perfil === filtro) &&
      (u.nome.toLowerCase().includes(termo) || u.email.includes(termo))
  );

  const renderUsuario = ({ item }) => {
    const souEu = item.id === meuId;
    return (
      <View style={styles.card}>
        <View style={[styles.avatar, item.perfil === PERFIS.ADMIN && styles.avatarAdmin]}>
          <Text style={styles.textoAvatar}>{iniciais(item.nome)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.nome}>
            {item.nome}
            {souEu ? ' (você)' : ''}
          </Text>
          <Text style={styles.email}>{item.email}</Text>
          <Etiqueta texto={NOMES_PERFIS[item.perfil]} tipo={item.perfil === PERFIS.ADMIN ? 'info' : 'neutro'} />
        </View>
        {!souEu ? (
          <TouchableOpacity style={styles.botaoRemover} onPress={() => remover(item)} accessibilityLabel={`Remover ${item.nome}`}>
            <Ionicons name="trash-outline" size={22} color={CORES.perigo} />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Cabecalho
        titulo="Usuários"
        subtitulo="Técnicos e administradores com acesso"
        icone="person-add"
        rotuloIcone="Cadastrar usuário"
        onPressIcone={() => navigation.navigate('UsuarioForm')}
      />

      <View style={styles.busca}>
        <CampoBusca valor={busca} onAlterar={setBusca} placeholder="Buscar por nome ou e-mail..." />
      </View>
      <Chips opcoes={opcoesFiltro} selecionado={filtro} onSelecionar={setFiltro} />

      <FlatList
        data={usuariosFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderUsuario}
        ListEmptyComponent={<ListaVazia icone="people-outline" mensagem="Nenhum usuário encontrado." />}
        contentContainerStyle={styles.lista}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundo },
  busca: { padding: 16, paddingBottom: 12 },
  lista: { paddingTop: 12, paddingBottom: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.branco,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: CORES.textoSecundario,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarAdmin: { backgroundColor: CORES.primaria },
  textoAvatar: { color: CORES.branco, fontWeight: 'bold', fontSize: 16 },
  info: { flex: 1, gap: 3 },
  nome: { fontSize: 16, fontWeight: 'bold', color: CORES.texto },
  email: { fontSize: 13, color: CORES.textoSecundario },
  botaoRemover: { padding: 8 },
});
