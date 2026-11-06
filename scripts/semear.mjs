// Script executado UMA VEZ para criar os dados de demonstração no Firebase:
// três usuários (um administrador e dois técnicos), o estoque inicial e
// algumas requisições de exemplo.
//
// Como usar (na pasta do projeto, com o Firestore ainda em "modo de teste"):
//   node scripts/semear.mjs
//
// Depois de rodar, publique as regras do arquivo firestore.rules no console.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, getDocs, writeBatch } from 'firebase/firestore';

const pastaDoScript = dirname(fileURLToPath(import.meta.url));
const raiz = join(pastaDoScript, '..');
const ler = (caminho) => JSON.parse(readFileSync(join(raiz, caminho), 'utf8'));

const credenciais = ler('firebase.config.json');
const ITENS = ler('src/data/itensIniciais.json');

// Senhas apenas de demonstração. O Firebase guarda somente o hash delas.
const USUARIOS = [
  { nome: 'Ana Souza', email: 'admin@flexfibra.com', senha: 'admin123', perfil: 'admin' },
  { nome: 'Carlos Lima', email: 'tecnico@flexfibra.com', senha: 'tecnico123', perfil: 'tecnico' },
  { nome: 'Bruno Alves', email: 'bruno@flexfibra.com', senha: 'tecnico123', perfil: 'tecnico' },
];

const app = initializeApp(credenciais);
const auth = getAuth(app);
const db = getFirestore(app);

const horasAtras = (horas) => new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();

// Cria a conta no Authentication; se já existir, apenas faz login para pegar o uid.
// O cadastro no Firestore é gravado depois, com a sessão do administrador,
// porque as regras de segurança só deixam o admin definir o perfil de alguém.
async function garantirConta({ email, senha }) {
  try {
    const conta = (await createUserWithEmailAndPassword(auth, email, senha)).user;
    console.log(`  conta criada: ${email}`);
    return conta.uid;
  } catch (erro) {
    if (erro.code !== 'auth/email-already-in-use') throw erro;
    const conta = (await signInWithEmailAndPassword(auth, email, senha)).user;
    console.log(`  conta já existia: ${email}`);
    return conta.uid;
  }
}

async function limparColecao(nome) {
  const consulta = await getDocs(collection(db, nome));
  if (consulta.empty) return 0;

  const lote = writeBatch(db);
  consulta.docs.forEach((documento) => lote.delete(documento.ref));
  await lote.commit();
  return consulta.size;
}

async function semear() {
  if (credenciais.apiKey.startsWith('COLE_AQUI')) {
    throw new Error('Preencha o arquivo firebase.config.json com os dados do seu projeto antes de rodar este script.');
  }

  console.log(`Projeto: ${credenciais.projectId}\n`);

  console.log('1) Contas de acesso');
  const ids = {};
  for (const usuario of USUARIOS) {
    ids[usuario.email] = await garantirConta(usuario);
  }

  // Daqui em diante tudo é gravado como administrador
  const admin = USUARIOS.find((u) => u.perfil === 'admin');
  await signInWithEmailAndPassword(auth, admin.email, admin.senha);

  console.log('\n2) Perfis de acesso');
  const lotePerfis = writeBatch(db);
  USUARIOS.forEach((usuario) => {
    lotePerfis.set(doc(db, 'usuarios', ids[usuario.email]), {
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      criadoEm: new Date().toISOString(),
    });
  });
  await lotePerfis.commit();
  USUARIOS.forEach((usuario) => console.log(`  ${usuario.email}: ${usuario.perfil}`));

  console.log('\n3) Estoque');
  console.log(`  apagados: ${await limparColecao('itens')} item(ns)`);
  const loteItens = writeBatch(db);
  const idsItens = {};
  ITENS.forEach((item) => {
    const referencia = doc(collection(db, 'itens'));
    idsItens[item.nome] = referencia.id;
    loteItens.set(referencia, item);
  });
  await loteItens.commit();
  console.log(`  gravados: ${ITENS.length} itens`);

  console.log('\n4) Requisições de exemplo');
  console.log(`  apagadas: ${await limparColecao('requisicoes')} requisição(ões)`);

  const buscar = (nome) => ITENS.find((item) => item.nome === nome);
  const exemplos = [
    { item: 'ONU GPON Wi-Fi', quantidade: 2, observacao: 'OS 4821 - instalação residencial',
      email: 'tecnico@flexfibra.com', nome: 'Carlos Lima', status: 'pendente', horas: 1 },
    { item: 'Cabo Drop Flat 1FO', quantidade: 150, observacao: 'Troca de drop rompido',
      email: 'bruno@flexfibra.com', nome: 'Bruno Alves', status: 'pendente', horas: 3 },
    { item: 'Conector Rápido SC/APC', quantidade: 20, observacao: 'Reposição da maleta',
      email: 'tecnico@flexfibra.com', nome: 'Carlos Lima', status: 'aprovada', horas: 26 },
    { item: 'Power Meter Óptico', quantidade: 1, observacao: '',
      email: 'bruno@flexfibra.com', nome: 'Bruno Alves', status: 'negada', horas: 50,
      motivo: 'Equipamento em calibração. Use o da base.' },
  ];

  // As regras de segurança só deixam o TÉCNICO criar uma requisição, e sempre
  // como pendente. Por isso o script repete o caminho real: entra como cada
  // técnico para criar o pedido e, depois, entra como administrador para responder.
  const criadas = [];
  for (const exemplo of exemplos) {
    const tecnico = USUARIOS.find((usuario) => usuario.email === exemplo.email);
    await signInWithEmailAndPassword(auth, tecnico.email, tecnico.senha);

    const item = buscar(exemplo.item);
    const referencia = await addDoc(collection(db, 'requisicoes'), {
      itemId: idsItens[exemplo.item],
      itemNome: item.nome,
      unidade: item.unidade,
      quantidade: exemplo.quantidade,
      observacao: exemplo.observacao,
      tecnicoId: ids[exemplo.email],
      tecnicoNome: exemplo.nome,
      status: 'pendente',
      criadaEm: horasAtras(exemplo.horas),
      respondidaEm: null,
      respondidaPorNome: null,
      motivoNegacao: '',
    });

    criadas.push({ id: referencia.id, exemplo });
  }
  console.log(`  criadas pelos técnicos: ${criadas.length}`);

  await signInWithEmailAndPassword(auth, admin.email, admin.senha);
  const respondidas = criadas.filter(({ exemplo }) => exemplo.status !== 'pendente');

  const loteRespostas = writeBatch(db);
  respondidas.forEach(({ id, exemplo }) => {
    loteRespostas.update(doc(db, 'requisicoes', id), {
      status: exemplo.status,
      respondidaEm: horasAtras(exemplo.horas - 1),
      respondidaPorNome: admin.nome,
      motivoNegacao: exemplo.motivo || '',
    });
  });
  await loteRespostas.commit();
  console.log(`  respondidas pelo administrador: ${respondidas.length}`);

  console.log('\nPronto! Dados de demonstração recarregados.');
}

semear()
  .then(() => process.exit(0))
  .catch((erro) => {
    console.error('\nErro ao semear:', erro.message);
    process.exit(1);
  });
