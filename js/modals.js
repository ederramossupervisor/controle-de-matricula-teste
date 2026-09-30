let fotoAlunoCarregada = null;
let vinculosEdicaoSelecionados = [];
const cacheAlunosBusca = {};
const tiposDocumentoSemNome = [
  "Atas de Conselho de Classe",
  "Listas de Alunos Concluintes",
  "Plano de Curso (Técnico)"
];

// =========================
// MODAIS: ABERTURA, FECHAMENTO E AÇÕES INTERNAS
// =========================

// ------ MODAL DETALHES DO ALUNO ------
function abrirAluno(row) {
  const aluno = dadosGlobais.find(a => a._row == row);
  if (!aluno) {
    mostrarToast("Aluno não encontrado", "error");
    return;
  }
  abrirModalDetalhes(aluno);
}

// Adiciona estilo para destaque (no final do arquivo, fora de qualquer função)
const style = document.createElement('style');
style.textContent = `
  .legislacao-destaque {
    background-color: #fef9e7 !important;  /* amarelo bem clarinho */
    border-left: 5px solid #f1c40f !important;
    box-shadow: 0 0 8px rgba(241, 196, 15, 0.3);
  }
`;
document.head.appendChild(style);

function abrirModalDetalhes(aluno) {
  // 🔒 Trava rolagem da página
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.top = `-${window.scrollY}px`;

  dadosAlunoAtual = aluno;
  
  document.getElementById("detalhesTitulo").textContent = aluno.ALUNO;
  
  // Exibe foto (se existir)
  if (aluno.FOTO) {
    exibirFotoAluno(aluno.FOTO);
  } else {
    exibirFotoAluno(null);
  }
  
  // Monta checkboxes de documentos
  let html = `
    <p style="margin-top:0; color:#64748b; display:flex; gap:12px;">
      <span><i class="fas fa-school"></i> ${aluno.ESCOLA}</span>
      <span><i class="fas fa-calendar-alt"></i> Matrícula: ${new Date(aluno.DATA_MATRICULA).toLocaleDateString('pt-BR')}</span>
    </p>
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <h3 style="margin:0;">Documentos</h3>
      <button type="button" class="btn-pequeno" onclick="toggleTodosDocumentos()" style="background: var(--card-border);">
        <i class="fas fa-check-double"></i> Marcar/Desmarcar Todos
      </button>
    </div>
    <div class="checkboxes-container">
  `;
  
  const docsBasicos = [
    { label: "Certidão de Nascimento", coluna: 8, valor: aluno.CERTIDAO },
    { label: "CPF do aluno", coluna: 9, valor: aluno.CPF },
    { label: "RG do aluno", coluna: 10, valor: aluno.RG },
    { label: "Carteira de Vacinação", coluna: 11, valor: aluno.VACINA },
    { label: "Cartão do SUS", coluna: 12, valor: aluno.SUS },
    { label: "Comprovante de Residência", coluna: 13, valor: aluno.RESIDENCIA },
    { label: "Documentos do Responsável", coluna: 14, valor: aluno.RESP_DOCS },
    { label: "Histórico Escolar", coluna: 15, valor: aluno.HISTORICO },
    { label: "Declaração de Transferência", coluna: 16, valor: aluno.DECL_TRANSF }
  ];
  
  docsBasicos.forEach(doc => {
    const chave = `${aluno._row}_${doc.coluna}`;
    const checked = (alteracoesPendentes.hasOwnProperty(chave)) ? alteracoesPendentes[chave] : doc.valor;
    const disabledAttr = (perfilUsuario === 'PEDAGOGICO') ? 'disabled' : '';
    html += `
      <div class="checkbox-moderno">
        <input type="checkbox" 
          id="doc_${doc.coluna}" 
          ${checked ? "checked" : ""} 
          ${disabledAttr}
          onchange="marcarAlteracao(${aluno._row}, ${doc.coluna}, this.checked)">
        <label for="doc_${doc.coluna}">${doc.label}</label>
      </div>
    `;
  });
  
  if (aluno.ED_ESPECIAL === true) {
    const docEspecial = { label: "Laudo/Relatório Pedagógico (Ed. Especial)", coluna: 17, valor: aluno.ED_ESPECIAL };
    const chave = `${aluno._row}_${docEspecial.coluna}`;
    const checked = (alteracoesPendentes.hasOwnProperty(chave)) ? alteracoesPendentes[chave] : docEspecial.valor;
    const disabledAttr = (perfilUsuario === 'PEDAGOGICO') ? 'disabled' : '';
    html += `
      <div class="checkbox-moderno">
        <input type="checkbox" 
          id="doc_${docEspecial.coluna}" 
          ${checked ? "checked" : ""} 
          ${disabledAttr}
          onchange="marcarAlteracao(${aluno._row}, ${docEspecial.coluna}, this.checked)">
        <label for="doc_${docEspecial.coluna}">${docEspecial.label}</label>
      </div>
    `;
  }
  
  html += `</div>`; // fecha checkboxes-container

  const observacoesEscapadas = (aluno.OBSERVACOES || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html += `
    <div style="margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 16px;">
      <label for="observacoesAluno" style="font-weight: 500; display: block; margin-bottom: 8px;">
        <i class="fas fa-pencil-alt"></i> Observações internas:
      </label>
      <textarea id="observacoesAluno" rows="3" style="width: 100%; padding: 8px; border-radius: 12px; border: 1px solid var(--input-border); background: var(--input-bg); color: var(--text-primary); font-family: inherit;">${observacoesEscapadas}</textarea>
      <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Campo interno – não aparece em relatórios.</p>
    </div>
  `;
  
  document.getElementById("detalhesConteudo").innerHTML = html;

  // Seção Termo de Responsabilidade
  const termoHtml = `
    <div style="margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 16px;">
      <h3><i class="fas fa-file-signature"></i> Termo de Responsabilidade</h3>
      <p style="font-size:13px; color: var(--text-muted);">Quando há pendência de documentos, os pais/responsáveis devem assinar este termo.</p>
      <a href="https://docs.google.com/document/d/1yviCGA04nu08cKl8vmPwbny4JswycqCv/edit?usp=sharing&ouid=105884198619872219066&rtpof=true&sd=true" target="_blank" class="btn-pequeno">
        <i class="fas fa-download"></i> Baixar modelo
      </a>
      <input type="file" id="inputTermoResp" accept=".pdf,.jpg,.jpeg,.png" onchange="uploadTermoResp(${aluno._row}, '${aluno.ESCOLA}')" style="margin-left: 8px;">
      <button class="btn-pequeno" onclick="visualizarTermo()" style="margin-left:8px;" id="btnVisualizarTermo">
        <i class="fas fa-eye"></i> Visualizar
      </button>
      <button class="btn-pequeno btn-perigo" onclick="removerTermo(${aluno._row}, '${aluno.ESCOLA}')" style="margin-left:8px;" id="btnRemoverTermo">
        <i class="fas fa-trash"></i> Remover
      </button>
      <span id="statusTermoResp" style="margin-left:8px;"></span>
    </div>
  `;
  document.getElementById("detalhesConteudo").innerHTML += termoHtml;

  // Seção Declaração de Educação Especial
  const declEdEspHtml = `
    <div style="margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 16px;">
      <h3><i class="fa-solid fa-universal-access"></i> Declaração para Educação Especial</h3>
      <p style="font-size:13px; color: var(--text-muted);">Documento obrigatório para alunos público da Educação Especial (Decreto 12.686/2025).</p>
      <a href="https://docs.google.com/document/d/1lB4Cqp-ZZ2sfVUmSg3RSNCvhIEg-nCqo/export?format=docx" target="_blank" class="btn-pequeno">
        <i class="fas fa-download"></i> Baixar modelo
      </a>
      <span id="acoesDeclEdEsp" style="display: ${aluno.ED_ESPECIAL ? 'inline' : 'none'};">
        <input type="file" id="inputDeclEdEsp" accept=".pdf,.jpg,.jpeg,.png" onchange="uploadDeclEdEsp(${aluno._row}, '${aluno.ESCOLA}')" style="margin-left: 8px;">
        <button class="btn-pequeno" onclick="visualizarDeclEdEsp()" style="margin-left:8px;" id="btnVisualizarDeclEdEsp">
          <i class="fas fa-eye"></i> Visualizar
        </button>
        <button class="btn-pequeno btn-perigo" onclick="removerDeclEdEsp(${aluno._row}, '${aluno.ESCOLA}')" style="margin-left:8px;" id="btnRemoverDeclEdEsp">
          <i class="fas fa-trash"></i> Remover
        </button>
      </span>
      <span id="statusDeclEdEsp" style="margin-left:8px;"></span>
      <p id="msgEdEspOpcional" style="font-size:12px; color: var(--text-muted); margin-top:4px;">
        ${aluno.ED_ESPECIAL === true ? 'Este aluno é público da Educação Especial.' : 'Disponível apenas para alunos marcados como Educação Especial.'}
      </p>
    </div>
  `;
  document.getElementById("detalhesConteudo").innerHTML += declEdEspHtml;

  // Atualiza botões conforme a declaração existente
  atualizarBotoesDeclEdEsp(aluno);
  atualizarBotoesTermo(aluno);
  
  // ---- Preenche os campos editáveis ----
  const isPedagogico = (perfilUsuario === 'PEDAGOGICO');
  
  document.getElementById("editNomeAluno").value = aluno.ALUNO || "";
  document.getElementById("editNomeAluno").disabled = isPedagogico;
  
  document.getElementById("editIdAluno").value = aluno.ID || '';
  document.getElementById("editIdAluno").disabled = isPedagogico;
  
  document.getElementById("editResponsavel").value = aluno.RESPONSAVEL || "";
  document.getElementById("editResponsavel").disabled = isPedagogico;
  
  preencherCamposTelefoneEdicao(aluno.TELEFONE || "");
  if (isPedagogico) {
    document.querySelectorAll('#telefonesContainerEdicao input').forEach(inp => inp.disabled = true);
  }
  
  document.getElementById("editEdEspecial").checked = aluno.ED_ESPECIAL === true;
  document.getElementById("editEdEspecial").disabled = isPedagogico;
  
  document.getElementById("editCpfNumero").value = aluno.CPF_NUMERO || '';
  document.getElementById("editCpfNumero").disabled = isPedagogico;

  document.getElementById("editRacaCor").value = aluno.RACA_COR || "";
  document.getElementById("editRacaCor").disabled = isPedagogico;
  document.getElementById("editFiliacao1").value = aluno.FILIACAO_1 || "";
  document.getElementById("editFiliacao2").value = aluno.FILIACAO_2 || "";
  document.getElementById("editDataNascimento").value = formatarDataISO(aluno.DATA_NASCIMENTO);
  document.getElementById("editNaturalidade").value = aluno.NATURALIDADE || "";
  document.getElementById("editUfNascimento").value = (aluno.UF_NASCIMENTO || '').trim().toUpperCase();
  document.getElementById("editNacionalidade").value = aluno.NACIONALIDADE || "";

  if (isPedagogico) {
    document.getElementById("editFiliacao1").disabled = true;
    document.getElementById("editFiliacao2").disabled = true;
    document.getElementById("editDataNascimento").disabled = true;
    document.getElementById("editNaturalidade").disabled = true;
    document.getElementById("editUfNascimento").disabled = true;
    document.getElementById("editNacionalidade").disabled = true;
  }
  document.getElementById("btnSalvarInfoAluno").style.display = isPedagogico ? 'none' : '';
  document.getElementById("btnSalvarDetalhes").style.display = isPedagogico ? 'none' : '';
  
  const secaoEncerrar = document.querySelector('#modalDetalhes .modal-actions > div:first-child');
  if (secaoEncerrar) {
    secaoEncerrar.style.display = isPedagogico ? 'none' : '';
  }
  
  carregarTurmasParaEdicao(aluno.ESCOLA, aluno.TURMA);
  document.getElementById("modalDetalhes").style.display = "flex";

  // ********** Foto do aluno: ícone único e funcional **********
  const fotoPreview = document.getElementById('fotoAlunoPreview');
  const fotoInicial = document.getElementById('fotoAlunoInicial');
  const inputFoto = document.getElementById('uploadFotoAluno');

  // Remove completamente o botão "Foto" original para evitar qualquer ícone duplicado
  const oldFotoBtn = document.querySelector('#modalDetalhes button[onclick*="uploadFotoAluno"]');
  if (oldFotoBtn) oldFotoBtn.remove(); // remove do DOM, não apenas esconde

  // Função para abrir seletor de arquivo
  function abrirSeletorFoto() {
    if (inputFoto) inputFoto.click();
  }

  // Torna a foto de preview clicável
  if (fotoPreview) {
    fotoPreview.style.cursor = 'pointer';
    fotoPreview.title = 'Clique para alterar a foto';
    fotoPreview.onclick = abrirSeletorFoto;
  }

  // Configura a div de inicial (sem foto) com ícone de câmera ÚNICO
  if (fotoInicial) {
    // Limpa qualquer conteúdo extra que possa ter sido adicionado (overlays antigos)
    const existingOverlay = fotoInicial.querySelector('.camera-overlay');
    if (existingOverlay) existingOverlay.remove();

    fotoInicial.style.cursor = 'pointer';
    fotoInicial.title = 'Clique para adicionar uma foto';
    fotoInicial.onclick = abrirSeletorFoto;

    // Cria um único ícone de câmera
    const overlay = document.createElement('span');
    overlay.className = 'camera-overlay';
    overlay.innerHTML = '<i class="fas fa-camera" style="font-size:14px; color:#fff;"></i>';
    overlay.style.cssText = `
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(0,0,0,0.5);
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none; /* para não interceptar cliques */
    `;
    // Garante que a div pai tenha position relative para o absolute funcionar
    if (!fotoInicial.style.position || fotoInicial.style.position === 'static') {
      fotoInicial.style.position = 'relative';
    }
    fotoInicial.appendChild(overlay);
  }

  // ********** Botão Gerar Histórico **********
  let btnHistorico = document.getElementById('btnGerarHistorico');
  if (!btnHistorico) {
    btnHistorico = document.createElement('button');
    btnHistorico.id = 'btnGerarHistorico';
    btnHistorico.className = 'btn-salvar';
    btnHistorico.innerHTML = '<i class="fas fa-file-excel"></i> Gerar Histórico';
    btnHistorico.style.marginTop = '12px';
    const detalhesConteudo = document.getElementById('detalhesConteudo');
    if (detalhesConteudo) detalhesConteudo.after(btnHistorico);
  }
  btnHistorico.onclick = function() {
    gerarHistoricoAluno(dadosAlunoAtual.ID, dadosAlunoAtual.ESCOLA, dadosAlunoAtual.TURMA);
  };
}

function fecharModalDetalhes() {
  // 🔓 Restaura a rolagem da página
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.top = '';
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY.replace('px', '')) * -1);
  }

  document.getElementById("modalDetalhes").style.display = "none";
  dadosAlunoAtual = null;
}
function marcarAlteracao(row, coluna, valor) {
  const chave = `${row}_${coluna}`;
  alteracoesPendentes[chave] = valor;
}

function toggleTodosDocumentos() {
  const container = document.querySelector('#modalDetalhes .checkboxes-container');
  if (!container) return;
  
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  if (checkboxes.length === 0) return;
  
  const todosMarcados = Array.from(checkboxes).every(cb => cb.checked);
  const novoEstado = !todosMarcados;
  
  checkboxes.forEach(cb => {
    cb.checked = novoEstado;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
  });
  
  mostrarToast(novoEstado ? 'Todos os documentos marcados.' : 'Todos os documentos desmarcados.', 'info');
}

// ------ MODAL IMPORTAÇÃO CSV ------
function abrirModalImportacao() {
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode importar alunos.', 'warning');
    return;
  }
  document.getElementById('modalImportacao').style.display = 'flex';
  document.getElementById('arquivoCSV').value = '';
  document.getElementById('previewContainer').innerHTML = '<p style="padding:16px;color:#64748b;">Selecione um arquivo CSV para visualizar os dados.</p>';
  document.getElementById('btnExecutarImportacao').disabled = true;
  document.getElementById('statusImportacao').innerHTML = '';
}

function fecharModalImportacao() {
  document.getElementById('modalImportacao').style.display = 'none';
}

// ------ MODAL INATIVOS ------
function abrirModalInativos() {
  document.getElementById("modalInativos").style.display = "flex";
  carregarTurmasParaFiltroInativos();
  buscarInativos(1);
  ativarEnterNoModal('#modalInativos', () => buscarInativos(1));
}

function fecharModalInativos() {
  document.getElementById("modalInativos").style.display = "none";
}

function carregarTurmasParaFiltroInativos() {
  const select = document.getElementById("filtroTurmaInativo");
  select.innerHTML = '<option value="">Todas as turmas</option>';
  
  if (turmasDisponiveis.length > 0) {
    turmasDisponiveis.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      select.appendChild(opt);
    });
  } else {
    const url = `${API_URL}?tipo=turmas&email=${emailUsuario}`;
    jsonp(url, function(turmas) {
      turmasDisponiveis = turmas;
      turmas.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.turma;
        opt.textContent = t.turma;
        select.appendChild(opt);
      });
    });
  }
}

// ------ MODAL TURMAS (SUPERVISOR) ------
function abrirModalTurmas() {
  document.getElementById("modalTurmas").style.display = "flex";
  carregarTurmas();
}

function fecharModalTurmas() {
  document.getElementById("modalTurmas").style.display = "none";
}

function abrirModalCadastroTurma() {
  document.getElementById("modalCadastroTurma").style.display = "flex";
  
  // Se for secretária, esconde o campo de escola e usa a escola do usuário
  const selectEscola = document.getElementById("selectEscolaTurma");
  const labelEscola = selectEscola.parentElement; // div.input-icon
  if (perfilUsuario === "SECRETARIA") {
    labelEscola.style.display = "none";
    // Define o valor da escola para enviar ao backend (mesmo oculto)
    selectEscola.value = escolaUsuario;
  } else {
    labelEscola.style.display = "block";
    preencherSelectEscolasTurma(); // preenche o select para supervisores
  }
}

function fecharModalCadastroTurma() {
  document.getElementById("modalCadastroTurma").style.display = "none";
  document.getElementById("nomeTurma").value = "";
  document.getElementById("erroTurma").style.display = "none";
}

// Salvar turma (múltiplas linhas) - função usada no modal
async function salvarTurma() {
  const escola = document.getElementById("selectEscolaTurma").value;
  const turmasTexto = document.getElementById("nomeTurma").value.trim();
  const erroDiv = document.getElementById("erroTurma");
  
  if (!escola) {
    erroDiv.textContent = "Selecione uma escola.";
    erroDiv.style.display = "block";
    return;
  }
  if (!turmasTexto) {
    erroDiv.textContent = "Digite pelo menos uma turma.";
    erroDiv.style.display = "block";
    return;
  }
  
  const turmas = turmasTexto.split('\n').map(t => t.trim()).filter(t => t !== "");
  
  if (turmas.length === 0) {
    erroDiv.textContent = "Nenhuma turma válida informada.";
    erroDiv.style.display = "block";
    return;
  }
  
  erroDiv.style.display = "none";
  
  const btnSalvar = document.querySelector("#modalCadastroTurma .btn-salvar");
  showButtonLoading(btnSalvar);
  
  let sucessos = 0;
  let erros = [];
  
  try {
    for (let turma of turmas) {
      try {
        await fetch(API_URL, {
          method: "POST",
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            acao: "cadastrarTurma",
            email: emailUsuario,
            escola: escola,
            turma: turma
          })
        });
        sucessos++;
      } catch (e) {
        erros.push(`${turma}: Erro de conexão`);
      }
    }
  } finally {
    hideButtonLoading(btnSalvar);
  }
  
  let mensagem = "";
  if (sucessos > 0) mensagem += `${sucessos} turma(s) cadastrada(s) com sucesso. `;
  if (erros.length > 0) mensagem += `Erros: ${erros.join(', ')}`;
  
  if (erros.length === 0) {
    mostrarToast(mensagem, "success");
    limparCacheTurmas(escola);
    limparCacheTurmas("todas");
  } else {
    mostrarToast(mensagem, "error", 8000);
  }
  
  if (sucessos > 0) {
    fecharModalCadastroTurma();
    carregarTurmas(document.getElementById("filtroEscolaTurma").value);
  }
}

// ------ MODAL LEGALIZAÇÃO (ATOS) ------
function abrirModalLegalizacao() {
  document.getElementById("modalLegalizacao").style.display = "flex";
  carregarEscolasParaFiltroAto();
  carregarAtos();
}

function fecharModalLegalizacao() {
  document.getElementById("modalLegalizacao").style.display = "none";
}

function preencherSelectEscolaAto() {
  const select = document.getElementById('atoEscola');
  if (!select) return;
  const escolas = getEscolasPermitidas();
  select.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(esc => {
    const opt = document.createElement('option');
    opt.value = esc;
    opt.textContent = esc;
    select.appendChild(opt);
  });
}

function abrirFormAto() {
  document.getElementById("formAtoTitulo").textContent = "Novo Ato Autorizativo";
  document.getElementById("atoId").value = "";
  document.getElementById("atoEscola").value = "";
  document.getElementById("atoTipo").value = "";
  document.getElementById("atoCursoEtapa").value = "";
  document.getElementById("atoFundamentacao").value = "";
  document.getElementById("atoCursoTecnico").value = "";
  document.getElementById("atoNumero").value = "";
  document.getElementById("atoDataPublicacao").value = "";
  document.getElementById("atoValidadeAnos").value = "5";
  document.getElementById("atoObservacoes").value = "";
  document.getElementById("atoArquivo").value = "";
  document.getElementById("atoDataHomologacao").value = "";
  
  // Esconde os campos de curso (aparecem só se tipo for Ato de curso)
  document.getElementById('atoCursoEtapa').closest('.input-icon').style.display = 'none';
  document.getElementById('fundamentacaoWrapper').style.display = 'none';
  document.getElementById('cursoTecnicoWrapper').style.display = 'none';
  
  preencherCursoEtapa();
  preencherSelectEscolaAto();
  document.getElementById("modalFormAto").style.display = "flex";
}

function fecharFormAto() {
  document.getElementById("modalFormAto").style.display = "none";
}

function editarAto(id) {
  const ato = atosGlobais.find(a => a.id === id);
  if (!ato) return;
  document.getElementById("formAtoTitulo").textContent = "Editar Ato Autorizativo";
  document.getElementById("atoId").value = ato.id;
  document.getElementById("atoEscola").value = ato.escola;
  document.getElementById("atoTipo").value = ato.tipoAto;
  document.getElementById("atoCursoEtapa").value = ato.cursoEtapa;
  document.getElementById("atoFundamentacao").value = ato.fundamentacao || "";
  document.getElementById("atoCursoTecnico").value = ato.cursoTecnico || "";
  document.getElementById("atoNumero").value = ato.numeroAto;
  document.getElementById("atoDataPublicacao").value = ato.dataPublicacao.split('T')[0];
  document.getElementById("atoValidadeAnos").value = ato.validadeAnos;
  document.getElementById("atoObservacoes").value = ato.observacoes || "";
  document.getElementById("atoArquivo").value = "";
  document.getElementById("atoDataHomologacao").value = ato.dataHomologacao ? ato.dataHomologacao.split('T')[0] : "";
  
  preencherCursoEtapa();
  preencherSelectEscolaAto();
  
  // Exibe os campos de curso se for ato de curso
  atualizarVisibilidadeCurso();
  
  document.getElementById("modalFormAto").style.display = "flex";
}

// ------ MODAL MODELOS ------
function abrirModalModelos() {
  document.getElementById("modalModelos").style.display = "flex";
  
  const isAdmin = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br');
  const abaUploadBtn = document.getElementById("abaUploadModeloBtn");
  
  if (isAdmin) {
    abaUploadBtn.style.display = "inline-block";
    preencherSelectTipoModelo();
  } else {
    abaUploadBtn.style.display = "none";
  }
  
  mostrarAbaListarModelos();
}

function mostrarAbaUploadModeloEscola() {
  document.getElementById('abaListarModelos').style.display = 'none';
  document.getElementById('abaUploadModelo').style.display = 'none';
  document.getElementById('abaUploadModeloEscola').style.display = 'block';
  preencherDatalistModelosExistentes();
}

function preencherDatalistModelosExistentes() {
  const datalist = document.getElementById('listaModelosExistentes');
  if (!datalist) return;
  const url = `${API_URL}?tipo=listarModelosEscola&email=${emailUsuario}&_=${new Date().getTime()}`;
  jsonp(url, function(modelos) {
    datalist.innerHTML = '';
    if (!Array.isArray(modelos)) return;
    const nomesEscola = [...new Set(modelos.filter(m => m.isPersonalizado).map(m => m.nome))];
    nomesEscola.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      datalist.appendChild(opt);
    });
  });
}

function fecharModalModelos() {
  document.getElementById("modalModelos").style.display = "none";
}

function mostrarAbaListarModelos() {
  document.getElementById('abaListarModelos').style.display = 'block';
  document.getElementById('abaUploadModelo').style.display = 'none';
  document.getElementById('abaUploadModeloEscola').style.display = 'none';
  carregarModelosEscola(); // usa a nova função que lista todos
}

function mostrarAbaUploadModelo() {
  document.getElementById("abaListarModelos").style.display = "none";
  document.getElementById("abaUploadModelo").style.display = "block";
}

function preencherSelectTipoModelo() {
  const select = document.getElementById("selectTipoModelo");
  select.innerHTML = '<option value="">Selecione o tipo de modelo</option>';
  LISTA_MODELOS.forEach(modelo => {
    const opt = document.createElement("option");
    opt.value = modelo;
    opt.textContent = modelo;
    select.appendChild(opt);
  });
}

// ------ MODAL GESTÃO DE DOCUMENTOS ------
function abrirModalDocumentos() {
  document.getElementById("modalDocumentos").style.display = "flex";
  preencherSelectEscolasDoc();   // ← chamada movida para cá
  mostrarAbaUpload();
  ativarEnterNoModal('#modalDocumentos', buscarDocumentos);
}

function fecharModalDocumentos() {
  document.getElementById("modalDocumentos").style.display = "none";
}

function mostrarAbaUpload() {
  document.getElementById("abaUpload").style.display = "block";
  document.getElementById("abaListagem").style.display = "none";
  carregarTiposDocumento();
}

function carregarTiposDocumento() {
  const select = document.getElementById('uploadTipoDoc');
  if (!select) return;

  const url = `${API_URL}?tipo=listarTiposDocumento&email=${emailUsuario}`;
  jsonp(url, function(tipos) {
    select.innerHTML = '<option value="">Tipo de documento</option>';
    if (Array.isArray(tipos)) {
      tipos.forEach(tipo => {
        const opt = document.createElement('option');
        opt.value = tipo;
        opt.textContent = tipo;
        select.appendChild(opt);
      });
    }
    // Adiciona opção "Outro" no final
    const optOutro = document.createElement('option');
    optOutro.value = '__novo__';
    optOutro.textContent = '+ Novo tipo...';
    select.appendChild(optOutro);

    // Evento para capturar quando selecionar "+ Novo tipo..."
    select.onchange = function() {
      if (this.value === '__novo__') {
        const novoTipo = prompt('Digite o nome do novo tipo de documento:');
        if (novoTipo && novoTipo.trim()) {
          postSemResposta({
            acao: 'cadastrarTipoDocumento',
            email: emailUsuario,
            tipo: novoTipo.trim()
          }, 'Tipo cadastrado!', () => {
            carregarTiposDocumento(); // recarrega a lista
            select.value = novoTipo.trim();
          });
        } else {
          select.value = '';
        }
      }
      atualizarCampoNomeTitular(); // função existente
    };
  });
}

function mostrarAbaListagem() {
  document.getElementById("abaUpload").style.display = "none";
  document.getElementById("abaListagem").style.display = "block";
  buscarDocumentos();
}

// ------ MODAL PROCESSOS (EDOCS) ------
function abrirModalProcessos() {
  document.getElementById("modalProcessos").style.display = "flex";
  preencherSelectsProcessos();   // ← chamada movida para cá
  mostrarAbaCadastroProcesso();
  ativarEnterNoModal('#modalProcessos', buscarProcessos);
}

function fecharModalProcessos() {
  document.getElementById("modalProcessos").style.display = "none";
}

function mostrarAbaCadastroProcesso() {
  document.getElementById("abaCadastroProcesso").style.display = "block";
  document.getElementById("abaBuscaProcesso").style.display = "none";
}

function mostrarAbaBuscaProcesso() {
  document.getElementById("abaCadastroProcesso").style.display = "none";
  document.getElementById("abaBuscaProcesso").style.display = "block";
  buscarProcessos();
}

// ------ MODAL LISTA DE USUÁRIOS ------
function abrirModalListaUsuarios() {
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode gerenciar usuários.', 'warning');
    return;
  }
  document.getElementById("modalListaUsuarios").style.display = "flex";
  carregarUsuarios();
}

function fecharModalListaUsuarios() {
  document.getElementById("modalListaUsuarios").style.display = "none";
}

function abrirModalCadastroUsuario() {
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode cadastrar usuários.', 'warning');
    return;
  }
  document.getElementById("novoNome").value = "";
  document.getElementById("novoEmail").value = "";
  document.querySelectorAll('input[name="perfilCadastro"]').forEach(el => el.checked = (el.value === 'SECRETARIA'));
  document.getElementById("erroUsuario").style.display = "none";

  const selectEscola = document.getElementById("escola");
  const escolas = getEscolasPermitidas();
  selectEscola.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(esc => {
    const opt = document.createElement("option");
    opt.value = esc;
    opt.textContent = esc;
    selectEscola.appendChild(opt);
  });
  selectEscola.value = "";

  ajustarOpcoesCadastroUsuario();

  document.getElementById("modalCadastroUsuario").style.display = "flex";
}

function fecharModalCadastroUsuario() {
  document.getElementById("modalCadastroUsuario").style.display = "none";
}

// ------ MODAL EDIÇÃO DE USUÁRIO ------
function abrirModalEdicaoUsuario(usuario) {
  document.getElementById("edicaoNome").value = usuario.NOME || "";
  document.getElementById("edicaoEmail").value = usuario.EMAIL || "";
  document.getElementById("edicaoEmail").dataset.emailOriginal = usuario.EMAIL || "";
  document.getElementById("erroEdicaoUsuario").style.display = "none";

  const perfisAtuais = (usuario.PERFIL || "").toString().split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
  document.querySelectorAll('input[name="perfilEdicao"]').forEach(el => el.checked = perfisAtuais.includes(el.value));

  const selectEscola = document.getElementById("escolaEdicao");
  const escolas = getEscolasPermitidas();
  selectEscola.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(esc => {
    const opt = document.createElement("option");
    opt.value = esc;
    opt.textContent = esc;
    selectEscola.appendChild(opt);
  });
  selectEscola.value = usuario.ESCOLA || "";

  ajustarOpcoesEdicaoUsuario();

  document.getElementById("modalEdicaoUsuario").style.display = "flex";
}

function fecharModalEdicaoUsuario() {
  document.getElementById("modalEdicaoUsuario").style.display = "none";
}

// ------ MODAL ALTERAR SENHA ------
function abrirModalAlterarSenha() {
  document.getElementById("modalAlterarSenha").style.display = "flex";
  document.getElementById("senhaAtual").value = "";
  document.getElementById("novaSenha").value = "";
  document.getElementById("confirmarNovaSenha").value = "";
}

function fecharModalAlterarSenha() {
  const modal = document.getElementById("modalAlterarSenha");
  if (modal && modal.classList.contains("primeiro-acesso")) {
    return; // não permite fechar durante o primeiro acesso
  }
  modal.style.display = "none";
}

// ------ MODAL EXPORTAÇÃO ------
function abrirModalExportacao() {
  // Preencher escolas (apenas para supervisor)
  if (perfilUsuario === "SUPERVISOR") {
    const selectEscola = document.getElementById('exportEscola');
    const escolas = getEscolasPermitidas();
    selectEscola.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.forEach(esc => selectEscola.appendChild(new Option(esc, esc)));
    document.getElementById('exportEscolaWrapper').style.display = 'block';
    // Quando a escola mudar, recarregar turmas
    selectEscola.onchange = function() {
      carregarTurmasExportacao(this.value);
    };
  } else {
    document.getElementById('exportEscolaWrapper').style.display = 'none';
  }

  // Preencher turmas
  carregarTurmasExportacao( perfilUsuario === "SUPERVISOR" ? "" : escolaUsuario );
  
  document.getElementById('exportStatus').value = '';
  document.getElementById('modalExportacao').style.display = 'flex';
}

function fecharModalExportacao() {
  document.getElementById('modalExportacao').style.display = 'none';
}

// ------ MODAL CHECKLIST EM LOTE ------
function abrirModalChecklistLote() {
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode acessar checklist em lote.', 'warning');
    return;
  }
  document.getElementById("modalChecklistLote").style.display = "flex";
  document.getElementById("escolaAtualChecklist").textContent = escolaUsuario;
  
  const select = document.getElementById("selectTurmaChecklist");
  select.innerHTML = '<option value="">Selecione uma turma</option>';
  
  const turmasDaEscola = turmasDisponiveis.filter(t => t.escola === escolaUsuario);
  if (turmasDaEscola.length === 0) {
    carregarTurmas(escolaUsuario).then(() => {
      const turmas = turmasGlobais.filter(t => t.escola === escolaUsuario);
      turmas.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.turma;
        opt.textContent = t.turma;
        select.appendChild(opt);
      });
    });
  } else {
    turmasDaEscola.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.turma;
      opt.textContent = t.turma;
      select.appendChild(opt);
    });
  }
  
  document.getElementById("listaChecklistContainer").innerHTML = '<p style="padding:20px; text-align:center;">Selecione uma turma...</p>';
}

// Função auxiliar: verifica se alguma checkbox do checklist foi alterada
function checklistTemAlteracoes() {
  const checkboxes = document.querySelectorAll('#listaChecklistContainer .check-doc-individual');
  for (const cb of checkboxes) {
    const original = cb.dataset.original === 'true';
    if (cb.checked !== original) {
      return true; // pelo menos uma alteração encontrada
    }
  }
  return false;
}

// Função de fechamento do modal de checklist em lote (ATUALIZADA)
function fecharModalChecklistLote() {
  if (checklistTemAlteracoes()) {
    if (!confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
      return; // não fecha se o usuário cancelar
    }
  }
  document.getElementById("modalChecklistLote").style.display = "none";
}

async function carregarAlunosParaChecklist() {
  const turmaSelecionada = document.getElementById("selectTurmaChecklist").value;
  const container = document.getElementById("listaChecklistContainer");

  if (!turmaSelecionada) {
    container.innerHTML = '<p style="padding:20px; text-align:center;">Selecione uma turma...</p>';
    return;
  }

  mostrarLoading();

  let url = `${API_URL}?email=${emailUsuario}&turma=${encodeURIComponent(turmaSelecionada)}&limite=1000`;

  jsonp(url, function(dados) {
    const alunos = dados.alunos.filter(a => a.SITUACAO === "Ativo");

    if (alunos.length === 0) {
      container.innerHTML = '<p style="padding:20px; text-align:center;">Nenhum aluno ativo encontrado nesta turma.</p>';
      esconderLoading();
      return;
    }

    const documentos = [
      { col: 'CERTIDAO', label: 'Certidão', icon: 'fa-certificate' },
      { col: 'CPF', label: 'CPF', icon: 'fa-id-card' },
      { col: 'RG', label: 'RG', icon: 'fa-address-card' },
      { col: 'VACINA', label: 'Vacina', icon: 'fa-syringe' },
      { col: 'SUS', label: 'SUS', icon: 'fa-hospital' },
      { col: 'RESIDENCIA', label: 'Residência', icon: 'fa-home' },
      { col: 'RESP_DOCS', label: 'Resp. Docs', icon: 'fa-file-signature' },
      { col: 'HISTORICO', label: 'Histórico', icon: 'fa-history' },
      { col: 'DECL_TRANSF', label: 'Decl. Transf.', icon: 'fa-exchange-alt' },
      { col: 'ED_ESPECIAL', label: 'Laudo Ed. Especial', icon: 'fa-solid fa-universal-access', especial: true }
    ];

    let html = '<div style="display:flex; flex-direction:column; min-width:700px;">';
    
    // Cabeçalho com nomes
    html += '<div style="display:flex; align-items:center; padding:10px 16px; background:var(--card-border); font-weight:600; font-size:11px; gap:4px; position:sticky; top:0; z-index:10;">';
    html += '<div style="flex:1; min-width:150px;">Aluno</div>';
    documentos.forEach(doc => {
      html += `<div style="width:50px; text-align:center; line-height:1.2;" title="${doc.label}">
        <i class="fas ${doc.icon}" style="font-size:16px;"></i><br>
        <span style="display:block; margin-top:2px;">${doc.label}</span>
      </div>`;
    });
    html += '</div>';

    alunos.forEach(aluno => {
      html += '<div style="display:flex; align-items:center; padding:8px 16px; border-bottom:1px solid var(--card-border); gap:4px;">';
      html += `<div style="flex:1; min-width:150px; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${aluno.ALUNO}">${aluno.ALUNO}</div>`;

      documentos.forEach(doc => {
        // Para o laudo de Ed. Especial, só exibe checkbox se o aluno for Ed. Especial
        if (doc.especial && aluno.ED_ESPECIAL !== true) {
          html += '<div style="width:50px; text-align:center; color:#ccc;">–</div>';
        } else {
          const valor = aluno[doc.col] === true;
          const bgColor = valor ? '#d4edda' : '#fff';
          html += `<div style="width:50px; text-align:center; background:${bgColor}; border-radius:4px; padding:2px 0;">
            <input type="checkbox" 
                   class="check-doc-individual"
                   data-row="${aluno._row}" 
                   data-escola="${aluno.ESCOLA}"
                   data-col="${doc.col}"
                   data-original="${valor}"
                   ${valor ? 'checked' : ''}
                   onchange="this.parentElement.style.background=this.checked?'#d4edda':'#fff';"
                   style="transform:scale(1.1); cursor:pointer;">
          </div>`;
        }
      });
      
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
    esconderLoading();
  });
}

// ------ NOVO ALUNO (MODAL) ------
function abrirNovoAluno() {
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode cadastrar alunos.', 'warning');
    return;
  }

  // 🔒 Fixa o body para impedir QUALQUER rolagem do fundo
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.top = `-${window.scrollY}px`;  // mantém a posição de rolagem atual visual

  document.getElementById("novoAluno").style.display = "flex";
  document.getElementById("lista").style.display = "none";
  document.getElementById("painel").style.display = "none";
  document.getElementById("escolaVinculada").textContent = 
    `Aluno será matriculado em: ${escolaUsuario}`;
  carregarTurmasParaCadastro(escolaUsuario);
}
function voltarApp() {
  // 🔓 Restaura o scroll do body
  const scrollY = document.body.style.top;
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.top = '';
  window.scrollTo(0, parseInt(scrollY || '0') * -1);

  // Fecha o modal e restaura a interface
  const idsParaEsconder = ["usuarios", "cadastro", "novoAluno", "modalListaUsuarios", "modalCadastroUsuario"];
  idsParaEsconder.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  const lista = document.getElementById("lista");
  const painel = document.getElementById("painel");
  if (lista) lista.style.display = "";
  if (painel) painel.style.display = "";

  // Limpa campos
  const nomeAluno = document.getElementById("nomeAluno");
  if (nomeAluno) {
    nomeAluno.value = "";
    nomeAluno.style.borderColor = "#e2e8f0";
  }
  const erroNome = document.getElementById("erroNome");
  if (erroNome) erroNome.style.display = "none";
  const nomeResp = document.getElementById("nomeResponsavel");
  if (nomeResp) nomeResp.value = "";
  const tel = document.getElementById("telefoneContato");
  if (tel) tel.value = "";
  const edEspCheck = document.getElementById("alunoEdEspecial");
  if (edEspCheck) edEspCheck.checked = false;
  const racaCad = document.getElementById('racaCorCadastro');
  if (racaCad) racaCad.value = "";
    const filiacao1 = document.getElementById("filiacao1Cadastro");
  if (filiacao1) filiacao1.value = "";
  const filiacao2 = document.getElementById("filiacao2Cadastro");
  if (filiacao2) filiacao2.value = "";
  const dataNasc = document.getElementById("dataNascimentoCadastro");
  if (dataNasc) dataNasc.value = "";
  const naturalidade = document.getElementById("naturalidadeCadastro");
  if (naturalidade) naturalidade.value = "";
  const ufNasc = document.getElementById("ufNascimentoCadastro");
  if (ufNasc) ufNasc.value = "";
  const nacionalidade = document.getElementById("nacionalidadeCadastro");
  if (nacionalidade) nacionalidade.value = "";
}


// ------ CAMPOS DE TELEFONE (MODAL CADASTRO E EDIÇÃO) ------
function adicionarCampoTelefoneCadastro() {
  const container = document.getElementById("telefonesContainerCadastro");
  const novoCampo = document.createElement("div");
  novoCampo.className = "input-icon";
  novoCampo.style.marginBottom = "8px";
  novoCampo.innerHTML = `
    <span class="icon"><i class="fas fa-phone-alt"></i></span>
    <input type="tel" class="telefone-cadastro" placeholder="Telefone adicional" oninput="aplicarMascaraTelefone(event)">
    <button type="button" class="btn-icone" onclick="removerCampoTelefone(this)" style="margin-left: 8px; color: #dc2626;">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(novoCampo);
}

function removerCampoTelefone(botao) {
  botao.closest('.input-icon').remove();
}

function coletarTelefonesCadastro() {
  const inputs = document.querySelectorAll("#telefonesContainerCadastro .telefone-cadastro");
  const telefones = [];
  inputs.forEach(input => {
    const valor = input.value.trim();
    if (valor) telefones.push(valor);
  });
  return telefones.join("; ");
}

function preencherCamposTelefoneEdicao(telefonesStr) {
  const container = document.getElementById("telefonesContainerEdicao");
  container.innerHTML = "";
  
  const telefones = telefonesStr ? telefonesStr.split(";").map(t => t.trim()).filter(t => t) : [];
  
  if (telefones.length === 0) {
    adicionarCampoTelefoneEdicao();
  } else {
    telefones.forEach((tel, index) => {
      adicionarCampoTelefoneEdicao(tel);
    });
  }
}

function adicionarCampoTelefoneEdicao(valor = "") {
  const container = document.getElementById("telefonesContainerEdicao");
  const novoCampo = document.createElement("div");
  novoCampo.className = "input-icon";
  novoCampo.style.marginBottom = "8px";
  novoCampo.innerHTML = `
    <span class="icon"><i class="fas fa-phone-alt"></i></span>
    <input type="tel" class="telefone-edicao" placeholder="Telefone" value="${valor}" oninput="aplicarMascaraTelefone(event)">
    <button type="button" class="btn-icone" onclick="removerCampoTelefone(this)" style="margin-left: 8px; color: #dc2626;">
      <i class="fas fa-times"></i>
    </button>
  `;
  container.appendChild(novoCampo);
}

function coletarTelefonesEdicao() {
  const inputs = document.querySelectorAll("#telefonesContainerEdicao .telefone-edicao");
  const telefones = [];
  inputs.forEach(input => {
    const valor = input.value.trim();
    if (valor) telefones.push(valor);
  });
  return telefones.join("; ");
}

// ------ TOGGLE DE SENHA NO MODAL ALTERAR SENHA ------
function toggleSenha(iconElement) {
  const input = iconElement.parentElement.querySelector('input');
  if (!input) return;
  
  const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
  input.setAttribute('type', type);
  
  const icon = iconElement.querySelector('i');
  if (icon) {
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  }
}

// ------ MENU DROPDOWN (USUÁRIO NO HEADER) ------
function toggleMenu() {
  const menu = document.getElementById("menuDropdown");
  const overlay = document.getElementById("menuOverlay");
  const header = document.querySelector("header");
  
  if (window.innerWidth <= 800) {
    // Mobile: usa classe e ajusta z-index do header
    menu.style.display = '';
    const aberto = menu.classList.contains("menu-aberto");
    
    if (aberto) {
      // Fechar
      menu.classList.remove("menu-aberto");
      overlay.classList.remove("ativo");
      if (header) header.style.zIndex = '50';        // restaura padrão
    } else {
      // Abrir
      menu.classList.add("menu-aberto");
      overlay.classList.add("ativo");
      if (header) header.style.zIndex = '10002';    // sobe acima do overlay
    }
  } else {
    // Desktop: mantém lógica original
    menu.classList.remove("menu-aberto");
    overlay.classList.remove("ativo");
    if (header) header.style.zIndex = '50';
    const estaVisivel = menu.style.display !== "none" && menu.style.display !== "";
    menu.style.display = estaVisivel ? "none" : "flex";
  }
}
// ------ COPIAR CÓDIGO DO PROCESSO ------
function copiarCodigo(codigo) {
  if (!codigo) return;
  
  navigator.clipboard.writeText(codigo)
    .then(() => {
      mostrarToast(`Código ${codigo} copiado!`, "success");
    })
    .catch(err => {
      console.error('Erro ao copiar:', err);
      mostrarToast('Não foi possível copiar o código.', "error");
    });
}

// ------ PREENCHER DATA DE HOJE NO CADASTRO DE ALUNO ------
function preencherDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  const dataFormatada = `${ano}-${mes}-${dia}`;
  document.getElementById("dataMatricula").value = dataFormatada;
}
function alterarFotoAluno() {
  const fileInput = document.getElementById('uploadFotoAluno');
  const file = fileInput.files[0];
  if (!file) return;
  
  if (file.size > 5 * 1024 * 1024) {
    mostrarToast("A imagem deve ter no máximo 5 MB.", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result.split(',')[1];
    const dados = {
      acao: 'uploadFotoAluno',
      email: emailUsuario,
      escola: dadosAlunoAtual.ESCOLA,
      row: dadosAlunoAtual._row,
      fileBase64: base64,
      fileName: `aluno_${dadosAlunoAtual.ID || dadosAlunoAtual._row}.jpg`,
      mimeType: file.type
    };
    
    postSemResposta(dados, "Foto salva com sucesso!", function() {
      // Atualiza a pré-visualização
      const url = `https://drive.google.com/thumbnail?id=${dados.fileName}&sz=w100`;
      fotoAlunoCarregada = URL.createObjectURL(file); // usa blob local para preview imediato
      exibirFotoAluno(fotoAlunoCarregada);
    });
  };
  reader.readAsDataURL(file);
}

function removerFotoAluno() {
  if (!confirm("Remover a foto do aluno?")) return;
  // Envia um upload sem arquivo? Não temos backend para excluir, mas podemos limpar a coluna.
  // Para simplificar, apenas limpa a visualização e marca a coluna como vazia enviando uma flag.
  const dados = {
    acao: 'uploadFotoAluno',
    email: emailUsuario,
    escola: dadosAlunoAtual.ESCOLA,
    row: dadosAlunoAtual._row,
    fileBase64: '', // vazio sinaliza remoção
    fileName: '',
    mimeType: ''
  };
  postSemResposta(dados, "Foto removida.", function() {
    fotoAlunoCarregada = null;
    exibirFotoAluno(null);
  });
}
function exibirFotoAluno(url) {
  const img = document.getElementById('fotoAlunoPreview');
  const inicial = document.getElementById('fotoAlunoInicial');
  if (url) {
    img.src = url;
    img.style.display = 'block';
    inicial.style.display = 'none';
  } else {
    img.style.display = 'none';
    inicial.style.display = 'flex';
    const letra = dadosAlunoAtual ? dadosAlunoAtual.ALUNO.charAt(0).toUpperCase() : '?';
    inicial.textContent = letra;
  }
}
function carregarFotoAluno(id, escola) {
  const urlAPI = `${API_URL}?tipo=fotoAluno&id=${id}&escola=${encodeURIComponent(escola)}&_=${Date.now()}`;
  jsonp(urlAPI, function(res) {
    if (res.url && res.url.trim() !== "") {
      fotoAlunoCarregada = res.url;
      exibirFotoAluno(res.url);
    } else {
      fotoAlunoCarregada = null;
      exibirFotoAluno(null);
    }
  });
}

function abrirModalAlterarSenhaObrigatorio() {
  const modal = document.getElementById("modalAlterarSenha");
  if (!modal) return;
  modal.style.display = "flex";
  const closeBtn = modal.querySelector(".close-btn");
  if (closeBtn) closeBtn.style.display = "none";
  modal.classList.add("primeiro-acesso");

  // Limpa os campos
  document.getElementById("senhaAtual").value = "";
  document.getElementById("novaSenha").value = "";
  document.getElementById("confirmarNovaSenha").value = "";

  // Foco no campo de senha atual (que será a senha enviada por e-mail)
  document.getElementById("senhaAtual").focus();
}
function marcarTodosDocumentos(marcar) {
  const checkboxes = document.querySelectorAll('#listaChecklistContainer .check-doc-individual');
  checkboxes.forEach(cb => { cb.checked = marcar; });
}

function desmarcarTodosDocumentos() {
  marcarTodosDocumentos(false);
}
// =========================
// MODAL LEGISLAÇÃO
// =========================

let vinculosSelecionados = [];

// ---- ABERTURA / FECHAMENTO / ABAS ----
function abrirModalLegislacao() {
  // Salva o estado atual do scroll (para restaurar depois)
  const scrollY = window.scrollY;
  document.documentElement.style.setProperty('--scroll-y', scrollY + 'px');

  // Trava o fundo (html e body)
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
  document.body.style.top = `-${scrollY}px`;

  // Exibe o modal
  document.getElementById('modalLegislacao').style.display = 'flex';
  document.body.classList.add('modal-fullscreen-aberto');

  // Restante da lógica existente...
  const abaCadastroBtn = document.getElementById('abaCadastrarLegislacaoBtn');
  const emailsPermitidos = [
    "eder.ramos@educador.edu.es.gov.br",
    "ecramos@sedu.es.gov.br"
  ];
  if (abaCadastroBtn) {
    abaCadastroBtn.style.display = emailsPermitidos.includes(emailUsuario) ? 'inline-block' : 'none';
  }
  mostrarAbaConsultaLegislacao();
  ativarEnterNoModal('#modalLegislacao', buscarLegislacao);
}

function fecharModalLegislacao() {
  // Restaura o fundo
  const scrollY = parseInt(document.documentElement.style.getPropertyValue('--scroll-y') || '0');
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
  document.body.style.top = '';
  document.documentElement.style.removeProperty('--scroll-y');

  // Esconde o modal
  document.getElementById('modalLegislacao').style.display = 'none';
  document.body.classList.remove('modal-fullscreen-aberto');

  // Restaura a posição de rolagem original
  window.scrollTo(0, scrollY);
}

function mostrarAbaCadastroLegislacao() {
  document.getElementById('abaCadastroLegislacao').style.display = 'block';
  document.getElementById('abaConsultaLegislacao').style.display = 'none';
  carregarDocumentosParaVinculacao();   // ← ADICIONE ESTA LINHA
}

function mostrarAbaConsultaLegislacao() {
  document.getElementById('abaCadastroLegislacao').style.display = 'none';
  document.getElementById('abaConsultaLegislacao').style.display = 'block';
  buscarLegislacao();
}

// ---- CADASTRAR ----
// ---- CADASTRAR ----
async function cadastrarLegislacao() {
  const tipo = document.getElementById('tipoLegislacao').value;
  const numero = document.getElementById('numeroLegislacao').value.trim();
  const ano = document.getElementById('anoLegislacao').value.trim();
  const assunto = document.getElementById('assuntoLegislacao').value.trim();
  const dataPublicacao = document.getElementById('dataPublicacaoLegislacao').value;
  const observacoes = document.getElementById('observacoesLegislacao').value.trim();
  const palavrasChave = document.getElementById('palavrasChaveLegislacao').value.trim();
  const fileInput = document.getElementById('arquivoLegislacao');
  const file = fileInput.files[0];

  if (!tipo || !numero || !ano) {
    mostrarToast('Tipo, número e ano são obrigatórios.', 'warning');
    return;
  }

  const btnSalvar = document.querySelector('#abaCadastroLegislacao .btn-salvar');
  showButtonLoading(btnSalvar);

  let fileBase64 = null, fileName = null, mimeType = null;

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarToast('Arquivo muito grande. Máximo 10 MB.', 'warning');
      hideButtonLoading(btnSalvar);
      return;
    }
    const extensao = file.name.split('.').pop();
    fileName = `${tipo} ${numero}/${ano} - ${assunto}.${extensao}`;
    mimeType = file.type;
    fileBase64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
  }

  const dados = {
    acao: 'salvarLegislacao',
    email: emailUsuario,
    tipo: tipo,
    numero: numero,
    ano: ano,
    assunto: assunto,
    dataPublicacao: dataPublicacao,
    observacoes: observacoes,
    palavrasChave: palavrasChave,
    fileName: fileName,
    mimeType: mimeType,
    fileBase64: fileBase64,
    vinculos: vinculosSelecionados
  };

  postSemResposta(dados, 'Legislação cadastrada!', () => {
    hideButtonLoading(btnSalvar);
    document.getElementById('tipoLegislacao').value = '';
    document.getElementById('numeroLegislacao').value = '';
    document.getElementById('anoLegislacao').value = '';
    document.getElementById('assuntoLegislacao').value = '';
    document.getElementById('dataPublicacaoLegislacao').value = '';
    document.getElementById('observacoesLegislacao').value = '';
    document.getElementById('palavrasChaveLegislacao').value = '';
    fileInput.value = '';
    vinculosSelecionados = [];
    renderizarVinculosAdicionados();
    mostrarAbaConsultaLegislacao();
  });
}

// ---- CONSULTAR ----
function buscarLegislacao() {
  mostrarLoading();
  const filtroTipo = document.getElementById('filtroTipoLegislacao').value;
  const filtroAno = document.getElementById('filtroAnoLegislacao').value.trim();
  const filtroAssunto = document.getElementById('filtroAssuntoLegislacao')?.value.trim() || '';
  const filtroPalavrasChave = document.getElementById('filtroPalavrasChaveLegislacao')?.value.trim() || '';

  let url = `${API_URL}?tipo=legislacao&email=${emailUsuario}`;
  if (filtroTipo) url += `&filtroTipo=${encodeURIComponent(filtroTipo)}`;
  if (filtroAno) url += `&filtroAno=${encodeURIComponent(filtroAno)}`;
  if (filtroAssunto) url += `&filtroAssunto=${encodeURIComponent(filtroAssunto)}`;
  if (filtroPalavrasChave) url += `&filtroPalavrasChave=${encodeURIComponent(filtroPalavrasChave)}`;

  jsonp(url, function(dados) {
    esconderLoading();
    preencherDropdownDocumentos(dados);
    renderizarListaLegislacao(dados);
  });
}

function preencherDropdownDocumentos(dados) {
  const select = document.getElementById('filtroDocumentoId');
  if (!select) return;
  // Mantém a primeira opção (placeholder) e remove as demais
  while (select.options.length > 1) select.remove(1);
  if (Array.isArray(dados)) {
    dados.forEach(item => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}`;
      select.appendChild(option);
    });
  }
}

function renderizarListaLegislacao(lista) {
  const container = document.getElementById('listaLegislacaoContainer');
  container.innerHTML = '';

  if (!Array.isArray(lista) || lista.length === 0) {
    container.innerHTML = '<p>Nenhum documento encontrado.</p>';
    return;
  }

  // 🔥 Conjunto de IDs que foram revogados (para indicador visual)
  const idsRevogados = new Set();
  lista.forEach(item => {
    if (item.vinculosDetalhes) {
      item.vinculosDetalhes.forEach(v => {
        if (v.tipoVinculo === 'revoga') {
          idsRevogados.add(v.id);
        }
      });
    }
  });

  const emailsPermitidos = ['eder.ramos@educador.edu.es.gov.br', 'ecramos@sedu.es.gov.br'];
  const podeGerenciar = emailsPermitidos.includes(emailUsuario);

  lista.forEach(item => {
  const div = document.createElement('div');
  
  // 🔍 Verifica se o item corresponde ao termo buscado (último termo usado)
  const termoBuscado = document.getElementById('filtroAssuntoLegislacao')?.value.trim().toLowerCase() || 
                       document.getElementById('filtroPalavrasChaveLegislacao')?.value.trim().toLowerCase();
  let destaque = false;
  if (termoBuscado) {
    const textoItem = `${item.tipo} ${item.numero}/${item.ano} ${item.assunto} ${item.palavrasChave || ''}`.toLowerCase();
    destaque = textoItem.includes(termoBuscado);
  }
  
  div.className = 'usuario-card' + (destaque ? ' legislacao-destaque' : '');

    // Estilo especial se revogado
    if (idsRevogados.has(item.id)) {
      div.style.borderLeft = '4px solid #ef4444';
      div.style.opacity = '0.85';
      div.style.background = '#fef2f2';
    }

    const viewUrl = item.arquivoId ? `https://drive.google.com/file/d/${item.arquivoId}/view` : '';
    const downloadUrl = item.arquivoId ? `https://drive.google.com/uc?export=download&id=${item.arquivoId}` : '';

    // Monta links de vínculos
    let vinculosHtml = '';
    if (item.vinculosDetalhes && item.vinculosDetalhes.length > 0) {
      const links = item.vinculosDetalhes.map(v => 
        `<span onclick="event.stopPropagation(); abrirDetalheLegislacao('${v.id}')" 
               title="${v.tipoVinculo}" 
               style="cursor:pointer; color:#2563eb; text-decoration:underline; margin-right:8px;">
           ${v.tipo} ${v.numero}/${v.ano} (${v.tipoVinculo})
         </span>`
      ).join('|');
      vinculosHtml = `<div class="legislacao-vinculos">Vinculado a: ${links}</div>`;
    }

    // Badge de revogado
    const badgeRevogado = idsRevogados.has(item.id) ? 
      '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:12px;font-size:11px;margin-left:8px;">Revogado</span>' : '';

    // Botões de ação
    const botaoEditar = podeGerenciar ? 
      `<button class="btn-pequeno" onclick="event.stopPropagation(); abrirEdicaoLegislacao('${item.id}')" style="margin-left:4px;">
        <i class="fas fa-edit"></i> Editar
      </button>` : '';

    const botaoExcluir = podeGerenciar ? 
      `<button class="btn-pequeno" onclick="event.stopPropagation(); excluirLegislacaoItem('${item.id}')" style="background:#ef4444;color:white;margin-left:4px;">
        <i class="fas fa-trash"></i> Excluir
      </button>` : '';

    div.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-file-contract"></i></div>
      <div class="usuario-info">
        <strong>${item.tipo} ${item.numero}/${item.ano}${badgeRevogado}</strong>
        <p>${item.assunto || 'Sem assunto'}</p>
        <p style="font-size:12px;">
          <i class="fas fa-calendar-alt"></i> ${item.dataPublicacao ? new Date(item.dataPublicacao).toLocaleDateString('pt-BR') : '—'}
        </p>
        ${vinculosHtml}
        <div style="margin-top:8px;">
          ${viewUrl ? `<a href="${viewUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-eye"></i> Visualizar</a>` : ''}
          ${downloadUrl ? `<a href="${downloadUrl}" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>` : ''}
          <button class="btn-pequeno" onclick="event.stopPropagation(); abrirDetalheLegislacao('${item.id}')">
            <i class="fas fa-info-circle"></i> Detalhes
          </button>
          <button class="btn-pequeno" onclick="event.stopPropagation(); compartilharLegislacao({
              tipo: '${String(item.tipo || '').replace(/'/g, "\\'")}',
              numero: '${String(item.numero || '').replace(/'/g, "\\'")}',
              ano: '${item.ano || ''}',
              assunto: '${String(item.assunto || '').replace(/'/g, "\\'")}',
              arquivoId: '${item.arquivoId || ''}'
            })" style="background:#4CAF50;color:white;">
              <i class="fas fa-share-alt"></i> Compartilhar
          </button>
          ${botaoEditar}
          ${botaoExcluir}
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function abrirDetalheLegislacao(id) {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=legislacaoPorId&email=${emailUsuario}&id=${encodeURIComponent(id)}`, function(item) {
    esconderLoading();
    if (!item) {
      mostrarToast('Documento não encontrado.', 'warning');
      return;
    }

    let vinculosHtml = '';
    if (item.vinculosDetalhes && item.vinculosDetalhes.length > 0) {
      vinculosHtml = '<h4>Vínculos:</h4><ul>';
      item.vinculosDetalhes.forEach(v => {
        vinculosHtml += `<li><a href="#" onclick="abrirDetalheLegislacao('${v.id}')">${v.tipo} ${v.numero}/${v.ano} (${v.tipoVinculo})</a></li>`;
      });
      vinculosHtml += '</ul>';
    }

    const viewUrl = item.arquivoId ? `https://drive.google.com/file/d/${item.arquivoId}/view` : '';
    const downloadUrl = item.arquivoId ? `https://drive.google.com/uc?export=download&id=${item.arquivoId}` : '';

    const conteudo = `
      <div style="background:var(--card-bg); padding:16px; border-radius:12px; border:1px solid var(--card-border); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <h3 style="margin:0;">${item.tipo} ${item.numero}/${item.ano}</h3>
          <button onclick="fecharDetalheLegislacao()" style="background:none; border:none; font-size:20px; cursor:pointer; color:var(--text-muted); padding:4px;" title="Fechar">✕</button>
        </div>
        <p><strong>Assunto:</strong> ${item.assunto || '—'}</p>
        <p><strong>Publicação:</strong> ${item.dataPublicacao ? new Date(item.dataPublicacao).toLocaleDateString('pt-BR') : '—'}</p>
        ${vinculosHtml}
        <div style="margin-top:12px;">
          ${viewUrl ? `<a href="${viewUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-eye"></i> Visualizar PDF</a>` : ''}
          ${downloadUrl ? `<a href="${downloadUrl}" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>` : ''}
        </div>
      </div>
    `;

    let detalheContainer = document.getElementById('detalheLegislacaoContainer');
    if (!detalheContainer) {
      detalheContainer = document.createElement('div');
      detalheContainer.id = 'detalheLegislacaoContainer';
      document.getElementById('abaConsultaLegislacao').appendChild(detalheContainer);
    }
     detalheContainer.innerHTML = conteudo;
    // Rola suavemente até o detalhe
    setTimeout(() => {
      detalheContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 200);
  });
}

function fecharDetalheLegislacao() {
  const container = document.getElementById('detalheLegislacaoContainer');
  if (container) {
    container.innerHTML = '';
  }
}

// Função auxiliar para buscar um documento vinculado específico
function buscarLegislacaoPorId(id) {
  // Por enquanto, apenas exibe o ID. Futuramente pode abrir um modal detalhado.
  mostrarToast(`Documento vinculado: ${id}`, 'info');
}
// =========================
// VÍNCULOS (MODIFICADO PARA USAR DROPDOWN NO CADASTRO)
// =========================

// Preenche o dropdown de vínculos ao abrir a aba de cadastro
function carregarDocumentosParaVinculacao() {
  const select = document.getElementById('selectVinculo');
  const inputBusca = document.getElementById('buscaVinculo');
  if (!select) return;

  // Inicializa lista global para o filtro
  window.legislacoesParaVinculo = [];

  select.innerHTML = '<option value="">Selecionar...</option>';
  const url = `${API_URL}?tipo=legislacao&email=${emailUsuario}`;
  jsonp(url, function(dados) {
    if (Array.isArray(dados)) {
      window.legislacoesParaVinculo = dados; // guarda os dados originais
      // Preenche o select com todos os itens
      dados.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        const textoCompleto = `${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}`;
        option.textContent = truncarTexto(textoCompleto, 100); // Limita a 60 caracteres
        // Armazena o texto completo como atributo (opcional, para referência)
        option.setAttribute('data-fulltext', textoCompleto);
        select.appendChild(option);
      });
    }
    // Se houver texto no campo de busca, aplica o filtro imediatamente
    if (inputBusca && inputBusca.value.trim()) {
      filtrarSelectVinculacao(inputBusca.value, 'selectVinculo', window.legislacoesParaVinculo);
    }
  });
}

// Adiciona o vínculo selecionado no dropdown
function adicionarVinculoDoSelect() {
  const select = document.getElementById('selectVinculo');
  const idDestino = select.value;
  if (!idDestino) return;
  const texto = select.options[select.selectedIndex].text;
  adicionarVinculo(idDestino, texto);
  select.value = '';
}

// Modifica adicionarVinculo para aceitar um texto descritivo
function adicionarVinculo(idDestino, texto = null) {
  if (vinculosSelecionados.find(v => v.idDestino === idDestino)) {
    mostrarToast('Documento já vinculado.', 'warning');
    return;
  }
  vinculosSelecionados.push({ idDestino, tipoVinculo: 'revoga', texto });
  renderizarVinculosAdicionados();
}

function removerVinculo(index) {
  vinculosSelecionados.splice(index, 1);
  renderizarVinculosAdicionados();
}

function alterarTipoVinculo(index, novoTipo) {
  vinculosSelecionados[index].tipoVinculo = novoTipo;
}

function renderizarVinculosAdicionados() {
  const container = document.getElementById('vinculosAdicionados');
  if (vinculosSelecionados.length === 0) {
    container.innerHTML = '<p style="font-size:13px; color:var(--text-muted);">Nenhum vínculo adicionado.</p>';
    return;
  }

  let html = '<div style="display:flex; flex-direction:column; gap:6px;">';
  vinculosSelecionados.forEach((v, i) => {
    html += `
      <div style="display:flex; align-items:center; gap:8px; background:var(--card-border); padding:6px 10px; border-radius:8px;">
        <span style="flex:1; font-size:13px;">${v.texto || v.idDestino}</span>
        <select onchange="alterarTipoVinculo(${i}, this.value)" style="width:140px; font-size:12px; padding:2px 4px;">
          <option value="revoga" ${v.tipoVinculo==='revoga'?'selected':''}>Revoga</option>
          <option value="altera" ${v.tipoVinculo==='altera'?'selected':''}>Altera</option>
          <option value="retifica" ${v.tipoVinculo==='retifica'?'selected':''}>Retifica</option>
          <option value="acrescenta" ${v.tipoVinculo==='acrescenta'?'selected':''}>Complementa</option>
          <option value="reorganiza" ${v.tipoVinculo==='reorganiza'?'selected':''}>Reorganiza</option>
          <option value="ver também" ${v.tipoVinculo==='ver também'?'selected':''}>Ver também</option>
        </select>
        <button type="button" class="btn-icone" onclick="removerVinculo(${i})" style="color:#ef4444;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}
function excluirLegislacaoItem(id) {
  if (!confirm('Deseja realmente excluir este documento? Esta ação não pode ser desfeita.')) return;

  const dados = {
    acao: 'excluirLegislacao',
    email: emailUsuario,
    id: id
  };

  postSemResposta(dados, 'Documento excluído!', () => {
    // Recarrega a consulta após a exclusão
    if (document.getElementById('abaConsultaLegislacao').style.display !== 'none') {
      buscarLegislacao();
    }
  });
}
let legislacaoEditandoId = null;

function abrirEdicaoLegislacao(id) {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=legislacaoPorId&email=${emailUsuario}&id=${encodeURIComponent(id)}`, function(item) {
    esconderLoading();
    if (!item) {
      mostrarToast('Documento não encontrado.', 'warning');
      return;
    }
    legislacaoEditandoId = item.id;
    document.getElementById('editTipoLegislacao').value = item.tipo || '';
    document.getElementById('editNumeroLegislacao').value = item.numero || '';
    document.getElementById('editAnoLegislacao').value = item.ano || '';
    document.getElementById('editAssuntoLegislacao').value = item.assunto || '';
    document.getElementById('editDataPublicacaoLegislacao').value = item.dataPublicacao ? item.dataPublicacao.split('T')[0] : '';
    document.getElementById('editObservacoesLegislacao').value = item.observacoes || '';
    document.getElementById('editPalavrasChaveLegislacao').value = item.palavrasChave || '';
    document.getElementById('editArquivoLegislacao').value = '';

    // 🔥 Inicializa vínculos da edição com os dados existentes
    vinculosEdicaoSelecionados = [];
    if (item.vinculosDetalhes && item.vinculosDetalhes.length > 0) {
      item.vinculosDetalhes.forEach(v => {
        vinculosEdicaoSelecionados.push({
          idDestino: v.id,
          tipoVinculo: v.tipoVinculo || 'revoga',
          texto: `${v.tipo} ${v.numero}/${v.ano} - ${v.assunto || 'Sem assunto'}`
        });
      });
    }
    renderizarVinculosEdicaoAdicionados();
    carregarDocumentosParaVinculacaoEdicao(); // carrega o dropdown

    document.getElementById('modalEditarLegislacao').style.display = 'flex';
  });
}

function fecharEdicaoLegislacao() {
  document.getElementById('modalEditarLegislacao').style.display = 'none';
  legislacaoEditandoId = null;
  vinculosEdicaoSelecionados = [];
  document.getElementById('vinculosEdicaoAdicionados').innerHTML = '';
}

async function salvarEdicaoLegislacao() {
  const tipo = document.getElementById('editTipoLegislacao').value;
  const numero = document.getElementById('editNumeroLegislacao').value.trim();
  const ano = document.getElementById('editAnoLegislacao').value.trim();
  const assunto = document.getElementById('editAssuntoLegislacao').value.trim();
  const dataPublicacao = document.getElementById('editDataPublicacaoLegislacao').value;
  const observacoes = document.getElementById('editObservacoesLegislacao').value.trim();
  const palavrasChave = document.getElementById('editPalavrasChaveLegislacao').value.trim();
  const fileInput = document.getElementById('editArquivoLegislacao');
  const file = fileInput.files[0];

  if (!tipo || !numero || !ano) {
    mostrarToast('Tipo, número e ano são obrigatórios.', 'warning');
    return;
  }

  const btnSalvar = document.querySelector('#modalEditarLegislacao .btn-salvar');
  showButtonLoading(btnSalvar);

  let fileBase64 = null, fileName = null, mimeType = null;

  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      mostrarToast('Arquivo muito grande. Máximo 10 MB.', 'warning');
      hideButtonLoading(btnSalvar);
      return;
    }
    const extensao = file.name.split('.').pop();
    fileName = `${tipo} ${numero}/${ano} - ${assunto}.${extensao}`;
    mimeType = file.type;
    fileBase64 = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
  }

  const dados = {
    acao: 'editarLegislacao',
    email: emailUsuario,
    id: legislacaoEditandoId,
    tipo: tipo,
    numero: numero,
    ano: ano,
    assunto: assunto,
    dataPublicacao: dataPublicacao,
    observacoes: observacoes,
    palavrasChave: palavrasChave,
    fileName: fileName,
    mimeType: mimeType,
    vinculos: vinculosEdicaoSelecionados,
    fileBase64: fileBase64
  };

  postSemResposta(dados, 'Documento atualizado!', () => {
    hideButtonLoading(btnSalvar);
    fecharEdicaoLegislacao();
    // Atualiza a lista se a aba de consulta estiver aberta
    if (document.getElementById('abaConsultaLegislacao').style.display !== 'none') {
      buscarLegislacao();
    }
  });
}
// Preenche o dropdown de vínculos do modal de edição
function carregarDocumentosParaVinculacaoEdicao() {
  const select = document.getElementById('selectEditVinculo');
  const inputBusca = document.getElementById('buscaEditVinculo');
  if (!select) return;

  // Inicializa lista global para o filtro
  window.legislacoesParaEdicao = [];

  select.innerHTML = '<option value="">Selecionar documento...</option>';
  const url = `${API_URL}?tipo=legislacao&email=${emailUsuario}`;
  jsonp(url, function(dados) {
    if (Array.isArray(dados)) {
      window.legislacoesParaEdicao = dados;
      dados.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        const textoCompleto = `${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}`;
        option.textContent = truncarTexto(textoCompleto, 100);
        option.setAttribute('data-fulltext', textoCompleto);
        select.appendChild(option);
      });
    }
    if (inputBusca && inputBusca.value.trim()) {
      filtrarSelectVinculacao(inputBusca.value, 'selectEditVinculo', window.legislacoesParaEdicao);
    }
  });
}

function filtrarSelectVinculacao(termo, selectId, lista) {
  const select = document.getElementById(selectId);
  if (!select || !lista) return;

  const termoLower = termo.trim().toLowerCase();

  // Mantém a opção padrão
  let html = '<option value="">Selecionar documento...</option>';
  const filtrados = termoLower === '' ? lista : lista.filter(item => {
    const texto = `${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}`.toLowerCase();
    return texto.includes(termoLower);
  });

  filtrados.forEach(item => {
    html += `<option value="${item.id}">${item.tipo} ${item.numero}/${item.ano} - ${item.assunto}</option>`;
  });

  select.innerHTML = html;
}

// Adiciona o vínculo selecionado no dropdown da edição
function adicionarVinculoEdicaoDoSelect() {
  const select = document.getElementById('selectEditVinculo');
  const idDestino = select.value;
  if (!idDestino) return;
  const texto = select.options[select.selectedIndex].text;
  adicionarVinculoEdicao(idDestino, texto);
  select.value = '';
}

function adicionarVinculoEdicao(idDestino, texto = null) {
  if (vinculosEdicaoSelecionados.find(v => v.idDestino === idDestino)) {
    mostrarToast('Documento já vinculado.', 'warning');
    return;
  }
  vinculosEdicaoSelecionados.push({ idDestino, tipoVinculo: 'revoga', texto });
  renderizarVinculosEdicaoAdicionados();
}

function removerVinculoEdicao(index) {
  vinculosEdicaoSelecionados.splice(index, 1);
  renderizarVinculosEdicaoAdicionados();
}

function alterarTipoVinculoEdicao(index, novoTipo) {
  vinculosEdicaoSelecionados[index].tipoVinculo = novoTipo;
}

function renderizarVinculosEdicaoAdicionados() {
  const container = document.getElementById('vinculosEdicaoAdicionados');
  if (vinculosEdicaoSelecionados.length === 0) {
    container.innerHTML = '<p style="font-size:13px; color:var(--text-muted);">Nenhum vínculo.</p>';
    return;
  }

  let html = '<div style="display:flex; flex-direction:column; gap:6px;">';
  vinculosEdicaoSelecionados.forEach((v, i) => {
    html += `
      <div style="display:flex; align-items:center; gap:8px; background:var(--card-border); padding:6px 10px; border-radius:8px;">
        <span style="flex:1; font-size:13px;">${v.texto || v.idDestino}</span>
        <select onchange="alterarTipoVinculoEdicao(${i}, this.value)" style="width:140px; font-size:12px; padding:2px 4px;">
          <option value="revoga" ${v.tipoVinculo==='revoga'?'selected':''}>Revoga</option>
          <option value="altera" ${v.tipoVinculo==='altera'?'selected':''}>Altera</option>
          <option value="retifica" ${v.tipoVinculo==='retifica'?'selected':''}>Retifica</option>
          <option value="acrescenta" ${v.tipoVinculo==='acrescenta'?'selected':''}>Complementa</option>
          <option value="reorganiza" ${v.tipoVinculo==='reorganiza'?'selected':''}>Reorganiza</option>
          <option value="ver também" ${v.tipoVinculo==='ver também'?'selected':''}>Ver também</option>
        </select>
        <button type="button" class="btn-icone" onclick="removerVinculoEdicao(${i})" style="color:#ef4444;">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}
// =========================
// MURAL DE COMUNICADOS
// =========================

// =========================
// MURAL DE COMUNICADOS
// =========================

function abrirModalComunicado() {
  document.getElementById('modalComunicado').style.display = 'flex';
  document.getElementById('tituloModalComunicado').innerHTML = '<i class="fas fa-bullhorn"></i> Novo Comunicado';
  document.getElementById('tituloComunicado').value = '';
  document.getElementById('textoComunicado').value = '';
  document.getElementById('prioridadeComunicado').value = 'informativo';
  document.getElementById('dataExpiracaoComunicado').value = '';
  document.getElementById('fixarComunicado').checked = false;

  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('comunicadoEscolaWrapper').style.display = 'block';
    carregarEscolasPermitidasNoSelect('selectEscolaComunicado');
  } else {
    document.getElementById('comunicadoEscolaWrapper').style.display = 'none';
  }
}

function fecharModalComunicado() {
  document.getElementById('modalComunicado').style.display = 'none';
}

function salvarComunicado() {
  const titulo = document.getElementById('tituloComunicado').value.trim();
  const texto = document.getElementById('textoComunicado').value.trim();
  const prioridade = document.getElementById('prioridadeComunicado').value;
  const dataExpiracao = document.getElementById('dataExpiracaoComunicado').value;
  const fixado = document.getElementById('fixarComunicado').checked;
  let escola = '';

  if (perfilUsuario === 'SUPERVISOR') {
    escola = document.getElementById('selectEscolaComunicado').value;
    if (!escola) { mostrarToast('Selecione a escola.', 'warning'); return; }
  } else {
    escola = escolaUsuario;
  }

  if (!titulo || !texto) {
    mostrarToast('Título e texto são obrigatórios.', 'warning');
    return;
  }

  if (dataExpiracao) {
    const dataExp = new Date(dataExpiracao);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataExp < hoje) {
      mostrarToast('Data de expiração não pode ser anterior à data atual.', 'warning');
      return;
    }
  }

  // 🔄 Indicador de carregamento no botão "Publicar"
  const btnPublicar = document.querySelector('#modalComunicado .btn-salvar');
  showButtonLoading(btnPublicar);

  const dados = {
    acao: 'salvarComunicado',
    email: emailUsuario,
    escola: escola,
    titulo: titulo,
    texto: texto,
    prioridade: prioridade,
    fixado: fixado,
    dataExpiracao: dataExpiracao
  };

  postSemResposta(dados, 'Comunicado publicado!', () => {
    hideButtonLoading(btnPublicar);
    fecharModalComunicado();
    carregarComunicados();
  });
}

function carregarComunicados() {
  const mural = document.getElementById('muralComunicados');
  const container = document.getElementById('muralCards');
  const btnNovo = document.getElementById('btnNovoComunicado');

  // 🔥 O mural fica sempre visível para supervisores e secretarias
  const podePublicar = (perfilUsuario === 'SUPERVISOR' || perfilUsuario === 'SECRETARIA');
  if (mural) mural.style.display = podePublicar ? 'block' : 'none';

  if (btnNovo) {
    btnNovo.style.display = podePublicar ? 'inline-block' : 'none';
  }

  const url = `${API_URL}?tipo=comunicados&email=${emailUsuario}&escola=${encodeURIComponent(escolaUsuario)}`;
  jsonp(url, function(dados) {
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(dados) || dados.length === 0) {
      container.innerHTML = `<p style="text-align:center; color:var(--text-muted); padding:16px;">
        Nenhum comunicado no momento.
      </p>`;
      // Recolhe o mural automaticamente
      const cards = document.getElementById('muralCards');
      const btn = document.getElementById('btnToggleMural');
      if (cards) cards.style.display = 'none';
      if (btn) btn.innerHTML = '<i class="fas fa-chevron-down"></i> Expandir';
      return;
    }

    // Cria os cards (código já existente)
    const cores = { urgente: '#ef4444', importante: '#f59e0b', informativo: '#3b82f6' };
    const icones = { urgente: '⚠️', importante: '⚡', informativo: 'ℹ️' };

    dados.forEach(item => {
      const cor = cores[item.prioridade] || cores.informativo;
      const icone = icones[item.prioridade] || icones.informativo;
            // Verifica se o comunicado já foi lido (registrado no localStorage)
      const chaveLido = 'comunicado_lido_' + item.id;
      const jaFoiLido = localStorage.getItem(chaveLido) === 'true';
      
      // Exibe o badge "NOVO" apenas para comunicados ainda não lidos
      const badgeNovo = !jaFoiLido ? '<span class="badge-novo">NOVO</span>' : '';
      const badgeFixado = item.fixado ? '📌' : '';

      const card = document.createElement('div');
      card.style.cssText = `
        min-width:260px; max-width:300px; background:var(--card-bg); border-left:4px solid ${cor};
        border-radius:12px; padding:12px; box-shadow:0 2px 8px rgba(0,0,0,0.06); flex-shrink:0;
        cursor:pointer; transition:all 0.2s;
      `;
      card.onmouseenter = () => card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      card.onmouseleave = () => card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';

      // Variável de controle de expansão
      let expandido = false;
      const textoOriginal = item.texto;
      const textoCurto = textoOriginal.length > 150 ? textoOriginal.substring(0, 150) + '...' : textoOriginal;
      const textoLinkificado = linkificar(textoOriginal);

      // Renderiza inicialmente com texto truncado
      const atualizarCard = () => {
        card.querySelector('.texto-comunicado').innerHTML = expandido ? textoLinkificado : textoCurto;
        card.querySelector('.texto-comunicado').style.display = '-webkit-box';
        card.querySelector('.texto-comunicado').style.webkitLineClamp = expandido ? 'unset' : '2';
        card.querySelector('.texto-comunicado').style.webkitBoxOrient = 'vertical';
        card.querySelector('.texto-comunicado').style.overflow = expandido ? 'visible' : 'hidden';
      };

            card.onclick = () => {
        // Marca como lido no localStorage quando o card é clicado
        if (!jaFoiLido) {
          localStorage.setItem(chaveLido, 'true');
          // Atualiza o card para remover o badge imediatamente
          const badge = card.querySelector('.badge-novo');
          if (badge) badge.remove();
        }
        expandido = !expandido;
        atualizarCard();
      };

      const botaoExcluir = (item.criador === emailUsuario) ? 
        `<button class="btn-icone" onclick="event.stopPropagation(); excluirComunicadoItem('${item.id}')" 
                style="color:#ef4444; font-size:12px; padding:2px 4px;" title="Excluir">✕</button>` 
        : '';

      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
          <span style="font-size:20px;">${icone}</span>
          <strong style="font-size:14px; color:var(--text-primary);">${badgeFixado} ${item.titulo}</strong>
          ${badgeNovo}
        </div>
        <p class="texto-comunicado" style="font-size:13px; color:var(--text-secondary); margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
          ${textoCurto}
        </p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <span style="font-size:11px; color:var(--text-muted);">
            <i class="fas fa-school"></i> ${item.escola} · ${new Date(item.dataInicio).toLocaleDateString('pt-BR')}
          </span>
          ${botaoExcluir}
        </div>
      `;
      container.appendChild(card);
    });
  });
}

// Função para recolher/expandir o mural (botão “Recolher”)
function toggleMural() {
  const cards = document.getElementById('muralCards');
  const btn = document.getElementById('btnToggleMural');
  if (cards.style.display === 'none') {
    cards.style.display = 'flex';
    btn.innerHTML = '<i class="fas fa-chevron-up"></i> Recolher';
  } else {
    cards.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-chevron-down"></i> Expandir';
  }
}
function excluirComunicadoItem(id) {
  if (!confirm('Deseja excluir este comunicado?')) return;

  postSemResposta({ acao: 'excluirComunicado', email: emailUsuario, id: id }, 'Excluído!', () => {
    carregarComunicados();
  });
}
function linkificar(texto) {
  if (!texto) return '';
  // Regex para detectar URLs com http/https
  const urlPattern = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  return texto.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}
let debounceTimer;

function buscarGlobalComDebounce() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => buscarGlobalmente(), 300);
}

function buscarGlobalmente() {
  const termo = document.getElementById('inputBuscaGlobal').value.trim();
  const dropdown = document.getElementById('dropdownBuscaGlobal');
  if (!dropdown) return;

  if (termo.length < 2) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
    return;
  }

  mostrarLoading();
  const url = `${API_URL}?tipo=buscaGlobal&email=${encodeURIComponent(emailUsuario)}&termo=${encodeURIComponent(termo)}`;
  jsonp(url, function(dados) {
    esconderLoading();
    renderizarDropdownBusca(dados);
  });
}

function renderizarDropdownBusca(resultados) {
  const dropdown = document.getElementById('dropdownBuscaGlobal');
  if (!dropdown) return;

  if (!Array.isArray(resultados) || resultados.length === 0) {
    dropdown.innerHTML = '<p style="padding:12px; color:var(--text-muted);">Nenhum resultado encontrado.</p>';
    dropdown.style.display = 'block';
    return;
  }

  const grupos = {};
  resultados.forEach(item => {
    if (!grupos[item.tipo]) grupos[item.tipo] = [];
    grupos[item.tipo].push(item);
  });

  const icones = {
    'Aluno': 'fa-user-graduate',
    'Legislação': 'fa-balance-scale',
    'Comunicado': 'fa-bullhorn',
    'Processo': 'fa-folder',
    'Ata': 'fa-file-alt'
  };

  let html = '';
  for (const tipo in grupos) {
    const icone = icones[tipo] || 'fa-search';
    html += `<div class="grupo-busca">
      <div class="grupo-titulo"><i class="fas ${icone}"></i> ${tipo}</div>`;
    grupos[tipo].forEach(item => {
      // Armazena o aluno no cache, se disponível
      if (item.aluno) {
        cacheAlunosBusca[item.link] = item.aluno;
      }
      html += `
        <div class="item-busca" onmousedown="event.preventDefault(); abrirResultadoBusca('${item.link.replace(/'/g, "\\'")}'); fecharDropdownBusca()">
          <i class="fas ${icone}"></i>
          <div>
            <strong>${item.titulo}</strong>
            <p style="font-size:12px; color:var(--text-muted); margin:0;">${item.descricao || ''}</p>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  dropdown.innerHTML = html;
  dropdown.style.display = 'block';
}

function fecharDropdownBusca() {
  const dropdown = document.getElementById('dropdownBuscaGlobal');
  if (dropdown) {
    dropdown.style.display = 'none';
    dropdown.innerHTML = '';
  }
}

function abrirResultadoBusca(link) {
  if (!link) return;
  const index = link.indexOf('_');
  const prefixo = index !== -1 ? link.substring(0, index) : link;
  const id = index !== -1 ? link.substring(index + 1) : '';
  // Fecha o dropdown imediatamente
  fecharDropdownBusca();
  
  switch (prefixo) {
    case 'aluno':
      const alunoCache = cacheAlunosBusca[link];
      if (alunoCache) {
        abrirModalDetalhes(alunoCache);
      } else {
        // fallback: tenta encontrar nos dados globais (para retrocompatibilidade)
        abrirAluno(id);
      }
      break;
    case 'legislacao':
      // Fecha o dropdown do buscador global
      fecharDropdownBusca();
      
      // Obtém o termo que foi digitado no campo de busca global
      const termo = document.getElementById('inputBuscaGlobal').value.trim();
      
      // Abre o modal de Legislação
      abrirModalLegislacao();
      
      // Garante que estamos na aba "Consultar"
      mostrarAbaConsultaLegislacao();
      
      // Preenche o campo de busca com o termo pesquisado (usamos o campo "Buscar por assunto...")
      const campoBusca = document.getElementById('filtroAssuntoLegislacao');
      if (campoBusca) {
        campoBusca.value = termo;
      }
      
      // Dispara a busca (que agora vai destacar os itens)
      setTimeout(() => {
        buscarLegislacao();
        // Se quiser abrir o detalhe do item específico, descomente a linha abaixo:
        // abrirDetalheLegislacao(id);
      }, 500); // pequeno atraso para garantir que o modal foi renderizado
      break;
    case 'comunicado':
      abrirModalComunicado();
      break;
    case 'processo':
      abrirModalProcessos();
      break;
    case 'ata':
      abrirModalAtas();
      break;
    default:
      break;
  }
}

function atualizarCampoNomeTitular() {
  const tipoSelecionado = document.getElementById("uploadTipoDoc").value;
  const campoNome = document.getElementById("campoNomeTitular");
  if (tiposDocumentoSemNome.includes(tipoSelecionado)) {
    campoNome.style.display = 'none';
  } else {
    campoNome.style.display = 'block';
  }
}

// Em modals.js, adicionar ou substituir:

function abrirModalMonitoramento() {
  document.body.style.overflow = 'hidden';
  document.getElementById('modalMonitoramento').style.display = 'flex';
  preencherSelectEscolaMonitoramento();
  mostrarAbaMonitoramento('nova');
}

function fecharModalMonitoramento() {
  document.body.style.overflow = '';
  document.getElementById('modalMonitoramento').style.display = 'none';
}

function mostrarAbaMonitoramento(aba) {
  const novaAba = document.getElementById('novaVisitaAba');
  const histAba = document.getElementById('historicoVisitasAba');
  if (aba === 'nova') {
    novaAba.style.display = 'block';
    histAba.style.display = 'none';
    if (document.getElementById('monitoramentoEscola').value) renderizarChecklist();
  } else {
    novaAba.style.display = 'none';
    histAba.style.display = 'block';
    carregarListaVisitas();
  }
}
function toggleListaAlunosMobile() {
  const ativo = document.body.classList.toggle('lista-mobile-ativa');
  const lista = document.getElementById('lista');
  const paginacao = document.getElementById('paginacao');
  const filtros = document.querySelector('.filtros-container');
  const dockItem = document.getElementById('dockToggleAlunos');

  if (ativo) {
    if (dockItem) {
      dockItem.querySelector('i').className = 'fas fa-times';
      dockItem.querySelector('span').textContent = 'Ocultar';
    }
    if (lista) lista.style.display = '';
    if (paginacao) paginacao.style.display = '';
    if (filtros) filtros.style.display = '';
    if (typeof carregarAlunos === 'function' && (!dadosGlobais || dadosGlobais.length === 0)) {
      carregarAlunos();
    }
  } else {
    if (dockItem) {
      dockItem.querySelector('i').className = 'fas fa-users';
      dockItem.querySelector('span').textContent = 'Alunos';
    }
    if (lista) lista.style.display = 'none';
    if (paginacao) paginacao.style.display = 'none';
    if (filtros) filtros.style.display = 'none';
  }
}

function aplicarEstadoInicialMobile() {
  if (window.innerWidth <= 600) {
    const lista = document.getElementById('lista');
    const paginacao = document.getElementById('paginacao');
    const filtros = document.querySelector('.filtros-container');
    if (lista) lista.style.display = 'none';
    if (paginacao) paginacao.style.display = 'none';
    if (filtros) filtros.style.display = 'none';
  }
}
function abrirModalExportacaoAtos() {
  document.getElementById('modalExportacaoAtos').style.display = 'flex';
  preencherSelectEscolaExportAto();
  preencherCursoEtapaExport();
}

function fecharModalExportacaoAtos() {
  document.getElementById('modalExportacaoAtos').style.display = 'none';
}

function preencherSelectEscolaExportAto() {
  const select = document.getElementById('exportAtoEscola');
  select.innerHTML = '<option value="">Selecione a escola</option>';
  const escolas = getEscolasPermitidas();
  escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
}

function preencherCursoEtapaExport() {
  const select = document.getElementById('exportAtoCursoEtapa');
  select.innerHTML = '<option value="">Todos os cursos/etapas</option>';
  CURSOS_ETAPAS.forEach(curso => select.appendChild(new Option(curso, curso)));
}

function atualizarCursoTecnicoExport() {
  const cursoEtapa = document.getElementById('exportAtoCursoEtapa').value;
  const wrapper = document.getElementById('exportCursoTecnicoWrapper');
  if (cursoEtapa && cursoEtapa.toUpperCase().includes('EDUCAÇÃO PROFISSIONAL')) {
    wrapper.style.display = 'block';
    preencherCursosTecnicosExport(cursoEtapa);
  } else {
    wrapper.style.display = 'none';
  }
}

function preencherCursosTecnicosExport(cursoEtapa) {
  const select = document.getElementById('exportAtoCursoTecnico');
  select.innerHTML = '<option value="">Todos os cursos técnicos</option>';
  Object.keys(CURSOS_TECNICOS).forEach(nomeCurso => {
    if (CURSOS_TECNICOS[nomeCurso].includes(cursoEtapa)) {
      select.appendChild(new Option(nomeCurso, nomeCurso));
    }
  });
}

function exportarRelatorioAtos() {
  const escola = document.getElementById('exportAtoEscola').value;
  const cursoEtapa = document.getElementById('exportAtoCursoEtapa').value;
  const cursoTecnico = document.getElementById('exportAtoCursoTecnico')?.value || '';

  if (!escola) {
    mostrarToast('Selecione a escola.', 'warning');
    return;
  }

  mostrarLoading();
  let url = `${API_URL}?tipo=atos&email=${emailUsuario}`;
  url += `&filtroEscola=${encodeURIComponent(escola)}`;
  if (cursoEtapa) url += `&cursoEtapa=${encodeURIComponent(cursoEtapa)}`;
  if (cursoTecnico) url += `&cursoTecnico=${encodeURIComponent(cursoTecnico)}`;

  jsonp(url, function(atos) {
    esconderLoading();
    if (!atos.length) {
      mostrarToast('Nenhum ato encontrado para os filtros selecionados.', 'warning');
      return;
    }

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Atos Autorizativos</title>`;
    html += `<style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #333; }
      h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
      .info { margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1e3a8a; color: white; padding: 8px; }
      td { padding: 8px; border: 1px solid #ccc; }
      @page { size: A4; margin: 15mm; }
    </style></head><body>`;
    html += `<h1>Relatório de Atos Autorizativos</h1>`;
    html += `<p><strong>Escola:</strong> ${escola}</p>`;
    if (cursoEtapa) html += `<p><strong>Curso/Etapa:</strong> ${cursoEtapa}</p>`;
    if (cursoTecnico) html += `<p><strong>Curso Técnico:</strong> ${cursoTecnico}</p>`;
    html += `<p><strong>Data de emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>`;
    html += `<table><thead><tr><th>Tipo</th><th>Número</th><th>Curso/Etapa</th><th>Curso Técnico</th><th>Fundação Legal</th><th>Publicação</th><th>Validade</th><th>Status</th></tr></thead><tbody>`;
    atos.forEach(ato => {
      html += `<tr>
        <td>${ato.tipoAto}</td>
        <td>${ato.numeroAto}</td>
        <td>${ato.cursoEtapa}</td>
        <td>${ato.cursoTecnico || '—'}</td>
        <td>${ato.fundamentacao || '—'}</td>
        <td>${new Date(ato.dataPublicacao).toLocaleDateString('pt-BR')}</td>
        <td>${ato.validadeAnos} anos</td>
        <td>${ato.status}</td>
      </tr>`;
    });
    html += `</tbody></table></body></html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => printWindow.print();
  });
}
function atualizarVisibilidadeCurso() {
  const tipoAto = document.getElementById('atoTipo').value;
  const isAtoCurso = tipoAto === 'Ato de curso (criação)' || tipoAto === 'Ato de curso (aprovação/renovação)';
  
  const cursoEtapaField = document.getElementById('atoCursoEtapa').closest('.input-icon');
  const fundamentacaoWrapper = document.getElementById('fundamentacaoWrapper');
  const cursoTecnicoWrapper = document.getElementById('cursoTecnicoWrapper');
  
  if (isAtoCurso) {
    cursoEtapaField.style.display = 'block';
    atualizarFundamentacoes(); // preenche fundamentações baseado no curso já selecionado
  } else {
    cursoEtapaField.style.display = 'none';
    fundamentacaoWrapper.style.display = 'none';
    cursoTecnicoWrapper.style.display = 'none';
    // Limpa valores
    document.getElementById('atoCursoEtapa').value = '';
    document.getElementById('atoFundamentacao').value = '';
    document.getElementById('atoCursoTecnico').value = '';
  }
}
function abrirModalLegalizacao() {
  document.getElementById("modalLegalizacao").style.display = "flex";
  carregarEscolasParaFiltroAto();
  carregarAtos();
  ativarEnterNoModal('#modalLegalizacao', carregarAtos);
}
function fecharModalLegalizacao() {
  document.body.classList.remove('modal-fullscreen-aberto');
  document.getElementById('modalLegalizacao').style.display = 'none';
  atosSelecionados.clear();
  document.getElementById('btnExportarSelecionados').style.display = 'none';
}

function exportarAtosSelecionados() {
  if (atosSelecionados.size === 0) {
    mostrarToast('Nenhum ato selecionado.', 'warning');
    return;
  }

  // Filtra os atos globais pelos IDs selecionados
  const atos = atosGlobais.filter(ato => atosSelecionados.has(ato.id));
  if (atos.length === 0) return;

  const isSupervisor = (perfilUsuario === 'SUPERVISOR');

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Atos Autorizativos</title>`;
  html += `<style>
    @page { size: A4 landscape; margin: 15mm; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      margin: 30px;
      color: #333;
    }
    h1 {
      color: #1e3a8a;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 8px;
      font-size: 18px;
    }
    h2 {
      font-size: 14px;
      margin-top: 20px;
      background: #f1f5f9;
      padding: 8px;
      border-left: 4px solid #1e3a8a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th {
      background: #1e3a8a;
      color: white;
      padding: 6px 8px;
      font-size: 11px;
    }
    td {
      padding: 5px 8px;
      border: 1px solid #ccc;
      font-size: 10px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style></head><body>`;

  html += `<h1>Atos Autorizativos – Seleção</h1>`;
  html += `<p>Data: ${new Date().toLocaleDateString('pt-BR')} | Selecionados: ${atos.length}</p>`;

  if (isSupervisor) {
    const porEscola = {};
    atos.forEach(ato => {
      if (!porEscola[ato.escola]) porEscola[ato.escola] = [];
      porEscola[ato.escola].push(ato);
    });
    const escolas = Object.keys(porEscola).sort();
    escolas.forEach(escola => {
      html += `<h2>${escola}</h2>`;
      html += gerarTabelaAtos(porEscola[escola]);
    });
  } else {
    html += gerarTabelaAtos(atos);
  }

  html += `</body></html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
}

function gerarTabelaAtos(atos) {
  let html = `<table><thead><tr>
    <th>Tipo</th><th>Número</th><th>Curso/Etapa</th><th>Curso Técnico</th><th>Fundamentação</th><th>Publicação</th><th>Validade</th><th>Status</th>
  </tr></thead><tbody>`;
  atos.forEach(ato => {
    html += `<tr>
      <td>${ato.tipoAto}</td>
      <td>${ato.numeroAto}</td>
      <td>${ato.cursoEtapa || '—'}</td>
      <td>${ato.cursoTecnico || '—'}</td>
      <td>${ato.fundamentacao || '—'}</td>
      <td>${new Date(ato.dataPublicacao).toLocaleDateString('pt-BR')}</td>
      <td>${ato.validadeAnos} anos</td>
      <td>${ato.status}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  return html;
}
// =========================
// TERMO DE RESPONSABILIDADE
// =========================

function atualizarBotoesTermo(aluno) {
  const termoId = aluno._TERMO_RESP_ID;
  const btnVis = document.getElementById('btnVisualizarTermo');
  const btnRem = document.getElementById('btnRemoverTermo');
  const status = document.getElementById('statusTermoResp');
  if (termoId) {
    if (btnVis) btnVis.style.display = 'inline-block';
    if (btnRem) btnRem.style.display = 'inline-block';
    if (status) status.innerHTML = '<span style="color:#10b981;">✓ Termo anexado</span>';
  } else {
    if (btnVis) btnVis.style.display = 'none';
    if (btnRem) btnRem.style.display = 'none';
    if (status) status.innerHTML = '<span style="color:#ef4444;">✗ Nenhum termo anexado</span>';
  }
}

async function uploadTermoResp(row, escola) {
  const fileInput = document.getElementById('inputTermoResp');
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    mostrarToast("Arquivo muito grande (máx. 5 MB)", "error");
    return;
  }

  const base64 = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  const dados = {
    acao: "uploadTermoResponsabilidade",
    email: emailUsuario,
    row: row,
    escola: escola,
    fileName: file.name,
    mimeType: file.type,
    fileBase64: base64
  };

  postSemResposta(dados, "Termo enviado!", () => {
    // Busca a URL atualizada após 2 segundos
    setTimeout(() => {
      const urlBusca = `${API_URL}?tipo=obterTermoResp&email=${emailUsuario}&escola=${escola}&row=${row}`;
      jsonp(urlBusca, function(resp) {
        const novoId = resp.url ? resp.url.split('/d/')[1].split('/')[0] : null;
        dadosAlunoAtual._TERMO_RESP_ID = novoId;
        atualizarBotoesTermo(dadosAlunoAtual);
      });
    }, 2000);
  });
}

function visualizarTermo() {
  const id = dadosAlunoAtual._TERMO_RESP_ID;
  if (id) window.open(`https://drive.google.com/file/d/${id}/view`, '_blank');
}

function removerTermo(row, escola) {
  if (!confirm("Remover o termo de responsabilidade anexado?")) return;
  const dados = {
    acao: "uploadTermoResponsabilidade",
    email: emailUsuario,
    row: row,
    escola: escola,
    fileBase64: null,
    fileName: null
  };
  postSemResposta(dados, "Termo removido.", () => {
    dadosAlunoAtual._TERMO_RESP_ID = null;
    atualizarBotoesTermo(dadosAlunoAtual);
  });
}
// =========================
// DECLARAÇÃO DE EDUCAÇÃO ESPECIAL
// =========================

function atualizarBotoesDeclEdEsp(aluno) {
  const declId = aluno._DECL_ED_ESPECIAL_ID;
  const temDecl = declId && declId.toString().trim() !== '';
  const btnVis = document.getElementById('btnVisualizarDeclEdEsp');
  const btnRem = document.getElementById('btnRemoverDeclEdEsp');
  const status = document.getElementById('statusDeclEdEsp');

  if (temDecl) {
    if (btnVis) btnVis.style.display = 'inline-block';
    if (btnRem) btnRem.style.display = 'inline-block';
    if (status) status.innerHTML = '<span style="color:#10b981;">✓ Declaração anexada</span>';
  } else {
    if (btnVis) btnVis.style.display = 'none';
    if (btnRem) btnRem.style.display = 'none';
    if (status) status.innerHTML = '<span style="color:#ef4444;">✗ Nenhuma declaração anexada</span>';
  }
}

async function uploadDeclEdEsp(row, escola) {
  const fileInput = document.getElementById('inputDeclEdEsp');
  const file = fileInput.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    mostrarToast("Arquivo muito grande (máx. 5 MB)", "error");
    return;
  }

  const base64 = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  const dados = {
    acao: "uploadDeclaracaoEdEspecial",
    email: emailUsuario,
    row: row,
    escola: escola,
    fileName: file.name,
    mimeType: file.type,
    fileBase64: base64
  };

  postSemResposta(dados, "Declaração enviada!", () => {
    setTimeout(() => {
      const urlBusca = `${API_URL}?tipo=obterDeclEdEspecial&email=${emailUsuario}&escola=${encodeURIComponent(escola)}&row=${row}`;
      jsonp(urlBusca, function(resp) {
        let novoId = null;
        if (resp.url) {
          const partes = resp.url.split('/d/');
          if (partes.length > 1) novoId = partes[1].split('/')[0];
        }
        if (dadosAlunoAtual) {
          dadosAlunoAtual._DECL_ED_ESPECIAL_ID = novoId;
          atualizarBotoesDeclEdEsp(dadosAlunoAtual);
        }
        if (novoId) mostrarToast("Declaração anexada com sucesso!", "success");
        else mostrarToast("Erro ao recuperar o ID. Recarregue a página.", "warning");
      });
    }, 2000);
  });
}

function visualizarDeclEdEsp() {
  const id = dadosAlunoAtual._DECL_ED_ESPECIAL_ID;
  if (id) window.open(`https://drive.google.com/file/d/${id}/view`, '_blank');
}

function removerDeclEdEsp(row, escola) {
  if (!confirm("Remover a declaração de educação especial?")) return;
  const dados = {
    acao: "uploadDeclaracaoEdEspecial",
    email: emailUsuario,
    row: row,
    escola: escola,
    fileBase64: null,
    fileName: null
  };
  postSemResposta(dados, "Declaração removida.", () => {
    dadosAlunoAtual._DECL_ED_ESPECIAL_ID = null;
    atualizarBotoesDeclEdEsp(dadosAlunoAtual);
  });
}

function atualizarCelulaChecklist(checkbox) {
  const td = checkbox.closest('div'); // ou 'td' se estiver em tabela
  if (checkbox.checked) {
    td.style.backgroundColor = '#d4edda';
  } else {
    td.style.backgroundColor = '#fff';
  }
}
// =========================
// MODAL DADOS DA ESCOLA
// =========================

function abrirModalDadosEscola() {
  document.body.style.overflow = 'hidden';               // trava rolagem do fundo
  document.getElementById('modalDadosEscola').style.display = 'flex';
  preencherSelectEscolaDados();
  preencherEtapasModalidade();
  orgsSelecionadas = [];
  renderizarOrgsAdicionadas();
}

function fecharModalDadosEscola() {
  document.body.style.overflow = '';                     // restaura rolagem
  document.getElementById('modalDadosEscola').style.display = 'none';
}

function preencherSelectEscolaDados() {
  const select = document.getElementById('selectEscolaDados');
  const escolas = getEscolasPermitidas();
  select.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
}

function carregarDadosEscola() {
  const escola = document.getElementById('selectEscolaDados').value;
  if (!escola) {
    document.getElementById('cardDadosEscola').style.display = 'none';
    document.getElementById('formDadosEscola').style.display = 'none';
    return;
  }

  const url = `${API_URL}?tipo=obterDadosEscola&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`;
  jsonp(url, function(dados) {
    if (dados.erro) {
      mostrarToast(dados.erro, 'error');
      return;
    }

    // Preenche o card de resumo
    const enderecoParts = [
      dados.LOGRADOURO, dados.NUMERO, dados.BAIRRO,
      dados.CIDADE, dados.UF, dados.CEP
    ].filter(Boolean).join(', ') || '—';
    document.getElementById('resumoEndereco').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${enderecoParts}`;
    document.getElementById('resumoContato').innerHTML = `<i class="fas fa-envelope"></i> ${dados.EMAIL || '—'} | <i class="fas fa-phone"></i> ${dados.TELEFONE || '—'}`;

    const formatarData = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    document.getElementById('resumoAtos').innerHTML = 
      `<i class="fas fa-file-contract"></i> Criação: ${dados.ATO_CRIACAO || '—'} (${formatarData(dados.PUBLICACAO_CRIACAO)}) | Aprovação: ${dados.ATO_APROVACAO || '—'} (${formatarData(dados.PUBLICACAO_APROVACAO)})`;

    // Preenche o formulário de edição
    document.getElementById('editLogradouro').value = dados.LOGRADOURO || '';
    document.getElementById('editNumero').value = dados.NUMERO || '';
    document.getElementById('editBairro').value = dados.BAIRRO || '';
    document.getElementById('editCidade').value = dados.CIDADE || '';
    document.getElementById('editUfEscola').value = dados.UF || '';
    document.getElementById('editCep').value = dados.CEP || '';
    document.getElementById('editEmailEscola').value = dados.EMAIL || '';

    const telInput = document.getElementById('editTelefone');
    telInput.value = dados.TELEFONE || '';
    if (dados.TELEFONE) {
      telInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    document.getElementById('editAtoCriacao').value = dados.ATO_CRIACAO || '';
    document.getElementById('editPublicacaoCriacao').value = dados.PUBLICACAO_CRIACAO ? new Date(dados.PUBLICACAO_CRIACAO).toISOString().split('T')[0] : '';
    document.getElementById('editAtoAprovacao').value = dados.ATO_APROVACAO || '';
    document.getElementById('editPublicacaoAprovacao').value = dados.PUBLICACAO_APROVACAO ? new Date(dados.PUBLICACAO_APROVACAO).toISOString().split('T')[0] : '';
    
    // Carrega organizações curriculares vinculadas
    const urlOrgs = `${API_URL}?tipo=listarOrganizacoesCurriculares&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`;
    jsonp(urlOrgs, function(orgs) {
      orgsSelecionadas = orgs || [];
      renderizarOrgsAdicionadas();
    });

    document.getElementById('cardDadosEscola').style.display = 'block';
    document.getElementById('formDadosEscola').style.display = 'none';
  });
}

function mostrarFormEdicaoDadosEscola() {
  document.getElementById('cardDadosEscola').style.display = 'none';
  document.getElementById('formDadosEscola').style.display = 'block';
}

function cancelarEdicaoDadosEscola() {
  document.getElementById('formDadosEscola').style.display = 'none';
  document.getElementById('cardDadosEscola').style.display = 'block';
}

function salvarDadosEscola() {
  const escola = document.getElementById('selectEscolaDados').value;
  if (!escola) {
    mostrarToast('Selecione uma escola.', 'warning');
    return;
  }

  // Primeiro salva as organizações curriculares
  const dadosOrgs = {
    acao: 'salvarOrganizacoesCurriculares',
    email: emailUsuario,
    escola: escola,
    organizacoes: orgsSelecionadas
  };

  postSemResposta(dadosOrgs, null, () => {
    // Depois salva os dados da escola
    const dadosEscola = {
      acao: 'salvarDadosEscola',
      email: emailUsuario,
      escola: escola,
      logradouro: document.getElementById('editLogradouro').value,
      numero: document.getElementById('editNumero').value,
      bairro: document.getElementById('editBairro').value,
      cidade: document.getElementById('editCidade').value,
      uf: document.getElementById('editUfEscola').value,
      cep: document.getElementById('editCep').value,
      emailEscola: document.getElementById('editEmailEscola').value,
      telefone: document.getElementById('editTelefone').value,
      atoCriacao: document.getElementById('editAtoCriacao').value,
      publicacaoCriacao: document.getElementById('editPublicacaoCriacao').value,
      atoAprovacao: document.getElementById('editAtoAprovacao').value,
      publicacaoAprovacao: document.getElementById('editPublicacaoAprovacao').value
      
    };

    postSemResposta(dadosEscola, 'Dados da escola e organizações curriculares salvos!', () => {
      cancelarEdicaoDadosEscola();
      carregarDadosEscola();
    });
  });
}

function truncarTexto(texto, max = 100) {
  if (!texto) return '';
  return texto.length > max ? texto.substring(0, max - 3) + '...' : texto;
}

function exportarDadosEscolaPDF() {
  const escola = document.getElementById('selectEscolaDados').value;
  if (!escola) {
    mostrarToast('Selecione uma escola.', 'warning');
    return;
  }

  mostrarLoading();
  const url = `${API_URL}?tipo=obterDadosEscola&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`;

  jsonp(url, function(dados) {
    if (dados.erro) {
      esconderLoading();
      mostrarToast(dados.erro, 'error');
      return;
    }

    if (!dados.ESCOLA) {
      esconderLoading();
      mostrarToast('Escola não encontrada.', 'error');
      return;
    }

    // Busca as organizações curriculares para incluir no PDF
    const urlOrgs = `${API_URL}?tipo=listarOrganizacoesCurriculares&email=${emailUsuario}&escola=${encodeURIComponent(escola)}`;
    jsonp(urlOrgs, function(orgs) {
      esconderLoading();

      // Monta o endereço formatado
      const partesEndereco = [
        dados.LOGRADOURO,
        dados.NUMERO,
        dados.BAIRRO,
        dados.CIDADE ? `${dados.CIDADE}/${dados.UF}` : '',
        dados.CEP ? `CEP: ${dados.CEP}` : ''
      ].filter(Boolean);
      const enderecoFormatado = partesEndereco.join(', ') || '—';

      // Monta o HTML do relatório
      let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dados da Escola</title>`;
      html += `<style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #333; }
        h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
        h2 { color: #1e3a8a; margin-top: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #1e3a8a; color: white; padding: 8px; text-align: left; }
        td { padding: 8px; border: 1px solid #ccc; }
        ul { margin: 8px 0; padding-left: 20px; }
        li { margin-bottom: 4px; }
        @page { size: A4; margin: 15mm; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>`;
      html += `<h1>Dados da Escola: ${dados.ESCOLA}</h1>`;
      html += `<table>`;

      // Endereço (linha única)
      html += `<tr><th>Endereço</th><td>${enderecoFormatado}</td></tr>`;

      // Demais campos
      const camposExibicao = {
        EMAIL: 'E-mail',
        TELEFONE: 'Telefone',
        ATO_CRIACAO: 'Ato de Criação',
        PUBLICACAO_CRIACAO: 'Publicação do Ato de Criação',
        ATO_APROVACAO: 'Ato de Aprovação/Credenciamento',
        PUBLICACAO_APROVACAO: 'Publicação do Ato de Aprovação'
      };

      for (let campo in camposExibicao) {
        let valor = dados[campo] || '—';
        if (campo.includes('PUBLICACAO') && dados[campo]) {
          valor = new Date(dados[campo]).toLocaleDateString('pt-BR');
        }
        html += `<tr><th>${camposExibicao[campo]}</th><td>${valor}</td></tr>`;
      }

      html += `</table>`;

      // Seção de Organizações Curriculares
      html += `<h2>Organizações Curriculares Vinculadas</h2>`;
      if (orgs && orgs.length > 0) {
        html += `<table>`;
        html += `<tr><th>Código</th><th>Nome</th><th>Etapa/Modalidade</th><th>Tipo</th></tr>`;
        orgs.forEach(org => {
          html += `<tr><td>${org.codigo}</td><td>${org.nome}</td><td>${org.etapaModalidade}</td><td>${org.tipo}</td></tr>`;
        });
        html += `</table>`;
      } else {
        html += `<p>Nenhuma organização curricular vinculada.</p>`;
      }

      html += `</body></html>`;

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.onload = function() {
        printWindow.print();
      };
    });
  });
}

// =========================
// GERAR HISTÓRICO
// =========================

function gerarHistoricoAluno(idAluno, escola, turma) {
  mostrarLoading();
  
  // Mapeamento de modelo por características da turma
  let modeloAba = 'TEMPLATE_EF'; // padrão

  const t = turma.toUpperCase();

  if (t.includes('EJA') || t.includes('NEEJA')) {
    if (t.includes('TÉCNICO') || t.includes('INTEGRADO')) modeloAba = 'TEMPLATE_TECNICO_EJA';
    else if (t.includes('QUALIFICAÇÃO')) modeloAba = 'TEMPLATE_QUALI_EJA';
    else if (t.includes('EM') || t.includes('ENSINO MÉDIO') || t.includes('3ª SÉRIE')) modeloAba = 'TEMPLATE_EJA_EM';
    else modeloAba = 'TEMPLATE_EJA_EF';
  } else if (t.includes('TÉCNICO') || t.includes('INTEGRADO') || t.includes('CONCOMITANTE') || t.includes('SUBSEQUENTE')) {
    if (t.includes('EJA')) modeloAba = 'TEMPLATE_TECNICO_EJA';
    else if (t.includes('NÍVEL MÉDIO')) modeloAba = 'TEMPLATE_TECNICO_NM';
    else modeloAba = 'TEMPLATE_TECNICO';
  } else if (t.includes('ENSINO MÉDIO') || /^[1-3]ª/.test(t)) {
    modeloAba = 'TEMPLATE_EM';
  } else if (/^[1-9]º/.test(t)) {
    modeloAba = 'TEMPLATE_EF';
  }

  const url = API_URL + '?tipo=gerarHistorico&email=' + encodeURIComponent(emailUsuario)
              + '&idAluno=' + encodeURIComponent(idAluno)
              + '&escola=' + encodeURIComponent(escola)
              + '&modelo=' + encodeURIComponent(modeloAba);
              
  jsonp(url, function(res) {
    esconderLoading();
    if (res.erro) {
      mostrarToast(res.erro, 'error');
      return;
    }
    window.open(res.url, '_blank');
    mostrarToast('Histórico gerado com sucesso!', 'success');
  });
}

// Fechar dropdown de busca global ao clicar fora
document.addEventListener('mousedown', function(e) {
  const input = document.getElementById('inputBuscaGlobal');
  const dropdown = document.getElementById('dropdownBuscaGlobal');
  if (!input || !dropdown) return;
  
  // Se o clique foi FORA do input e FORA do dropdown, fecha
  if (!input.contains(e.target) && !dropdown.contains(e.target)) {
    fecharDropdownBusca();
  }
});
