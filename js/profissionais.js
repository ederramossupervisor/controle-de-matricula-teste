// =========================
// PROFISSIONAIS.JS – COMPLETO
// =========================

// Variáveis globais
let abaAtiva = 'alunos';
let profissionaisGlobais = [];
let modoVisualizacaoProf = 'cards';
let itensPorPaginaProf = 20;
let paginaAtualProf = 1;
let profissionaisFiltrados = [];
let profissionalAtual = null;

// =========================
// CONFIGURAÇÃO DOS ÍCONES DE DOCUMENTOS PARA PROFISSIONAIS
// =========================
const CONFIG_DOCS_PROFISSIONAL = [
  { coluna: "NOME", icone: "fa-user", label: "Nome" },
  { coluna: "CPF", icone: "fa-id-card", label: "CPF" },
  { coluna: "RG", icone: "fa-address-card", label: "RG" },
  { coluna: "CERTIDAO_NASC", icone: "fa-file-alt", label: "Certidão de Nascimento" },
  { coluna: "INEP", icone: "fa-graduation-cap", label: "INEP" },
  { coluna: "ESCOLARIDADE", icone: "fa-school", label: "Escolaridade" },
  { coluna: "CURSO_SUPERIOR", icone: "fa-university", label: "Curso Superior" },
  { coluna: "LICENCIATURA", icone: "fa-chalkboard-teacher", label: "Licenciatura" },
  { coluna: "LOGRADOURO", icone: "fa-home", label: "Endereço" },
  { coluna: "EMAIL", icone: "fa-envelope", label: "E-mail" }
];

// =========================
// TIPOS DE DOCUMENTOS PARA PROFISSIONAIS
// =========================
const TIPOS_DOCUMENTOS_PROFISSIONAL = [
  "RG",
  "CPF",
  "Certidão de Nascimento",
  "Certidão de Casamento",
  "Título de Eleitor",
  "Comprovante de Residência",
  "Diploma de Ensino Médio",
  "Diploma de Curso Superior",
  "Histórico Escolar (Superior)",
  "Licenciatura",
  "Pós-Graduação (Diploma)",
  "Certificado de Curso (Formação)",
  "Declaração de Deficiência",
  "Declaração de Povo Indígena",
  "Laudo Médico",
  "INEP",
  "PIS/PASEP",
  "Contato de Emergência",
  "Outros"
];

// =========================
// UTILITÁRIOS DE LIMPEZA
// =========================
function limparDataISO(valor) {
  if (!valor) return '';
  const str = String(valor);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const partes = str.split('/');
  if (partes.length === 3 && partes[2].length === 4) {
    return `${partes[2]}-${partes[1].padStart(2,'0')}-${partes[0].padStart(2,'0')}`;
  }
  return str;
}

function limparCH(valor) {
  if (!valor) return '';
  const str = String(valor);
  if (/^1899-12-30T/.test(str) || /^1899-12-31T/.test(str)) return '000:00';
  if (/^\d{2,3}:\d{2}$/.test(str)) return str;
  const match = str.match(/^(\d{2,3}):(\d{2}):\d{2}$/);
  if (match) return `${match[1]}:${match[2]}`;
  return str;
}

function chParaHumanizado(valor) {
  if (!valor) return '';
  const str = String(valor).trim();
  const match = str.match(/^(\d{2,3}):(\d{2})$/);
  if (match) {
    const horas = parseInt(match[1], 10);
    const minutos = parseInt(match[2], 10);
    if (horas === 0 && minutos === 0) return '0h';
    return `${horas}h`;
  }
  return str;
}

function chParaMaquina(str) {
  if (!str) return '000:00';
  const match = str.match(/^(\d+)h?$/i);
  if (match) {
    const horas = parseInt(match[1], 10);
    return `${String(horas).padStart(3, '0')}:00`;
  }
  return str;
}

function paraDataISO(str) {
  if (!str) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const partes = str.split(/[/-]/);
  if (partes.length === 3) {
    return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
  }
  return str;
}

// =========================
// SELEÇÃO DE ABA
// =========================
function selecionarAba(aba) {
  if (aba === abaAtiva) return;
  abaAtiva = aba;

  const menu = document.getElementById('menuDropdown');
  if (menu) menu.style.display = 'none';

  document.getElementById('abaAlunos').classList.toggle('ativo', aba === 'alunos');
  document.getElementById('abaProfissionais').classList.toggle('ativo', aba === 'profissionais');

  document.getElementById('filtros-container').style.display = (aba === 'alunos') ? 'flex' : 'none';
  document.getElementById('filtros-profissionais-container').style.display = (aba === 'profissionais') ? 'flex' : 'none';
  document.getElementById('areaToggleVisualizacao').style.display = 'flex';

  const colunaAlunos = document.getElementById('menuColunaAlunos');
  const colunaProfissionais = document.getElementById('menuColunaProfissionais');
  if (colunaAlunos) colunaAlunos.style.display = (aba === 'alunos') ? '' : 'none';
  if (colunaProfissionais) colunaProfissionais.style.display = (aba === 'profissionais') ? '' : 'none';

  if (aba === 'profissionais') {
    window.alternarVisualizacaoOriginal = window.alternarVisualizacao;
    window.alternarVisualizacao = function() {
      modoVisualizacaoProf = (modoVisualizacaoProf === 'cards') ? 'lista' : 'cards';
      const lista = profissionaisFiltrados.length ? profissionaisFiltrados : profissionaisGlobais;
      renderListaProfissionais(lista);
      const btn = document.getElementById('toggleVisualizacao');
      if (btn) {
        if (modoVisualizacaoProf === 'lista') {
          btn.classList.add('ativo');
          btn.innerHTML = '<i class="fas fa-list"></i>';
        } else {
          btn.classList.remove('ativo');
          btn.innerHTML = '<i class="fas fa-th-large"></i>';
        }
      }
    };
  } else {
    if (window.alternarVisualizacaoOriginal) {
      window.alternarVisualizacao = window.alternarVisualizacaoOriginal;
    }
  }

  if (aba === 'alunos') {
    if (typeof carregarAlunos === 'function') carregarAlunos();
  } else {
    carregarProfissionais();
  }
}

// =========================
// CARREGAR PROFISSIONAIS
// =========================
function carregarProfissionais() {
  mostrarLoading();
  const escola = (perfilUsuario === 'SUPERVISOR') ? document.getElementById('filtroProfEscola').value : escolaUsuario;
  const cargo = document.getElementById('filtroProfCargo').value;
  const regime = document.getElementById('filtroProfRegime').value;
  const situacao = document.getElementById('filtroProfSituacao').value;
  const nomeBusca = document.getElementById('pesquisaProfNome').value.trim().toLowerCase();

  let url = `${API_URL_PROFISSIONAIS}?tipo=listarProfissionais&email=${emailUsuario}&escola=${encodeURIComponent(escola)}&_=${Date.now()}`;

  jsonp(url, function(dados) {
    esconderLoading();
    if (!Array.isArray(dados)) {
      mostrarToast('Erro ao carregar profissionais.', 'error');
      return;
    }

    let lista = dados;
    if (cargo) lista = lista.filter(p => p.CARGO === cargo);
    if (regime) lista = lista.filter(p => p.REGIME === regime);
    if (situacao) lista = lista.filter(p => p.SITUACAO_LOTACAO === situacao);
    if (nomeBusca) lista = lista.filter(p => (p.NOME || '').toLowerCase().includes(nomeBusca));

    profissionaisGlobais = lista;
    profissionaisFiltrados = lista;
    paginaAtualProf = 1;
    aplicarFiltrosProfissionais();
    renderPainelProfissionais(lista);
    preencherFiltrosProfissionais(lista);
  });
}

// =========================
// APLICAR FILTROS / PAGINAÇÃO PROFISSIONAIS
// =========================
function aplicarFiltrosProfissionais() {
  const lista = profissionaisFiltrados;
  const inicio = (paginaAtualProf - 1) * itensPorPaginaProf;
  const paginados = lista.slice(inicio, inicio + itensPorPaginaProf);
  renderListaProfissionais(paginados);
  renderizarPaginacaoProfissionais(Math.ceil(lista.length / itensPorPaginaProf), lista.length);
}

// =========================
// RENDERIZAR LISTA DE PROFISSIONAIS (CARDS)
// =========================
function renderListaProfissionais(lista) {
  const container = document.getElementById('lista');
  container.innerHTML = '';

  if (modoVisualizacaoProf === 'lista') {
    container.style.display = 'block';
    container.style.padding = '0 20px 20px';
    renderTabelaProfissionais(lista, container);
    return;
  }

  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
  container.style.gap = '14px';
  container.style.padding = '0 20px 20px';

  if (lista.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-muted);">Nenhum profissional encontrado.</p>';
    return;
  }

  lista.forEach(prof => {
    const card = document.createElement('div');
    card.className = 'fade';

    // Verifica documentos pendentes
    const pendentes = verificarDocumentosProfissional(prof);
    const temPendencia = pendentes.length > 0;

    // Cor da borda esquerda
    const corBorda = temPendencia ? '#ef4444' : '#10b981';

    // Cor de fundo conforme situação
    const situacao = (prof.SITUACAO_LOTACAO || '').toUpperCase();
    let corFundo = '';
    if (situacao === 'ATIVO') {
      corFundo = '#dcfce7';
    } else if (situacao === 'DESLIGADO' || situacao === 'INATIVO') {
      corFundo = '#fee2e2';
    } else {
      corFundo = '#fef3c7';
    }

    // Badge de situação
    let situacaoBadge = '';
    if (situacao === 'ATIVO') {
      situacaoBadge = '<span class="status-badge status-completo">✅ Ativo</span>';
    } else if (situacao === 'DESLIGADO' || situacao === 'INATIVO') {
      situacaoBadge = '<span class="status-badge status-vencido">🔴 Desligado</span>';
    } else {
      situacaoBadge = `<span class="status-badge status-pendente">🟡 ${prof.SITUACAO_LOTACAO || '—'}</span>`;
    }

    // Nome
    const nome = prof.NOME || 'Nome não informado';

    // Ícones de documentos
    let docsIconsHtml = '<div class="docs-icons" style="display:flex; flex-wrap:wrap; gap:4px; margin:6px 0;">';
    CONFIG_DOCS_PROFISSIONAL.forEach(doc => {
      const valor = prof[doc.coluna];
      const entregue = valor && valor.toString().trim() !== '';
      const statusClass = entregue ? 'entregue' : 'pendente';
      const tooltip = entregue ? `${doc.label}: OK` : `${doc.label}: Pendente`;
      docsIconsHtml += `
        <span class="doc-icon ${statusClass}" data-tooltip="${tooltip}">
          <i class="fas ${doc.icone}"></i>
        </span>
      `;
    });
    docsIconsHtml += '</div>';

    // Monta o card
    card.style.cssText = `
      background: ${corFundo};
      border-radius: 16px;
      padding: 14px 16px;
      border: 1px solid var(--card-border);
      border-left-width: 4px !important;
      border-left-style: solid;
      border-left-color: ${corBorda};
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      gap: 4px;
      position: relative;
    `;

    card.innerHTML = `
      <div style="font-weight: 700; font-size: 16px; color: var(--text-primary); line-height: 1.3; word-wrap: break-word;" title="${nome}">
        ${nome}
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0;">
        ${situacaoBadge}
      </div>
      <div style="display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--text-secondary);">
        <div><i class="fas fa-user-tie" style="width: 18px;"></i> <strong>Função:</strong> ${prof.CARGO || '—'}</div>
        <div><i class="fas fa-calendar-alt" style="width: 18px;"></i> <strong>Regime:</strong> ${prof.REGIME || '—'}</div>
        <div><i class="fas fa-id-card" style="width: 18px;"></i> <strong>Matrícula:</strong> ${prof.MATRICULA || '—'}</div>
      </div>
      ${docsIconsHtml}
    `;

    // Botão Ficha PDF
    const btnPdf = document.createElement('button');
    btnPdf.className = 'btn-icone';
    btnPdf.setAttribute('data-tooltip', 'Gerar ficha em PDF');
    btnPdf.innerHTML = '<i class="fas fa-file-pdf" style="font-size:14px; color:#ef4444;"></i>';
    btnPdf.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      background: transparent;
      border: none;
      cursor: pointer;
      z-index: 5;
    `;
    btnPdf.addEventListener('click', (e) => {
      e.stopPropagation();
      gerarFichaProfissionalPDF(prof);
    });
    card.appendChild(btnPdf);

    // Abrir modal ao clicar no card
    card.addEventListener('click', function(e) {
      if (e.target.closest('button, a')) return;
      abrirModalDetalhesProfissional(prof);
    });

    container.appendChild(card);
  });
}

// =========================
// VERIFICA DOCUMENTOS PENDENTES PARA PROFISSIONAIS
// =========================
function verificarDocumentosProfissional(prof) {
  const pendentes = [];
  const docsObrigatorios = ['NOME', 'CPF', 'RG', 'CERTIDAO_NASC', 'LOGRADOURO', 'EMAIL'];
  docsObrigatorios.forEach(campo => {
    const valor = prof[campo];
    if (!valor || valor.toString().trim() === '') {
      pendentes.push(campo);
    }
  });

  const cargo = (prof.CARGO || '').toUpperCase();
  const ehProfessor = cargo.includes('PROFESSOR') || cargo.includes('PEDAGOGO');

  if (ehProfessor) {
    if (!prof.CURSO_SUPERIOR || prof.CURSO_SUPERIOR.trim() === '') pendentes.push('CURSO_SUPERIOR');
    if (!prof.LICENCIATURA || prof.LICENCIATURA.trim() === '') pendentes.push('LICENCIATURA');
    if (!prof.INEP || prof.INEP.trim() === '') pendentes.push('INEP');
  } else {
    if (!prof.ESCOLARIDADE || prof.ESCOLARIDADE.trim() === '') pendentes.push('ESCOLARIDADE');
  }

  return pendentes;
}

// =========================
// RENDERIZAR TABELA DE PROFISSIONAIS (MODO LISTA)
// =========================
function renderTabelaProfissionais(lista, container) {
  const tabela = document.createElement('table');
  tabela.className = 'tabela-alunos';
  tabela.style.width = '100%';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="border-bottom: 2px solid var(--card-border);">
      <th style="padding: 12px 8px; text-align: left;">Nome</th>
      <th style="padding: 12px 8px; text-align: left;">Cargo</th>
      <th style="padding: 12px 8px; text-align: left;">Regime</th>
      <th style="padding: 12px 8px; text-align: left;">Situação</th>
      <th style="padding: 12px 8px; text-align: left;">CH Mensal</th>
      <th style="padding: 12px 8px; text-align: center;">Ações</th>
    </tr>
  `;
  tabela.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  lista.forEach(prof => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td style="padding: 10px 8px;">${prof.NOME || '—'}</td>
      <td style="padding: 10px 8px;">${prof.CARGO || '—'}</td>
      <td style="padding: 10px 8px;">${prof.REGIME || '—'}</td>
      <td style="padding: 10px 8px;">${prof.SITUACAO_LOTACAO || '—'}</td>
      <td style="padding: 10px 8px;">${chParaHumanizado(limparCH(prof.CH_MENSAL)) || '—'}</td>
      <td style="padding: 10px 8px; text-align:center;">
        <button class="btn-icone" onclick="event.stopPropagation(); abrirModalDetalhesProfissional(profissionaisGlobais.find(p => p.ID === '${prof.ID}'))" data-tooltip="Abrir ficha"><i class="fa-regular fa-pen-to-square"></i></button>
      </td>
    `;
    tr.addEventListener('click', () => abrirModalDetalhesProfissional(prof));
    tbody.appendChild(tr);
  });
  
  tabela.appendChild(tbody);
  container.appendChild(tabela);
}

// =========================
// PAINEL DE MÉTRICAS (PROFISSIONAIS)
// =========================
function renderPainelProfissionais(lista) {
  const painel = document.getElementById('painel');
  const total = lista.length;
  const ativos = lista.filter(p => p.SITUACAO_LOTACAO === 'ATIVO').length;
  const temporarios = lista.filter(p => p.REGIME === 'CONTRATO TEMPORÁRIO').length;
  const efetivos = lista.filter(p => p.REGIME === 'EFETIVO').length;

  painel.innerHTML = `
    <div class="metrica-card metrica-total" onclick="filtrarProfissionaisPorStatus('total')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-users"></i> Total</div>
      <div class="metrica-valor">${total}</div>
      <div class="metrica-detalhe">profissionais</div>
    </div>
    <div class="metrica-card metrica-completos" onclick="filtrarProfissionaisPorStatus('ativos')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-check-circle"></i> Ativos</div>
      <div class="metrica-valor">${ativos}</div>
      <div class="metrica-detalhe">em exercício</div>
    </div>
    <div class="metrica-card metrica-pendentes" onclick="filtrarProfissionaisPorStatus('temporarios')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-clock"></i> Temporários</div>
      <div class="metrica-valor">${temporarios}</div>
      <div class="metrica-detalhe">contrato temporário</div>
    </div>
    <div class="metrica-card metrica-vencidos" onclick="filtrarProfissionaisPorStatus('efetivos')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-shield-alt"></i> Efetivos</div>
      <div class="metrica-valor">${efetivos}</div>
      <div class="metrica-detalhe">concursados</div>
    </div>
  `;
}

// =========================
// PREENCHER FILTROS
// =========================
function preencherFiltrosProfissionais(lista) {
  if (perfilUsuario === 'SUPERVISOR') {
    const selectEscola = document.getElementById('filtroProfEscola');
    const valorAtual = selectEscola.value;
    selectEscola.innerHTML = '<option value="">Todas as escolas</option>';
    const escolas = [...new Set(lista.map(p => p._ESCOLA))].sort();
    escolas.forEach(esc => selectEscola.appendChild(new Option(esc, esc)));
    selectEscola.value = valorAtual;
    document.getElementById('filtroProfEscolaWrapper').style.display = 'block';
  } else {
    document.getElementById('filtroProfEscolaWrapper').style.display = 'none';
  }

  const selectCargo = document.getElementById('filtroProfCargo');
  const cargos = [...new Set(lista.map(p => p.CARGO).filter(Boolean))].sort();
  selectCargo.innerHTML = '<option value="">Todos os cargos</option>';
  cargos.forEach(c => selectCargo.appendChild(new Option(c, c)));

  const selectRegime = document.getElementById('filtroProfRegime');
  const regimes = [...new Set(lista.map(p => p.REGIME).filter(Boolean))].sort();
  selectRegime.innerHTML = '<option value="">Todos os regimes</option>';
  regimes.forEach(r => selectRegime.appendChild(new Option(r, r)));

  const selectSituacao = document.getElementById('filtroProfSituacao');
  const situacoes = [...new Set(lista.map(p => p.SITUACAO_LOTACAO).filter(Boolean))].sort();
  selectSituacao.innerHTML = '<option value="">Todas as situações</option>';
  situacoes.forEach(s => selectSituacao.appendChild(new Option(s, s)));
}

// =========================
// PAGINAÇÃO DE PROFISSIONAIS
// =========================
function renderizarPaginacaoProfissionais(totalPaginas, totalRegistros) {
  const container = document.getElementById('paginacao');
  if (!container) return;
  
  if (totalPaginas <= 1 && itensPorPaginaProf >= totalRegistros) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  container.innerHTML = '';

  const btnFirst = document.createElement('button');
  btnFirst.innerHTML = '<i class="fas fa-angle-double-left"></i>';
  btnFirst.className = 'btn-paginacao';
  btnFirst.disabled = (paginaAtualProf === 1);
  btnFirst.addEventListener('click', () => {
    if (paginaAtualProf !== 1) {
      paginaAtualProf = 1;
      aplicarFiltrosProfissionais();
    }
  });
  container.appendChild(btnFirst);

  const btnPrev = document.createElement('button');
  btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
  btnPrev.className = 'btn-paginacao';
  btnPrev.disabled = (paginaAtualProf === 1);
  btnPrev.addEventListener('click', () => {
    if (paginaAtualProf > 1) {
      paginaAtualProf--;
      aplicarFiltrosProfissionais();
    }
  });
  container.appendChild(btnPrev);

  const paginaSpan = document.createElement('span');
  paginaSpan.className = 'pagina-info';
  paginaSpan.textContent = `Página ${paginaAtualProf} de ${totalPaginas} (${totalRegistros} registros)`;
  container.appendChild(paginaSpan);

  const btnNext = document.createElement('button');
  btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
  btnNext.className = 'btn-paginacao';
  btnNext.disabled = (paginaAtualProf === totalPaginas);
  btnNext.addEventListener('click', () => {
    if (paginaAtualProf < totalPaginas) {
      paginaAtualProf++;
      aplicarFiltrosProfissionais();
    }
  });
  container.appendChild(btnNext);

  const btnLast = document.createElement('button');
  btnLast.innerHTML = '<i class="fas fa-angle-double-right"></i>';
  btnLast.className = 'btn-paginacao';
  btnLast.disabled = (paginaAtualProf === totalPaginas);
  btnLast.addEventListener('click', () => {
    if (paginaAtualProf !== totalPaginas) {
      paginaAtualProf = totalPaginas;
      aplicarFiltrosProfissionais();
    }
  });
  container.appendChild(btnLast);

  const selectItens = document.createElement('select');
  selectItens.className = 'btn-paginacao';
  selectItens.style.marginLeft = '12px';
  [20, 50, 100, 200].forEach(qtd => {
    const opt = document.createElement('option');
    opt.value = qtd;
    opt.textContent = `${qtd} por página`;
    if (itensPorPaginaProf === qtd) opt.selected = true;
    selectItens.appendChild(opt);
  });
  selectItens.addEventListener('change', (e) => {
    itensPorPaginaProf = parseInt(e.target.value);
    paginaAtualProf = 1;
    aplicarFiltrosProfissionais();
  });
  container.appendChild(selectItens);
}

// =========================
// FILTRAR POR STATUS (CLIQUE NAS MÉTRICAS)
// =========================
function filtrarProfissionaisPorStatus(tipo) {
  switch (tipo) {
    case 'total':
      document.getElementById('filtroProfCargo').value = '';
      document.getElementById('filtroProfRegime').value = '';
      document.getElementById('filtroProfSituacao').value = '';
      document.getElementById('pesquisaProfNome').value = '';
      profissionaisFiltrados = profissionaisGlobais;
      break;
    case 'ativos':
      document.getElementById('filtroProfSituacao').value = 'ATIVO';
      profissionaisFiltrados = profissionaisGlobais.filter(p => p.SITUACAO_LOTACAO === 'ATIVO');
      break;
    case 'temporarios':
      document.getElementById('filtroProfRegime').value = 'CONTRATO TEMPORÁRIO';
      profissionaisFiltrados = profissionaisGlobais.filter(p => p.REGIME === 'CONTRATO TEMPORÁRIO');
      break;
    case 'efetivos':
      document.getElementById('filtroProfRegime').value = 'EFETIVO';
      profissionaisFiltrados = profissionaisGlobais.filter(p => p.REGIME === 'EFETIVO');
      break;
  }

  paginaAtualProf = 1;
  aplicarFiltrosProfissionais();
  renderPainelProfissionais(profissionaisGlobais);
}

// =========================
// ABRIR MODAL DETALHES DO PROFISSIONAL
// =========================
function abrirModalDetalhesProfissional(prof) {
  profissionalAtual = prof;

  const setVal = (id, valor) => {
    const el = document.getElementById(id);
    if (el) el.value = valor || '';
  };

  // Dados Pessoais
  setVal('profNomeInput', prof.NOME);
  setVal('profCPFInput', prof.CPF);
  setVal('profRGInput', prof.RG || '');
  setVal('profDataNascInput', limparDataISO(prof.DATA_NASCIMENTO));
  setVal('profSexoInput', prof.SEXO);
  setVal('profRacaInput', prof.RACA);
  setVal('profNacionalidadeInput', prof.NACIONALIDADE);
  setVal('profPaisOrigemInput', prof.PAIS_ORIGEM);
  setVal('profFiliacao1Input', prof.FILIACAO_1);
  setVal('profFiliacao2Input', prof.FILIACAO_2);
  setVal('profLogradouroInput', prof.LOGRADOURO);
  setVal('profNumeroInput', prof.NUMERO);
  setVal('profComplementoInput', prof.COMPLEMENTO);
  setVal('profBairroInput', prof.BAIRRO);
  setVal('profCidadeInput', [prof.CIDADE, prof.UF].filter(Boolean).join(' / '));
  setVal('profCEPInput', prof.CEP);

  // Naturalidade
  setVal('profUFNascimentoInput', prof.UF_NASCIMENTO);
  setVal('profMunicipioNascInput', prof.MUNICIPIO_NASCIMENTO);
  setVal('profCertidaoNascInput', prof.CERTIDAO_NASC);

  // Dados Funcionais
  setVal('profMatriculaInput', prof.MATRICULA);
  setVal('profCargoInput', prof.CARGO);
  setVal('profRegimeInput', prof.REGIME);
  setVal('profSituacaoInput', prof.SITUACAO_LOTACAO);
  setVal('profAdmissaoInput', limparDataISO(prof.DATA_ADMISSAO_LOTACAO));
  setVal('profTerminoInput', limparDataISO(prof.DATA_TERMINO_CONTRATO));
  setVal('profDesligamentoLotacaoInput', limparDataISO(prof.DATA_DESLIGAMENTO_LOTACAO));
  setVal('profLocalTrabalhoInput', prof.LOCAL_TRABALHO);

  // Vínculo e CH
  setVal('profSituacaoVinculoInput', prof.SITUACAO_VINCULO);
  setVal('profAdmissaoVinculoInput', limparDataISO(prof.DATA_ADMISSAO_VINCULO));
  setVal('profDesligamentoVinculoInput', limparDataISO(prof.DATA_DESLIGAMENTO_VINCULO));
  setVal('profCHInput', chParaHumanizado(limparCH(prof.CH_MENSAL)));
  setVal('profCHLotacaoInput', chParaHumanizado(limparCH(prof.CH_LOTACAO)));
  setVal('profCHVinculoInput', chParaHumanizado(limparCH(prof.CH_VINCULO)));

  // Formação
  setVal('profEscolaridadeInput', prof.ESCOLARIDADE);
  setVal('profTipoEnsinoMedioInput', prof.TIPO_ENSINO_MEDIO);
  setVal('profCursoSuperiorInput', prof.CURSO_SUPERIOR);
  setVal('profLicenciaturaInput', prof.LICENCIATURA);
  setVal('profPosGraduacaoInput', prof.POS_GRADUACAO);
  setVal('profAreasConhecimentoInput', prof.AREAS_CONHECIMENTO);

  // Cursos de Formação (1 a 3)
  let htmlCursos = '<table style="width:100%; border-collapse:collapse;">';
  htmlCursos += '<tr><th>#</th><th>Curso</th><th>Instituição</th><th>Ano Conclusão</th></tr>';
  for (let i = 1; i <= 3; i++) {
    const curso = prof[`CURSO_FORMACAO_${i}`] || '';
    const inst = prof[`INSTITUICAO_FORMACAO_${i}`] || '';
    const ano = prof[`ANO_CONCLUSAO_FORMACAO_${i}`] || '';
    htmlCursos += `<tr>
      <td>${i}</td>
      <td><input id="profCursoFormacao${i}Input" class="form-control" value="${curso.replace(/"/g, '&quot;')}" style="width:100%; padding:6px 10px; border:1px solid var(--input-border); border-radius:6px;"></td>
      <td><input id="profInstituicaoFormacao${i}Input" class="form-control" value="${inst.replace(/"/g, '&quot;')}" style="width:100%; padding:6px 10px; border:1px solid var(--input-border); border-radius:6px;"></td>
      <td><input id="profAnoConclusaoFormacao${i}Input" class="form-control" value="${ano}" style="width:100%; padding:6px 10px; border:1px solid var(--input-border); border-radius:6px;"></td>
    </tr>`;
  }
  htmlCursos += '</table>';
  document.getElementById('secaoCursosFormacao').innerHTML = htmlCursos;

  // Pós-Graduações (1 a 6)
  let htmlPos = '<table style="width:100%; border-collapse:collapse;">';
  htmlPos += '<tr><th>#</th><th>Tipo</th><th>Área</th><th>Nome</th><th>Ano Conclusão</th></tr>';
  for (let i = 1; i <= 6; i++) {
    const tipo = prof[`TIPO_POS_${i}`] || '';
    const area = prof[`AREA_POS_${i}`] || '';
    const nome = prof[`NOME_POS_${i}`] || '';
    const ano = prof[`ANO_CONCLUSAO_POS_${i}`] || '';
    htmlPos += `<tr>
      <td>${i}</td>
      <td><input id="profTipoPos${i}Input" class="form-control" value="${tipo.replace(/"/g, '&quot;')}" style="width:100%; padding:6px 10px; border:1px solid var(--input-border); border-radius:6px;"></td>
      <td><input id="profAreaPos${i}Input" class="form-control" value="${area.replace(/"/g, '&quot;')}" style="width:100%; padding:6px 10px; border:1px solid var(--input-border); border-radius:6px;"></td>
      <td><input id="profNomePos${i}Input" class="form-control" value="${nome.replace(/"/g, '&quot;')}" style="width:100%; padding:6px 10px; border:1px solid var(--input-border); border-radius:6px;"></td>
      <td><input id="profAnoConclusaoPos${i}Input" class="form-control" value="${ano}" style="width:100%; padding:6px 10px; border:1px solid var(--input-border); border-radius:6px;"></td>
    </tr>`;
  }
  htmlPos += '</table>';
  document.getElementById('secaoPosGraduacoes').innerHTML = htmlPos;

  // Adicionais
  setVal('profINEPInput', prof.INEP);
  setVal('profPovoIndigenaInput', prof.POVO_INDIGENA);
  setVal('profLocalizacaoDiferenciadaInput', prof.LOCALIZACAO_DIFERENCIADA);
  setVal('profDeficienciasInput', prof.DEFICIENCIAS);
  setVal('profTranstornoGlobalInput', prof.TRANSTORNO_GLOBAL);
  setVal('profAltasHabilidadesInput', prof.ALTAS_HABILIDADES);
  setVal('profZonaResidenciaInput', prof.ZONA_RESIDENCIA);
  setVal('profOutrosCursosInput', prof.OUTROS_CURSOS);

  // Contato
  setVal('profEmailInput', prof.EMAIL);
  setVal('profTurmasInput', prof.TURMAS);
  setVal('profDisciplinasInput', prof.DISCIPLINAS);

  // Título
  document.getElementById('detalhesProfissionalTitulo').textContent = prof.NOME || 'Profissional';

  // Seção de Documentos Anexados
  const docsHtml = `
    <details style="margin-bottom: 16px;">
      <summary style="font-weight: 600; cursor: pointer; color: var(--primary);">
        <i class="fas fa-folder-open"></i> Documentos Anexados
      </summary>
      <div style="margin-top: 8px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px;">
          <select id="profDocTipo" style="flex: 2; min-width: 150px;">
            <option value="">Selecione o tipo...</option>
            ${TIPOS_DOCUMENTOS_PROFISSIONAL.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <input type="file" id="profDocArquivo" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style="flex: 2; min-width: 150px;">
          <input type="text" id="profDocObs" placeholder="Observações (opcional)" style="flex: 2; min-width: 150px;">
          <button class="btn-salvar" onclick="uploadDocumentoProfissional('${prof.ID}', '${prof._ESCOLA}')" style="flex: 1; min-width: 100px;">
            <i class="fas fa-upload"></i> Anexar
          </button>
        </div>
        <div id="listaDocumentosProfissional" style="max-height: 200px; overflow-y: auto;">
          <p style="color: var(--text-muted); font-size: 13px;">Carregando documentos...</p>
        </div>
      </div>
    </details>
  `;

  const modalBody = document.querySelector('#modalDetalhesProfissional .modal-body');
  const actionsDiv = modalBody.querySelector('.modal-actions');
  if (actionsDiv) {
    actionsDiv.insertAdjacentHTML('beforebegin', docsHtml);
  } else {
    modalBody.insertAdjacentHTML('beforeend', docsHtml);
  }

  carregarDocumentosProfissional(prof.ID, prof._ESCOLA);

  // Botão PDF no modal
  const actionsDivFinal = document.querySelector('#modalDetalhesProfissional .modal-actions');
  if (actionsDivFinal) {
    const btnExistente = actionsDivFinal.querySelector('.btn-pdf-modal');
    if (btnExistente) btnExistente.remove();

    const btnPdf = document.createElement('button');
    btnPdf.className = 'btn-salvar btn-pdf-modal';
    btnPdf.innerHTML = '<i class="fas fa-file-pdf"></i> Gerar Ficha PDF';
    btnPdf.onclick = function() {
      gerarFichaProfissionalPDF(profissionalAtual);
    };
    actionsDivFinal.insertBefore(btnPdf, actionsDivFinal.firstChild);
  }

  document.getElementById('modalDetalhesProfissional').style.display = 'flex';
}

// =========================
// FECHAR MODAL DETALHES
// =========================
function fecharModalDetalhesProfissional() {
  document.getElementById('modalDetalhesProfissional').style.display = 'none';
  profissionalAtual = null;
}

// =========================
// SALVAR EDIÇÃO DO PROFISSIONAL
// =========================
function salvarEdicaoProfissional() {
  if (!profissionalAtual) return;

  const campos = {
    NOME: document.getElementById('profNomeInput').value,
    CPF: document.getElementById('profCPFInput').value,
    RG: document.getElementById('profRGInput').value,
    DATA_NASCIMENTO: document.getElementById('profDataNascInput').value,
    SEXO: document.getElementById('profSexoInput').value,
    RACA: document.getElementById('profRacaInput').value,
    NACIONALIDADE: document.getElementById('profNacionalidadeInput').value,
    PAIS_ORIGEM: document.getElementById('profPaisOrigemInput').value,
    FILIACAO_1: document.getElementById('profFiliacao1Input').value,
    FILIACAO_2: document.getElementById('profFiliacao2Input').value,
    LOGRADOURO: document.getElementById('profLogradouroInput').value,
    NUMERO: document.getElementById('profNumeroInput').value,
    COMPLEMENTO: document.getElementById('profComplementoInput').value,
    BAIRRO: document.getElementById('profBairroInput').value,
    CIDADE: document.getElementById('profCidadeInput').value.split('/')[0].trim(),
    UF: document.getElementById('profCidadeInput').value.split('/')[1]?.trim() || '',
    CEP: document.getElementById('profCEPInput').value,
    UF_NASCIMENTO: document.getElementById('profUFNascimentoInput').value,
    MUNICIPIO_NASCIMENTO: document.getElementById('profMunicipioNascInput').value,
    CERTIDAO_NASC: document.getElementById('profCertidaoNascInput').value,
    MATRICULA: document.getElementById('profMatriculaInput').value,
    CARGO: document.getElementById('profCargoInput').value,
    REGIME: document.getElementById('profRegimeInput').value,
    SITUACAO_LOTACAO: document.getElementById('profSituacaoInput').value,
    DATA_ADMISSAO_LOTACAO: document.getElementById('profAdmissaoInput').value,
    DATA_TERMINO_CONTRATO: document.getElementById('profTerminoInput').value,
    DATA_DESLIGAMENTO_LOTACAO: document.getElementById('profDesligamentoLotacaoInput').value,
    LOCAL_TRABALHO: document.getElementById('profLocalTrabalhoInput').value,
    SITUACAO_VINCULO: document.getElementById('profSituacaoVinculoInput').value,
    DATA_ADMISSAO_VINCULO: document.getElementById('profAdmissaoVinculoInput').value,
    DATA_DESLIGAMENTO_VINCULO: document.getElementById('profDesligamentoVinculoInput').value,
    CH_MENSAL: chParaMaquina(document.getElementById('profCHInput').value),
    CH_LOTACAO: chParaMaquina(document.getElementById('profCHLotacaoInput').value),
    CH_VINCULO: chParaMaquina(document.getElementById('profCHVinculoInput').value),
    ESCOLARIDADE: document.getElementById('profEscolaridadeInput').value,
    TIPO_ENSINO_MEDIO: document.getElementById('profTipoEnsinoMedioInput').value,
    CURSO_SUPERIOR: document.getElementById('profCursoSuperiorInput').value,
    LICENCIATURA: document.getElementById('profLicenciaturaInput').value,
    POS_GRADUACAO: document.getElementById('profPosGraduacaoInput').value,
    AREAS_CONHECIMENTO: document.getElementById('profAreasConhecimentoInput').value,
    INEP: document.getElementById('profINEPInput').value,
    POVO_INDIGENA: document.getElementById('profPovoIndigenaInput').value,
    LOCALIZACAO_DIFERENCIADA: document.getElementById('profLocalizacaoDiferenciadaInput').value,
    DEFICIENCIAS: document.getElementById('profDeficienciasInput').value,
    TRANSTORNO_GLOBAL: document.getElementById('profTranstornoGlobalInput').value,
    ALTAS_HABILIDADES: document.getElementById('profAltasHabilidadesInput').value,
    ZONA_RESIDENCIA: document.getElementById('profZonaResidenciaInput').value,
    OUTROS_CURSOS: document.getElementById('profOutrosCursosInput').value,
    EMAIL: document.getElementById('profEmailInput').value,
    TURMAS: document.getElementById('profTurmasInput').value,
    DISCIPLINAS: document.getElementById('profDisciplinasInput').value
  };

  // Cursos de Formação
  for (let i = 1; i <= 3; i++) {
    campos[`CURSO_FORMACAO_${i}`] = document.getElementById(`profCursoFormacao${i}Input`)?.value || '';
    campos[`INSTITUICAO_FORMACAO_${i}`] = document.getElementById(`profInstituicaoFormacao${i}Input`)?.value || '';
    campos[`ANO_CONCLUSAO_FORMACAO_${i}`] = document.getElementById(`profAnoConclusaoFormacao${i}Input`)?.value || '';
  }

  // Pós-Graduações
  for (let i = 1; i <= 6; i++) {
    campos[`TIPO_POS_${i}`] = document.getElementById(`profTipoPos${i}Input`)?.value || '';
    campos[`AREA_POS_${i}`] = document.getElementById(`profAreaPos${i}Input`)?.value || '';
    campos[`NOME_POS_${i}`] = document.getElementById(`profNomePos${i}Input`)?.value || '';
    campos[`ANO_CONCLUSAO_POS_${i}`] = document.getElementById(`profAnoConclusaoPos${i}Input`)?.value || '';
  }

  const dados = {
    acao: 'atualizarProfissional',
    email: emailUsuario,
    escola: profissionalAtual._ESCOLA,
    id: profissionalAtual.ID,
    ...campos
  };

  postSemResposta(dados, 'Dados atualizados!', () => {
    fecharModalDetalhesProfissional();
    carregarProfissionais();
  });
}

// =========================
// CARREGAR DOCUMENTOS DO PROFISSIONAL
// =========================
function carregarDocumentosProfissional(idProfissional, escola) {
  const container = document.getElementById('listaDocumentosProfissional');
  if (!container) return;

  const url = `${API_URL_PROFISSIONAIS}?tipo=listarDocumentosProfissional&email=${emailUsuario}&idProfissional=${encodeURIComponent(idProfissional)}&escola=${encodeURIComponent(escola)}&_=${Date.now()}`;

  jsonp(url, function(docs) {
    if (!docs || docs.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Nenhum documento anexado.</p>';
      return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';
    docs.forEach(doc => {
      const data = doc.dataUpload ? new Date(doc.dataUpload).toLocaleDateString('pt-BR') : '—';
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card-border); padding: 8px 12px; border-radius: 8px; flex-wrap: wrap; gap: 4px;">
          <div>
            <i class="fas fa-file-pdf" style="color: #dc2626;"></i>
            <strong>${doc.tipoDocumento}</strong>
            <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">${doc.fileName}</span>
            ${doc.observacoes ? `<span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">📝 ${doc.observacoes}</span>` : ''}
            <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">📅 ${data}</span>
          </div>
          <div style="display: flex; gap: 4px;">
            <a href="${doc.viewUrl}" target="_blank" class="btn-icone" title="Visualizar" style="color: #2563eb;">
              <i class="fas fa-eye"></i>
            </a>
            <a href="${doc.downloadUrl}" target="_blank" class="btn-icone" title="Baixar" style="color: #10b981;">
              <i class="fas fa-download"></i>
            </a>
            <button class="btn-icone" onclick="excluirDocumentoProfissional('${doc.fileId}', '${idProfissional}', '${escola}')" title="Excluir" style="color: #ef4444;">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  });
}

// =========================
// UPLOAD DE DOCUMENTO DO PROFISSIONAL
// =========================
// =========================
// UPLOAD DE DOCUMENTO DO PROFISSIONAL
// =========================
async function uploadDocumentoProfissional(idProfissional, escola) {
  const tipo = document.getElementById('profDocTipo').value;
  const fileInput = document.getElementById('profDocArquivo');
  const file = fileInput.files[0];
  const observacoes = document.getElementById('profDocObs').value.trim();

  if (!tipo) {
    mostrarToast('Selecione o tipo de documento.', 'warning');
    return;
  }
  if (!file) {
    mostrarToast('Selecione um arquivo.', 'warning');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    mostrarToast('Arquivo muito grande. Máximo 10 MB.', 'warning');
    return;
  }

  // 🔥 Obtém o nome do profissional a partir da variável global
  const nomeProfissional = profissionalAtual ? profissionalAtual.NOME : '';

  const btn = document.querySelector('#listaDocumentosProfissional')?.previousElementSibling?.querySelector('.btn-salvar');
  if (btn) showButtonLoading(btn);

  try {
    const base64 = await lerArquivoBase64(file);

    const dados = {
      acao: 'uploadDocumentoProfissional',
      email: emailUsuario,
      idProfissional: idProfissional,
      escola: escola,
      tipoDocumento: tipo,
      observacoes: observacoes,
      fileBase64: base64,
      fileName: file.name,
      mimeType: file.type,
      nomeProfissional: nomeProfissional   // 🔥 NOVO CAMPO
    };

    await new Promise(resolve => {
      postSemResposta(dados, null, () => resolve());
    });

    mostrarToast('Documento anexado com sucesso!', 'success');
    document.getElementById('profDocTipo').value = '';
    document.getElementById('profDocArquivo').value = '';
    document.getElementById('profDocObs').value = '';
    carregarDocumentosProfissional(idProfissional, escola);

  } catch (error) {
    mostrarToast('Erro ao enviar documento.', 'error');
  } finally {
    if (btn) hideButtonLoading(btn);
  }
}

// =========================
// EXCLUIR DOCUMENTO DO PROFISSIONAL
// =========================
function excluirDocumentoProfissional(fileId, idProfissional, escola) {
  if (!confirm('Deseja excluir este documento permanentemente?')) return;

  const dados = {
    acao: 'excluirDocumentoProfissional',
    email: emailUsuario,
    fileId: fileId,
    idProfissional: idProfissional,
    escola: escola
  };

  postSemResposta(dados, 'Documento excluído!', () => {
    carregarDocumentosProfissional(idProfissional, escola);
  });
}

// =========================
// LER ARQUIVO COMO BASE64
// =========================
function lerArquivoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =========================
// GERAR FICHA DO PROFISSIONAL EM PDF
// =========================
function gerarFichaProfissionalPDF(prof) {
  if (!prof) {
    mostrarToast('Profissional não encontrado.', 'error');
    return;
  }

  function formatarData(valor) {
    if (!valor) return '—';
    const data = new Date(valor);
    if (isNaN(data.getTime())) return valor;
    return data.toLocaleDateString('pt-BR');
  }

  const nome = prof.NOME || 'Nome não informado';
  const cargo = prof.CARGO || '—';
  const regime = prof.REGIME || '—';
  const situacao = prof.SITUACAO_LOTACAO || '—';
  const matricula = prof.MATRICULA || '—';
  const escola = prof._ESCOLA || '—';

  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Ficha do Profissional - ${nome}</title>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; font-size: 13px; }
      h1 { color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; font-size: 22px; margin-bottom: 16px; }
      .cabecalho { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; background: #f8fafc; padding: 16px 20px; border-radius: 8px; }
      .cabecalho h2 { margin: 0; font-size: 20px; color: #0f172a; }
      .cabecalho .info { text-align: right; color: #475569; font-size: 13px; }
      .secao { margin: 20px 0; page-break-inside: avoid; }
      .secao h3 { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 15px; color: #1e3a8a; margin: 0 0 8px 0; border-left: 4px solid #2563eb; }
      table { width: 100%; border-collapse: collapse; margin: 0 0 12px 0; }
      th { background: #f8fafc; padding: 6px 10px; text-align: left; width: 30%; font-weight: 600; color: #475569; border-bottom: 1px solid #e2e8f0; }
      td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
      .status-badge { display: inline-block; padding: 2px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; }
      .status-ativo { background: #dcfce7; color: #166534; }
      .status-desligado { background: #fee2e2; color: #991b1b; }
      .status-outro { background: #fef3c7; color: #854d0e; }
      .footer { margin-top: 30px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
      @page { size: A4; margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
  </head>
  <body>
  `;

  // Cabeçalho
  html += `
    <h1>Ficha do Profissional</h1>
    <div class="cabecalho">
      <div>
        <h2>${nome}</h2>
        <p style="margin: 4px 0 0; color: #475569;">
          <i class="fas fa-user-tie"></i> ${cargo} &nbsp;|&nbsp;
          <i class="fas fa-calendar-alt"></i> ${regime} &nbsp;|&nbsp;
          <span class="status-badge ${situacao === 'ATIVO' ? 'status-ativo' : (situacao === 'DESLIGADO' || situacao === 'INATIVO' ? 'status-desligado' : 'status-outro')}">${situacao}</span>
        </p>
      </div>
      <div class="info">
        <div><strong>Matrícula:</strong> ${matricula}</div>
        <div><strong>Escola:</strong> ${escola}</div>
        <div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>
  `;

  // Dados Pessoais
  html += `
    <div class="secao">
      <h3>Dados Pessoais</h3>
      <table>
        <tr><th>Nome</th><td>${nome}</td></tr>
        <tr><th>Data de Nascimento</th><td>${formatarData(prof.DATA_NASCIMENTO)}</td></tr>
        <tr><th>CPF</th><td>${prof.CPF || '—'}</td></tr>
        <tr><th>RG</th><td>${prof.RG || '—'}</td></tr>
        <tr><th>Sexo</th><td>${prof.SEXO || '—'}</td></tr>
        <tr><th>Raça/Cor</th><td>${prof.RACA || '—'}</td></tr>
        <tr><th>Nacionalidade</th><td>${prof.NACIONALIDADE || '—'}</td></tr>
        <tr><th>País de Origem</th><td>${prof.PAIS_ORIGEM || '—'}</td></tr>
        <tr><th>Filiação 1</th><td>${prof.FILIACAO_1 || '—'}</td></tr>
        <tr><th>Filiação 2</th><td>${prof.FILIACAO_2 || '—'}</td></tr>
        <tr><th>UF Nascimento</th><td>${prof.UF_NASCIMENTO || '—'}</td></tr>
        <tr><th>Município Nascimento</th><td>${prof.MUNICIPIO_NASCIMENTO || '—'}</td></tr>
        <tr><th>Certidão Nascimento</th><td>${prof.CERTIDAO_NASC || '—'}</td></tr>
      </table>
    </div>
  `;

  // Endereço e Contato
  html += `
    <div class="secao">
      <h3>Endereço e Contato</h3>
      <table>
        <tr><th>Logradouro</th><td>${prof.LOGRADOURO || '—'}</td></tr>
        <tr><th>Número</th><td>${prof.NUMERO || '—'}</td></tr>
        <tr><th>Complemento</th><td>${prof.COMPLEMENTO || '—'}</td></tr>
        <tr><th>Bairro</th><td>${prof.BAIRRO || '—'}</td></tr>
        <tr><th>Cidade / UF</th><td>${prof.CIDADE || '—'} / ${prof.UF || '—'}</td></tr>
        <tr><th>CEP</th><td>${prof.CEP || '—'}</td></tr>
        <tr><th>E-mail</th><td>${prof.EMAIL || '—'}</td></tr>
        <tr><th>Zona Residência</th><td>${prof.ZONA_RESIDENCIA || '—'}</td></tr>
      </table>
    </div>
  `;

  // Dados Funcionais
  html += `
    <div class="secao">
      <h3>Dados Funcionais</h3>
      <table>
        <tr><th>Matrícula</th><td>${matricula}</td></tr>
        <tr><th>Cargo</th><td>${cargo}</td></tr>
        <tr><th>Regime</th><td>${regime}</td></tr>
        <tr><th>Situação Lotação</th><td>${situacao}</td></tr>
        <tr><th>Local Trabalho</th><td>${prof.LOCAL_TRABALHO || '—'}</td></tr>
        <tr><th>Admissão Lotação</th><td>${formatarData(prof.DATA_ADMISSAO_LOTACAO)}</td></tr>
        <tr><th>Término Contrato</th><td>${formatarData(prof.DATA_TERMINO_CONTRATO)}</td></tr>
        <tr><th>Desligamento Lotação</th><td>${formatarData(prof.DATA_DESLIGAMENTO_LOTACAO)}</td></tr>
        <tr><th>CH Mensal</th><td>${chParaHumanizado(limparCH(prof.CH_MENSAL)) || '—'}</td></tr>
        <tr><th>CH Lotação</th><td>${chParaHumanizado(limparCH(prof.CH_LOTACAO)) || '—'}</td></tr>
        <tr><th>CH Vínculo</th><td>${chParaHumanizado(limparCH(prof.CH_VINCULO)) || '—'}</td></tr>
        <tr><th>Turmas</th><td>${prof.TURMAS || '—'}</td></tr>
        <tr><th>Disciplinas</th><td>${prof.DISCIPLINAS || '—'}</td></tr>
      </table>
    </div>
  `;

  // Formação Acadêmica
  html += `
    <div class="secao">
      <h3>Formação Acadêmica</h3>
      <table>
        <tr><th>Escolaridade</th><td>${prof.ESCOLARIDADE || '—'}</td></tr>
        <tr><th>Tipo Ensino Médio</th><td>${prof.TIPO_ENSINO_MEDIO || '—'}</td></tr>
        <tr><th>Curso Superior</th><td>${prof.CURSO_SUPERIOR || '—'}</td></tr>
        <tr><th>Licenciatura</th><td>${prof.LICENCIATURA || '—'}</td></tr>
        <tr><th>Pós-Graduação</th><td>${prof.POS_GRADUACAO || '—'}</td></tr>
        <tr><th>Áreas de Conhecimento</th><td>${prof.AREAS_CONHECIMENTO || '—'}</td></tr>
        <tr><th>INEP</th><td>${prof.INEP || '—'}</td></tr>
      </table>
    </div>
  `;

  // Cursos de Formação
  const cursos = [];
  for (let i = 1; i <= 3; i++) {
    const nome = prof[`CURSO_FORMACAO_${i}`];
    const instituicao = prof[`INSTITUICAO_FORMACAO_${i}`];
    const ano = prof[`ANO_CONCLUSAO_FORMACAO_${i}`];
    if (nome || instituicao || ano) {
      cursos.push({ nome, instituicao, ano });
    }
  }
  if (cursos.length > 0) {
    html += `
      <div class="secao">
        <h3>Cursos de Formação</h3>
        <table>
          <tr><th>#</th><th>Curso</th><th>Instituição</th><th>Ano Conclusão</th></tr>
          ${cursos.map((c, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${c.nome || '—'}</td>
              <td>${c.instituicao || '—'}</td>
              <td>${c.ano || '—'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  // Pós-Graduações
  const pos = [];
  for (let i = 1; i <= 6; i++) {
    const tipo = prof[`TIPO_POS_${i}`];
    const area = prof[`AREA_POS_${i}`];
    const nome = prof[`NOME_POS_${i}`];
    const ano = prof[`ANO_CONCLUSAO_POS_${i}`];
    if (tipo || area || nome || ano) {
      pos.push({ tipo, area, nome, ano });
    }
  }
  if (pos.length > 0) {
    html += `
      <div class="secao">
        <h3>Pós-Graduações</h3>
        <table>
          <tr><th>#</th><th>Tipo</th><th>Área</th><th>Nome</th><th>Ano Conclusão</th></tr>
          ${pos.map((p, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${p.tipo || '—'}</td>
              <td>${p.area || '—'}</td>
              <td>${p.nome || '—'}</td>
              <td>${p.ano || '—'}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  // Informações Adicionais
  html += `
    <div class="secao">
      <h3>Informações Adicionais</h3>
      <table>
        <tr><th>Povo Indígena</th><td>${prof.POVO_INDIGENA || '—'}</td></tr>
        <tr><th>Localização Diferenciada</th><td>${prof.LOCALIZACAO_DIFERENCIADA || '—'}</td></tr>
        <tr><th>Deficiências</th><td>${prof.DEFICIENCIAS || '—'}</td></tr>
        <tr><th>Transtorno Global</th><td>${prof.TRANSTORNO_GLOBAL || '—'}</td></tr>
        <tr><th>Altas Habilidades</th><td>${prof.ALTAS_HABILIDADES || '—'}</td></tr>
        <tr><th>Outros Cursos</th><td>${prof.OUTROS_CURSOS || '—'}</td></tr>
      </table>
    </div>
  `;

  // Rodapé
  html += `
    <div class="footer">
      Documento gerado pelo Sistema de Controle de Matrículas – SRE Afonso Cláudio<br>
      Emissão: ${new Date().toLocaleString('pt-BR')}
    </div>
    <script>
      window.onload = function() {
        window.print();
      };
    <\/script>
  </body>
  </html>
  `;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
}

// =========================
// DASHBOARD DE PROFISSIONAIS
// =========================

function abrirDashboardProfissionais() {
  document.getElementById('modalDashboardProfissionais').style.display = 'flex';
  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('dashboardProfFiltroEscolaWrapper').style.display = 'block';
    document.getElementById('dashboardProfFiltroCargoWrapper').style.display = 'block';
    carregarEscolasDashboardProf();
    carregarCargosDashboardProf();
  } else {
    document.getElementById('dashboardProfFiltroEscolaWrapper').style.display = 'none';
    document.getElementById('dashboardProfFiltroCargoWrapper').style.display = 'none';
  }
  carregarDashboardProfissionais();
}

function fecharDashboardProfissionais() {
  document.getElementById('modalDashboardProfissionais').style.display = 'none';
}

function carregarEscolasDashboardProf() {
  const select = document.getElementById('dashboardProfFiltroEscola');
  select.innerHTML = '<option value="">Todas as escolas</option>';
  const escolas = getEscolasPermitidas();
  escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
}

function carregarCargosDashboardProf() {
  // Busca os cargos da lista atual de profissionais
  const cargos = [...new Set(profissionaisGlobais.map(p => p.CARGO).filter(Boolean))].sort();
  const select = document.getElementById('dashboardProfFiltroCargo');
  select.innerHTML = '<option value="">Todos os cargos</option>';
  cargos.forEach(c => select.appendChild(new Option(c, c)));
}

function carregarDashboardProfissionais() {
  mostrarLoading();
  const filtroEscola = document.getElementById('dashboardProfFiltroEscola')?.value || '';
  const filtroCargo = document.getElementById('dashboardProfFiltroCargo')?.value || '';
  let url = `${API_URL_PROFISSIONAIS}?tipo=dashboardProfissionais&email=${emailUsuario}&_=${Date.now()}`;
  if (filtroEscola) url += `&escola=${encodeURIComponent(filtroEscola)}`;

  jsonp(url, function(dados) {
    if (dados.erro || !Array.isArray(dados) || dados.length === 0) {
      esconderLoading();
      document.getElementById('dashboardProfContainer').innerHTML = '<p>Nenhum dado disponível.</p>';
      return;
    }

    // Se houver filtro de escola, carrega a lista de profissionais para detalhamento
    if (filtroEscola) {
      const urlProf = `${API_URL_PROFISSIONAIS}?tipo=listarProfissionais&email=${emailUsuario}&escola=${encodeURIComponent(filtroEscola)}&_=${Date.now()}`;
      jsonp(urlProf, function(profissionais) {
        esconderLoading();
        if (!Array.isArray(profissionais)) profissionais = [];

        // Aplica filtro de cargo, se houver
        if (filtroCargo) {
          profissionais = profissionais.filter(p => p.CARGO === filtroCargo);
        }

        // Recalcula os totais com base nos profissionais filtrados
        const total = profissionais.length;
        const ativos = profissionais.filter(p => p.SITUACAO_LOTACAO === 'ATIVO').length;
        const temporarios = profissionais.filter(p => p.REGIME === 'CONTRATO TEMPORÁRIO').length;
        const efetivos = profissionais.filter(p => p.REGIME === 'EFETIVO').length;
        const comPendencia = profissionais.filter(p => verificarDocumentosProfissional(p).length > 0).length;

        const dadosAgrupados = [{
          escola: filtroEscola || 'Todas',
          total,
          ativos,
          temporarios,
          efetivos,
          comPendencia
        }];

        renderizarDashboardProf(dadosAgrupados, profissionais);
      });
      return;
    }

    // Sem filtro de escola – exibe apenas o resumo geral (sem lista detalhada)
    esconderLoading();
    renderizarDashboardProf(dados, null);
  });
}

function renderizarDashboardProf(dados, profissionaisLista = null) {
  // Calcula totais gerais
  let totalGeral = 0, ativosGeral = 0, temporariosGeral = 0, efetivosGeral = 0, pendentesGeral = 0;
  dados.forEach(item => {
    totalGeral += item.total;
    ativosGeral += item.ativos;
    temporariosGeral += item.temporarios;
    efetivosGeral += item.efetivos;
    pendentesGeral += item.comPendencia;
  });

  let html = `
    <div class="painel-metricas" style="margin: 0 0 20px 0;">
      <div class="metrica-card metrica-total">
        <div class="metrica-titulo"><i class="fas fa-users"></i> Total</div>
        <div class="metrica-valor">${totalGeral}</div>
        <div class="metrica-detalhe">profissionais</div>
      </div>
      <div class="metrica-card metrica-completos">
        <div class="metrica-titulo"><i class="fas fa-check-circle"></i> Ativos</div>
        <div class="metrica-valor">${ativosGeral}</div>
        <div class="metrica-detalhe">em exercício</div>
      </div>
      <div class="metrica-card metrica-pendentes">
        <div class="metrica-titulo"><i class="fas fa-clock"></i> Temporários</div>
        <div class="metrica-valor">${temporariosGeral}</div>
        <div class="metrica-detalhe">contrato</div>
      </div>
      <div class="metrica-card metrica-vencidos">
        <div class="metrica-titulo"><i class="fas fa-exclamation-triangle"></i> Documentação pendente</div>
        <div class="metrica-valor">${pendentesGeral}</div>
        <div class="metrica-detalhe">precisa regularizar</div>
      </div>
    </div>
  `;

  // ========== SITUAÇÃO DOCUMENTAL DETALHADA ==========
  if (profissionaisLista && profissionaisLista.length > 0) {
    html += `<div style="margin-top: 20px; border-top: 2px solid var(--card-border); padding-top: 16px;">`;
    html += `<h3 style="margin: 0 0 12px;"><i class="fas fa-file-alt"></i> Situação Documental Detalhada</h3>`;

    // 1. Resumo por tipo de documento
    const contagemPendencias = {};
    CONFIG_DOCS_PROFISSIONAL.forEach(doc => {
      contagemPendencias[doc.coluna] = 0;
    });

    profissionaisLista.forEach(prof => {
      const pendentes = verificarDocumentosProfissional(prof);
      pendentes.forEach(campo => {
        if (contagemPendencias.hasOwnProperty(campo)) {
          contagemPendencias[campo]++;
        }
      });
    });

    html += `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">`;
    CONFIG_DOCS_PROFISSIONAL.forEach(doc => {
      const count = contagemPendencias[doc.coluna] || 0;
      const cor = count > 0 ? '#ef4444' : '#10b981';
      html += `
        <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 8px; padding: 6px 12px; display: flex; align-items: center; gap: 6px; font-size: 13px;">
          <i class="fas ${doc.icone}" style="color: ${cor};"></i>
          <strong>${doc.label}:</strong>
          <span style="color: ${cor}; font-weight: 600;">${count}</span>
        </div>
      `;
    });
    html += `</div>`;

    // 2. Lista dos profissionais com pendência
    const profissionaisComPendencia = profissionaisLista.filter(prof => {
      return verificarDocumentosProfissional(prof).length > 0;
    });

    if (profissionaisComPendencia.length > 0) {
      html += `<details open style="margin-top: 8px;">`;
      html += `<summary style="font-weight: 600; cursor: pointer; color: var(--primary);">
        <i class="fas fa-list"></i> Profissionais com pendência (${profissionaisComPendencia.length})
      </summary>`;
      html += `<div style="max-height: 300px; overflow-y: auto; margin-top: 8px;">`;
      html += `<table style="width:100%; border-collapse:collapse; font-size:13px;">`;
      html += `<thead><tr style="background:#f1f5f9;">
        <th style="padding:6px 8px; text-align:left;">Nome</th>
        <th style="padding:6px 8px; text-align:left;">Cargo</th>
        <th style="padding:6px 8px; text-align:left;">Documentos pendentes</th>
        <th style="padding:6px 8px; text-align:center;">Ação</th>
      </tr></thead><tbody>`;

      profissionaisComPendencia.slice(0, 50).forEach(prof => {
        const pendentes = verificarDocumentosProfissional(prof);
        const labels = pendentes.map(campo => {
          const doc = CONFIG_DOCS_PROFISSIONAL.find(d => d.coluna === campo);
          return doc ? doc.label : campo;
        }).join(', ');

        html += `<tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:6px 8px;">${prof.NOME || '—'}</td>
          <td style="padding:6px 8px;">${prof.CARGO || '—'}</td>
          <td style="padding:6px 8px; color:#ef4444; font-size:12px;">${labels}</td>
          <td style="padding:6px 8px; text-align:center;">
            <button class="btn-icone" onclick="abrirModalDetalhesProfissional(profissionaisGlobais.find(p => p.ID === '${prof.ID}'))" data-tooltip="Abrir ficha" style="width:28px; height:28px;">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
          </td>
        </tr>`;
      });

      if (profissionaisComPendencia.length > 50) {
        html += `<tr><td colspan="4" style="padding:8px; text-align:center; color:var(--text-muted);">
          Exibindo 50 de ${profissionaisComPendencia.length} profissionais. Use os filtros para refinar.
        </td></tr>`;
      }

      html += `</tbody></table></div></details>`;
    } else {
      html += `<p style="color: #10b981; font-weight: 500;"><i class="fas fa-check-circle"></i> Todos os profissionais estão com a documentação em dia!</p>`;
    }

    html += `</div>`;
  }

  // Tabela por escola (apenas para supervisor)
  if (perfilUsuario === 'SUPERVISOR' && dados.length > 1) {
    html += `<h3 style="margin: 16px 0 8px;">Resumo por Escola</h3>`;
    html += `<table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px; text-align:left;">Escola</th>
          <th style="padding:8px; text-align:center;">Total</th>
          <th style="padding:8px; text-align:center;">Ativos</th>
          <th style="padding:8px; text-align:center;">Temporários</th>
          <th style="padding:8px; text-align:center;">Efetivos</th>
          <th style="padding:8px; text-align:center;">Pendentes</th>
        </tr>
      </thead>
      <tbody>
    `;
    dados.forEach(item => {
      html += `<tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px;">${item.escola}</td>
        <td style="padding:8px; text-align:center;">${item.total}</td>
        <td style="padding:8px; text-align:center; color:#10b981;">${item.ativos}</td>
        <td style="padding:8px; text-align:center; color:#f59e0b;">${item.temporarios}</td>
        <td style="padding:8px; text-align:center; color:#3b82f6;">${item.efetivos}</td>
        <td style="padding:8px; text-align:center; color:#ef4444;">${item.comPendencia}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }

  document.getElementById('dashboardProfContainer').innerHTML = html;
}

// =========================
// EXPORTAR DASHBOARD EM PDF
// =========================
function exportarDashboardProfissionaisPDF() {
  const container = document.getElementById('dashboardProfContainer');
  if (!container || !container.innerHTML) {
    mostrarToast('Nada para exportar.', 'warning');
    return;
  }

  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`
    <html>
    <head>
      <title>Dashboard de Profissionais</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #1e3a8a; }
        .painel-metricas { display: flex; gap: 16px; flex-wrap: wrap; }
        .metrica-card { flex: 1; min-width: 150px; padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; text-align: center; }
        .metrica-valor { font-size: 28px; font-weight: bold; }
        .metrica-titulo { font-size: 14px; color: #64748b; }
        .metrica-detalhe { font-size: 12px; color: #94a3b8; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f1f5f9; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <h2>📊 Dashboard de Profissionais</h2>
      ${container.innerHTML}
      <p style="margin-top: 16px; color: #64748b;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 500);
}