# Inventário FlexFibra 📦

App mobile de controle de estoque feito com **React Native + Expo (SDK 54)** e **Firebase**,
seguindo a base do projeto da disciplina (Módulos 1 a 10).

Existem dois perfis de acesso, cada um com login próprio (e-mail e senha):

| Perfil | O que pode fazer |
| --- | --- |
| **Técnico** | Consultar o estoque, requisitar itens, acompanhar e cancelar os próprios pedidos |
| **Administrador** | Aprovar ou negar requisições (com motivo), cadastrar/editar/excluir itens, cadastrar/remover usuários |

Quando um administrador **aprova** uma requisição, a quantidade é descontada do estoque automaticamente.
A baixa é feita em uma transação: se o estoque não for suficiente, a aprovação é recusada.

## Como rodar

Pré-requisitos: **Node.js LTS** no computador e o app **Expo Go** no celular.

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

## Configuração do Firebase

Os dados ficam no **Cloud Firestore** e o login é feito pelo **Firebase Authentication**.
Para apontar o app para outro projeto Firebase:

1. No [console do Firebase](https://console.firebase.google.com), crie o projeto.
2. Ative **Authentication → E-mail/senha**.
3. Crie o **Firestore Database** (comece em modo de teste).
4. Registre um app **Web** (`</>`) e copie as credenciais para o arquivo `firebase.config.json`.
5. Carregue os dados de demonstração e publique as regras:

```bash
node scripts/semear.mjs
```

6. No console, em **Firestore Database → Regras**, cole o conteúdo de `firestore.rules` e publique.
7. Confira se tudo ficou protegido:

```bash
node scripts/testar-regras.mjs
```

> A `apiKey` do arquivo `firebase.config.json` não é segredo: ela apenas identifica o projeto.
> Quem protege os dados são as regras de segurança (veja `firestore.rules`).

## Contas de teste

Criadas pelo `scripts/semear.mjs`. Na tela de login dá para tocar nelas para preencher:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@flexfibra.com | admin123 |
| Técnico | tecnico@flexfibra.com | tecnico123 |
| Técnico | bruno@flexfibra.com | tecnico123 |

Novos técnicos podem se cadastrar pelo link **"Cadastre-se"** do login.
Novos administradores só podem ser criados por outro administrador (aba **Usuários**).

Na aba **Perfil** do administrador há o botão **"Restaurar dados de exemplo"**, que recarrega o
estoque inicial e apaga as requisições (útil para a apresentação).

## Estrutura do projeto

```
inventario-flexfibra/
├── App.js                      # Rotas: Stack (login, formulários) + Tabs (técnico / admin)
├── firebase.config.json        # Credenciais do projeto Firebase
├── firestore.rules             # Regras de segurança do banco (rodam no servidor)
├── scripts/
│   ├── semear.mjs              # Cria usuários, estoque e requisições de demonstração
│   └── testar-regras.mjs       # Testa as regras com cada perfil (24 verificações)
└── src/
    ├── components/             # Peças reutilizáveis
    │   ├── Botao.js, CampoTexto.js, CampoBusca.js, Chips.js, Etiqueta.js
    │   ├── Cabecalho.js, ListaVazia.js, TelaFormulario.js
    │   ├── CardItem.js         # Cartão de item do estoque
    │   ├── CardRequisicao.js   # Cartão de requisição com status
    │   └── ModalNegar.js       # Janela para informar o motivo da negação
    ├── screens/                # Telas inteiras
    │   ├── LoginScreen.js, CadastroScreen.js
    │   ├── EstoqueScreen.js, NovaRequisicaoScreen.js, MinhasRequisicoesScreen.js   (técnico)
    │   ├── AprovacoesScreen.js, GerenciarEstoqueScreen.js, ItemFormScreen.js       (admin)
    │   ├── UsuariosScreen.js, UsuarioFormScreen.js                                 (admin)
    │   └── PerfilScreen.js     # Os dois perfis
    ├── services/               # Regras de negócio e acesso ao Firebase
    │   ├── firebaseConfig.js   # Conexão com Auth e Firestore
    │   ├── authService.js      # Login, sessão, cadastro, permissões
    │   ├── estoqueService.js   # Itens do estoque
    │   ├── requisicoesService.js  # Criar, aprovar (transação), negar, cancelar
    │   └── bancoInicial.js     # Restauração dos dados de demonstração
    ├── data/                   # Constantes e itens iniciais
    ├── theme/cores.js          # Paleta de cores
    └── utils/                  # Alertas (celular e web) e formatação de datas
```

## Modelo de dados (Firestore)

| Coleção | Conteúdo |
| --- | --- |
| `usuarios/{uid}` | nome, email, perfil (`admin` ou `tecnico`), criadoEm |
| `itens/{id}` | nome, categoria, unidade, quantidade, estoqueMinimo |
| `requisicoes/{id}` | item, quantidade, observação, técnico, status, datas e motivo da negação |

O `uid` dos usuários é o mesmo do Firebase Authentication, que liga a conta ao perfil de acesso.

## Conceitos da disciplina usados

- **Componentes e Props** (Módulo 4): `CardItem`, `CardRequisicao`, `Botao`, etc.
- **StyleSheet e Flexbox** (Módulo 5): cabeçalho, cartões, linhas de botões.
- **Navegação Stack + Bottom Tabs aninhadas** (Módulo 6): cada perfil tem a sua barra de abas.
- **Estado, eventos e formulários** (Módulo 7): `useState`, `TextInput` controlado, validações.
- **FlatList e filtros** (Módulo 8): busca por texto, filtro por categoria/status, "puxar para atualizar".
- **Consumo de serviço na internet** (Módulo 9): `async/await` e `try/catch` em toda a camada de serviços.
- **AsyncStorage** (Módulo 10): guarda a sessão do Firebase no aparelho e o último e-mail usado,
  para o usuário continuar logado ao reabrir o app.

## Segurança

- As senhas ficam no **Firebase Authentication**; o aplicativo nunca as armazena.
- As permissões são verificadas **duas vezes**: na camada de serviços (`exigirPerfil`) e,
  principalmente, nas regras do Firestore, que rodam no servidor do Google.
- O cadastro público sempre cria técnicos: ninguém consegue se promover a administrador.
- `node scripts/testar-regras.mjs` comprova as regras com os dois perfis.

## Limitação importante

Por usar um banco na nuvem, o aplicativo **depende de conexão com a internet**.
O Firestore não mantém cache offline em React Native, então um técnico sem sinal não
consegue consultar o estoque nem registrar requisições.
