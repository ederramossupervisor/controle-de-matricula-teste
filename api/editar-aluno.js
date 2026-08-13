import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: 'erro', msg: 'Use POST' });
    }

    const dados = req.body;
    const email = (dados.email || '').trim().toLowerCase();
    const codigo = dados.codigo;

    if (!email || !codigo) {
      return res.status(400).json({ status: 'erro', msg: 'Dados insuficientes.' });
    }

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios').select('*').eq('email', email).single();

    if (erroUsuario || !usuario) {
      return res.status(401).json({ status: 'erro', msg: 'Não autorizado.' });
    }

    const { data: aluno, error: erroAluno } = await supabase
      .from('alunos').select('*').eq('codigo', codigo).single();

    if (erroAluno || !aluno) {
      return res.status(404).json({ status: 'erro', msg: 'Aluno não encontrado.' });
    }

    if (usuario.perfil !== 'SUPERVISOR' && aluno.escola !== usuario.escola) {
      return res.status(403).json({ status: 'erro', msg: 'Sem permissão para editar este aluno.' });
    }

    const camposEditaveis = {
      nome: dados.nome,
      responsavel: dados.responsavel,
      telefone: dados.telefone,
      turma: dados.turma,
      observacoes: dados.observacoes,
      raca_cor: dados.racaCor,
      filiacao_1: dados.filiacao1,
      filiacao_2: dados.filiacao2,
      data_nascimento: dados.dataNascimento,
      naturalidade: dados.naturalidade,
      uf_nascimento: dados.ufNascimento,
      nacionalidade: dados.nacionalidade,
      ed_especial: dados.edEspecial === true
    };

    // remove campos que não vieram no pedido (undefined), pra não apagar o que já existia
    Object.keys(camposEditaveis).forEach(campo => {
      if (camposEditaveis[campo] === undefined) delete camposEditaveis[campo];
    });

    camposEditaveis.usuario_atualizacao = email;
    camposEditaveis.data_atualizacao = new Date().toISOString();

    const { error } = await supabase.from('alunos').update(camposEditaveis).eq('codigo', codigo);

    if (error) {
      return res.status(500).json({ status: 'erro', msg: error.message });
    }

    return res.status(200).json({ status: 'ok', msg: 'Dados atualizados com sucesso!' });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ status: 'erro', msg: 'Erro interno do servidor.' });
  }
}
