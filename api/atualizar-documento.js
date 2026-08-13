import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Estes 8 documentos entram no cálculo de "Completo" (é assim no sistema original —
// RG e Ed. Especial não entram nessa conta, de propósito, para manter o comportamento igual)
const CAMPOS_STATUS = [
  'certidao_entregue', 'cpf_entregue', 'vacina_entregue', 'sus_entregue',
  'residencia_entregue', 'resp_docs_entregue', 'historico_entregue', 'decl_transf_entregue'
];

const CAMPOS_PERMITIDOS = [...CAMPOS_STATUS, 'rg_entregue', 'ed_especial'];

function calcularStatus(aluno) {
  const completo = CAMPOS_STATUS.every(campo => aluno[campo] === true);
  return completo ? '✅ Completo' : '⚠️ Pendente';
}

function calcularAlerta(prazoFinal, status) {
  if (status === '✅ Completo') return '';
  if (!prazoFinal) return '';
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(prazoFinal); prazo.setHours(0, 0, 0, 0);
  const diffDias = Math.floor((prazo - hoje) / (1000 * 60 * 60 * 24));
  if (diffDias < 0) return '🔴 Vencido';
  if (diffDias <= 5) return '🟡 Atenção';
  return '🟢 No prazo';
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ status: 'erro', msg: 'Use POST' });
    }

    const { email, codigo, campo, valor } = req.body;
    const emailLimpo = (email || '').trim().toLowerCase();

    if (!emailLimpo || !codigo || !campo) {
      return res.status(400).json({ status: 'erro', msg: 'Dados insuficientes.' });
    }
    if (!CAMPOS_PERMITIDOS.includes(campo)) {
      return res.status(400).json({ status: 'erro', msg: 'Campo inválido.' });
    }

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios').select('*').eq('email', emailLimpo).single();

    if (erroUsuario || !usuario) {
      return res.status(401).json({ status: 'erro', msg: 'Não autorizado.' });
    }
    if (usuario.perfil !== 'SECRETARIA' && usuario.perfil !== 'SUPERVISOR') {
      return res.status(403).json({ status: 'erro', msg: 'Sem permissão.' });
    }

    const { data: aluno, error: erroAluno } = await supabase
      .from('alunos').select('*').eq('codigo', codigo).single();

    if (erroAluno || !aluno) {
      return res.status(404).json({ status: 'erro', msg: 'Aluno não encontrado.' });
    }
    if (usuario.perfil === 'SECRETARIA' && aluno.escola !== usuario.escola) {
      return res.status(403).json({ status: 'erro', msg: 'Sem permissão para editar aluno de outra escola.' });
    }

    const alunoAtualizado = { ...aluno, [campo]: valor === true };
    const novoStatus = calcularStatus(alunoAtualizado);
    const novoAlerta = calcularAlerta(alunoAtualizado.prazo_final, novoStatus);

    const { error } = await supabase.from('alunos').update({
      [campo]: valor === true,
      status: novoStatus,
      alerta: novoAlerta,
      usuario_atualizacao: emailLimpo,
      data_atualizacao: new Date().toISOString()
    }).eq('codigo', codigo);

    if (error) {
      return res.status(500).json({ status: 'erro', msg: error.message });
    }

    return res.status(200).json({ status: 'ok', novoStatus, novoAlerta });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ status: 'erro', msg: 'Erro interno do servidor.' });
  }
}
