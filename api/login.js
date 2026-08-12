import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
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

  const hashDigitado = crypto.createHash('sha256').update(senha).digest('hex');

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
