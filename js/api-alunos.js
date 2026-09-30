// js/api-alunos.js
// ============================================================
// CAMADA DE ACESSO A DADOS DE ALUNOS (backend Supabase/Vercel)
// ============================================================
// Todo o resto do sistema (atos autorizativos, modelos de documentos,
// agenda, plano tático, profissionais...) continua chamando API_URL
// (Apps Script/Sheets) normalmente, sem passar por este arquivo.
//
// O backend é o repositório "controle-de-matricula-teste" (Vercel):
// cada arquivo em /api/ é uma rota própria, todas recebendo POST com
// JSON no corpo (exceto /api/alunos, que é GET com email na query).
//
// Diferença importante em relação a postSemResposta()/jsonp():
// - postSemResposta usa mode:'no-cors', então o front-end NUNCA sabe
//   se a chamada deu certo ou errado no servidor — só assume sucesso.
// - Aqui usamos fetch() normal, com CORS de verdade (a função Vercel
//   devolve os headers de CORS), então dá pra checar o status HTTP e
//   tratar erro de verdade (ex.: aluno duplicado, escola sem permissão).

async function chamarApiAlunos(caminho, corpo = null) {
  const ehGet = corpo === null;
  const opcoes = ehGet
    ? { method: 'GET' }
    : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...corpo, email: emailUsuario })
      };

  const url = ehGet
    ? `${API_BASE_ALUNOS}${caminho}?email=${encodeURIComponent(emailUsuario)}`
    : `${API_BASE_ALUNOS}${caminho}`;

  let resp;
  try {
    resp = await fetch(url, opcoes);
  } catch (erroRede) {
    throw new Error('Falha de conexão com o servidor de alunos.');
  }

  let corpoResposta = null;
  try { corpoResposta = await resp.json(); } catch (_) { /* sem corpo JSON */ }

  if (!resp.ok) {
    const mensagem = (corpoResposta && (corpoResposta.msg || corpoResposta.erro))
      || `Erro ${resp.status} na API de alunos.`;
    throw new Error(mensagem);
  }

  return corpoResposta;
}

// ------ LISTAR (GET /api/alunos) ------
// Devolve os alunos já normalizados no MESMO formato que ui.js/modals.js
// sempre leram da planilha (chaves maiúsculas tipo ALUNO, ESCOLA,
// CERTIDAO...), pra não precisar reescrever a tela de listagem/detalhes.
// Também repassa o erro "termo_pendente" igualzinho ao que o Apps Script
// já mandava, pra reaproveitar o tratamento que já existe em
// continuarCarregamentoAlunos() (data.js).
async function carregarAlunosSupabase() {
  mostrarLoading();
  try {
    const resposta = await chamarApiAlunos('/api/alunos');
    if (resposta && resposta.erro) {
      return resposta; // ex: { erro: 'termo_pendente', status: ... }
    }
    return (resposta || []).map(normalizarAlunoSupabase);
  } catch (e) {
    mostrarToast('Erro ao carregar alunos: ' + e.message, 'error');
    return [];
  } finally {
    esconderLoading();
  }
}

// Converte o formato do Supabase (snake_case) pro formato que o resto do
// app já espera. O código (ex: "AB123") vira tanto ID quanto _row — no
// modelo antigo _row era o número da linha na planilha, usado só pra
// identificar QUAL aluno editar/excluir; no Supabase essa mesma função é
// cumprida pelo código, então os dois passam a apontar pro mesmo valor.
function normalizarAlunoSupabase(a) {
  return {
    _row: a.codigo,
    CODIGO: a.codigo,
    ID: a.codigo,
    ALUNO: a.nome,
    ESCOLA: a.escola,
    RESPONSAVEL: a.responsavel,
    TELEFONE: a.telefone,
    TURMA: a.turma,
    ED_ESPECIAL: a.ed_especial === true,
    OBSERVACOES: a.observacoes || '',
    CPF_NUMERO: a.cpf_numero || '',
    RACA_COR: a.raca_cor || '',
    FILIACAO_1: a.filiacao_1 || '',
    FILIACAO_2: a.filiacao_2 || '',
    DATA_NASCIMENTO: a.data_nascimento || '',
    NATURALIDADE: a.naturalidade || '',
    UF_NASCIMENTO: a.uf_nascimento || '',
    NACIONALIDADE: a.nacionalidade || '',
    CERTIDAO: a.certidao_entregue === true,
    CPF: a.cpf_entregue === true,
    RG: a.rg_entregue === true,
    VACINA: a.vacina_entregue === true,
    SUS: a.sus_entregue === true,
    RESIDENCIA: a.residencia_entregue === true,
    RESP_DOCS: a.resp_docs_entregue === true,
    HISTORICO: a.historico_entregue === true,
    DECL_TRANSF: a.decl_transf_entregue === true,
    STATUS: a.status,
    ALERTA: a.alerta,
    SITUACAO: a.situacao,
    DATA_MATRICULA: a.data_matricula,
    PRAZO_FINAL: a.prazo_final,
    DATA_ATUALIZACAO: a.data_atualizacao,
    FOTO: null // fotos de aluno continuam no Drive/Apps Script, não migradas ainda
  };
}

// Faz o caminho inverso de normalizarAlunoSupabase() — usado pelas funções
// de salvar/editar, que hoje montam o payload a partir de dadosAlunoAtual
// (já no formato "de tela"/maiúsculo).
//
// aluno.id é o número de matrícula OFICIAL do SEGES (vem assim já no CSV
// baixado do sistema estadual) — não é um código qualquer. Por isso ele
// sempre vira idAluno aqui: tanto no cadastro individual quanto na
// importação em lote, o back-end usa esse valor como o próprio "codigo"
// (chave do aluno no banco) em vez de gerar um código aleatório.
function mapearCamposAluno(aluno) {
  const payload = {
    nome: aluno.nome,
    responsavel: aluno.responsavel,
    telefone: aluno.telefone,
    turma: aluno.turma,
    dataMatricula: aluno.dataMatricula,
    cpfNumero: aluno.cpfAluno || aluno.cpfNumero || '',
    edEspecial: aluno.edEspecial === true,
    observacoes: aluno.observacoes || '',
    racaCor: aluno.racaCor || '',
    filiacao1: aluno.filiacao1 || '',
    filiacao2: aluno.filiacao2 || '',
    dataNascimento: aluno.dataNascimento || null,
    naturalidade: aluno.naturalidade || '',
    ufNascimento: aluno.ufNascimento || '',
    nacionalidade: aluno.nacionalidade || '',
    // documentos recebidos como "entregue = true" quando o CSV trouxe algo preenchido
    certidaoEntregue: !!(aluno.certidao && aluno.certidao.trim()),
    susEntregue: !!(aluno.sus && aluno.sus.trim()),
    rgEntregue: !!(aluno.rg && aluno.rg.trim()),
    residenciaEntregue: !!(aluno.residencia && aluno.residencia.trim())
  };
  if (aluno.id) payload.idAluno = String(aluno.id).trim();
  return payload;
}

// Marca/desmarca um documento entregue, a partir do número de coluna que
// modals.js já usa pra identificar cada checkbox (8 a 17 — ver
// CONFIG_DOCS_CARD em config.js e os checkboxes no modal de detalhes).
const MAPA_COLUNA_CAMPO_DOCUMENTO = {
  8: 'certidao_entregue',
  9: 'cpf_entregue',
  10: 'rg_entregue',
  11: 'vacina_entregue',
  12: 'sus_entregue',
  13: 'residencia_entregue',
  14: 'resp_docs_entregue',
  15: 'historico_entregue',
  16: 'decl_transf_entregue',
  17: 'ed_especial'
};

async function atualizarDocumentoPorColunaSupabase(codigo, coluna, valor) {
  const campo = MAPA_COLUNA_CAMPO_DOCUMENTO[coluna];
  if (!campo) throw new Error(`Coluna de documento desconhecida: ${coluna}`);
  return atualizarDocumentoAlunoSupabase(codigo, campo, valor);
}

// ------ CADASTRAR 1 ALUNO (POST /api/cadastrar-aluno) ------
async function cadastrarAlunoSupabase(dadosAluno) {
  try {
    const payload = mapearCamposAluno(dadosAluno);
    const resultado = await chamarApiAlunos('/api/cadastrar-aluno', payload);
    mostrarToast(resultado.msg || 'Aluno cadastrado com sucesso!', 'success');
    return resultado;
  } catch (e) {
    mostrarToast('Erro ao cadastrar aluno: ' + e.message, 'error');
    throw e;
  }
}

// ------ EDITAR (POST /api/editar-aluno) ------
async function editarAlunoSupabase(codigo, dadosAluno) {
  try {
    const payload = { codigo, ...mapearCamposAluno(dadosAluno) };
    const resultado = await chamarApiAlunos('/api/editar-aluno', payload);
    mostrarToast(resultado.msg || 'Aluno atualizado com sucesso!', 'success');
    return resultado;
  } catch (e) {
    mostrarToast('Erro ao atualizar aluno: ' + e.message, 'error');
    throw e;
  }
}

// Igual a editarAlunoSupabase, mas manda só os campos passados em vez de
// passar por mapearCamposAluno() — que preenche o resto com '' e apagaria
// dados existentes. Usar pra mudanças pontuais (ex: só a situação).
async function editarCamposAlunoSupabase(codigo, camposParciais, mensagemSucesso = null) {
  try {
    const resultado = await chamarApiAlunos('/api/editar-aluno', { codigo, ...camposParciais });
    if (mensagemSucesso) mostrarToast(mensagemSucesso, 'success');
    return resultado;
  } catch (e) {
    mostrarToast('Erro ao atualizar aluno: ' + e.message, 'error');
    throw e;
  }
}

// ------ EXCLUIR (POST /api/excluir-aluno) ------
async function excluirAlunoSupabase(codigo) {
  try {
    const resultado = await chamarApiAlunos('/api/excluir-aluno', { codigo });
    mostrarToast(resultado.msg || 'Aluno excluído com sucesso!', 'success');
    return resultado;
  } catch (e) {
    mostrarToast('Erro ao excluir aluno: ' + e.message, 'error');
    throw e;
  }
}

// ------ MARCAR DOCUMENTO ENTREGUE/PENDENTE (POST /api/atualizar-documento) ------
// campo: um de certidao_entregue, cpf_entregue, rg_entregue, sus_entregue,
// residencia_entregue, resp_docs_entregue, historico_entregue,
// decl_transf_entregue, ed_especial
async function atualizarDocumentoAlunoSupabase(codigo, campo, valor) {
  try {
    const resultado = await chamarApiAlunos('/api/atualizar-documento', { codigo, campo, valor });
    return resultado; // { status, novoStatus, novoAlerta }
  } catch (e) {
    mostrarToast('Erro ao atualizar documento: ' + e.message, 'error');
    throw e;
  }
}

// ------ IMPORTAÇÃO EM LOTE (POST /api/importar-lote — precisa ser criado) ------
// Reaproveita a UI de progresso (barra + "desfazer") que já existe em
// js/importador.js (ImportProgress), mas envia os lotes pro Supabase em
// poucas chamadas grandes, em vez do esquema de fila + gatilho de tempo
// que o Apps Script precisava por causa do limite de 6 min de execução.
async function importarAlunosSupabase(alunos, tamanhoLote = 200) {
  ImportProgress.limpar();
  ImportProgress.alunosEnviadosIds = [];
  const total = alunos.length;
  let enviados = 0;
  const inicio = Date.now();

  document.getElementById('importProgressTitle').innerText = 'Importando alunos...';
  ImportProgress.mostrar();
  ImportProgress.atualizarUI(0, total, 0);

  for (let i = 0; i < total; i += tamanhoLote) {
    const lote = alunos.slice(i, i + tamanhoLote).map(mapearCamposAluno);
    try {
      const resultado = await chamarApiAlunos('/api/importar-lote', { alunos: lote });
      enviados += lote.length;
      const idsDoLote = (resultado && resultado.codigosCriados) || [];
      ImportProgress.alunosEnviadosIds = ImportProgress.alunosEnviadosIds.concat(idsDoLote);
    } catch (e) {
      mostrarToast(`Erro no lote ${Math.floor(i / tamanhoLote) + 1}: ${e.message}`, 'error');
      ImportProgress.atualizarUI(enviados, total, 0, false, true);
      return;
    }

    const decorrido = (Date.now() - inicio) / 1000;
    const velocidade = enviados / decorrido;
    const faltam = total - enviados;
    const tempoRestante = velocidade > 0 ? Math.ceil(faltam / velocidade) : 0;
    ImportProgress.atualizarUI(enviados, total, tempoRestante);
  }

  ImportProgress.atualizarUI(enviados, total, 0, true);
  mostrarToast(`Importação concluída! ${enviados} de ${total} alunos processados.`, 'success');
  setTimeout(() => ImportProgress.esconder(), 12000);
  if (typeof carregarAlunos === 'function') carregarAlunos();
  if (typeof fecharModalImportacao === 'function') fecharModalImportacao();
}

// ------ DESFAZER IMPORTAÇÃO (POST /api/excluir-lote — precisa ser criado) ------
async function desfazerImportacaoSupabase() {
  if (ImportProgress.alunosEnviadosIds.length === 0) {
    mostrarToast('Nenhum aluno para desfazer.', 'info');
    return;
  }
  mostrarLoading();
  try {
    await chamarApiAlunos('/api/excluir-lote', { codigos: ImportProgress.alunosEnviadosIds });
    mostrarToast('Alunos removidos com sucesso!', 'success');
    ImportProgress.alunosEnviadosIds = [];
    ImportProgress.esconder();
    if (typeof carregarAlunos === 'function') carregarAlunos();
  } catch (e) {
    mostrarToast('Erro ao desfazer: ' + e.message, 'error');
  } finally {
    esconderLoading();
  }
}

// ============================================================
// LISTAGEM COM FILTRO/PAGINAÇÃO NO NAVEGADOR
// ============================================================
// O Apps Script paginava e filtrava no servidor (por parâmetro na URL).
// /api/alunos não faz isso — devolve tudo que o usuário pode ver de uma
// vez. Por isso guardamos essa lista em cache (alguns minutos) e fazemos
// o filtro/paginação aqui no navegador a cada troca de filtro, sem
// precisar buscar de novo no servidor toda hora.
let _cacheAlunosSupabase = null;
let _cacheAlunosSupabaseEm = 0;
const CACHE_ALUNOS_VALIDADE_MS = 3 * 60 * 1000; // 3 minutos

async function obterTodosAlunosSupabase(forcarRecarga = false) {
  const expirou = (Date.now() - _cacheAlunosSupabaseEm) > CACHE_ALUNOS_VALIDADE_MS;
  if (forcarRecarga || !_cacheAlunosSupabase || expirou) {
    const resultado = await carregarAlunosSupabase();
    if (resultado && resultado.erro) return resultado; // repassa termo_pendente etc.
    _cacheAlunosSupabase = resultado;
    _cacheAlunosSupabaseEm = Date.now();
  }
  return _cacheAlunosSupabase;
}

function invalidarCacheAlunosSupabase() {
  _cacheAlunosSupabase = null;
}

function filtrarAlunosClientSide(alunos, filtros = {}) {
  const nomeBusca = (filtros.nome || '').toLowerCase();
  return alunos.filter(a => {
    if (filtros.escola && a.ESCOLA !== filtros.escola) return false;
    if (filtros.turma && a.TURMA !== filtros.turma) return false;
    if (filtros.status && a.STATUS !== filtros.status) return false;
    if (filtros.situacao && a.SITUACAO !== filtros.situacao) return false;
    if (nomeBusca && !(a.ALUNO || '').toLowerCase().includes(nomeBusca)) return false;
    return true;
  });
}

function gerarResumoPorEscolaSupabase(alunos) {
  const mapa = {};
  alunos.forEach(a => {
    const esc = a.ESCOLA || 'Sem escola';
    if (!mapa[esc]) mapa[esc] = { total: 0, pendentes: 0 };
    mapa[esc].total++;
    if (a.STATUS === '⚠️ Pendente') mapa[esc].pendentes++;
  });
  return mapa;
}

// Monta o mesmo "formato dados" que o Apps Script devolvia (dados.alunos,
// dados.paginaAtual, dados.totalPaginas, dados.totalRegistros,
// dados.metricas, dados.resumoPorEscola), a partir da lista do Supabase —
// pra reaproveitar toda a renderização existente sem reescrevê-la.
async function montarPaginaAlunosSupabase(pagina, filtros, itensPorPagina) {
  const todos = await obterTodosAlunosSupabase();
  if (todos && todos.erro) return todos; // termo_pendente etc.

  const filtrados = filtrarAlunosClientSide(todos, filtros);
  const inicio = (pagina - 1) * itensPorPagina;
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itensPorPagina));

  return {
    alunos: filtrados.slice(inicio, inicio + itensPorPagina),
    paginaAtual: pagina,
    totalPaginas,
    totalRegistros: filtrados.length,
    metricas: gerarResumo(filtrados),
    resumoPorEscola: gerarResumoPorEscolaSupabase(todos)
  };
}

// ============================================================
// ATUALIZAR MATRICULADOS E PROMOVER ALUNOS (CSV)
// ============================================================
// Mesmo padrão de campos que o CSV de "Atualizar Matriculados"/"Promover
// Alunos" já produz em js/data.js (processarCSVAtualizar/processarCSVPromocao):
// id, nome, responsavel, telefone, escola, turma, dataMatricula, cpf,
// racaCor, filiacao1, filiacao2, dataNascimento, naturalidade,
// ufNascimento, nacionalidade, edEspecial.
function mapearCamposAtualizacaoLote(aluno) {
  return {
    idAluno: (aluno.id || '').toString().trim(),
    nome: aluno.nome,
    responsavel: aluno.responsavel || '',
    telefone: aluno.telefone || '',
    turma: aluno.turma || '',
    dataMatricula: aluno.dataMatricula || null,
    cpfNumero: aluno.cpf || '',
    edEspecial: aluno.edEspecial === true,
    racaCor: aluno.racaCor || '',
    filiacao1: aluno.filiacao1 || '',
    filiacao2: aluno.filiacao2 || '',
    dataNascimento: aluno.dataNascimento || null,
    naturalidade: aluno.naturalidade || '',
    ufNascimento: aluno.ufNascimento || '',
    nacionalidade: aluno.nacionalidade || '',
    certidaoEntregue: !!(aluno.certidao && aluno.certidao.trim && aluno.certidao.trim()),
    susEntregue: !!(aluno.sus && aluno.sus.trim && aluno.sus.trim()),
    rgEntregue: !!(aluno.rg && aluno.rg.trim && aluno.rg.trim()),
    residenciaEntregue: !!(aluno.residencia && aluno.residencia.trim && aluno.residencia.trim())
  };
}

// ------ ATUALIZAR MATRICULADOS (POST /api/atualizar-matriculados) ------
// Insere só quem é novo; quem já existe fica intocado. Não exclui ninguém.
async function atualizarMatriculadosSupabase(alunos, atualizarStatus = null, tamanhoLote = 500) {
  let inseridos = 0, ignorados = 0;
  for (let i = 0; i < alunos.length; i += tamanhoLote) {
    const lote = alunos.slice(i, i + tamanhoLote).map(mapearCamposAtualizacaoLote);
    if (atualizarStatus) atualizarStatus(`Enviando lote ${Math.floor(i / tamanhoLote) + 1} de ${Math.ceil(alunos.length / tamanhoLote)}...`);
    const resultado = await chamarApiAlunos('/api/atualizar-matriculados', { alunos: lote });
    inseridos += resultado.inseridos || 0;
    ignorados += resultado.ignorados || 0;
  }
  invalidarCacheAlunosSupabase();
  return { inseridos, ignorados };
}

// ------ PROMOVER ALUNOS (POST /api/promover-alunos) ------
// Atualiza turma de quem já existe (documentos não são mexidos), cria
// quem não existe, e marca como "Transferido" quem sumiu da lista nova.
// Precisa ir num lote só (não em pedaços), porque o cálculo de quem foi
// "transferido" depende de ver a lista COMPLETA de uma vez.
async function promoverAlunosSupabase(alunos) {
  const payload = alunos.map(mapearCamposAtualizacaoLote);
  const resultado = await chamarApiAlunos('/api/promover-alunos', { alunos: payload });
  invalidarCacheAlunosSupabase();
  return resultado;
}
