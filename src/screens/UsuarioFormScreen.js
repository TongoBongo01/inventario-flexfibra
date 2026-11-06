// Arquivo: src/screens/UsuarioFormScreen.js
// O ADMINISTRADOR cadastra um novo usuário e escolhe o perfil dele.
import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import TelaFormulario from '../components/TelaFormulario';
import CampoTexto from '../components/CampoTexto';
import Chips from '../components/Chips';
import Botao from '../components/Botao';
import { CORES } from '../theme/cores';
import { PERFIS, NOMES_PERFIS } from '../data/constantes';
import { criarUsuario } from '../services/authService';
import { mostrarAviso } from '../utils/alertas';

const OPCOES_PERFIL = [
  { valor: PERFIS.TECNICO, rotulo: NOMES_PERFIS.tecnico },
  { valor: PERFIS.ADMIN, rotulo: NOMES_PERFIS.admin },
];

export default function UsuarioFormScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState(PERFIS.TECNICO);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    setErro('');
    setSalvando(true);
    try {
      const novo = await criarUsuario({ nome, email, senha, perfil });
      mostrarAviso('Usuário criado!', `${novo.nome} já pode entrar com o e-mail ${novo.email}.`);
      navigation.goBack();
    } catch (e) {
      setErro(e.message);
      setSalvando(false);
    }
  };

  return (
    <TelaFormulario>
      <CampoTexto label="Nome completo" placeholder="Ex.: Maria da Silva" value={nome} onChangeText={setNome} />
      <CampoTexto
        label="E-mail"
        placeholder="email@flexfibra.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />
      <CampoTexto
        label="Senha inicial"
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry={true}
        value={senha}
        onChangeText={setSenha}
      />

      <Text style={styles.label}>Perfil de acesso</Text>
      <Chips opcoes={OPCOES_PERFIL} selecionado={perfil} onSelecionar={setPerfil} quebrarLinha />
      <Text style={styles.dica}>
        {perfil === PERFIS.ADMIN
          ? 'Administradores aprovam/negam requisições e gerenciam estoque e usuários.'
          : 'Técnicos consultam o estoque e fazem requisições de material.'}
      </Text>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Botao titulo="Cadastrar usuário" icone="person-add" onPress={salvar} carregando={salvando} />
    </TelaFormulario>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: 'bold', color: CORES.texto, marginBottom: 8 },
  dica: { fontSize: 13, color: CORES.textoSecundario, marginBottom: 20, marginTop: -6 },
  erro: { color: CORES.perigo, fontSize: 14, marginBottom: 12, textAlign: 'center' },
});
