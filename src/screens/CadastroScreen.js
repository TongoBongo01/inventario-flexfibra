// Arquivo: src/screens/CadastroScreen.js
// Cadastro público: quem se cadastra por aqui é sempre TÉCNICO.
// Novos administradores só podem ser criados por outro administrador.
import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TelaFormulario from '../components/TelaFormulario';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';
import { CORES } from '../theme/cores';
import { cadastrarTecnico, fazerLogin } from '../services/authService';

export default function CadastroScreen({ navigation }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const cadastrar = async () => {
    if (nome === '' || email === '' || senha === '' || confirmacao === '') {
      setErro('Por favor, preencha todos os campos.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }

    setErro('');
    setCarregando(true);
    try {
      await cadastrarTecnico({ nome, email, senha });
      await fazerLogin(email, senha);

      // Limpa a pilha de telas e entra direto na área do técnico
      navigation.reset({ index: 0, routes: [{ name: 'AreaTecnico' }] });
    } catch (e) {
      setErro(e.message);
      setCarregando(false);
    }
  };

  return (
    <TelaFormulario>
    <View style={styles.aviso}>
        <Ionicons name="information-circle" size={22} color={CORES.primaria} />
        <Text style={styles.textoAviso}>
          Contas criadas aqui têm perfil de técnico. Administradores são cadastrados por outro administrador.
        </Text>
      </View>

      <CampoTexto label="Nome completo" placeholder="Ex.: Maria da Silva" value={nome} onChangeText={setNome} />
      <CampoTexto
        label="E-mail"
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />
      <CampoTexto
        label="Senha"
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry={true}
        value={senha}
        onChangeText={setSenha}
      />
      <CampoTexto
        label="Confirmar senha"
        placeholder="Digite a senha novamente"
        secureTextEntry={true}
        value={confirmacao}
        onChangeText={setConfirmacao}
      />

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Botao titulo="Criar conta" icone="person-add" onPress={cadastrar} carregando={carregando} />
    </TelaFormulario>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    backgroundColor: CORES.primariaClara,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  textoAviso: { flex: 1, marginLeft: 8, color: CORES.primaria, fontSize: 14 },
  erro: { color: CORES.perigo, fontSize: 14, marginBottom: 12, textAlign: 'center' },
});
