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

    const { email, codigo } = req.body;
    const emailLimpo = (email || '').trim().toLowerCase();

    if (!emailLimpo || !codigo) {
      return res.status(400).json({ status: 'erro', msg: 'Dados insuficientes.' });
    }

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios').select('*').eq('email', emailLimpo).single();

    if (erroUsuario || !usuario) {
      return res.status(401).json({ status: 'erro', msg: 'Não autorizado.' });
    }

    const { data: aluno, error: erroAluno } = await supabase
      .from('alunos').select('*').eq('codigo', codigo).single();

    if (erroAluno || !aluno) {
      return res.status(404).json({ status: 'erro', msg: 'Aluno não encontrado.' });
    }

    if (usuario.perfil !== 'SUPERVISOR' && aluno.escola !== usuario.escola) {
      return res.status(403).json({ status: 'erro', msg: 'Sem permissão para excluir aluno de outra escola.' });
    }

    const { error } = await supabase.from('alunos').delete().eq('codigo', codigo);

    if (error) {
      return res.status(500).json({ status: 'erro', msg: error.message });
    }

    return res.status(200).json({ status: 'ok', msg: 'Aluno excluído com sucesso.' });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ status: 'erro', msg: 'Erro interno do servidor.' });
  }
}
