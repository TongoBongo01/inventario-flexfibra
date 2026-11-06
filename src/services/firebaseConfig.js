// Conexão com o Firebase: autenticação (Auth) e banco de dados (Cloud Firestore).
// As credenciais ficam em firebase.config.json, na raiz do projeto.
//
// Observação: a apiKey do Firebase NÃO é uma senha. Ela apenas identifica o projeto.
// Quem protege os dados são as regras de segurança (arquivo firestore.rules).
import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import credenciais from '../../firebase.config.json';

// getApps() evita inicializar duas vezes quando o Fast Refresh recarrega o arquivo
export const app = getApps().length === 0 ? initializeApp(credenciais) : getApp();

function criarAuth() {
  // No navegador (Expo Web) o próprio SDK guarda a sessão
  if (Platform.OS === 'web') return getAuth(app);

  try {
    // No celular, a sessão é gravada no AsyncStorage (Módulo 10),
    // para o usuário continuar logado ao reabrir o aplicativo
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (erro) {
    // Já havia sido inicializado antes
    return getAuth(app);
  }
}

export const auth = criarAuth();
export const db = getFirestore(app);

// Usado para criar um segundo app temporário ao cadastrar usuários (ver authService)
export const credenciaisFirebase = credenciais;
