# Inventário FlexFibra 📦

App mobile de controle de estoque feito com **React Native + Expo (SDK 54)**, seguindo a mesma base do projeto Hortifruti da disciplina (Módulos 1 a 10).

Existem dois perfis de acesso, cada um com login próprio (e-mail e senha):

| Perfil | O que pode fazer |
| --- | --- |
| **Técnico** | Consultar o estoque, requisitar itens, acompanhar e cancelar os próprios pedidos |
| **Administrador** | Aprovar ou negar requisições (com motivo), cadastrar/editar/excluir itens, cadastrar/remover usuários |

Quando um administrador **aprova** uma requisição, a quantidade é descontada do estoque automaticamente.
Se o estoque não for suficiente, o app não deixa aprovar.

## Como rodar

Pré-requisitos (Módulo 3): **Node.js LTS** instalado no computador e o app **Expo Go** no celular.

```bash
cd inventario-flexfibra
npm install
npx expo start
```

- **Celular:** leia o QR Code com o Expo Go (computador e celular na mesma rede Wi-Fi).
- **Navegador (plano B):** com o servidor rodando, aperte `w` no terminal.

> Se o Expo avisar que alguma biblioteca está com versão diferente da esperada, rode `npx expo install --fix`.

### Problemas comuns no Windows

- **"a execução de scripts foi desabilitada neste sistema"** ao rodar `npx`: use `npx.cmd expo start`.
- **Celular mostra "Failed to download remote update"** (usando ancoragem USB): o PC tem mais de uma rede
  (cabo, VPN...) e o Expo escolheu o IP errado. Force o IP da ancoragem USB antes de iniciar:

  ```powershell
  $env:REACT_NATIVE_PACKAGER_HOSTNAME = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet 2").IPAddress
  npx.cmd expo start
  ```

  (Troque `"Ethernet 2"` pelo nome da conexão USB em *Configurações → Rede e Internet → Ethernet*.)

## Contas de teste

Criadas automaticamente na primeira vez que o app abre (na tela de login dá para tocar nelas para preencher):

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@flexfibra.com | admin123 |
| Técnico | tecnico@flexfibra.com | tecnico123 |
| Técnico | bruno@flexfibra.com | tecnico123 |

Novos técnicos podem se cadastrar pelo link **"Cadastre-se"** do login.
Novos administradores só podem ser criados por outro administrador (aba **Usuários**).

Na aba **Perfil** do administrador há o botão **"Restaurar dados de exemplo"**, que volta tudo ao estado inicial (útil para a apresentação).

## Estrutura do projeto

```
inventario-flexfibra/
├── App.js                      # Rotas: Stack (login, formulários) + Tabs (técnico / admin)
└── src/
    ├── components/             # Peças reutilizáveis (Módulo 4)
    │   ├── Botao.js, CampoTexto.js, CampoBusca.js, Chips.js, Etiqueta.js
    │   ├── Cabecalho.js, ListaVazia.js
    │   ├── CardItem.js         # Cartão de item do estoque
    │   ├── CardRequisicao.js   # Cartão de requisição com status
    │   └── ModalNegar.js       # Janela para informar o motivo da negação
    ├── screens/                # Telas inteiras (Módulo 6)
    │   ├── LoginScreen.js, CadastroScreen.js
    │   ├── EstoqueScreen.js, NovaRequisicaoScreen.js, MinhasRequisicoesScreen.js   (técnico)
    │   ├── AprovacoesScreen.js, GerenciarEstoqueScreen.js, ItemFormScreen.js       (admin)
    │   ├── UsuariosScreen.js, UsuarioFormScreen.js                                 (admin)
    │   └── PerfilScreen.js     # Os dois perfis
    ├── services/               # Regras de negócio + "banco de dados"
    │   ├── armazenamento.js    # Leitura/escrita no AsyncStorage (Módulo 10)
    │   ├── authService.js      # Login, sessão, cadastro, permissões
    │   ├── estoqueService.js   # Itens do estoque
    │   ├── requisicoesService.js  # Criar, aprovar, negar, cancelar
    │   └── bancoInicial.js     # Dados de exemplo na primeira execução
    ├── data/                   # Constantes e dados iniciais
    ├── theme/cores.js          # Paleta de cores
    └── utils/                  # Alertas (celular e web) e formatação de datas
```

## Conceitos da disciplina usados

- **Componentes e Props** (Módulo 4): `CardItem`, `CardRequisicao`, `Botao`, etc.
- **StyleSheet e Flexbox** (Módulo 5): cabeçalho, cartões, linhas de botões.
- **Navegação Stack + Bottom Tabs aninhadas** (Módulo 6): cada perfil tem a sua barra de abas; passagem de parâmetros com `navigation.navigate('NovaRequisicao', { itemId })`.
- **Estado, eventos e formulários** (Módulo 7): `useState`, `TextInput` controlado, validações, `KeyboardAvoidingView`.
- **FlatList e filtros** (Módulo 8): busca por texto, filtro por categoria/status, "puxar para atualizar".
- **async/await e try/catch** (Módulos 2 e 9): toda a camada de serviços.
- **AsyncStorage** (Módulo 10): usuários, itens, requisições e sessão ficam salvos no aparelho; o usuário continua logado ao reabrir o app.

## Segurança e permissões

- As senhas **não** são salvas em texto puro: o app guarda só o hash SHA-256 (`expo-crypto`).
- Toda ação de administrador é conferida também na camada de serviço (`exigirPerfil`), não só escondendo botões.
- O cadastro público sempre cria técnicos.

## Limitação importante

Os dados ficam no **AsyncStorage do próprio aparelho**. Ou seja: técnico e administrador precisam usar
o **mesmo celular/navegador** para ver as requisições um do outro (ótimo para demonstração).
Para uso real com vários aparelhos, o próximo passo seria trocar a camada `src/services/` por um
banco na nuvem (ex.: Firebase), sem precisar mexer nas telas.
