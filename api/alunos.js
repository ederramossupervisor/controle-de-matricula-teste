import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const EMAIL_ADMINISTRADOR = 'eder.ramos@educador.edu.es.gov.br';

export default async function handler(req, res) {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ erro: 'E-mail obrigatório.' });
    }

    const emailLimpo = email.trim().toLowerCase();

    const { data: usuario, error: erroUsuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', emailLimpo)
      .single();

    if (erroUsuario || !usuario) {
      return res.status(401).json({ erro: 'não autorizado' });
    }

    const ehAdmin = emailLimpo === EMAIL_ADMINISTRADOR;

    let query = supabase.from('alunos').select('*').order('nome');

    if (usuario.perfil === 'SECRETARIA' || usuario.perfil === 'PEDAGOGICO') {
      // só a própria escola
      query = query.eq('escola', usuario.escola);
    } else if (usuario.perfil === 'SUPERVISOR' && !ehAdmin) {
      // só as escolas supervisionadas
      const { data: escolasSup } = await supabase
        .from('escolas_supervisionadas')
        .select('escola')
        .eq('email_supervisor', usuario.email);

      const listaEscolas = (escolasSup || []).map(e => e.escola);

      if (listaEscolas.length === 0) {
        return res.status(200).json([]); // não supervisiona nenhuma escola ainda
      }
      query = query.in('escola', listaEscolas);
    }
    // se for admin, não filtra nada — vê tudo

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ erro: error.message });
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}
