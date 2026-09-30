// =========================
// FILTROS, PREENCHIMENTO DE SELECTS E AJUSTES DE INTERFACE
// =========================

// ------ APLICAR FILTROS E PESQUISAR ------
function aplicarFiltros(pagina = 1) {
  if (bloqueiaChangeTurma) return;

  console.log("✅ aplicarFiltros chamada com página:", pagina);
  const filtros = {
    escola: document.getElementById("filtroEscola")?.value || "",
    turma: document.getElementById("filtroTurma")?.value || "",
    status: document.getElementById("filtroStatus")?.value || "",
    situacao: document.getElementById("filtroSituacao")?.value || "",
    nome: document.getElementById("pesquisaNome")?.value.toLowerCase() || ""
  };

  carregarAlunos(pagina, filtros);

  // 🔥 Recarregar estrelas ao mudar a escola
  if (typeof carregarDesempenho === 'function') {
    carregarDesempenho();
  }
}

// ------ INICIALIZAR FILTROS PRINCIPAIS ------
function inicializarFiltros() {
  const selectEscola = document.getElementById("filtroEscola");
  if (selectEscola) {
    const valorSelecionado = selectEscola.value;
    const escolas = getEscolasPermitidas();
    selectEscola.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.forEach(esc => {
      const opt = document.createElement("option");
      opt.value = esc;
      opt.textContent = esc;
      selectEscola.appendChild(opt);
    });
    if (valorSelecionado) {
      selectEscola.value = valorSelecionado;
    }
  }

  const campoBusca = document.getElementById("pesquisaNome");
  if (campoBusca) {
    const buscarDebounced = debounce(aplicarFiltros, 600);
    campoBusca.removeEventListener("input", buscarDebounced);
    campoBusca.addEventListener("input", buscarDebounced);
  }

  // Aplicar filtros ao pressionar Enter em qualquer campo de filtro
  document.querySelectorAll('#filtroEscola, #filtroTurma, #filtroStatus, #filtroSituacao, #pesquisaNome').forEach(el => {
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        aplicarFiltros();
      }
    });
  });

  carregarTurmasParaFiltro();
}
// ------ SELECT DE ESCOLAS PARA FILTRO DE ATOS ------
function carregarEscolasParaFiltroAto() {
  const escolas = getEscolasPermitidas();
  const selectFiltro = document.getElementById("filtroEscolaAto");
  selectFiltro.innerHTML = '<option value="">Todas as escolas</option>';
  escolas.forEach(esc => {
    const opt = document.createElement("option");
    opt.value = esc;
    opt.textContent = esc;
    selectFiltro.appendChild(opt);
  });
}

// ------ SELECTS DE PROCESSOS ------
function preencherSelectsProcessos() {
  const selectEscolaCad = document.getElementById("cadastroProcessoEscola");
  const selectEscolaFiltro = document.getElementById("filtroProcessoEscola");
  const escolas = getEscolasPermitidas();
  
  [selectEscolaCad, selectEscolaFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id.includes('filtro') ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
  });
  
  const cadWrapper = document.getElementById("cadastroProcessoEscolaWrapper");
  const filtroWrapper = document.getElementById("filtroProcessoEscolaWrapper");
  if (perfilUsuario === "SECRETARIA") {
    if (cadWrapper) cadWrapper.style.display = "none";
    if (filtroWrapper) filtroWrapper.style.display = "none";
  } else {
    if (cadWrapper) cadWrapper.style.display = "block";
    if (filtroWrapper) filtroWrapper.style.display = "block";
  }

  carregarTiposProcesso();
  if (selectEscolaCad) selectEscolaCad.onchange = carregarTiposProcesso;
}

// ------ TIPOS DE PROCESSO (fixos + personalizados por escola, com "+ Novo tipo...") ------
function carregarTiposProcesso() {
  const selectCad = document.getElementById('cadastroProcessoTipo');
  const selectFiltro = document.getElementById('filtroProcessoTipo');
  if (!selectCad && !selectFiltro) return;

  const escolaSelecionada = document.getElementById('cadastroProcessoEscola')?.value || '';
  const url = `${API_URL}?tipo=listarTiposProcesso&email=${emailUsuario}&escola=${encodeURIComponent(escolaSelecionada)}`;

  jsonp(url, function(tipos) {
    if (selectCad) {
      const valorAtual = selectCad.value;
      selectCad.innerHTML = '<option value="">Tipo de processo / Documento</option>';
      if (Array.isArray(tipos)) {
        tipos.forEach(t => selectCad.appendChild(new Option(t, t)));
      }
      const optOutro = document.createElement('option');
      optOutro.value = '__novo__';
      optOutro.textContent = '+ Novo tipo...';
      selectCad.appendChild(optOutro);
      if (valorAtual && tipos.includes(valorAtual)) selectCad.value = valorAtual;

      selectCad.onchange = function() {
        if (this.value === '__novo__') {
          const novoTipo = prompt('Digite o nome do novo tipo de processo/documento:');
          if (novoTipo && novoTipo.trim()) {
            const escolaAlvo = document.getElementById('cadastroProcessoEscola')?.value || '';
            if (perfilUsuario !== 'SECRETARIA' && !escolaAlvo) {
              mostrarToast('Selecione a escola antes de cadastrar um novo tipo.', 'warning');
              this.value = '';
              return;
            }
            postSemResposta({
              acao: 'cadastrarTipoProcesso',
              email: emailUsuario,
              tipo: novoTipo.trim(),
              escola: escolaAlvo
            }, 'Tipo cadastrado!', () => {
              carregarTiposProcesso();
              setTimeout(() => { selectCad.value = novoTipo.trim(); }, 300);
            });
          } else {
            this.value = '';
          }
        }
        atualizarCamposProcesso();
      };
    }

    if (selectFiltro) {
      const valorAtualFiltro = selectFiltro.value;
      selectFiltro.innerHTML = '<option value="">Todos os tipos</option>';
      if (Array.isArray(tipos)) {
        tipos.forEach(t => selectFiltro.appendChild(new Option(t, t)));
      }
      if (valorAtualFiltro) selectFiltro.value = valorAtualFiltro;
    }
  });
}

// ------ SELECTS DE GESTÃO DE DOCUMENTOS ------
function preencherSelectEscolasDoc() {
  const selectUpload = document.getElementById("uploadEscola");
  const selectFiltro = document.getElementById("filtroEscolaDoc");
  const escolas = getEscolasPermitidas();
  
  [selectUpload, selectFiltro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">' + (select.id === 'filtroEscolaDoc' ? 'Todas as escolas' : 'Selecione a escola') + '</option>';
    escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
  });
  
  const uploadWrapper = document.getElementById("uploadEscolaWrapper");
  const filtroWrapper = document.getElementById("filtroEscolaDocWrapper");
  if (perfilUsuario === "SECRETARIA") {
    if (uploadWrapper) uploadWrapper.style.display = "none";
    if (filtroWrapper) filtroWrapper.style.display = "none";
  } else {
    if (uploadWrapper) uploadWrapper.style.display = "block";
    if (filtroWrapper) filtroWrapper.style.display = "block";
  }
}

// ------ SELECTS DE TURMAS (MODAL TURMAS) ------
function preencherSelectEscolasTurma() {
  // Se for secretária, esconde o filtro de escola no modal de turmas
  if (perfilUsuario === "SECRETARIA") {
    const wrapperFiltro = document.getElementById("filtroEscolaTurma");
    if (wrapperFiltro) wrapperFiltro.parentElement.style.display = "none"; // esconde a div pai do select
    return;
  }
  
  // Para supervisor, preenche normalmente
  const selectFiltro = document.getElementById("filtroEscolaTurma");
  const selectCadastro = document.getElementById("selectEscolaTurma");
  const escolas = getEscolasPermitidas();
  
  [selectFiltro, selectCadastro].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Todas as escolas</option>';
    escolas.forEach(esc => {
      const opt = document.createElement("option");
      opt.value = esc;
      opt.textContent = esc;
      select.appendChild(opt);
    });
  });
}

// ------ ATUALIZAR CAMPOS EXTRAS NO CADASTRO DE PROCESSO ------
function atualizarCamposProcesso() {
  const tipo = document.getElementById("cadastroProcessoTipo").value;
  const container = document.getElementById("camposExtrasProcesso");
  container.innerHTML = "";
  
  const tiposComAluno = [
    "Cuidador", 
    "Regularização AEE", 
    "Regularização de Vida Escolar",
    "Manifestação GENPRO",
    "Ata Especial de RVE",
    "Ata de Classificação/Reclassificação/Avanço Escolar"
  ];
  
  if (tiposComAluno.includes(tipo)) {
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon"><i class="fas fa-user"></i></span>
        <input type="text" id="cadastroProcessoAluno" placeholder="Nome do aluno">
      </div>
    `;
  } else if (tipo === "Livro de ponto") {
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon"><i class="fas fa-folder"></i></span>
        <select id="cadastroProcessoCategoria" onchange="atualizarSubcategorias()">
          <option value="">Categoria</option>
          <option value="Técnico Administrativo">Técnico Administrativo</option>
          <option value="Profissionais do Magistério">Profissionais do Magistério</option>
        </select>
      </div>
      <div class="input-icon" id="subcategoriaWrapper" style="display:none;">
        <span class="icon"><i class="fas fa-file-alt"></i></span>
        <select id="cadastroProcessoSubcategoria">
          <option value="">Subcategoria</option>
          <option value="Técnico Pedagógico">Técnico Pedagógico</option>
          <option value="Matutino ou Integral">Matutino ou Integral</option>
          <option value="Vespertino">Vespertino</option>
          <option value="Noturno">Noturno</option>
          <option value="Educação Profissional">Educação Profissional</option>
        </select>
      </div>
    `;
  } else if (tipo === "Plano de Intervenção PFA") {
    container.innerHTML = `
      <div class="input-icon">
        <span class="icon"><i class="fas fa-book-open"></i></span>
        <select id="cadastroProcessoSubtopicoPFA">
          <option value="">Selecione o componente</option>
          <option value="PFA Língua Portuguesa">PFA Língua Portuguesa</option>
          <option value="PFA Matemática">PFA Matemática</option>
        </select>
      </div>
    `;
  }
}

function atualizarSubcategorias() {
  const cat = document.getElementById("cadastroProcessoCategoria")?.value;
  const wrapper = document.getElementById("subcategoriaWrapper");
  if (cat === "Profissionais do Magistério") {
    wrapper.style.display = "block";
  } else {
    wrapper.style.display = "none";
    document.getElementById("cadastroProcessoSubcategoria").value = "";
  }
}

// ------ AJUSTES DE INTERFACE POR PERFIL ------
function getPerfisSelecionados(nomeGrupo) {
  return Array.from(document.querySelectorAll(`input[name="${nomeGrupo}"]:checked`)).map(el => el.value);
}

function ajustarOpcoesCadastroUsuario() {
  const perfis = getPerfisSelecionados('perfilCadastro');
  const campoEscola = document.getElementById('campoEscolaContainer');
  campoEscola.style.display = (perfis.includes('SECRETARIA') || perfis.includes('PEDAGOGICO')) ? 'block' : 'none';
}

function ajustarOpcoesEdicaoUsuario() {
  const perfis = getPerfisSelecionados('perfilEdicao');
  const campoEscola = document.getElementById('campoEscolaEdicaoContainer');
  campoEscola.style.display = (perfis.includes('SECRETARIA') || perfis.includes('PEDAGOGICO')) ? 'block' : 'none';
}

function ajustarInterfacePorPerfil() {
  const btnCadastroUsuario = document.querySelector("button[onclick*='abrirModalCadastroUsuario']");
  const btnListarUsuarios = document.querySelector("button[onclick*='abrirModalListaUsuarios']");
  const btnNovoAluno = document.querySelector("button[onclick*='abrirNovoAluno']");
  const btnImportarCSV = document.querySelector("button[onclick*='abrirModalImportacao']");
  const filtrosContainer = document.querySelector(".filtros-container");
  const btnTurmas = document.getElementById("btnTurmas");
  const filtroEscolaWrapper = document.getElementById("filtroEscolaWrapper");
  const filtroTurmaWrapper = document.getElementById("filtroTurmaWrapper");
  const filtroStatusWrapper = document.getElementById("filtroStatusWrapper");
  const filtroSituacaoWrapper = document.getElementById("filtroSituacaoWrapper");
  const btnModelos = document.getElementById("btnModelos");
  const btnAlterarSenha = document.getElementById("btnAlterarSenha");
  if (btnAlterarSenha) btnAlterarSenha.style.display = "inline-block";

  // 🔥 Múltiplos perfis: em vez de escolher um único ramo (secretaria OU
  // supervisor), somamos as permissões de todos os perfis do usuário —
  // assim quem acumula SECRETARIA + SUPERVISOR, por exemplo, não perde
  // nenhum botão que teria isoladamente em cada perfil.
  const hasSecretaria = temPerfilUsuario("SECRETARIA");
  const hasSupervisor = temPerfilUsuario("SUPERVISOR");
  const isAdministrador = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br');

  const btnInativos = document.getElementById("btnInativos");
  if (btnInativos) btnInativos.style.display = (hasSecretaria || hasSupervisor) ? "inline-block" : "none";

  const btnLegalizacao = document.getElementById("btnLegalizacao");
  if (btnLegalizacao) btnLegalizacao.style.display = (hasSupervisor || hasSecretaria) ? "inline-block" : "none";

  // Itens que já eram iguais nos dois ramos originais — ficam fixos.
  if (filtroTurmaWrapper) filtroTurmaWrapper.style.display = "block";
  if (filtroStatusWrapper) filtroStatusWrapper.style.display = "block";
  if (filtrosContainer) filtrosContainer.style.display = "flex";
  if (btnTurmas) btnTurmas.style.display = "inline-block";
  if (btnModelos) btnModelos.style.display = "inline-block";

  // Filtro de escola e de situação: só quem enxerga várias escolas precisa deles.
  if (filtroEscolaWrapper) filtroEscolaWrapper.style.display = hasSupervisor ? "block" : "none";
  if (filtroSituacaoWrapper) filtroSituacaoWrapper.style.display = hasSupervisor ? "block" : "none";

  // Gestão de usuários: exclusiva de quem tem SUPERVISOR.
  if (btnCadastroUsuario) btnCadastroUsuario.style.display = hasSupervisor ? "inline-block" : "none";
  if (btnListarUsuarios) btnListarUsuarios.style.display = hasSupervisor ? "inline-block" : "none";

  // Novo Aluno: exclusivo de quem tem SECRETARIA (mesmo que também seja supervisor).
  if (btnNovoAluno) btnNovoAluno.style.display = hasSecretaria ? "inline-block" : "none";

  // Importar CSV: secretaria sempre vê; supervisor só se também for o administrador
  // (mantém a mesma regra de negócio que já existia para supervisores "comuns").
  if (btnImportarCSV) {
    btnImportarCSV.style.display = (hasSecretaria || (hasSupervisor && isAdministrador)) ? "inline-block" : "none";
  }
}

function toggleFiltros() {
  const container = document.querySelector('.filtros-container');
  container.classList.toggle('expandido');
}
function toggleFiltros() {
  document.querySelector('.filtros-container').classList.toggle('expandido');
}
