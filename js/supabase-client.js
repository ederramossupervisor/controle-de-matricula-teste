// js/supabase-client.js
// ============================================================
// CAMADA SUPABASE (Etapa 2): login, leitura e gravação de ALUNOS
// ============================================================
// O que passa por aqui: login/senha (Supabase Auth), listagem de alunos
// (com filtros, paginação e métricas feitos no banco) e as gravações de
// aluno (cadastrar, editar, documentos, situação, excluir).
// Todo o resto do sistema continua chamando o Apps Script (API_URL).
//
// Segurança: as permissões (quem vê/edita qual escola) são aplicadas pelo
// PRÓPRIO BANCO (RLS). O navegador só envia o token de login do usuário.

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

let perfilSbCache = null;                 // linha da tabela usuarios do usuário logado
window._recuperandoSenha = /type=recovery/.test(window.location.hash || '');

sb.auth.onAuthStateChange(function (evento) {
  if (evento === 'SIGNED_OUT') perfilSbCache = null;
  if (evento === 'PASSWORD_RECOVERY') {
    window._recuperandoSenha = true;
    setTimeout(solicitarNovaSenhaRecuperacao, 300);
  }
});

// ------------------------------------------------------------
// PERFIL / LOGIN
// ------------------------------------------------------------
async function carregarPerfilSb(forcar = false) {
  if (perfilSbCache && !forcar) return perfilSbCache;
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data, error } = await sb.from('usuarios').select('*').eq('id', session.user.id).maybeSingle();
  if (error || !data) return null;
  perfilSbCache = data;
  return data;
}

async function loginSb(email, senha) {
  const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: senha });
  if (error) {
    if (/invalid login/i.test(error.message)) throw new Error('E-mail ou senha incorretos.');
    throw new Error('Não foi possível entrar: ' + error.message);
  }
  const perfil = await carregarPerfilSb(true);
  if (!perfil) {
    await sb.auth.signOut();
    throw new Error('Seu usuário não está cadastrado no sistema. Procure a supervisão.');
  }
  return perfil;
}

async function solicitarNovaSenhaRecuperacao() {
  let nova = '';
  while (true) {
    nova = prompt('Digite sua nova senha (mínimo 6 caracteres):');
    if (nova === null) return;
    if (nova.length >= 6) break;
    alert('A senha precisa ter pelo menos 6 caracteres.');
  }
  const { error } = await sb.auth.updateUser({ password: nova });
  if (error) { mostrarToast('Não foi possível definir a senha: ' + error.message, 'error'); return; }
  try { await sb.rpc('concluir_primeiro_acesso'); } catch (_) {}
  window._recuperandoSenha = false;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  mostrarToast('Senha definida com sucesso!', 'success');
  const perfil = await carregarPerfilSb(true);
  if (perfil) {
    emailUsuario = perfil.email;
    nomeUsuario = perfil.nome || perfil.email;
    localStorage.setItem('emailUsuario', emailUsuario);
    localStorage.setItem('nomeUsuario', nomeUsuario);
    carregarAlunos();
  }
}

// ------------------------------------------------------------
// TERMO DE COMPROMISSO / CONSENTIMENTO (agora no Supabase)
// ------------------------------------------------------------
async function statusTermoSb() {
  const p = await carregarPerfilSb();
  if (!p) throw new Error('sessao_expirada');
  if (p.is_admin) return { enviado: true, status: 'aprovado', aprovado: true };
  const { data, error } = await sb.from('termos_usuarios').select('*').eq('usuario_id', p.id).maybeSingle();
  if (error) throw error;
  if (!data) return { enviado: false, status: null, aprovado: false };
  return {
    enviado: true, status: data.status, aprovado: data.status === 'aprovado',
    fileName: data.arquivo_nome || '', dataEnvio: data.data_envio,
    aprovadoPor: data.aprovado_por || '', dataAprovacao: data.data_aprovacao, obs: data.obs || ''
  };
}

async function consentimentoSb() {
  const p = await carregarPerfilSb();
  if (!p) throw new Error('sessao_expirada');
  if (p.is_admin) return { consentiu: true };
  const { data, error } = await sb.from('consentimentos').select('id').eq('usuario_id', p.id).eq('versao', '1.0').limit(1);
  if (error) throw error;
  return { consentiu: data.length > 0 };
}

async function listarTermosSb() {
  const p = await carregarPerfilSb();
  if (!p || !p.is_admin) return { erro: 'não autorizado' };
  const { data, error } = await sb.from('termos_usuarios').select('*').order('data_envio', { ascending: false });
  if (error) throw error;
  const itens = await Promise.all(data.map(async function (t) {
    let viewUrl = '';
    if (t.arquivo_path) {
      const r = await sb.storage.from('termos').createSignedUrl(t.arquivo_path, 3600);
      viewUrl = r.data ? r.data.signedUrl : '';
    } else if (t.arquivo_drive_id) {
      viewUrl = `https://drive.google.com/file/d/${t.arquivo_drive_id}/view`;
    }
    return {
      email: t.email, status: t.status, fileName: t.arquivo_nome || '', dataEnvio: t.data_envio,
      aprovadoPor: t.aprovado_por || '', dataAprovacao: t.data_aprovacao, obs: t.obs || '', viewUrl: viewUrl
    };
  }));
  const ordem = { pendente: 0, recusado: 1, aprovado: 2 };
  itens.sort(function (a, b) { return (ordem[a.status] - ordem[b.status]) || String(b.dataEnvio).localeCompare(String(a.dataEnvio)); });
  return itens;
}

async function contarTermosPendentesSb() {
  const p = await carregarPerfilSb();
  if (!p || !p.is_admin) return { pendentes: 0 };
  const { count, error } = await sb.from('termos_usuarios').select('usuario_id', { count: 'exact', head: true }).eq('status', 'pendente');
  if (error) throw error;
  return { pendentes: count || 0 };
}

async function listarUsuariosSb() {
  const p = await carregarPerfilSb();
  if (!p || !(p.is_admin || (p.perfis || []).includes('SUPERVISOR'))) return { erro: 'não autorizado' };
  const { data, error } = await sb.from('usuarios').select('email, nome, perfis, escola, primeiro_acesso');
  if (error) throw error;
  let lista = data;
  if (!p.is_admin) lista = lista.filter(function (u) { return !(u.perfis || []).includes('SUPERVISOR') && u.email !== p.email; });
  lista.sort(function (a, b) { return String(a.nome || a.email).localeCompare(String(b.nome || b.email), 'pt-BR'); });
  return lista.map(function (u) {
    return { EMAIL: u.email, NOME: u.nome || '', PERFIL: (u.perfis || []).join(','), ESCOLA: u.escola || '', PRIMEIRO_ACESSO: u.primeiro_acesso };
  });
}

async function chamarAdminUsuarios(payload) {
  const { data, error } = await sb.functions.invoke('admin-usuarios', { body: payload });
  if (error) {
    let msg = error.message;
    try { const j = await error.context.json(); msg = j.msg || msg; } catch (_) {}
    throw new Error(msg);
  }
  if (!data || data.status !== 'ok') throw new Error((data && data.msg) || 'Falha na operação.');
  return data;
}

function mostrarSenhaTemporaria(email, r) {
  if (!r || !r.senhaTemporaria) return;
  setTimeout(function () {
    prompt('O e-mail não foi enviado. Copie a senha temporária de ' + email + ' e repasse ao usuário:', r.senhaTemporaria);
  }, 300);
}

// ------------------------------------------------------------
// LEITURA DE ALUNOS
// ------------------------------------------------------------
const ALERTA_TELA = { 'Vencido': '🔴 Vencido', 'Atenção': '🟡 Atenção', 'No prazo': '🟢 No prazo', '': '' };

function dataParaTela(d) { return d ? d + 'T12:00:00' : ''; }

function alunoSbParaTela(a) {
  const drive = function (id) { return id ? `https://drive.google.com/file/d/${id}/view` : null; };
  return {
    _row: a.seq,                       // número estável que identifica o aluno nas telas
    ID: a.codigo,
    ALUNO: a.nome,
    ESCOLA: a.escola,
    RESPONSAVEL: a.responsavel || '',
    TELEFONE: a.telefone || '',
    TURMA: a.turma || '',
    DATA_MATRICULA: dataParaTela(a.data_matricula),
    PRAZO_FINAL: dataParaTela(a.prazo_final),
    CERTIDAO: a.certidao_entregue === true,
    CPF: a.cpf_entregue === true,
    RG: a.rg_entregue === true,
    VACINA: a.vacina_entregue === true,
    SUS: a.sus_entregue === true,
    RESIDENCIA: a.residencia_entregue === true,
    RESP_DOCS: a.resp_docs_entregue === true,
    HISTORICO: a.historico_entregue === true,
    DECL_TRANSF: a.decl_transf_entregue === true,
    ED_ESPECIAL: a.ed_especial === true,
    STATUS: a.status === 'Completo' ? '✅ Completo' : '⚠️ Pendente',
    ALERTA: ALERTA_TELA[a.alerta] !== undefined ? ALERTA_TELA[a.alerta] : '',
    DATA_ATUALIZACAO: a.data_atualizacao,
    USUARIO_ATUALIZACAO: a.usuario_atualizacao || '',
    SITUACAO: a.situacao,
    OBSERVACOES: a.observacoes || '',
    CPF_NUMERO: a.cpf_numero || '',
    RACA_COR: a.raca_cor || '',
    FILIACAO_1: a.filiacao_1 || '',
    FILIACAO_2: a.filiacao_2 || '',
    DATA_NASCIMENTO: a.data_nascimento ? dataParaTela(a.data_nascimento) : '',
    NATURALIDADE: a.naturalidade || '',
    UF_NASCIMENTO: a.uf_nascimento || '',
    NACIONALIDADE: a.nacionalidade || '',
    FOTO: (!a.foto_path && a.foto_drive_id) ? `https://drive.google.com/thumbnail?id=${a.foto_drive_id}&sz=w200` : null,
    _TERMO_RESP_ID: a.termo_resp_path ? 'sb:' + encodeURIComponent(a.termo_resp_path) : (a.termo_resp_drive_id || null),
    TERMO_RESP: a.termo_resp_path ? null : drive(a.termo_resp_drive_id),
    _DECL_ED_ESPECIAL_ID: a.decl_ed_especial_path ? 'sb:' + encodeURIComponent(a.decl_ed_especial_path) : (a.decl_ed_especial_drive_id || null),
    DECL_ED_ESPECIAL: a.decl_ed_especial_path ? null : drive(a.decl_ed_especial_drive_id),
    _FOTO_PATH: a.foto_path || null
  };
}

function termoDeBusca(texto) {
  const t = (texto || '').trim();
  if (!t) return null;
  if (/^[\d\s.\-()\/]+$/.test(t)) return t.replace(/\D/g, '') || null;   // CPF/telefone: só dígitos
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function statusParaFiltro(valor) {
  if (valor === '✅ Completo') return 'completo';
  if (valor === '⚠️ Pendente / Vencido') return 'pendente';
  if (valor === '🔴 Vencido') return 'vencido';
  return null;
}

// Devolve o MESMO formato que o Apps Script devolvia (alunos, metricas, paginação...),
// para reaproveitar as telas sem reescrevê-las.
async function buscarDadosAlunosSb(pagina = 1, filtros = {}, limite = 20) {
  try {
    const perfil = await carregarPerfilSb();
    if (!perfil) return { erro: 'sessao_expirada' };

    // Termo de compromisso (provisório): só consulta o Apps Script uma vez por sessão.
    if (!perfil.is_admin && sessionStorage.getItem('termo_ok_' + perfil.email) !== '1') {
      let t = null;
      try { t = await statusTermoSb(); } catch (_) {}
      if (!t) return { erro: 'falha_termo' };
      if (!(t.enviado && t.status === 'aprovado')) {
        return { erro: 'termo_pendente', status: t.enviado ? t.status : null, obs: t.obs || '' };
      }
      sessionStorage.setItem('termo_ok_' + perfil.email, '1');
    }

    const perfis = perfil.perfis || [];
    const soEscola = !perfis.includes('SUPERVISOR') && !perfil.is_admin;
    const inativos = filtros.modo === 'inativos';
    const termo = termoDeBusca(filtros.nome);
    const statusF = statusParaFiltro(filtros.status);
    let situacao = filtros.situacao || null;
    if (soEscola && !inativos) situacao = 'Ativo';

    const aplicar = function (q) {
      if (filtros.escola) q = q.eq('escola', filtros.escola);
      if (filtros.turma) q = q.eq('turma', filtros.turma);
      if (termo) q = q.like('busca', '%' + termo.replace(/[%_\\]/g, '\\$&') + '%');
      if (inativos) q = q.neq('situacao', 'Ativo');
      else if (situacao) q = q.eq('situacao', situacao);
      if (statusF === 'completo') q = q.eq('status', 'Completo');
      if (statusF === 'pendente') q = q.neq('status', 'Completo');
      if (statusF === 'vencido') q = q.eq('alerta', 'Vencido');
      return q;
    };
    const base = function (cols, opt) {
      return aplicar(sb.from('alunos_v').select(cols, opt)).order('escola').order('nome').order('seq');
    };

    // Página(s) de dados (o servidor devolve no máximo 1000 linhas por chamada)
    const inicio = (pagina - 1) * limite;
    const linhas = [];
    let contagem = null;
    for (let de = inicio; de < inicio + limite; de += 1000) {
      const ate = Math.min(de + 999, inicio + limite - 1);
      const opt = (inativos && contagem === null) ? { count: 'exact' } : undefined;
      const { data, error, count } = await base('*', opt).range(de, ate);
      if (error) throw error;
      if (count !== null && count !== undefined) contagem = count;
      linhas.push(...data);
      if (data.length < (ate - de + 1)) break;
    }

    let metricas, porEscola = {}, total, ultima = null;
    if (inativos) {
      total = contagem !== null ? contagem : linhas.length;
      metricas = { total, completos: 0, pendentes: 0, vencidos: 0 };
    } else {
      const { data: r, error } = await sb.rpc('alunos_resumo', {
        p_escola: filtros.escola || null, p_turma: filtros.turma || null, p_busca: termo,
        p_status: statusF, p_situacao: situacao
      });
      if (error) throw error;
      total = r.total;
      metricas = { total: r.total, completos: r.completos, pendentes: r.pendentes, vencidos: r.vencidos };
      porEscola = r.por_escola || {};
      ultima = r.ultima_atualizacao || null;
    }

    // fotos guardadas no Storage: links temporários (1 h), em lote
    const telas = linhas.map(alunoSbParaTela);
    const comFoto = telas.filter(function (t) { return t._FOTO_PATH; });
    if (comFoto.length) {
      const r = await sb.storage.from('alunos-arquivos').createSignedUrls(comFoto.map(function (t) { return t._FOTO_PATH; }), 3600);
      const porCaminho = {};
      (r.data || []).forEach(function (x) { if (x.signedUrl) porCaminho[x.path] = x.signedUrl; });
      comFoto.forEach(function (t) { t.FOTO = porCaminho[t._FOTO_PATH] || null; });
    }

    return {
      perfil: perfis.join(','),
      escola: perfil.escola,
      alunos: telas,
      totalRegistros: total,
      paginaAtual: pagina,
      totalPaginas: Math.ceil(total / limite),
      limite: limite,
      metricas: metricas,
      resumoPorEscola: porEscola,
      escolasSupervisionadas: perfil.escolas_supervisionadas || [],
      ultimaAtualizacao: ultima
    };
  } catch (e) {
    console.error('Erro ao consultar alunos no Supabase:', e);
    if (e && (e.status === 401 || /jwt/i.test(e.message || ''))) return { erro: 'sessao_expirada' };
    return { erro: 'falha_consulta' };
  }
}

// ------------------------------------------------------------
// GRAVAÇÃO DE ALUNOS
// ------------------------------------------------------------
const CAMPO_POR_COLUNA = {
  8: 'certidao_entregue', 9: 'cpf_entregue', 10: 'rg_entregue', 11: 'vacina_entregue',
  12: 'sus_entregue', 13: 'residencia_entregue', 14: 'resp_docs_entregue',
  15: 'historico_entregue', 16: 'decl_transf_entregue', 17: 'ed_especial'
};

const RACA_COR_FEM = { branco: 'Branca', preto: 'Preta', pardo: 'Parda', amarelo: 'Amarela', 'indígena': 'Indígena',
  branca: 'Branca', preta: 'Preta', parda: 'Parda', amarela: 'Amarela' };

function racaCorSb(v) {
  const t = (v || '').toString().trim();
  return t ? (RACA_COR_FEM[t.toLowerCase()] || t) : null;
}

function cpfFormatado(v) {
  const n = (v || '').toString().replace(/\D/g, '');
  return n.length === 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : null;
}

function paraDataIso(s) {
  if (!s) return null;
  s = String(s).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  return null;
}

function hojeSaoPaulo() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function somarDias(iso, dias) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

function gerarCodigoAluno() {
  const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return L[Math.floor(Math.random() * 26)] + L[Math.floor(Math.random() * 26)] +
    String(Math.floor(Math.random() * 1000)).padStart(3, '0');
}

function mensagemErroSb(e) {
  if (!e) return 'Erro desconhecido.';
  if (e.code === '23505') return 'Já existe um aluno com esse ID nesta escola.';
  if (e.code === '42501') return 'Você não tem permissão para esta ação.';
  return e.message || 'Erro ao salvar.';
}

async function exigirLinhasAfetadas(promessa) {
  const { data, error } = await promessa;
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('Sem permissão para alterar este aluno (ou ele não foi encontrado).');
  return data;
}

// campos opcionais só entram no UPDATE se vieram na chamada (não apagam o que já existe)
function camposDoAluno(d) {
  const c = {};
  const texto = function (k, col) { if (d[k] !== undefined) c[col || k] = (d[k] === '' || d[k] === null) ? null : String(d[k]); };
  texto('nome');
  texto('responsavel'); texto('telefone'); texto('turma'); texto('observacoes');
  texto('filiacao1', 'filiacao_1'); texto('filiacao2', 'filiacao_2');
  texto('naturalidade'); texto('ufNascimento', 'uf_nascimento'); texto('nacionalidade');
  if (d.racaCor !== undefined) c.raca_cor = racaCorSb(d.racaCor);
  if (d.dataNascimento !== undefined) c.data_nascimento = paraDataIso(d.dataNascimento);
  if (d.edEspecial !== undefined) c.ed_especial = d.edEspecial === true;
  if (d.cpfNumero !== undefined) {
    const f = cpfFormatado(d.cpfNumero);
    c.cpf_numero = f;
    c.cpf_entregue = f !== null;
  }
  return c;
}

const ACAO_ALUNO_SB = {
  async cadastrarAluno(d) {
    const perfil = await carregarPerfilSb();
    // supervisor/administrador escolhem a escola; secretaria usa a dela (o banco confere a permissão)
    const escolheEscola = !!perfil && (perfil.is_admin || (perfil.perfis || []).includes('SUPERVISOR'));
    const escolaAluno = (escolheEscola && d.escola) ? d.escola : (perfil && perfil.escola);
    if (!escolaAluno) throw new Error(escolheEscola ? 'Selecione a escola do aluno.' : 'Seu usuário não está vinculado a uma escola.');
    const dm = paraDataIso(d.dataMatricula) || hojeSaoPaulo();
    const linha = Object.assign({
      escola: escolaAluno,
      data_matricula: dm,
      prazo_final: somarDias(dm, 30)
    }, camposDoAluno(d));
    const fixo = (d.idAluno || '').toString().trim();
    for (let tentativa = 0; tentativa < 6; tentativa++) {
      linha.codigo = fixo || gerarCodigoAluno();
      const { error } = await sb.from('alunos').insert(linha);
      if (!error) return;
      if (error.code === '23505' && !fixo) continue;     // código gerado repetido: tenta outro
      throw error;
    }
    throw new Error('Não foi possível gerar um código único. Tente novamente.');
  },

  async atualizarDadosAluno(d) {
    const c = camposDoAluno(d);
    const novoCodigo = (d.idAluno || '').toString().trim();
    if (novoCodigo) c.codigo = novoCodigo;
    await exigirLinhasAfetadas(sb.from('alunos').update(c).eq('seq', d.row).select('seq'));
  },

  async atualizarDocumentosEmLote(d) {
    const porLinha = {};
    (d.alteracoes || []).forEach(function (alt) {
      const campo = CAMPO_POR_COLUNA[alt.coluna];
      if (!campo) return;
      (porLinha[alt.row] = porLinha[alt.row] || {})[campo] = alt.valor === true;
    });
    await Promise.all(Object.keys(porLinha).map(function (row) {
      return exigirLinhasAfetadas(sb.from('alunos').update(porLinha[row]).eq('seq', Number(row)).select('seq'));
    }));
  },

  async alterarSituacao(d) {
    await exigirLinhasAfetadas(sb.from('alunos').update({ situacao: d.situacao }).eq('seq', d.row).select('seq'));
  },

  async excluirAluno(d) {
    await exigirLinhasAfetadas(sb.from('alunos').delete().eq('seq', d.row).select('seq'));
  },

  async excluirAlunosLote(d) {
    const porEscola = {};
    (d.alunos || []).forEach(function (a) { if (a.id && a.escola) (porEscola[a.escola] = porEscola[a.escola] || []).push(String(a.id)); });
    for (const escola of Object.keys(porEscola)) {
      const { error } = await sb.from('alunos').delete().eq('escola', escola).in('codigo', porEscola[escola]);
      if (error) throw error;
    }
  }
};


// ------------------------------------------------------------
// TURMAS
// ------------------------------------------------------------
async function listarTurmasSb(escola) {
  let q = sb.from('turmas').select('id, escola, nome, legacy_id').order('escola').order('nome');
  if (escola) q = q.eq('escola', escola);
  const { data, error } = await q;
  if (error) { console.error('Erro ao listar turmas:', error); return []; }
  return data.map(function (t) { return { escola: t.escola, turma: t.nome, id: t.legacy_id || t.id }; });
}

async function garantirTurmasSb(escola, turmas) {
  const nomes = Array.from(new Set((turmas || []).map(function (t) { return (t || '').toString().trim(); }).filter(Boolean)));
  if (!nomes.length) return 0;
  const { data, error } = await sb.from('turmas')
    .upsert(nomes.map(function (nome) { return { escola: escola, nome: nome }; }), { onConflict: 'escola,nome', ignoreDuplicates: true })
    .select('id');
  if (error) throw error;
  return data.length;
}

// As telas pedem turmas via jsonp(...tipo=turmas...). Aqui desviamos esse pedido para o Supabase.
// ------------------------------------------------------------
// COMUNICADOS, AGENDA, DADOS DA ESCOLA, ORG. CURRICULARES, ATOS, LEGISLAÇÃO
// ------------------------------------------------------------
function isoOuVazio(v) { return v || ''; }

async function listarComunicadosSb(escola) {
  const agora = new Date().toISOString();
  let q = sb.from('comunicados').select('*').or('data_expiracao.is.null,data_expiracao.gt.' + agora);
  if (escola) q = q.or('escola.eq."' + escola.replace(/"/g, '') + '",escola.eq.TODAS');
  const { data, error } = await q.order('fixado', { ascending: false }).order('data_inicio', { ascending: false });
  if (error) throw error;
  return data.map(function (c) {
    return { id: c.id, escola: c.escola, titulo: c.titulo, texto: c.texto, prioridade: c.prioridade, fixado: c.fixado === true,
      dataInicio: c.data_inicio, dataExpiracao: isoOuVazio(c.data_expiracao), criador: c.criador };
  });
}

async function listarAgendaSb() {
  const { data, error } = await sb.from('agenda').select('*').order('data_hora');
  if (error) throw error;
  return data.map(function (e) {
    return { id: e.id, criador: e.criador, tipo: e.tipo, escola: e.escola || '', dataHora: e.data_hora,
      descricao: e.descricao || '', lembrete: e.lembrete_enviado === true };
  });
}

function dadosEscolaParaTela(e) {
  return {
    ESCOLA: e.nome, LOGRADOURO: e.logradouro || '', NUMERO: e.numero || '', BAIRRO: e.bairro || '',
    CIDADE: e.cidade || '', UF: e.uf || '', CEP: e.cep || '', EMAIL: e.email || '', TELEFONE: e.telefone || '',
    ATO_CRIACAO: e.ato_criacao || '', PUBLICACAO_CRIACAO: dataParaTela(e.publicacao_criacao),
    ATO_APROVACAO: e.ato_aprovacao || '', PUBLICACAO_APROVACAO: dataParaTela(e.publicacao_aprovacao),
    ORGANIZACAO_CURRICULAR: e.organizacao_curricular || ''
  };
}

async function obterDadosEscolaSb(escola) {
  const { data, error } = await sb.from('escolas').select('*').eq('nome', escola).maybeSingle();
  if (error) throw error;
  return data ? dadosEscolaParaTela(data) : {};
}

async function listarDadosEscolasSb() {
  const { data, error } = await sb.from('escolas').select('*').order('nome');
  if (error) throw error;
  return data.map(dadosEscolaParaTela);
}

async function listarOrgsSb(escola) {
  const { data, error } = await sb.from('org_curriculares').select('*').eq('escola', escola).order('codigo');
  if (error) throw error;
  return data.map(function (o) { return { codigo: o.codigo, nome: o.nome, etapaModalidade: o.etapa_modalidade, tipo: o.tipo }; });
}

function atoParaTela(a) {
  return {
    id: a.id, escola: a.escola, tipoAto: a.tipo_ato, cursoEtapa: a.curso_etapa || '', numeroAto: a.numero_ato || '',
    dataPublicacao: dataParaTela(a.data_publicacao), dataHomologacao: dataParaTela(a.data_homologacao),
    validadeAnos: a.validade_anos, dataVencimento: dataParaTela(a.data_vencimento), status: a.status,
    arquivoId: a.arquivo_drive_id || '', observacoes: a.observacoes || '', usuarioCadastro: a.usuario_cadastro || '',
    dataCadastro: a.data_cadastro, fundamentacao: a.fundamentacao_legal || '', cursoTecnico: a.curso_tecnico || ''
  };
}

async function listarAtosSb(u) {
  let q = sb.from('atos_v').select('*');
  const escola = u.searchParams.get('filtroEscola'), tipo = u.searchParams.get('filtroTipoAto'), status = u.searchParams.get('filtroStatus');
  const etapa = u.searchParams.get('cursoEtapa'), tecnico = u.searchParams.get('cursoTecnico');
  if (escola) q = q.eq('escola', escola);
  if (tipo) q = q.eq('tipo_ato', tipo);
  if (status) q = q.eq('status', status);
  if (etapa) q = q.eq('curso_etapa', etapa);
  if (tecnico) q = q.eq('curso_tecnico', tecnico);
  const { data, error } = await q.order('escola').order('data_publicacao', { ascending: false });
  if (error) throw error;
  const links = await linksArquivosSb('atos', data);
  return data.map(function (a, i) {
    const t = atoParaTela(a);
    if (a.arquivo_path) { t.arquivoUrl = links[i].viewUrl; t.arquivoUrlDownload = links[i].downloadUrl; }
    return t;
  });
}

async function listarLegislacaoSb(u) {
  const [leg, vin] = await Promise.all([
    sb.from('legislacao').select('*'),
    sb.from('legislacao_vinculos').select('origem, destino, tipo_vinculo')
  ]);
  if (leg.error) throw leg.error;
  if (vin.error) throw vin.error;
  const porId = {};
  leg.data.forEach(function (l) { porId[l.id] = l; });
  let itens = leg.data.map(function (l) {
    const meus = vin.data.filter(function (v) { return v.origem === l.id; });
    const tipoVinculoObj = {};
    meus.forEach(function (v) { tipoVinculoObj[v.destino] = v.tipo_vinculo; });
    return {
      id: l.id, tipo: l.tipo, numero: l.numero, ano: l.ano, assunto: l.assunto || '', arquivoId: l.arquivo_drive_id || '',
      vinculosIds: meus.map(function (v) { return v.destino; }), tipoVinculoObj: tipoVinculoObj,
      dataPublicacao: l.data_publicacao ? dataParaTela(l.data_publicacao) : '', observacoes: l.observacoes || '',
      arquivoUrl: l.arquivo_path ? sb.storage.from('legislacao').getPublicUrl(l.arquivo_path).data.publicUrl : '',
      arquivoUrlDownload: l.arquivo_path ? sb.storage.from('legislacao').getPublicUrl(l.arquivo_path, { download: true }).data.publicUrl : '',
      cadastradoPor: l.cadastrado_por || '', dataCadastro: l.data_cadastro, palavrasChave: l.palavras_chave || '',
      vinculosDetalhes: meus.map(function (v) {
        const d = porId[v.destino];
        return d ? { id: d.id, tipo: d.tipo, numero: d.numero, ano: d.ano, assunto: d.assunto || '', tipoVinculo: v.tipo_vinculo } : null;
      }).filter(Boolean)
    };
  });
  const tem = function (campo, termo) { return String(campo || '').toLowerCase().includes(String(termo).toLowerCase()); };
  const p = function (k) { return u.searchParams.get(k); };
  if (p('filtroTipo')) itens = itens.filter(function (l) { return tem(l.tipo, p('filtroTipo')); });
  if (p('filtroNumero')) itens = itens.filter(function (l) { return tem(l.numero, p('filtroNumero')); });
  if (p('filtroAno')) itens = itens.filter(function (l) { return String(l.ano) === String(p('filtroAno')); });
  if (p('filtroAssunto')) itens = itens.filter(function (l) { return tem(l.assunto, p('filtroAssunto')); });
  if (p('filtroPalavrasChave')) itens = itens.filter(function (l) { return tem(l.palavrasChave, p('filtroPalavrasChave')); });
  itens.sort(function (a, b) { return String(b.dataPublicacao).localeCompare(String(a.dataPublicacao)); });
  return u.searchParams.get('tipo') === 'legislacaoPorId' ? (itens.find(function (l) { return l.id === p('id'); }) || null) : itens;
}

// ------------------------------------------------------------
// PROFISSIONAIS
// ------------------------------------------------------------
const PROF_COLUNAS = ["ID", "NOME", "DATA_NASCIMENTO", "FILIACAO_1", "FILIACAO_2", "UF_NASCIMENTO", "MUNICIPIO_NASCIMENTO", "INEP", "LOGRADOURO", "NUMERO", "COMPLEMENTO", "BAIRRO", "CIDADE", "UF", "CEP", "CPF", "CERTIDAO_NASC", "ESCOLARIDADE", "TIPO_ENSINO_MEDIO", "CURSO_SUPERIOR", "LICENCIATURA", "POS_GRADUACAO", "MATRICULA", "SITUACAO_LOTACAO", "CARGO", "DATA_ADMISSAO_LOTACAO", "DATA_TERMINO_CONTRATO", "REGIME", "CH_MENSAL", "DATA_DESLIGAMENTO_LOTACAO", "CH_LOTACAO", "CH_VINCULO", "LOCAL_TRABALHO", "SITUACAO_VINCULO", "DATA_ADMISSAO_VINCULO", "DATA_DESLIGAMENTO_VINCULO", "SEXO", "PAIS_ORIGEM", "RACA", "NACIONALIDADE", "POVO_INDIGENA", "LOCALIZACAO_DIFERENCIADA", "DEFICIENCIAS", "TRANSTORNO_GLOBAL", "ALTAS_HABILIDADES", "ANO_CONCLUSAO_FORMACAO_1", "ANO_CONCLUSAO_FORMACAO_2", "ANO_CONCLUSAO_FORMACAO_3", "CURSO_FORMACAO_1", "CURSO_FORMACAO_2", "CURSO_FORMACAO_3", "INSTITUICAO_FORMACAO_1", "INSTITUICAO_FORMACAO_2", "INSTITUICAO_FORMACAO_3", "AREAS_CONHECIMENTO", "ZONA_RESIDENCIA", "OUTROS_CURSOS", "EMAIL", "TURMAS", "DISCIPLINAS", "TIPO_POS_1", "TIPO_POS_2", "TIPO_POS_3", "TIPO_POS_4", "TIPO_POS_5", "TIPO_POS_6", "AREA_POS_1", "AREA_POS_2", "AREA_POS_3", "AREA_POS_4", "AREA_POS_5", "AREA_POS_6", "ANO_CONCLUSAO_POS_1", "ANO_CONCLUSAO_POS_2", "ANO_CONCLUSAO_POS_3", "ANO_CONCLUSAO_POS_4", "ANO_CONCLUSAO_POS_5", "ANO_CONCLUSAO_POS_6", "NOME_POS_1", "NOME_POS_2", "NOME_POS_3", "NOME_POS_4", "NOME_POS_5", "NOME_POS_6", "RG"];
const PROF_DATAS = ["DATA_NASCIMENTO", "DATA_ADMISSAO_LOTACAO", "DATA_TERMINO_CONTRATO", "DATA_DESLIGAMENTO_LOTACAO", "DATA_ADMISSAO_VINCULO", "DATA_DESLIGAMENTO_VINCULO"];

function profissionalParaTela(p) {
  const o = { ID: p.codigo, _ESCOLA: p.escola };
  PROF_COLUNAS.forEach(function (c) {
    if (c === 'ID') return;
    const v = p[c.toLowerCase()];
    o[c] = (v === null || v === undefined) ? '' : String(v);
  });
  return o;
}

async function listarProfissionaisSb(u) {
  const escola = u.searchParams.get('escola') || '';
  const todos = [];
  for (let de = 0; ; de += 1000) {
    let q = sb.from('profissionais_v').select('*');
    if (escola) q = q.eq('escola', escola);
    const { data, error } = await q.order('escola').order('nome').order('codigo').range(de, de + 999);
    if (error) throw error;
    data.forEach(function (p) { todos.push(profissionalParaTela(p)); });
    if (data.length < 1000) break;
  }
  return todos;
}

async function idProfissionalSb(escola, codigo) {
  const { data, error } = await sb.from('profissionais').select('id').eq('escola', escola).eq('codigo', String(codigo)).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Profissional não encontrado.');
  return data.id;
}

async function listarDocumentosProfissionalSb(u) {
  const escola = u.searchParams.get('escola'), codigo = u.searchParams.get('idProfissional');
  if (!escola || !codigo) return [];
  const profId = await idProfissionalSb(escola, codigo);
  const { data, error } = await sb.from('documentos_profissionais').select('*').eq('profissional_id', profId).order('data_upload');
  if (error) throw error;
  return Promise.all(data.map(async function (d) {
    let viewUrl = null, downloadUrl = null;
    if (d.arquivo_path) {
      const v = await sb.storage.from('profissionais-docs').createSignedUrl(d.arquivo_path, 3600);
      const dl = await sb.storage.from('profissionais-docs').createSignedUrl(d.arquivo_path, 3600, { download: d.nome_arquivo || true });
      viewUrl = v.data ? v.data.signedUrl : null;
      downloadUrl = dl.data ? dl.data.signedUrl : null;
    } else if (d.arquivo_drive_id) {
      viewUrl = 'https://drive.google.com/file/d/' + d.arquivo_drive_id + '/view';
      downloadUrl = 'https://drive.google.com/uc?export=download&id=' + d.arquivo_drive_id;
    }
    return { idProfissional: codigo, escola: d.escola, tipoDocumento: d.tipo_documento, fileName: d.nome_arquivo || '',
      fileId: d.id, dataUpload: d.data_upload, usuarioUpload: d.usuario_upload || '', observacoes: d.observacoes || '',
      viewUrl: viewUrl, downloadUrl: downloadUrl };
  }));
}

async function dashboardProfissionaisSb(u) {
  const { data, error } = await sb.rpc('dashboard_profissionais', { p_escola: u.searchParams.get('escola') || null });
  if (error) throw error;
  return data.map(function (r) {
    return { escola: r.escola, total: Number(r.total), ativos: Number(r.ativos), temporarios: Number(r.temporarios),
      efetivos: Number(r.efetivos), comPendencia: Number(r.com_pendencia) };
  });
}

// ------------------------------------------------------------
// PAINÉIS: DASHBOARD, DESEMPENHO, RANKING, BUSCA GLOBAL, LOG
// ------------------------------------------------------------
async function rpcSb(nome, args) {
  const { data, error } = await sb.rpc(nome, args || {});
  if (error) throw error;
  return data;
}

async function buscaGlobalSb(termoBruto) {
  const termoTxt = (termoBruto || '').trim();
  if (termoTxt.length < 2) return [];
  const p = await carregarPerfilSb();
  if (!p) return [];
  const t = termoDeBusca(termoTxt);
  const minusculo = termoTxt.toLowerCase();
  const resultados = [];

  // alunos (nome, CPF, telefone ou código)
  const consultas = [];
  if (t) consultas.push(sb.from('alunos_v').select('*').like('busca', '%' + t.replace(/[%_\\]/g, '\\$&') + '%').order('nome').limit(12));
  consultas.push(sb.from('alunos_v').select('*').ilike('codigo', '%' + minusculo.replace(/[%_\\]/g, '\\$&') + '%').order('nome').limit(12));
  const vistos = new Set();
  for (const r of await Promise.all(consultas)) {
    if (r.error) throw r.error;
    r.data.forEach(function (a) {
      if (vistos.has(a.seq)) return;
      vistos.add(a.seq);
      const tela = alunoSbParaTela(a);
      resultados.push({ tipo: 'Aluno', titulo: tela.ALUNO, descricao: (tela.TURMA || '—') + ' · ' + tela.ESCOLA, link: 'aluno_' + tela.ID, aluno: tela });
    });
  }
  // o link do aluno usa o número interno, como nas demais telas
  resultados.forEach(function (r) { if (r.tipo === 'Aluno') r.link = 'aluno_' + r.aluno._row; });

  // legislação
  const leg = await listarLegislacaoSb(new URL(API_URL + '?tipo=legislacao'));
  leg.forEach(function (l) {
    if ((l.tipo + ' ' + l.numero + ' ' + l.ano + ' ' + l.assunto + ' ' + l.palavrasChave).toLowerCase().includes(minusculo)) {
      resultados.push({ tipo: 'Legislação', titulo: l.tipo + ' ' + l.numero + '/' + l.ano, descricao: l.assunto || 'Sem assunto', link: 'legislacao_' + l.id });
    }
  });

  // comunicados
  const soEscola = !p.is_admin && !(p.perfis || []).includes('SUPERVISOR');
  const coms = await listarComunicadosSb(soEscola ? p.escola : '');
  coms.forEach(function (c) {
    if ((c.titulo + ' ' + c.texto).toLowerCase().includes(minusculo)) {
      resultados.push({ tipo: 'Comunicado', titulo: c.titulo, descricao: String(c.texto).substring(0, 100), link: 'comunicado_' + c.id });
    }
  });
  return resultados.slice(0, 25);
}

async function listarLogAcoesSb(u) {
  const limite = parseInt(u.searchParams.get('limite'), 10) || 100;
  const { data, error } = await sb.from('log_acoes').select('*').order('data_hora', { ascending: false }).limit(limite);
  if (error) throw error;
  return data.map(function (l) {
    return { dataHora: l.data_hora, usuario: l.usuario, acao: l.acao, detalhes: l.detalhes || '', escola: l.escola || '' };
  });
}

// ------------------------------------------------------------
// PROCESSOS, DOCUMENTOS E MODELOS
// ------------------------------------------------------------
const TIPOS_DOCUMENTO_FIXOS = [
  "Certificado", "Histórico", "Diploma", "Declaração de Transferência",
  "Declaração de Escolaridade", "Declaração de Conclusão", "Ficha de Matrícula",
  "Termo de Compromisso", "Termo de Uso de Imagem", "Atestado Médico",
  "Atas de Conselho de Classe", "Listas de Alunos Concluintes", "Plano de Curso (Técnico)"
];
const TIPOS_PROCESSO_FIXOS = [
  "Cuidador", "Regularização AEE", "Calendário", "Livro de ponto", "Regimento Escolar",
  "PPP", "PDI", "PAI", "Credenciamento", "Renovação de credenciamento",
  "Aprovação de curso/etapa/modalidade", "Renovação de aprovação de curso/etapa/modalidade",
  "Regularização de Vida Escolar", "Manifestação GENPRO", "Ata Especial de RVE",
  "Ata de Classificação/Reclassificação/Avanço Escolar", "Atas de Conselho de Classe",
  "Listas de Alunos Concluintes", "Plano de Curso (Técnico)", "Plano de Intervenção PFA"
];

const _slugCache = {};
async function slugEscolaSb(nome) {
  if (_slugCache[nome]) return _slugCache[nome];
  const { data, error } = await sb.from('escolas').select('slug').eq('nome', nome).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Escola não encontrada ou sem permissão.');
  _slugCache[nome] = data.slug;
  return data.slug;
}

function nomeSeguroArquivo(nome) {
  return String(nome || 'arquivo').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]/g, '_');
}

function base64ParaBlob(b64, tipo) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: tipo || 'application/octet-stream' });
}

// links temporários (1 h) para arquivos do Storage, em lote; arquivos antigos abrem pelo Drive
async function linksArquivosSb(bucket, itens) {
  const caminhos = itens.filter(function (i) { return i.arquivo_path; }).map(function (i) { return i.arquivo_path; });
  const ver = {}, baixar = {};
  if (caminhos.length) {
    const a = await sb.storage.from(bucket).createSignedUrls(caminhos, 3600);
    (a.data || []).forEach(function (x) { if (x.signedUrl) ver[x.path] = x.signedUrl; });
    const b = await sb.storage.from(bucket).createSignedUrls(caminhos, 3600, { download: true });
    (b.data || []).forEach(function (x) { if (x.signedUrl) baixar[x.path] = x.signedUrl; });
  }
  return itens.map(function (i) {
    if (i.arquivo_path) return { viewUrl: ver[i.arquivo_path] || null, downloadUrl: baixar[i.arquivo_path] || null };
    if (i.arquivo_drive_id) return {
      viewUrl: 'https://drive.google.com/file/d/' + i.arquivo_drive_id + '/view',
      downloadUrl: 'https://drive.google.com/uc?export=download&id=' + i.arquivo_drive_id };
    return { viewUrl: null, downloadUrl: null };
  });
}

async function listarProcessosSb(u) {
  let q = sb.from('processos').select('*');
  const p = function (k) { return u.searchParams.get(k); };
  if (p('filtroTipo')) q = q.eq('tipo', p('filtroTipo'));
  if (p('filtroEscola')) q = q.eq('escola', p('filtroEscola'));
  if (p('filtroCodigo')) q = q.ilike('codigo', '%' + p('filtroCodigo').replace(/[%_\\]/g, '\\$&') + '%');
  if (p('filtroAluno')) q = q.ilike('aluno', '%' + p('filtroAluno').replace(/[%_\\]/g, '\\$&') + '%');
  const { data, error } = await q.order('criado_em').order('codigo');
  if (error) throw error;
  return data.map(function (x) {
    return { id: x.id, codigo: x.codigo, tipo: x.tipo, escola: x.escola, aluno: x.aluno || '', categoria: x.categoria || '',
      subcategoria: x.subcategoria || '', observacoes: x.observacoes || '', link: x.link || '' };
  });
}

async function listarDocumentosSb(u) {
  let q = sb.from('documentos').select('*');
  const p = function (k) { return u.searchParams.get(k); };
  if (p('filtroEscola')) q = q.eq('escola', p('filtroEscola'));
  if (p('filtroTipo')) q = q.eq('tipo', p('filtroTipo'));
  if (p('filtroNome')) q = q.ilike('nome_aluno', '%' + p('filtroNome').replace(/[%_\\]/g, '\\$&') + '%');
  const { data, error } = await q.order('data_upload', { ascending: false }).limit(500);
  if (error) throw error;
  const links = await linksArquivosSb('documentos', data);
  return data.map(function (d, i) {
    return { escola: d.escola, tipo: d.tipo, nomeAluno: d.nome_aluno || '', fileName: d.nome_arquivo || '', fileId: d.id,
      dataUpload: d.data_upload, usuario: d.usuario || '', downloadUrl: links[i].downloadUrl, viewUrl: links[i].viewUrl };
  });
}

async function tiposPersonalizadosSb(tabela, escola) {
  if (!escola) return [];
  const { data, error } = await sb.from(tabela).select('tipo').eq('escola', escola).order('tipo');
  if (error) throw error;
  return data.map(function (x) { return x.tipo; });
}

async function listarModelosSb() {
  const p = await carregarPerfilSb();
  const { data, error } = await sb.from('modelos_oficiais').select('*').order('nome');
  if (error) throw error;
  const visiveis = data.filter(function (m) { return p.is_admin || m.arquivo_path || m.arquivo_drive_id; });
  const links = await linksArquivosSb('modelos', visiveis);
  const lista = visiveis.map(function (m, i) {
    const tem = !!(m.arquivo_path || m.arquivo_drive_id);
    return { nome: m.nome, fileId: m.arquivo_drive_id || m.arquivo_path || null, fileName: m.arquivo_nome || null,
      downloadUrl: tem ? links[i].downloadUrl : null, viewUrl: tem ? links[i].viewUrl : null, temArquivo: tem };
  });
  lista.sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
  return lista;
}

async function listarModelosEscolaSb(u) {
  const p = await carregarPerfilSb();
  const oficiais = await listarModelosSb();
  const escolheEscola = p.is_admin || (p.perfis || []).includes('SUPERVISOR');
  const escola = escolheEscola ? ((u && u.searchParams.get('escola')) || '') : p.escola;
  if (!escola) return oficiais;
  const { data, error } = await sb.from('modelos_escolas').select('*').eq('escola', escola).order('nome_modelo');
  if (error) throw error;
  const links = await linksArquivosSb('modelos', data);
  const proprios = data.map(function (m, i) {
    return { nome: m.nome_modelo, fileId: m.arquivo_drive_id || m.arquivo_path, fileName: m.arquivo_nome, dataUpload: m.data_upload,
      usuario: m.usuario, temArquivo: true, downloadUrl: links[i].downloadUrl, viewUrl: links[i].viewUrl, isPersonalizado: true };
  });
  return oficiais.concat(proprios);
}

// ------------------------------------------------------------
// ARQUIVOS DE ALUNO (foto, termo de responsabilidade, declaração)
// ------------------------------------------------------------
// As telas esperam um "ID" no estilo do Drive: arquivos novos usam o prefixo "sb:" + caminho codificado.
async function urlArquivoAlunoSb(row, prefixo) {
  const { data, error } = await sb.from('alunos').select(prefixo + '_path, ' + prefixo + '_drive_id').eq('seq', Number(row)).maybeSingle();
  if (error) throw error;
  if (!data) return { url: '' };
  if (data[prefixo + '_path']) return { url: 'https://drive.google.com/file/d/sb:' + encodeURIComponent(data[prefixo + '_path']) + '/view' };
  if (data[prefixo + '_drive_id']) return { url: 'https://drive.google.com/file/d/' + data[prefixo + '_drive_id'] + '/view' };
  return { url: '' };
}

async function abrirArquivoAluno(id) {
  if (!id) return;
  if (!String(id).startsWith('sb:')) { window.open('https://drive.google.com/file/d/' + id + '/view', '_blank'); return; }
  const janela = window.open('', '_blank');     // abre já, para o navegador não bloquear
  const { data, error } = await sb.storage.from('alunos-arquivos').createSignedUrl(decodeURIComponent(String(id).slice(3)), 600);
  if (error || !data) { if (janela) janela.close(); mostrarToast('Não foi possível abrir o arquivo.', 'error'); return; }
  if (janela) janela.location = data.signedUrl; else window.open(data.signedUrl, '_blank');
}

async function guardarArquivoAlunoSb(d, prefixo, rotulo) {
  const { data: aluno, error: e0 } = await sb.from('alunos').select('id, ' + prefixo + '_path').eq('seq', Number(d.row)).maybeSingle();
  if (e0) throw e0;
  if (!aluno) throw new Error('Aluno não encontrado ou sem permissão.');
  const antigo = aluno[prefixo + '_path'];
  let novo = null;
  if (d.fileBase64) {
    const tipo = d.mimeType || 'application/octet-stream';
    const ext = (d.fileName && d.fileName.indexOf('.') >= 0) ? d.fileName.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') : 'bin';
    novo = aluno.id + '/' + rotulo + '_' + Date.now() + '.' + (ext || 'bin');
    const up = await sb.storage.from('alunos-arquivos').upload(novo, base64ParaBlob(d.fileBase64, tipo), { contentType: tipo, upsert: false });
    if (up.error) throw up.error;
  }
  const campos = {};
  campos[prefixo + '_path'] = novo;
  campos[prefixo + '_drive_id'] = null;
  const { data: res, error } = await sb.from('alunos').update(campos).eq('id', aluno.id).select('id');
  if (error || !res || !res.length) {
    if (novo) await sb.storage.from('alunos-arquivos').remove([novo]);
    throw error || new Error('Sem permissão para alterar este aluno.');
  }
  if (antigo) await sb.storage.from('alunos-arquivos').remove([antigo]);
}

// ------------------------------------------------------------
// IMPORTAÇÃO DE PROFISSIONAIS POR CSV
// ------------------------------------------------------------
const PROF_CABECALHO_CSV = {"ID": "id", "NOME": "Nome do profissional", "DATA_NASCIMENTO": "Data de nascimento", "FILIACAO_1": "Nome da filiação 1", "FILIACAO_2": "Nome do pai", "UF_NASCIMENTO": "UF de nascimento", "MUNICIPIO_NASCIMENTO": "Município de nascimento", "INEP": "INEP do profissional", "LOGRADOURO": "Logradouro", "NUMERO": "Número", "COMPLEMENTO": "Complemento", "BAIRRO": "Bairro", "CIDADE": "Cidade", "UF": "UF", "CEP": "CEP", "CPF": "CPF", "RG": "Profissional: RG", "CERTIDAO_NASC": "Número de matrícula da certidão nascimento", "ESCOLARIDADE": "Maior nível de escolaridade concluído", "TIPO_ENSINO_MEDIO": "Tipo de ensino médio cursado", "CURSO_SUPERIOR": "Curso superior", "LICENCIATURA": "Licenciatura", "POS_GRADUACAO": "Pós-graduação", "MATRICULA": "Matrícula", "SITUACAO_LOTACAO": "Situação Lotação", "CARGO": "Descrição Cargo", "DATA_ADMISSAO_LOTACAO": "Data Admissão Lotação", "DATA_TERMINO_CONTRATO": "Data Término Contrato", "REGIME": "Regime Trabalho", "CH_MENSAL": "CH mensal", "DATA_DESLIGAMENTO_LOTACAO": "Data Desligamento Lotação", "CH_LOTACAO": "CH Lotação", "CH_VINCULO": "CH vinculo", "LOCAL_TRABALHO": "Descrição Local Trabalho", "SITUACAO_VINCULO": "Situação Vínculo", "DATA_ADMISSAO_VINCULO": "Data Admissão Vínculo", "DATA_DESLIGAMENTO_VINCULO": "Data Desligamento Vínculo", "SEXO": "Profissional: Sexo", "PAIS_ORIGEM": "Profissional: País de origem", "RACA": "Profissional: Raça", "NACIONALIDADE": "Profissional: Nacionalidade", "POVO_INDIGENA": "Profissional: Povo indígena", "LOCALIZACAO_DIFERENCIADA": "Profissional: Localização diferenciada", "DEFICIENCIAS": "Profissional: Deficiências", "TRANSTORNO_GLOBAL": "Profissional: Transtorno Global de desenvolvimento", "ALTAS_HABILIDADES": "Profissional: Altas habilidades/superdotação", "AREAS_CONHECIMENTO": "Profissional: Áreas de conhecimento", "ZONA_RESIDENCIA": "Profissional: Zona residência", "OUTROS_CURSOS": "Profissional: Outros cursos específicos (Formação continuada com mínimo de 80 horas)", "EMAIL": "Profissional: E-mail", "TURMAS": "Profissional: Turmas", "DISCIPLINAS": "Profissional: Disciplinas", "ANO_CONCLUSAO_FORMACAO_1": "Profissional: Ano Conclusão Formação 1", "CURSO_FORMACAO_1": "Profissional: Curso Formação 1", "INSTITUICAO_FORMACAO_1": "Profissional: Instituição Formação 1", "ANO_CONCLUSAO_FORMACAO_2": "Profissional: Ano Conclusão Formação 2", "CURSO_FORMACAO_2": "Profissional: Curso Formação 2", "INSTITUICAO_FORMACAO_2": "Profissional: Instituição Formação 2", "ANO_CONCLUSAO_FORMACAO_3": "Profissional: Ano Conclusão Formação 3", "CURSO_FORMACAO_3": "Profissional: Curso Formação 3", "INSTITUICAO_FORMACAO_3": "Profissional: Instituição Formação 3", "TIPO_POS_1": "Profissional: Tipo pós-graduação 1", "AREA_POS_1": "Profissional: Área pós-graduação 1", "ANO_CONCLUSAO_POS_1": "Profissional: Ano conclusão pós-graduação 1", "NOME_POS_1": "Profissional: Nome pós-graduação 1", "TIPO_POS_2": "Profissional: Tipo pós-graduação 2", "AREA_POS_2": "Profissional: Área pós-graduação 2", "ANO_CONCLUSAO_POS_2": "Profissional: Ano conclusão pós-graduação 2", "NOME_POS_2": "Profissional: Nome pós-graduação 2", "TIPO_POS_3": "Profissional: Tipo pós-graduação 3", "AREA_POS_3": "Profissional: Área pós-graduação 3", "ANO_CONCLUSAO_POS_3": "Profissional: Ano conclusão pós-graduação 3", "NOME_POS_3": "Profissional: Nome pós-graduação 3", "TIPO_POS_4": "Profissional: Tipo pós-graduação 4", "AREA_POS_4": "Profissional: Área pós-graduação 4", "ANO_CONCLUSAO_POS_4": "Profissional: Ano conclusão pós-graduação 4", "NOME_POS_4": "Profissional: Nome pós-graduação 4", "TIPO_POS_5": "Profissional: Tipo pós-graduação 5", "AREA_POS_5": "Profissional: Área pós-graduação 5", "ANO_CONCLUSAO_POS_5": "Profissional: Ano conclusão pós-graduação 5", "NOME_POS_5": "Profissional: Nome pós-graduação 5", "TIPO_POS_6": "Profissional: Tipo pós-graduação 6", "AREA_POS_6": "Profissional: Área pós-graduação 6", "ANO_CONCLUSAO_POS_6": "Profissional: Ano conclusão pós-graduação 6", "NOME_POS_6": "Profissional: Nome pós-graduação 6"};

function normCabecalho(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

async function importarProfissionaisSb(linhasCsv) {
  const p = await carregarPerfilSb();
  const perfis = p.perfis || [];
  if (!p.is_admin && !perfis.includes('SUPERVISOR') && !perfis.includes('SECRETARIA')) throw new Error('Seu perfil não pode importar profissionais.');
  if (!linhasCsv || !linhasCsv.length) throw new Error('Nenhum profissional para importar.');

  // escolas que a pessoa enxerga (o banco já filtra pelo perfil)
  const { data: esc, error: e0 } = await sb.from('escolas').select('nome');
  if (e0) throw e0;
  const escolas = {};
  esc.forEach(function (e) { escolas[normEscolaSb(e.nome)] = e.nome; });

  // descobre qual coluna do CSV corresponde a cada campo (exato; senão, ignorando acentos e maiúsculas)
  const cabecalhosCsv = Object.keys(linhasCsv[0]);
  const achar = function (nome) {
    if (cabecalhosCsv.indexOf(nome) >= 0) return nome;
    const alvo = normCabecalho(nome);
    return cabecalhosCsv.filter(function (h) { return normCabecalho(h) === alvo; })[0] || null;
  };
  const colunaCsv = {};
  Object.keys(PROF_CABECALHO_CSV).forEach(function (campo) { const h = achar(PROF_CABECALHO_CSV[campo]); if (h) colunaCsv[campo] = h; });
  const faltam = ['ID', 'NOME', 'LOCAL_TRABALHO'].filter(function (c) { return !colunaCsv[c]; }).map(function (c) { return PROF_CABECALHO_CSV[c]; });
  if (faltam.length) throw new Error('Colunas não encontradas no CSV: ' + faltam.join(', '));

  const r = { processados: 0, falhas: 0, naoPermitidos: 0 };
  const porChave = {};
  linhasCsv.forEach(function (linha) {
    const codigo = txtOuNulo(linha[colunaCsv.ID]);
    const nome = txtOuNulo(linha[colunaCsv.NOME]);
    const local = txtOuNulo(linha[colunaCsv.LOCAL_TRABALHO]);
    if (!codigo || !nome || !local) { r.falhas++; return; }
    const escola = escolas[normEscolaSb(local)];
    if (!escola) { r.naoPermitidos++; return; }
    const reg = { escola: escola, codigo: codigo };
    Object.keys(colunaCsv).forEach(function (campo) {
      if (campo === 'ID') return;
      const bruto = linha[colunaCsv[campo]];
      reg[campo.toLowerCase()] = PROF_DATAS.indexOf(campo) >= 0 ? paraDataIso(bruto) : txtOuNulo(bruto);
    });
    porChave[escola + '|' + codigo] = reg;     // se o ID repetir, vale o último
  });

  const registros = Object.keys(porChave).map(function (k) { return porChave[k]; });
  for (let i = 0; i < registros.length; i += 200) {
    const { error } = await sb.from('profissionais').upsert(registros.slice(i, i + 200), { onConflict: 'escola,codigo' });
    if (error) throw error;
    r.processados += Math.min(200, registros.length - i);
  }
  return r;
}

// ------------------------------------------------------------
// FOTO DE PERFIL E MONITORAMENTO DE VISITAS
// ------------------------------------------------------------
async function fotoPerfilSb() {
  const p = await carregarPerfilSb();
  const { data, error } = await sb.from('usuarios').select('foto_path, foto_drive_id').eq('id', p.id).maybeSingle();
  if (error) throw error;
  if (!data) return { url: '' };
  if (data.foto_path) {
    const r = await sb.storage.from('fotos-perfil').createSignedUrl(data.foto_path, 3600);
    return { url: r.data ? r.data.signedUrl : '' };
  }
  return { url: data.foto_drive_id ? 'https://drive.google.com/thumbnail?id=' + data.foto_drive_id + '&sz=w200' : '' };
}

async function historicoMonitoramentoSb(u) {
  let q = sb.from('monitoramento_visitas').select('*');
  const escola = u.searchParams.get('escola');
  if (escola) q = q.eq('escola', escola);
  const { data, error } = await q.order('data_visita', { ascending: false });
  if (error) throw error;
  return data.map(function (v) {
    return { id: v.id, escola: v.escola, supervisor: v.supervisor, data: v.data_visita, obsGerais: v.obs_gerais || '', finalizada: v.finalizada === true, itens: [] };
  });
}

async function detalhesMonitoramentoSb(u) {
  const id = u.searchParams.get('idVisita');
  const { data: v, error } = await sb.from('monitoramento_visitas').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!v) return { erro: 'Visita não encontrada' };
  const { data: itens, error: e2 } = await sb.from('monitoramento_itens').select('*, monitoramento_anexos(id)').eq('visita_id', id).order('item_id');
  if (e2) throw e2;
  return {
    cabecalho: { escola: v.escola, supervisor: v.supervisor, data: v.data_visita, obsGerais: v.obs_gerais || '' },
    itens: itens.map(function (i) {
      return { id: i.item_id, categoria: i.categoria || '', descricao: i.descricao || '', status: i.status || '', obs: i.obs || '',
        anexos: (i.monitoramento_anexos || []).map(function (a) { return a.id; }) };
    })
  };
}

// ------------------------------------------------------------
// NOTIFICAÇÕES DA AGENDA
// ------------------------------------------------------------
function escHtmlSb(t) {
  return String(t === null || t === undefined ? '' : t).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

async function listarNotificacoesSb() {
  const { data, error } = await sb.from('notificacoes').select('*').order('data', { ascending: false }).limit(100);
  if (error) throw error;
  return data.map(function (n) {
    return { id: n.id, fromEmail: n.remetente || '', tipoDestino: n.tipo_destino, destino: n.destino,
      data: n.data, mensagem: n.mensagem, lida: n.lida === true };
  });
}

const _jsonpLegado = jsonp;
const ROTAS_JSONP_SB = {
  verificarConsentimento: function () { return consentimentoSb(); },
  statusTermo: function () { return statusTermoSb(); },
  listarTermos: function () { return listarTermosSb(); },
  contarTermosPendentes: function () { return contarTermosPendentesSb(); },
  usuarios: function () { return listarUsuariosSb(); },
  obterTermoResp: function (u) { return urlArquivoAlunoSb(u.searchParams.get('row'), 'termo_resp'); },
  obterDeclEdEspecial: function (u) { return urlArquivoAlunoSb(u.searchParams.get('row'), 'decl_ed_especial'); },
  fotoAluno: async function (u) {
    const { data, error } = await sb.from('alunos').select('foto_path, foto_drive_id')
      .eq('escola', u.searchParams.get('escola') || '').eq('codigo', u.searchParams.get('id') || '').maybeSingle();
    if (error) throw error;
    if (!data) return { url: '' };
    if (data.foto_path) {
      const r = await sb.storage.from('alunos-arquivos').createSignedUrl(data.foto_path, 3600);
      return { url: r.data ? r.data.signedUrl : '' };
    }
    return { url: data.foto_drive_id ? 'https://drive.google.com/thumbnail?id=' + data.foto_drive_id + '&sz=w200' : '' };
  },
  turmas: function (u) { return listarTurmasSb(u.searchParams.get('escola') || ''); },
  comunicados: function (u) { return listarComunicadosSb(u.searchParams.get('escola') || ''); },
  agenda: function () { return listarAgendaSb(); },
  obterDadosEscola: function (u) { return obterDadosEscolaSb(u.searchParams.get('escola') || ''); },
  listarDadosEscolas: function () { return listarDadosEscolasSb(); },
  listarOrganizacoesCurriculares: function (u) { return listarOrgsSb(u.searchParams.get('escola') || ''); },
  atos: function (u) { return listarAtosSb(u); },
  notificacoesAgenda: function () { return listarNotificacoesSb(); },
  fotoPerfil: function () { return fotoPerfilSb(); },
  historicoMonitoramento: function (u) { return historicoMonitoramentoSb(u); },
  detalhesMonitoramento: function (u) { return detalhesMonitoramentoSb(u); },
  // Histórico escolar: gerado pelo Apps Script, que consulta o Supabase com o login desta pessoa
  gerarHistorico: function (u) {
    return new Promise(async function (resolve, reject) {
      try {
        const { data: { session } } = await sb.auth.getSession();
        if (!session) { resolve({ erro: 'Sessão expirada. Entre novamente.' }); return; }
        u.searchParams.set('token', session.access_token);
        _jsonpLegado(u.toString(), resolve);
      } catch (e) { reject(e); }
    });
  },
  processos: function (u) { return listarProcessosSb(u); },
  documentos: function (u) { return listarDocumentosSb(u); },
  listarTiposProcesso: async function (u) {
    const p = await carregarPerfilSb();
    const extra = await tiposPersonalizadosSb('processos_tipos', u.searchParams.get('escola') || p.escola);
    return Array.from(new Set(TIPOS_PROCESSO_FIXOS.concat(extra)));
  },
  listarTiposDocumento: async function (u) {
    const p = await carregarPerfilSb();
    const escolheEscola = p.is_admin || (p.perfis || []).includes('SUPERVISOR');
    const escola = escolheEscola ? (u.searchParams.get('escola') || '') : p.escola;
    return TIPOS_DOCUMENTO_FIXOS.concat(await tiposPersonalizadosSb('documentos_tipos', escola));
  },
  modelos: function () { return listarModelosSb(); },
  listarModelosEscola: function (u) { return listarModelosEscolaSb(u); },
  dashboard: function (u) { return rpcSb('dashboard_pendencias', { p_escola: u.searchParams.get('escola') || null }); },
  desempenho: function (u) { return rpcSb('desempenho', { p_escola: u.searchParams.get('escola') || null }); },
  rankingCache: function () { return rpcSb('ranking_escolas'); },
  buscaGlobal: function (u) { return buscaGlobalSb(u.searchParams.get('termo') || ''); },
  logAcoes: function (u) { return listarLogAcoesSb(u); },
  listarProfissionais: function (u) { return listarProfissionaisSb(u); },
  listarDocumentosProfissional: function (u) { return listarDocumentosProfissionalSb(u); },
  dashboardProfissionais: function (u) { return dashboardProfissionaisSb(u); },
  legislacao: function (u) { return listarLegislacaoSb(u); },
  legislacaoPorId: function (u) { return listarLegislacaoSb(u); }
};
window.jsonp = function (url, callback, onError) {
  try {
    const u = new URL(url);
    const rota = ROTAS_JSONP_SB[u.searchParams.get('tipo')];
    if (rota) {
      rota(u).then(callback).catch(function (e) {
        console.error('Erro na rota ' + u.searchParams.get('tipo') + ':', e);
        if (onError) onError(e); else callback({ erro: 'falha_consulta' });
      });
      return;
    }
  } catch (_) { /* URL inválida: segue o caminho antigo */ }
  return _jsonpLegado.apply(this, arguments);
};

// ------------------------------------------------------------
// IMPORTAÇÃO / PROMOÇÃO
// ------------------------------------------------------------
function normEscolaSb(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

// escolas em que o usuário PODE gravar (mesma regra do banco)
async function mapaEscolasEditaveisSb() {
  const p = await carregarPerfilSb();
  let nomes = [];
  if (p.is_admin) {
    const { data, error } = await sb.from('escolas').select('nome');
    if (error) throw error;
    nomes = data.map(function (e) { return e.nome; });
  } else {
    if ((p.perfis || []).includes('SUPERVISOR')) nomes = nomes.concat(p.escolas_supervisionadas || []);
    if ((p.perfis || []).includes('SECRETARIA') && p.escola) nomes.push(p.escola);
  }
  const mapa = {};
  nomes.forEach(function (n) { mapa[normEscolaSb(n)] = n; });
  return mapa;
}

function txtOuNulo(v) {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
}

function linhaNovoAlunoSb(a, escola, codigo, opt) {
  const dm = paraDataIso(a.dataMatricula) || hojeSaoPaulo();
  const cpf = cpfFormatado(a.cpfAluno !== undefined ? a.cpfAluno : a.cpf);
  const turma = txtOuNulo(a.turma);
  const linha = {
    codigo: codigo, escola: escola, nome: String(a.nome).trim(),
    responsavel: txtOuNulo(a.responsavel), telefone: txtOuNulo(a.telefone), turma: turma,
    data_matricula: dm, prazo_final: somarDias(dm, 30),
    cpf_numero: cpf, cpf_entregue: cpf !== null,
    raca_cor: racaCorSb(a.racaCor),
    filiacao_1: txtOuNulo(a.filiacao1), filiacao_2: txtOuNulo(a.filiacao2),
    data_nascimento: paraDataIso(a.dataNascimento),
    naturalidade: txtOuNulo(a.naturalidade), uf_nascimento: txtOuNulo(a.ufNascimento), nacionalidade: txtOuNulo(a.nacionalidade),
    situacao: opt.situacaoPorTurma ? (turma ? 'Ativo' : 'Inativo') : 'Ativo',
    ed_especial: a.edEspecial === true
  };
  if (opt.docsDoCsv) {
    linha.certidao_entregue = txtOuNulo(a.certidao) !== null;
    linha.rg_entregue = txtOuNulo(a.rg) !== null;
    linha.sus_entregue = txtOuNulo(a.sus) !== null;
    linha.residencia_entregue = txtOuNulo(a.residencia) !== null;
  }
  return linha;
}

async function inserirAlunosSb(alunos, opt) {
  const escolas = await mapaEscolasEditaveisSb();
  const r = { importados: 0, duplicatas: 0, falhas: 0 };
  const porEscola = {};
  (alunos || []).forEach(function (a) {
    const esc = escolas[normEscolaSb(a.escola)];
    const nome = txtOuNulo(a.nome);
    const id = txtOuNulo(a.id);
    if (!esc || !nome || (opt.exigeId && !id)) { r.falhas++; return; }
    (porEscola[esc] = porEscola[esc] || []).push({ a: a, id: id });
  });

  for (const esc of Object.keys(porEscola)) {
    const itens = porEscola[esc];
    await garantirTurmasSb(esc, itens.map(function (i) { return i.a.turma; }));

    // com ID: ignora quem já existe
    const vistos = new Set();
    const comId = [];
    itens.filter(function (i) { return i.id; }).forEach(function (i) {
      if (vistos.has(i.id)) { r.duplicatas++; return; }
      vistos.add(i.id);
      comId.push(linhaNovoAlunoSb(i.a, esc, i.id, opt));
    });
    if (comId.length) {
      const { data, error } = await sb.from('alunos')
        .upsert(comId, { onConflict: 'escola,codigo', ignoreDuplicates: true }).select('seq');
      if (error) throw error;
      r.importados += data.length;
      r.duplicatas += comId.length - data.length;
    }

    // sem ID: gera código novo (repete se por acaso já existir)
    const semId = itens.filter(function (i) { return !i.id; });
    if (semId.length) {
      let ok = false;
      for (let t = 0; t < 6 && !ok; t++) {
        const usados = new Set();
        const linhas = semId.map(function (i) {
          let c; do { c = gerarCodigoAluno(); } while (usados.has(c));
          usados.add(c);
          return linhaNovoAlunoSb(i.a, esc, c, opt);
        });
        const { data, error } = await sb.from('alunos').insert(linhas).select('seq');
        if (!error) { r.importados += data.length; ok = true; }
        else if (error.code !== '23505') throw error;
      }
      if (!ok) throw new Error('Não foi possível gerar códigos únicos para alunos sem ID.');
    }
  }
  return r;
}

async function promoverAlunosSb(alunos) {
  const escolas = await mapaEscolasEditaveisSb();
  let atualizados = 0, novos = [], falhas = 0;
  const porEscola = {};
  (alunos || []).forEach(function (a) {
    const esc = escolas[normEscolaSb(a.escola)];
    const id = txtOuNulo(a.id);
    if (!esc || !id || !txtOuNulo(a.nome)) { falhas++; return; }
    (porEscola[esc] = porEscola[esc] || []).push({ a: a, id: id });
  });

  for (const esc of Object.keys(porEscola)) {
    const itens = porEscola[esc];
    await garantirTurmasSb(esc, itens.map(function (i) { return i.a.turma; }));
    const { data, error } = await sb.from('alunos').select('codigo').eq('escola', esc)
      .in('codigo', itens.map(function (i) { return i.id; }));
    if (error) throw error;
    const existentes = new Set(data.map(function (x) { return x.codigo; }));

    const paraAtualizar = itens.filter(function (i) { return existentes.has(i.id); });
    for (let k = 0; k < paraAtualizar.length; k += 10) {
      await Promise.all(paraAtualizar.slice(k, k + 10).map(function (i) {
        return sb.from('alunos').update({ turma: txtOuNulo(i.a.turma), situacao: 'Ativo' })
          .eq('escola', esc).eq('codigo', i.id)
          .then(function (res) { if (res.error) throw res.error; });
      }));
    }
    atualizados += paraAtualizar.length;
    itens.filter(function (i) { return !existentes.has(i.id); }).forEach(function (i) { novos.push(i.a); });
  }

  let criados = 0;
  if (novos.length) {
    const r = await inserirAlunosSb(novos, { exigeId: true, situacaoPorTurma: false, docsDoCsv: false });
    criados = r.importados;
    falhas += r.falhas;
  }
  return { atualizados: atualizados, criados: criados, falhas: falhas };
}

async function finalizarPromocaoSb(alunos) {
  const escolas = await mapaEscolasEditaveisSb();
  const idsPorEscola = {};
  (alunos || []).forEach(function (a) {
    const esc = escolas[normEscolaSb(a.escola)];
    const id = txtOuNulo(a.id);
    if (!esc || !id) return;
    (idsPorEscola[esc] = idsPorEscola[esc] || new Set()).add(id);
  });

  let marcados = 0;
  for (const esc of Object.keys(idsPorEscola)) {
    const ativos = [];
    for (let de = 0; ; de += 1000) {
      const { data, error } = await sb.from('alunos').select('codigo').eq('escola', esc).eq('situacao', 'Ativo')
        .order('seq').range(de, de + 999);
      if (error) throw error;
      data.forEach(function (x) { ativos.push(x.codigo); });
      if (data.length < 1000) break;
    }
    const sair = ativos.filter(function (c) { return !idsPorEscola[esc].has(c); });
    for (let k = 0; k < sair.length; k += 80) {
      const { error } = await sb.from('alunos').update({ situacao: 'Transferido' })
        .eq('escola', esc).eq('situacao', 'Ativo').in('codigo', sair.slice(k, k + 80));
      if (error) throw error;
    }
    marcados += sair.length;
  }
  return marcados;
}

Object.assign(ACAO_ALUNO_SB, {
  async cadastrarTurma(d) {
    const p = await carregarPerfilSb();
    const podeEscolher = p.is_admin || (p.perfis || []).includes('SUPERVISOR');
    const escola = podeEscolher ? d.escola : p.escola;
    const nome = (d.turma || '').toString().trim();
    if (!escola || !nome) throw new Error('Escola e turma são obrigatórias.');
    const { error } = await sb.from('turmas').insert({ escola: escola, nome: nome });
    if (error) {
      if (error.code === '23505') throw new Error('Turma já cadastrada para esta escola.');
      throw error;
    }
  },

  async importarAlunosLote(d) {
    const r = await inserirAlunosSb(d.alunos, { exigeId: false, situacaoPorTurma: true, docsDoCsv: true });
    const acc = window._resumoImport = window._resumoImport || { importados: 0, duplicatas: 0, falhas: 0 };
    acc.importados += r.importados; acc.duplicatas += r.duplicatas; acc.falhas += r.falhas;
  },

  async inserirNovosAlunosLote(d) {
    await inserirAlunosSb(d.alunos, { exigeId: true, situacaoPorTurma: false, docsDoCsv: false });
  },

  async promoverAlunosLote(d) {
    await promoverAlunosSb(d.alunos);
  },

  async finalizarPromocao(d) {
    await finalizarPromocaoSb(d.alunos);
  },

  // A importação por arquivo agora roda direto, com barra de progresso (sem fila na planilha)
  async enviarCSVParaFila(d) {
    window._resumoImport = { importados: 0, duplicatas: 0, falhas: 0 };
    ImportProgress.iniciar(d.alunos || [], 'importarAlunosLote', 'Importando alunos...');
  }
});

Object.assign(ACAO_ALUNO_SB, {
  async registrarConsentimento(d) {
    const p = await carregarPerfilSb();
    const { error } = await sb.from('consentimentos').insert({
      usuario_id: p.id, email: p.email, versao: d.versao || '1.0', ip: d.ip || null
    });
    if (error) throw error;
  },

  async uploadTermoCompromisso(d) {
    const p = await carregarPerfilSb();
    const bin = atob(d.fileBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const nome = 'termo_' + Date.now() + '.pdf';
    const caminho = p.id + '/' + nome;
    const up = await sb.storage.from('termos').upload(caminho, new Blob([bytes], { type: 'application/pdf' }),
      { contentType: 'application/pdf', upsert: false });
    if (up.error) throw up.error;
    const { error } = await sb.from('termos_usuarios').upsert({
      usuario_id: p.id, email: p.email, status: 'pendente', arquivo_path: caminho, arquivo_drive_id: null,
      arquivo_nome: nome, data_envio: new Date().toISOString(), aprovado_por: null, data_aprovacao: null, obs: null
    }, { onConflict: 'usuario_id' });
    if (error) throw error;
  },

  async cadastrarUsuario(d) { mostrarSenhaTemporaria(d.email, await chamarAdminUsuarios(d)); },
  async editarUsuario(d) { await chamarAdminUsuarios(d); },
  async aprovarTermo(d) { await chamarAdminUsuarios(d); }
});


function dataHoraIso(v) {
  const d = new Date(v);
  if (isNaN(d.getTime())) throw new Error('Data/hora inválida.');
  return d.toISOString();
}

async function vinculosLegislacaoSb(origem, vinculos) {
  const { error: e1 } = await sb.from('legislacao_vinculos').delete().eq('origem', origem);
  if (e1) throw e1;
  const linhas = (vinculos || []).filter(function (v) { return v.idDestino && v.tipoVinculo && v.idDestino !== origem; })
    .map(function (v) { return { origem: origem, destino: v.idDestino, tipo_vinculo: v.tipoVinculo }; });
  if (linhas.length) {
    const { error } = await sb.from('legislacao_vinculos').upsert(linhas, { onConflict: 'origem,destino' });
    if (error) throw error;
  }
}

Object.assign(ACAO_ALUNO_SB, {
  async salvarComunicado(d) {
    const p = await carregarPerfilSb();
    const escola = (p.is_admin || (p.perfis || []).includes('SUPERVISOR')) ? (d.escola || '') : p.escola;
    if (!escola || !d.titulo || !d.texto) throw new Error('Escola, título e texto são obrigatórios.');
    const { error } = await sb.from('comunicados').insert({
      escola: escola, titulo: d.titulo, texto: d.texto, prioridade: d.prioridade || 'informativo',
      fixado: d.fixado === true,
      data_expiracao: d.dataExpiracao ? new Date(d.dataExpiracao + 'T23:59:59-03:00').toISOString() : null
    });
    if (error) throw error;
  },
  async excluirComunicado(d) {
    await exigirLinhasAfetadas(sb.from('comunicados').delete().eq('id', d.id).select('id'));
  },

  async criarEventoAgenda(d) {
    if (!d.tipo || !d.dataHora) throw new Error('Preencha todos os campos obrigatórios.');
    const quando = dataHoraIso(d.dataHora);
    const { error } = await sb.from('agenda').insert({
      tipo: d.tipo, escola: d.escola || null, data_hora: quando, descricao: d.descricao || null
    });
    if (error) throw error;
    if (d.tipo === 'Visita_Circuito' && d.escola) {
      // aviso para a escola (o texto digitado é escapado: aparece como HTML na tela de notificações)
      const detalhe = d.descricao ? ' Detalhes: ' + escHtmlSb(d.descricao) : '';
      const aviso = await sb.from('notificacoes').insert({
        tipo_destino: 'ESCOLA', destino: d.escola,
        mensagem: 'Visita do Circuito de Gestão agendada para ' + new Date(quando).toLocaleString('pt-BR') + '.' + detalhe
      });
      if (aviso.error) console.warn('Visita agendada, mas o aviso à escola não foi criado:', aviso.error);
    }
  },
  async reagendarEvento(d) {
    await exigirLinhasAfetadas(sb.from('agenda').update({ data_hora: dataHoraIso(d.novaDataHora) }).eq('id', d.id).select('id'));
  },
  async excluirEventoAgenda(d) {
    await exigirLinhasAfetadas(sb.from('agenda').delete().eq('id', d.id).select('id'));
  },
  async editarEventoAgenda(d) {
    const c = {};
    if (d.tipo) c.tipo = d.tipo;
    if (d.escola !== undefined) c.escola = d.escola || null;
    if (d.dataHora) c.data_hora = dataHoraIso(d.dataHora);
    if (d.descricao !== undefined) c.descricao = d.descricao || null;
    await exigirLinhasAfetadas(sb.from('agenda').update(c).eq('id', d.id).select('id'));
  },

  async salvarDadosEscola(d) {
    const c = {
      logradouro: txtOuNulo(d.logradouro), numero: txtOuNulo(d.numero), bairro: txtOuNulo(d.bairro),
      cidade: txtOuNulo(d.cidade), uf: txtOuNulo(d.uf), cep: txtOuNulo(d.cep),
      email: txtOuNulo(d.emailEscola), telefone: txtOuNulo(d.telefone),
      ato_criacao: txtOuNulo(d.atoCriacao), publicacao_criacao: paraDataIso(d.publicacaoCriacao),
      ato_aprovacao: txtOuNulo(d.atoAprovacao), publicacao_aprovacao: paraDataIso(d.publicacaoAprovacao),
      atualizado_em: new Date().toISOString()
    };
    await exigirLinhasAfetadas(sb.from('escolas').update(c).eq('nome', d.escola).select('nome'));
  },
  async salvarOrganizacoesCurriculares(d) {
    const { error } = await sb.rpc('salvar_org_curriculares', { p_escola: d.escola, p_itens: d.organizacoes || [] });
    if (error) throw error;
  },

  async salvarAtoAutorizativo(d) {
    const pub = paraDataIso(d.dataPublicacao);
    const anos = parseInt(d.validadeAnos, 10);
    if (!d.escola || !d.tipoAto || !pub || isNaN(anos)) throw new Error('Escola, tipo, data de publicação e validade são obrigatórios.');
    const venc = (parseInt(pub.slice(0, 4), 10) + anos) + pub.slice(4);
    const c = {
      escola: d.escola, tipo_ato: d.tipoAto, curso_etapa: txtOuNulo(d.cursoEtapa), numero_ato: txtOuNulo(d.numeroAto),
      data_publicacao: pub, data_homologacao: paraDataIso(d.dataHomologacao), validade_anos: anos, data_vencimento: venc,
      observacoes: txtOuNulo(d.observacoes), fundamentacao_legal: txtOuNulo(d.fundamentacao), curso_tecnico: txtOuNulo(d.cursoTecnico)
    };
    let novoCaminho = null, caminhoAntigo = null;
    if (d.fileBase64) {
      const slug = await slugEscolaSb(d.escola);
      novoCaminho = slug + '/' + Date.now() + '_' + nomeSeguroArquivo(d.fileName || 'ato.pdf');
      const up = await sb.storage.from('atos').upload(novoCaminho, base64ParaBlob(d.fileBase64, d.mimeType || 'application/pdf'), { contentType: d.mimeType || 'application/pdf', upsert: false });
      if (up.error) throw up.error;
      c.arquivo_path = novoCaminho; c.arquivo_drive_id = null;
    }
    try {
      if (d.id) {
        if (novoCaminho) { const ant = await sb.from('atos_autorizativos').select('arquivo_path').eq('id', d.id).maybeSingle(); caminhoAntigo = ant.data ? ant.data.arquivo_path : null; }
        await exigirLinhasAfetadas(sb.from('atos_autorizativos').update(c).eq('id', d.id).select('id'));
      } else {
        const { error } = await sb.from('atos_autorizativos').insert(c);
        if (error) throw error;
      }
    } catch (e) {
      if (novoCaminho) await sb.storage.from('atos').remove([novoCaminho]);
      throw e;
    }
    if (caminhoAntigo) await sb.storage.from('atos').remove([caminhoAntigo]);
  },
  async excluirAtoAutorizativo(d) {
    const r = await exigirLinhasAfetadas(sb.from('atos_autorizativos').delete().eq('id', d.id).select('arquivo_path'));
    if (r[0] && r[0].arquivo_path) await sb.storage.from('atos').remove([r[0].arquivo_path]);
  },

  async salvarLegislacao(d) {
    if (!d.tipo || !d.numero || !d.ano) throw new Error('Tipo, número e ano são obrigatórios.');
    let caminho = null;
    if (d.fileBase64) {
      caminho = 'leg_' + Date.now() + '_' + nomeSeguroArquivo(d.fileName || 'documento.pdf');
      const up = await sb.storage.from('legislacao').upload(caminho, base64ParaBlob(d.fileBase64, d.mimeType || 'application/pdf'), { contentType: d.mimeType || 'application/pdf', upsert: false });
      if (up.error) throw up.error;
    }
    const { data, error } = await sb.from('legislacao').insert({
      arquivo_path: caminho,
      tipo: d.tipo, numero: String(d.numero), ano: String(d.ano), assunto: txtOuNulo(d.assunto),
      palavras_chave: txtOuNulo(d.palavrasChave), data_publicacao: paraDataIso(d.dataPublicacao), observacoes: txtOuNulo(d.observacoes)
    }).select('id').single();
    if (error) { if (caminho) await sb.storage.from('legislacao').remove([caminho]); throw error; }
    await vinculosLegislacaoSb(data.id, d.vinculos);
  },
  async editarLegislacao(d) {
    const c = {};
    if (d.tipo !== undefined) c.tipo = d.tipo;
    if (d.numero !== undefined) c.numero = String(d.numero);
    if (d.ano !== undefined) c.ano = String(d.ano);
    if (d.assunto !== undefined) c.assunto = txtOuNulo(d.assunto);
    if (d.palavrasChave !== undefined) c.palavras_chave = txtOuNulo(d.palavrasChave);
    if (d.dataPublicacao !== undefined) c.data_publicacao = paraDataIso(d.dataPublicacao);
    if (d.observacoes !== undefined) c.observacoes = txtOuNulo(d.observacoes);
    let caminhoNovo = null, caminhoAntigo = null;
    if (d.fileBase64) {
      caminhoNovo = 'leg_' + Date.now() + '_' + nomeSeguroArquivo(d.fileName || 'documento.pdf');
      const up = await sb.storage.from('legislacao').upload(caminhoNovo, base64ParaBlob(d.fileBase64, d.mimeType || 'application/pdf'), { contentType: d.mimeType || 'application/pdf', upsert: false });
      if (up.error) throw up.error;
      const ant = await sb.from('legislacao').select('arquivo_path').eq('id', d.id).maybeSingle();
      caminhoAntigo = ant.data ? ant.data.arquivo_path : null;
      c.arquivo_path = caminhoNovo; c.arquivo_drive_id = null;
    }
    try {
      await exigirLinhasAfetadas(sb.from('legislacao').update(c).eq('id', d.id).select('id'));
    } catch (e) {
      if (caminhoNovo) await sb.storage.from('legislacao').remove([caminhoNovo]);
      throw e;
    }
    if (caminhoAntigo) await sb.storage.from('legislacao').remove([caminhoAntigo]);
    if (Array.isArray(d.vinculos)) await vinculosLegislacaoSb(d.id, d.vinculos);
  },
  async excluirLegislacao(d) {
    const r = await exigirLinhasAfetadas(sb.from('legislacao').delete().eq('id', d.id).select('arquivo_path'));
    if (r[0] && r[0].arquivo_path) await sb.storage.from('legislacao').remove([r[0].arquivo_path]);
  }
});

Object.assign(ACAO_ALUNO_SB, {
  async atualizarProfissional(d) {
    if (!d.escola || !d.id) throw new Error('Dados insuficientes.');
    const c = {};
    PROF_COLUNAS.forEach(function (col) {
      if (col === 'ID' || d[col] === undefined) return;
      c[col.toLowerCase()] = PROF_DATAS.indexOf(col) !== -1 ? paraDataIso(d[col]) : txtOuNulo(d[col]);
    });
    await exigirLinhasAfetadas(sb.from('profissionais').update(c).eq('escola', d.escola).eq('codigo', String(d.id)).select('id'));
  },

  async uploadDocumentoProfissional(d) {
    if (!d.idProfissional || !d.escola || !d.tipoDocumento || !d.fileBase64 || !d.fileName) throw new Error('Dados insuficientes.');
    const profId = await idProfissionalSb(d.escola, d.idProfissional);
    const bin = atob(d.fileBase64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const seguro = d.fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9._-]/g, '_');
    const caminho = profId + '/' + Date.now() + '_' + seguro;
    const up = await sb.storage.from('profissionais-docs').upload(caminho, new Blob([bytes], { type: d.mimeType || 'application/octet-stream' }),
      { contentType: d.mimeType || 'application/octet-stream', upsert: false });
    if (up.error) throw up.error;
    const { error } = await sb.from('documentos_profissionais').insert({
      profissional_id: profId, escola: d.escola, tipo_documento: d.tipoDocumento, nome_arquivo: d.fileName,
      arquivo_path: caminho, observacoes: txtOuNulo(d.observacoes)
    });
    if (error) { await sb.storage.from('profissionais-docs').remove([caminho]); throw error; }
  },

  async excluirDocumentoProfissional(d) {
    const { data, error } = await sb.from('documentos_profissionais').delete().eq('id', d.fileId).select('arquivo_path');
    if (error) throw error;
    if (!data || !data.length) throw new Error('Documento não encontrado ou sem permissão.');
    if (data[0].arquivo_path) await sb.storage.from('profissionais-docs').remove([data[0].arquivo_path]);
  }
});

Object.assign(ACAO_ALUNO_SB, {
  async registrarLogAcao(d) {
    if (!d.acaoLog) return;
    const p = await carregarPerfilSb();
    let escola = d.escola || '';
    if (!escola && p && !p.is_admin && !(p.perfis || []).includes('SUPERVISOR')) escola = p.escola || '';
    const { error } = await sb.from('log_acoes').insert({ acao: d.acaoLog, detalhes: d.detalhes || null, escola: escola || null });
    if (error) throw error;
  }
});

Object.assign(ACAO_ALUNO_SB, {
  async cadastrarProcesso(d) {
    const p = await carregarPerfilSb();
    const podeEscolher = p.is_admin || (p.perfis || []).includes('SUPERVISOR');
    const escola = podeEscolher ? d.escola : p.escola;
    if (!escola || !d.tipo || !txtOuNulo(d.codigo)) throw new Error('Escola, tipo e código são obrigatórios.');
    const { error } = await sb.from('processos').insert({
      escola: escola, tipo: d.tipo, codigo: String(d.codigo).trim(), aluno: txtOuNulo(d.aluno), categoria: txtOuNulo(d.categoria),
      subcategoria: txtOuNulo(d.subcategoria), observacoes: txtOuNulo(d.observacoes), link: txtOuNulo(d.link)
    });
    if (error) { if (error.code === '23505') throw new Error('Código já cadastrado.'); throw error; }
  },

  async cadastrarTipoProcesso(d) {
    const p = await carregarPerfilSb();
    const escola = (p.is_admin || (p.perfis || []).includes('SUPERVISOR')) ? (d.escola || '') : p.escola;
    if (!escola) throw new Error('Selecione a escola antes de cadastrar um novo tipo.');
    const tipo = (d.tipo || '').trim();
    if (!tipo) throw new Error('Nome do tipo é obrigatório.');
    const { error } = await sb.from('processos_tipos').upsert({ escola: escola, tipo: tipo }, { onConflict: 'escola,tipo', ignoreDuplicates: true });
    if (error) throw error;
  },

  async cadastrarTipoDocumento(d) {
    const p = await carregarPerfilSb();
    const escolheEscola = p.is_admin || (p.perfis || []).includes('SUPERVISOR');
    const escola = escolheEscola ? (d.escola || '') : p.escola;
    if (!escola) throw new Error(escolheEscola ? 'Selecione a escola.' : 'Seu usuário não está vinculado a uma escola.');
    const tipo = (d.tipo || '').trim();
    if (!tipo) throw new Error('Nome do tipo é obrigatório.');
    const { error } = await sb.from('documentos_tipos').upsert({ escola: escola, tipo: tipo }, { onConflict: 'escola,tipo', ignoreDuplicates: true });
    if (error) throw error;
  },

  async uploadDocumento(d) {
    const p = await carregarPerfilSb();
    const escola = (p.is_admin || (p.perfis || []).includes('SUPERVISOR')) ? d.escola : p.escola;
    if (!escola || !d.tipo || !d.fileBase64 || !d.fileName) throw new Error('Dados insuficientes.');
    const slug = await slugEscolaSb(escola);
    const ext = d.fileName.indexOf('.') >= 0 ? d.fileName.split('.').pop() : 'bin';
    const prefixo = ['Certificado', 'Histórico', 'Diploma'].indexOf(d.tipo) >= 0 ? d.tipo : 'Documento';
    const nomeFinal = prefixo + '_' + String(d.nomeAluno || '').replace(/\s+/g, '_') + '_' + escola.replace(/\s+/g, '_') + '.' + ext;
    const caminho = slug + '/' + Date.now() + '_' + nomeSeguroArquivo(d.fileName);
    const up = await sb.storage.from('documentos').upload(caminho, base64ParaBlob(d.fileBase64, d.mimeType), { contentType: d.mimeType || 'application/octet-stream', upsert: false });
    if (up.error) throw up.error;
    const { error } = await sb.from('documentos').insert({
      escola: escola, tipo: d.tipo, nome_aluno: txtOuNulo(d.nomeAluno), nome_arquivo: nomeFinal, arquivo_path: caminho
    });
    if (error) { await sb.storage.from('documentos').remove([caminho]); throw error; }
  },

  async uploadModeloEscola(d) {
    const p = await carregarPerfilSb();
    const escolheEscola = p.is_admin || (p.perfis || []).includes('SUPERVISOR');
    const escolaModelo = escolheEscola ? (d.escola || '') : p.escola;
    if (!escolaModelo) throw new Error(escolheEscola ? 'Selecione a escola do modelo.' : 'Seu usuário não está vinculado a uma escola.');
    if (!txtOuNulo(d.nomeModelo) || !d.fileBase64 || !d.fileName) throw new Error('Nome e arquivo são obrigatórios.');
    const slug = await slugEscolaSb(escolaModelo);
    const caminho = slug + '/' + Date.now() + '_' + nomeSeguroArquivo(d.fileName);
    const up = await sb.storage.from('modelos').upload(caminho, base64ParaBlob(d.fileBase64, d.mimeType), { contentType: d.mimeType || 'application/octet-stream', upsert: false });
    if (up.error) throw up.error;
    const { error } = await sb.from('modelos_escolas').insert({
      escola: escolaModelo, nome_modelo: d.nomeModelo.trim(), arquivo_path: caminho, arquivo_nome: d.fileName
    });
    if (error) { await sb.storage.from('modelos').remove([caminho]); throw error; }
  },

  async uploadModelo(d) {
    const p = await carregarPerfilSb();
    if (!p.is_admin) throw new Error('Apenas o Administrador pode gerenciar modelos.');
    if (!d.modeloNome || !d.fileBase64 || !d.fileName) throw new Error('Arquivo não fornecido.');
    const atual = await sb.from('modelos_oficiais').select('arquivo_path').eq('nome', d.modeloNome).maybeSingle();
    if (atual.error) throw atual.error;
    if (!atual.data) throw new Error('Tipo de modelo inválido.');
    const caminho = 'oficiais/' + Date.now() + '_' + nomeSeguroArquivo(d.fileName);
    const up = await sb.storage.from('modelos').upload(caminho, base64ParaBlob(d.fileBase64, d.mimeType), { contentType: d.mimeType || 'application/octet-stream', upsert: false });
    if (up.error) throw up.error;
    const { error } = await sb.from('modelos_oficiais').update({
      arquivo_path: caminho, arquivo_drive_id: null, arquivo_nome: d.fileName, atualizado_em: new Date().toISOString(), usuario: p.email
    }).eq('nome', d.modeloNome);
    if (error) { await sb.storage.from('modelos').remove([caminho]); throw error; }
    if (atual.data.arquivo_path) await sb.storage.from('modelos').remove([atual.data.arquivo_path]);
  }
});

Object.assign(ACAO_ALUNO_SB, {
  async uploadFotoAluno(d) { await guardarArquivoAlunoSb(d, 'foto', 'foto'); },
  async uploadTermoResponsabilidade(d) { await guardarArquivoAlunoSb(d, 'termo_resp', 'termo'); },
  async uploadDeclaracaoEdEspecial(d) { await guardarArquivoAlunoSb(d, 'decl_ed_especial', 'declaracao'); }
});

Object.assign(ACAO_ALUNO_SB, {
  async uploadFotoPerfil(d) {
    if (!d.fileBase64) throw new Error('Arquivo não informado.');
    const p = await carregarPerfilSb();
    const antigo = p.foto_path;
    const caminho = p.id + '/perfil_' + Date.now() + '.jpg';
    const tipo = d.mimeType || 'image/jpeg';
    const up = await sb.storage.from('fotos-perfil').upload(caminho, base64ParaBlob(d.fileBase64, tipo), { contentType: tipo, upsert: false });
    if (up.error) throw up.error;
    const r = await sb.rpc('definir_foto_perfil', { p_path: caminho });
    if (r.error) { await sb.storage.from('fotos-perfil').remove([caminho]); throw r.error; }
    if (antigo) await sb.storage.from('fotos-perfil').remove([antigo]);
    await carregarPerfilSb(true);
  },

  async salvarMonitoramento(d) {
    const p = await carregarPerfilSb();
    if (!p.is_admin && !(p.perfis || []).includes('SUPERVISOR')) throw new Error('Apenas supervisores registram visitas.');
    if (!d.escola || !d.idVisita || !Array.isArray(d.itens)) throw new Error('Dados da visita incompletos.');

    const v = await sb.from('monitoramento_visitas').upsert({
      id: d.idVisita, escola: d.escola, obs_gerais: txtOuNulo(d.obsGerais),
      finalizada: d.finalizar === true, data_visita: new Date().toISOString()
    }, { onConflict: 'id' });
    if (v.error) throw v.error;

    const linhas = d.itens.map(function (i) {
      return { visita_id: d.idVisita, item_id: String(i.id), categoria: txtOuNulo(i.categoria), descricao: txtOuNulo(i.descricao),
        status: txtOuNulo(i.status), obs: txtOuNulo(i.obs) };
    });
    const it = await sb.from('monitoramento_itens').upsert(linhas, { onConflict: 'visita_id,item_id' }).select('id, item_id');
    if (it.error) throw it.error;
    const uuidPorItem = {};
    it.data.forEach(function (x) { uuidPorItem[x.item_id] = x.id; });

    for (const i of d.itens) {
      for (const a of (i.anexos || [])) {
        const caminho = d.idVisita + '/' + nomeSeguroArquivo(String(i.id)) + '/' + Date.now() + '_' + nomeSeguroArquivo(a.fileName);
        const up = await sb.storage.from('monitoramento').upload(caminho, base64ParaBlob(a.base64, a.mimeType), { contentType: a.mimeType || 'application/octet-stream', upsert: false });
        if (up.error) throw up.error;
        const ins = await sb.from('monitoramento_anexos').insert({ item_uuid: uuidPorItem[String(i.id)], arquivo_path: caminho, nome: a.fileName });
        if (ins.error) { await sb.storage.from('monitoramento').remove([caminho]); throw ins.error; }
      }
    }
  }
});

Object.assign(ACAO_ALUNO_SB, {
  async marcarMensagemLida(d) {
    await exigirLinhasAfetadas(sb.from('notificacoes').update({ lida: true }).eq('id', d.id).select('id'));
  }
});

// Ações ainda não migradas: bloqueadas para NÃO gravar na planilha por engano
// enquanto a leitura já vem do Supabase (as duas bases ficariam diferentes).
const ACOES_ALUNOS_PENDENTES = {
  importarDaAbaTemp: 'A importação pela aba IMPORT_TEMP da planilha foi desativada. Use a importação por arquivo CSV.'
};

const _postSemRespostaLegado = postSemResposta;
window.postSemResposta = function (dados, msgSucesso, callback, aoFalhar) {
  if (dados && ACOES_ALUNOS_PENDENTES[dados.acao]) {
    try { ImportProgress.limpar(); ImportProgress.esconder(); } catch (_) {}
    if (typeof esconderLoading === 'function') esconderLoading();
    mostrarToast(ACOES_ALUNOS_PENDENTES[dados.acao], 'warning');
    if (aoFalhar) aoFalhar(new Error('pendente'));
    return;
  }
  if (dados && ACAO_ALUNO_SB[dados.acao]) {
    executarAcaoAlunoSb(dados, msgSucesso, callback, aoFalhar);
    return;
  }
  return _postSemRespostaLegado.apply(this, arguments);
};

async function executarAcaoAlunoSb(dados, msgSucesso, callback, aoFalhar) {
  if (dados.acao === 'enviarCSVParaFila') msgSucesso = null;
  const btn = window._clickedButton;
  if (btn && typeof showButtonLoading === 'function') showButtonLoading(btn);
  try {
    await ACAO_ALUNO_SB[dados.acao](dados);
    if (msgSucesso) mostrarToast(msgSucesso, 'success');
    if (callback) callback();
  } catch (e) {
    console.error('Erro em ' + dados.acao + ':', e);
    if (typeof esconderLoading === 'function') esconderLoading();
    mostrarToast(mensagemErroSb(e), 'error');
    if (aoFalhar) aoFalhar(e);
  } finally {
    if (btn && typeof hideButtonLoading === 'function') hideButtonLoading(btn);
    window._clickedButton = null;
  }
}
