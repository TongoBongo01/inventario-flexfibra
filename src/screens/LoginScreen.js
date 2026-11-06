// Arquivo: src/screens/LoginScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';
import { CORES } from '../theme/cores';
import { PERFIS } from '../data/constantes';
import { fazerLogin, obterUltimoEmail } from '../services/authService';

// Contas criadas automaticamente na primeira vez que o app abre
const CONTAS_DE_TESTE = [
  { rotulo: 'Administrador', email: 'admin@flexfibra.com', senha: 'admin123' },
  { rotulo: 'Técnico', email: 'tecnico@flexfibra.com', senha: 'tecnico123' },
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Preenche o e-mail usado no último login (salvo no AsyncStorage)
  useEffect(() => {
    obterUltimoEmail().then(setEmail);
  }, []);

  const entrar = async () => {
    if (email.trim() === '' || senha === '') {
      setErro('Preencha seu e-mail e senha.');
      return;
    }

    setErro('');
    setCarregando(true);
    try {
      const usuario = await fazerLogin(email, senha);

      // Cada perfil vai para a sua própria área.
      // 'replace' impede de voltar para o login com o botão "voltar".
      navigation.replace(usuario.perfil === PERFIS.ADMIN ? 'AreaAdmin' : 'AreaTecnico');
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const usarContaDeTeste = (conta) => {
    setEmail(conta.email);
    setSenha(conta.senha);
    setErro('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* "padding" nas duas plataformas: no SDK 54 o Android não redimensiona a tela sozinho */}
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <ScrollView contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled">
          <View style={styles.topo}>
            <View style={styles.logo}>
              <Ionicons name="cube" size={40} color={CORES.primaria} />
            </View>
            <Text style={styles.titulo}>FlexFibra</Text>
            <Text style={styles.subtitulo}>Inventário de materiais</Text>
          </View>

          <View style={styles.card}>
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
              placeholder="Sua senha"
              secureTextEntry={true}
              value={senha}
              onChangeText={setSenha}
              onSubmitEditing={entrar}
            />

            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <Botao titulo="Entrar" onPress={entrar} carregando={carregando} />

            <TouchableOpacity style={styles.botaoLink} onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.textoLink}>Técnico sem conta? Cadastre-se</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contas}>
            <Text style={styles.contasTitulo}>Contas de teste (toque para preencher)</Text>
            {CONTAS_DE_TESTE.map((conta) => (
              <TouchableOpacity key={conta.email} style={styles.conta} onPress={() => usarContaDeTeste(conta)}>
                <Text style={styles.contaRotulo}>{conta.rotulo}</Text>
                <Text style={styles.contaDados}>
                  {conta.email} / {conta.senha}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.primaria },
  rolagem: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  topo: { alignItems: 'center', marginBottom: 24 },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: CORES.branco,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titulo: { fontSize: 32, fontWeight: 'bold', color: CORES.branco },
  subtitulo: { fontSize: 16, color: '#BBDEFB', marginTop: 4 },
  card: { backgroundColor: CORES.fundo, borderRadius: 12, padding: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  erro: { color: CORES.perigo, fontSize: 14, marginBottom: 12, textAlign: 'center' },
  botaoLink: { alignItems: 'center', marginTop: 18 },
  textoLink: { color: CORES.primaria, fontSize: 15, fontWeight: 'bold' },
  contas: { marginTop: 20, width: '100%', maxWidth: 480, alignSelf: 'center' },
  contasTitulo: { color: '#BBDEFB', fontSize: 13, marginBottom: 8, textAlign: 'center' },
  conta: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: 10, marginBottom: 8 },
  contaRotulo: { color: CORES.branco, fontWeight: 'bold', fontSize: 14 },
  contaDados: { color: '#E3F2FD', fontSize: 13, marginTop: 2 },
});
