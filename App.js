// Arquivo: App.js
// Ponto de entrada: prepara o banco local, descobre se já há alguém logado
// e monta as rotas (Stack + Tabs, como no Módulo 6).
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Telas públicas
import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
// Telas do técnico
import EstoqueScreen from './src/screens/EstoqueScreen';
import NovaRequisicaoScreen from './src/screens/NovaRequisicaoScreen';
import MinhasRequisicoesScreen from './src/screens/MinhasRequisicoesScreen';
// Telas do administrador
import AprovacoesScreen from './src/screens/AprovacoesScreen';
import GerenciarEstoqueScreen from './src/screens/GerenciarEstoqueScreen';
import ItemFormScreen from './src/screens/ItemFormScreen';
import UsuariosScreen from './src/screens/UsuariosScreen';
import UsuarioFormScreen from './src/screens/UsuarioFormScreen';
// Tela dos dois perfis
import PerfilScreen from './src/screens/PerfilScreen';

import { CORES } from './src/theme/cores';
import { PERFIS } from './src/data/constantes';
import { inicializarBanco } from './src/services/bancoInicial';
import { obterUsuarioLogado } from './src/services/authService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Ícone de cada aba (a versão "-outline" é usada quando a aba não está selecionada)
const ICONES_ABAS = {
  Estoque: 'cube',
  MinhasRequisicoes: 'clipboard',
  Aprovacoes: 'checkmark-done-circle',
  GerenciarEstoque: 'cube',
  Usuarios: 'people',
  Perfil: 'person',
};

// Configuração visual comum às duas barras de abas
const opcoesDasAbas = ({ route }) => ({
  headerShown: false,
  tabBarActiveTintColor: CORES.primaria,
  tabBarInactiveTintColor: 'gray',
  tabBarIcon: ({ color, size, focused }) => {
    const nome = ICONES_ABAS[route.name];
    return <Ionicons name={focused ? nome : `${nome}-outline`} size={size} color={color} />;
  },
});

// Abas que o TÉCNICO vê depois de entrar
function TabsTecnico() {
  return (
    <Tab.Navigator screenOptions={opcoesDasAbas}>
      <Tab.Screen name="Estoque" component={EstoqueScreen} />
      <Tab.Screen name="MinhasRequisicoes" component={MinhasRequisicoesScreen} options={{ title: 'Requisições' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

// Abas que o ADMINISTRADOR vê depois de entrar
function TabsAdmin() {
  return (
    <Tab.Navigator screenOptions={opcoesDasAbas}>
      <Tab.Screen name="Aprovacoes" component={AprovacoesScreen} options={{ title: 'Requisições' }} />
      <Tab.Screen name="GerenciarEstoque" component={GerenciarEstoqueScreen} options={{ title: 'Estoque' }} />
      <Tab.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Usuários' }} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  // null = ainda carregando. Depois vira 'Login', 'AreaTecnico' ou 'AreaAdmin'.
  const [rotaInicial, setRotaInicial] = useState(null);

  useEffect(() => {
    prepararApp();
  }, []);

  const prepararApp = async () => {
    try {
      await inicializarBanco();

      // Se o usuário não saiu da conta, já abre direto na área dele (Módulo 10)
      const usuario = await obterUsuarioLogado();
      if (!usuario) {
        setRotaInicial('Login');
      } else {
        setRotaInicial(usuario.perfil === PERFIS.ADMIN ? 'AreaAdmin' : 'AreaTecnico');
      }
    } catch (erro) {
      console.log('Erro ao preparar o app', erro);
      setRotaInicial('Login');
    }
  };

  if (!rotaInicial) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={CORES.branco} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {/* Texto claro na barra de status, porque o topo das telas é azul */}
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName={rotaInicial}
          screenOptions={{
            headerStyle: { backgroundColor: CORES.primaria },
            headerTintColor: CORES.branco,
            headerTitleStyle: { fontWeight: 'bold' },
            headerBackTitle: 'Voltar',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Cadastro de técnico' }} />

          {/* Área de cada perfil (navegação aninhada: Tabs dentro do Stack) */}
          <Stack.Screen name="AreaTecnico" component={TabsTecnico} options={{ headerShown: false }} />
          <Stack.Screen name="AreaAdmin" component={TabsAdmin} options={{ headerShown: false }} />

          {/* Telas abertas "por cima" das abas */}
          <Stack.Screen name="NovaRequisicao" component={NovaRequisicaoScreen} options={{ title: 'Nova requisição' }} />
          <Stack.Screen
            name="ItemForm"
            component={ItemFormScreen}
            options={({ route }) => ({ title: route.params?.itemId ? 'Editar item' : 'Novo item' })}
          />
          <Stack.Screen name="UsuarioForm" component={UsuarioFormScreen} options={{ title: 'Novo usuário' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: CORES.primaria },
});
