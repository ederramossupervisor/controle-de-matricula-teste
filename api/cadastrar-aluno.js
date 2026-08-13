import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function gerarCodigo() {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numeros = '0123456789';
  let codigo = '';
  for (let i = 0; i < 2; i++) codigo += letras[Math.floor(Math.random() * letras.length)];
  for (let i = 0; i < 3; i++) codigo += numeros[Math.floor(Math.random() * numeros.length)];
  return codigo;
}

function formatarCPF(cpf) {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return '';
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: 'erro', msg: 'Use POST' });
    }

    const dados = req.body;
    const email = (dados.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ status: 'erro', msg: 'E-mail não informado.' });
    }

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single();

    if (erroUsuario || !usuario) {
      return res.status(401).json({ status: 'erro', msg: 'Usuário não autorizado.' });
    }

    if (usuario.perfil !== 'SECRETARIA') {
      return res.status(403).json({ status: 'erro', msg: 'Sem permissão para cadastrar aluno.' });
    }

    if (!dados.nome || dados.nome.trim() === '') {
      return res.status(400).json({ status: 'erro', msg: 'Nome do aluno é obrigatório.' });
    }

    const cpfBruto = (dados.cpfNumero || '').replace(/\D/g, '');
    const cpfEntregue = cpfBruto.length === 11;
    const cpfFormatado = cpfEntregue ? formatarCPF(cpfBruto) : '';

    const dataMatricula = dados.dataMatricula ? new Date(dados.dataMatricula) : new Date();
    const prazoFinal = new Date(dataMatricula);
    prazoFinal.setDate(prazoFinal.getDate() + 30);

    const diffDias = Math.floor((prazoFinal - new Date()) / (1000 * 60 * 60 * 24));
    const alerta = diffDias <= 5 ? '🟡 Atenção' : '🟢 No prazo';

    let codigo = (dados.idAluno || '').trim();
    if (!codigo) {
      codigo = gerarCodigo();
    }

    const novoAluno = {
      codigo,
      nome: dados.nome.trim(),
      responsavel: dados.responsavel || '',
      telefone: dados.telefone || '',
      turma: dados.turma || '',
      escola: usuario.escola,
      data_matricula: dataMatricula.toISOString().slice(0, 10),
      prazo_final: prazoFinal.toISOString().slice(0, 10),
      certidao_entregue: false,
      cpf_entregue: cpfEntregue,
      rg_entregue: false,
      vacina_entregue: false,
      sus_entregue: false,
      residencia_entregue: false,
      resp_docs_entregue: false,
      historico_entregue: false,
      decl_transf_entregue: false,
      ed_especial: dados.edEspecial === true,
      status: '⚠️ Pendente',
      alerta,
      situacao: 'Ativo',
      observacoes: dados.observacoes || '',
      cpf_numero: cpfFormatado,
      raca_cor: dados.racaCor || '',
      filiacao_1: dados.filiacao1 || '',
      filiacao_2: dados.filiacao2 || '',
      data_nascimento: dados.dataNascimento || null,
      naturalidade: dados.naturalidade || '',
      uf_nascimento: dados.ufNascimento || '',
      nacionalidade: dados.nacionalidade || '',
      usuario_atualizacao: email,
      data_atualizacao: new Date().toISOString()
    };

    const { error } = await supabase.from('alunos').insert(novoAluno);

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ status: 'erro', msg: 'Já existe um aluno com esse ID. Escolha outro ou deixe em branco.' });
      }
      return res.status(500).json({ status: 'erro', msg: error.message });
    }

    return res.status(200).json({ status: 'ok', msg: 'Aluno cadastrado com sucesso!', codigo });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ status: 'erro', msg: 'Erro interno do servidor.' });
  }
}
