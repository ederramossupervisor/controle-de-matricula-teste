import { createClient } from '@supabase/supabase-js';
// CORREÇÃO AQUI: Importe apenas a função que você usa, sem o 'default'
import { createHash } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Adicione um try/catch global para garantir que SEMPRE retorne um JSON
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ erro: 'Use POST' });
    }

    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ autorizado: false, msg: 'E-mail e senha obrigatórios.' });
    }

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !usuario) {
      return res.status(200).json({ autorizado: false, msg: 'E-mail não encontrado.' });
    }

    // CORREÇÃO AQUI: Agora 'createHash' está definido corretamente
    const hashDigitado = createHash('sha256').update(senha).digest('hex');

    if (hashDigitado !== usuario.senha_hash) {
      return res.status(200).json({ autorizado: false, msg: 'Senha incorreta.' });
    }

    let escolasSupervisionadas = [];
    if (usuario.perfil === 'SUPERVISOR') {
      const { data: escolas } = await supabase
        .from('escolas_supervisionadas')
        .select('escola')
        .eq('email_supervisor', usuario.email);
      escolasSupervisionadas = (escolas || []).map(e => e.escola);
    }

    const EMAIL_ADMINISTRADOR = 'eder.ramos@educador.edu.es.gov.br';

    return res.status(200).json({
      autorizado: true,
      perfil: usuario.perfil,
      escola: usuario.escola,
      nome: usuario.nome || '',
      primeiroAcesso: usuario.primeiro_acesso === true,
      escolasSupervisionadas,
      ehAdministrador: usuario.email.trim().toLowerCase() === EMAIL_ADMINISTRADOR
    });

  } catch (error) {
    // Isso evita que a função quebre silenciosamente e retorna um JSON de erro
    console.error('Erro interno na API:', error);
    return res.status(500).json({ 
      autorizado: false, 
      msg: 'Erro interno do servidor. Verifique os logs.' 
    });
  }
}
