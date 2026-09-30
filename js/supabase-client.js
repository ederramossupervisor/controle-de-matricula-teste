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
// TERMO DE COMPROMISSO (provisório: ainda vive no Apps Script)
// ------------------------------------------------------------
function statusTermoLegado() {
  return new Promise(function (resolve) {
    jsonp(`${API_URL}?tipo=statusTermo&email=${encodeURIComponent(emailUsuario)}`, function (r) {
      resolve(r && r.erro ? null : r);
    });
  });
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
    FOTO: a.foto_drive_id ? `https://drive.google.com/thumbnail?id=${a.foto_drive_id}&sz=w200` : null,
    _TERMO_RESP_ID: a.termo_resp_drive_id || null,
    TERMO_RESP: drive(a.termo_resp_drive_id),
    _DECL_ED_ESPECIAL_ID: a.decl_ed_especial_drive_id || null,
    DECL_ED_ESPECIAL: drive(a.decl_ed_especial_drive_id)
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
      const t = await statusTermoLegado();
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

    return {
      perfil: perfis.join(','),
      escola: perfil.escola,
      alunos: linhas.map(alunoSbParaTela),
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
    if (!perfil || !perfil.escola) throw new Error('Seu usuário não está vinculado a uma escola.');
    const dm = paraDataIso(d.dataMatricula) || hojeSaoPaulo();
    const linha = Object.assign({
      escola: perfil.escola,
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

// Ações ainda não migradas: bloqueadas para NÃO gravar na planilha por engano
// enquanto a leitura já vem do Supabase (as duas bases ficariam diferentes).
const ACOES_ALUNOS_PENDENTES = new Set([
  'importarDaAbaTemp', 'enviarCSVParaFila', 'importarAlunosLote',
  'promoverAlunosLote', 'inserirNovosAlunosLote', 'finalizarPromocao'
]);

const _postSemRespostaLegado = postSemResposta;
window.postSemResposta = function (dados, msgSucesso, callback, aoFalhar) {
  if (dados && ACOES_ALUNOS_PENDENTES.has(dados.acao)) {
    try { ImportProgress.limpar(); ImportProgress.esconder(); } catch (_) {}
    if (typeof esconderLoading === 'function') esconderLoading();
    mostrarToast('Importação e promoção de alunos ainda não foram migradas para o novo servidor.', 'warning');
    return;
  }
  if (dados && ACAO_ALUNO_SB[dados.acao]) {
    executarAcaoAlunoSb(dados, msgSucesso, callback, aoFalhar);
    return;
  }
  return _postSemRespostaLegado.apply(this, arguments);
};

async function executarAcaoAlunoSb(dados, msgSucesso, callback, aoFalhar) {
  const btn = window._clickedButton;
  if (btn && typeof showButtonLoading === 'function') showButtonLoading(btn);
  try {
    await ACAO_ALUNO_SB[dados.acao](dados);
    if (msgSucesso) mostrarToast(msgSucesso, 'success');
    if (callback) callback();
  } catch (e) {
    console.error('Erro em ' + dados.acao + ':', e);
    mostrarToast(mensagemErroSb(e), 'error');
    if (aoFalhar) aoFalhar(e);
  } finally {
    if (btn && typeof hideButtonLoading === 'function') hideButtonLoading(btn);
    window._clickedButton = null;
  }
}
