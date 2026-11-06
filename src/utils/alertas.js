// O Alert.alert do React Native não funciona no navegador (Expo Web).
// Estas funções usam o Alert no celular e o alert/confirm do navegador na web,
// assim o app funciona nos dois lugares.
import { Alert, Platform } from 'react-native';

// Mostra uma mensagem simples com botão "OK"
export function mostrarAviso(titulo, mensagem) {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensagem}`);
  } else {
    Alert.alert(titulo, mensagem);
  }
}

// Pergunta "Cancelar / Confirmar" e devolve true ou false.
// Uso: const ok = await confirmar('Sair', 'Deseja sair?', 'Sair');
export function confirmar(titulo, mensagem, textoConfirmar = 'Confirmar') {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${titulo}\n\n${mensagem}`));
      return;
    }

    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: textoConfirmar, onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
