import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { escola } = req.query;

  let query = supabase.from('alunos').select('*').order('nome');

  if (escola) {
    query = query.eq('escola', escola);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ erro: error.message });
  }

  return res.status(200).json(data);
}
