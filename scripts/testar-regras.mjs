// Testa as regras de segurança do Firestore com cada perfil de usuário.
// Roda contra o projeto real, usando as mesmas credenciais do aplicativo.
//
//   node scripts/testar-regras.mjs
//
// Ao final, rode "node scripts/semear.mjs" para devolver os dados ao estado inicial.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, runTransaction,
} from 'firebase/firestore';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const credenciais = JSON.parse(readFileSync(join(raiz, 'firebase.config.json'), 'utf8'));

const app = initializeApp(credenciais);
const auth = getAuth(app);
const db = getFirestore(app);

let passou = 0;
let falhou = 0;

// Executa um teste esperando sucesso ('permitir') ou bloqueio ('negar')
async function teste(descricao, esperado, acao) {
  try {
    const resultado = await acao();
    if (esperado === 'permitir') {
      console.log(`  OK    ${descricao}`);
      passou++;
      return resultado;
    }
    console.log(`  FALHA ${descricao} -> deveria ter sido bloqueado, mas funcionou`);
    falhou++;
    return resultado;
  } catch (erro) {
    const bloqueio = (erro.code || '').includes('permission-denied');
    if (esperado === 'negar' && bloqueio) {
      console.log(`  OK    ${descricao} (bloqueado pelas regras)`);
      passou++;
    } else {
      console.log(`  FALHA ${descricao} -> ${erro.code || erro.message}`);
      falhou++;
    }
    return null;
  }
}

const entrar = (email, senha) => signInWithEmailAndPassword(auth, email, senha);

async function rodar() {
  console.log(`Projeto: ${credenciais.projectId}\n`);

  // ---------- SEM LOGIN ----------
  console.log('SEM LOGIN');
  await teste('ler o estoque', 'negar', () => getDocs(collection(db, 'itens')));
  await teste('ler requisições', 'negar', () => getDocs(collection(db, 'requisicoes')));

  // ---------- TÉCNICO ----------
  console.log('\nTÉCNICO (Carlos)');
  const tecnico = (await entrar('tecnico@flexfibra.com', 'tecnico123')).user;

  const itens = await teste('consultar o estoque', 'permitir', async () => {
    const consulta = await getDocs(collection(db, 'itens'));
    return consulta.docs.map((d) => ({ id: d.id, ...d.data() }));
  });

  await teste('ver as próprias requisições', 'permitir', () =>
    getDocs(query(collection(db, 'requisicoes'), where('tecnicoId', '==', tecnico.uid)))
  );

  await teste('ver as requisições de todos', 'negar', () => getDocs(collection(db, 'requisicoes')));
  await teste('ler o cadastro dos outros usuários', 'negar', () => getDocs(collection(db, 'usuarios')));
  await teste('descobrir quem são os administradores', 'negar', () =>
    getDocs(query(collection(db, 'usuarios'), where('perfil', '==', 'admin')))
  );
  await teste('ler o próprio cadastro', 'permitir', () =>
    getDoc(doc(db, 'usuarios', tecnico.uid)).then((d) => {
      if (!d.exists()) throw new Error('cadastro do técnico não encontrado');
      return d;
    })
  );

  const item = itens.find((i) => i.quantidade > 10);
  const novaRequisicao = await teste('criar requisição em seu nome', 'permitir', () =>
    addDoc(collection(db, 'requisicoes'), {
      itemId: item.id, itemNome: item.nome, unidade: item.unidade, quantidade: 2,
      observacao: 'teste automatizado', tecnicoId: tecnico.uid, tecnicoNome: 'Carlos Lima',
      status: 'pendente', criadaEm: new Date().toISOString(),
      respondidaEm: null, respondidaPorNome: null, motivoNegacao: '',
    })
  );

  await teste('criar requisição no nome de outro técnico', 'negar', () =>
    addDoc(collection(db, 'requisicoes'), {
      itemId: item.id, itemNome: item.nome, unidade: item.unidade, quantidade: 1,
      observacao: '', tecnicoId: 'id-de-outra-pessoa', tecnicoNome: 'Outro',
      status: 'pendente', criadaEm: new Date().toISOString(),
      respondidaEm: null, respondidaPorNome: null, motivoNegacao: '',
    })
  );

  await teste('criar requisição já aprovada', 'negar', () =>
    addDoc(collection(db, 'requisicoes'), {
      itemId: item.id, itemNome: item.nome, unidade: item.unidade, quantidade: 1,
      observacao: '', tecnicoId: tecnico.uid, tecnicoNome: 'Carlos Lima',
      status: 'aprovada', criadaEm: new Date().toISOString(),
      respondidaEm: null, respondidaPorNome: null, motivoNegacao: '',
    })
  );

  await teste('aprovar a própria requisição', 'negar', () =>
    updateDoc(doc(db, 'requisicoes', novaRequisicao.id), { status: 'aprovada' })
  );
  await teste('cadastrar item no estoque', 'negar', () =>
    addDoc(collection(db, 'itens'), { nome: 'Item pirata', categoria: 'Cabos', unidade: 'un', quantidade: 1, estoqueMinimo: 0 })
  );
  await teste('alterar o estoque de um item', 'negar', () =>
    updateDoc(doc(db, 'itens', item.id), { quantidade: 9999 })
  );
  await teste('virar administrador', 'negar', () =>
    updateDoc(doc(db, 'usuarios', tecnico.uid), { perfil: 'admin' })
  );
  await teste('cancelar a própria requisição pendente', 'permitir', () =>
    updateDoc(doc(db, 'requisicoes', novaRequisicao.id), { status: 'cancelada', respondidaEm: new Date().toISOString() })
  );

  // ---------- ADMINISTRADOR ----------
  console.log('\nADMINISTRADOR (Ana)');
  await signOut(auth);
  await entrar('admin@flexfibra.com', 'admin123');

  const todas = await teste('ver as requisições de todos', 'permitir', async () => {
    const consulta = await getDocs(collection(db, 'requisicoes'));
    return consulta.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  await teste('ver todos os usuários', 'permitir', () => getDocs(collection(db, 'usuarios')));

  const pendente = todas.find((r) => r.status === 'pendente');
  const antes = (await getDoc(doc(db, 'itens', pendente.itemId))).data().quantidade;

  await teste('aprovar requisição dando baixa no estoque (transação)', 'permitir', () =>
    runTransaction(db, async (transacao) => {
      const refItem = doc(db, 'itens', pendente.itemId);
      const atual = await transacao.get(refItem);
      transacao.update(refItem, { quantidade: atual.data().quantidade - pendente.quantidade });
      transacao.update(doc(db, 'requisicoes', pendente.id), {
        status: 'aprovada', respondidaEm: new Date().toISOString(), respondidaPorNome: 'Ana Souza',
      });
    })
  );

  const depois = (await getDoc(doc(db, 'itens', pendente.itemId))).data().quantidade;
  const esperado = antes - pendente.quantidade;
  if (depois === esperado) {
    console.log(`  OK    estoque baixou de ${antes} para ${depois} (pedido de ${pendente.quantidade})`);
    passou++;
  } else {
    console.log(`  FALHA estoque deveria ser ${esperado} e ficou ${depois}`);
    falhou++;
  }

  const outra = todas.find((r) => r.status === 'pendente' && r.id !== pendente.id);
  if (outra) {
    await teste('negar requisição com motivo', 'permitir', () =>
      updateDoc(doc(db, 'requisicoes', outra.id), {
        status: 'negada', respondidaEm: new Date().toISOString(),
        respondidaPorNome: 'Ana Souza', motivoNegacao: 'teste automatizado',
      })
    );
  }

  const criado = await teste('cadastrar item no estoque', 'permitir', () =>
    addDoc(collection(db, 'itens'), { nome: 'Item de teste', categoria: 'Cabos', unidade: 'un', quantidade: 5, estoqueMinimo: 1 })
  );
  await teste('editar item', 'permitir', () => updateDoc(doc(db, 'itens', criado.id), { quantidade: 7 }));
  await teste('excluir item', 'permitir', () => deleteDoc(doc(db, 'itens', criado.id)));

  await signOut(auth);

  console.log(`\nResultado: ${passou} ok, ${falhou} falha(s)`);
  await deleteApp(app);
  process.exit(falhou === 0 ? 0 : 1);
}

rodar().catch(async (erro) => {
  console.error('\nErro inesperado:', erro.code || erro.message);
  process.exit(1);
});
