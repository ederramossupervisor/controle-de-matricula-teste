// =========================
// VARIÁVEIS GLOBAIS MUTÁVEIS
// =========================
let dadosGlobais = [];
let emailUsuario = "";
let perfilUsuario = ""; // "perfil principal" (maior privilégio) — mantido por compatibilidade
let perfisUsuario = []; // 🔥 NOVO: lista completa de perfis do usuário logado
let escolaUsuario = "";
let alteracoesPendentes = {};
let dadosAlunoAtual = null;
let turmasDisponiveis = [];
let resumoPorEscolaGlobal = {};

let paginaAtual = 1;
let alunosPorPagina = 200;
let dadosFiltradosGlobais = [];

let alunosImportados = [];

let atosGlobais = [];

let paginaAtualInativos = 1;
let totalPaginasInativos = 1;
let alunosPorPaginaInativos = 20;
let filtrosInativosAtuais = {};

let modoVisualizacao = 'cards'; // 'cards' ou 'lista'

// =========================
// INICIALIZAÇÃO
// =========================
window.onload = async function () {
  let perfil = null;
  try { perfil = await carregarPerfilSb(); } catch (_) {}

  if (perfil && !window._recuperandoSenha) {
    emailUsuario = perfil.email;
    nomeUsuario = perfil.nome || perfil.email;
    localStorage.setItem("emailUsuario", emailUsuario);
    localStorage.setItem("nomeUsuario", nomeUsuario);
    document.getElementById("email").value = emailUsuario;

    if (perfil.primeiro_acesso) {
      esconderSplash();
      document.getElementById("login").style.display = "";
      abrirModalAlterarSenhaObrigatorio();
      return;
    }

    carregarAlunos();
    // Trava de segurança: se o carregamento não terminar em 15s, mostra o login.
    setTimeout(function () {
      const splash = document.getElementById("splash");
      if (splash && splash.style.display !== "none") {
        esconderSplash();
        document.getElementById("app").style.display = "none";
        document.getElementById("login").style.display = "";
        if (typeof mostrarToast === "function") {
          mostrarToast("Não foi possível carregar os dados. Tente novamente.", "warning");
        }
      }
    }, 15000);
  } else {
    esconderSplash();
    document.getElementById("login").style.display = "";
  }
};

// Função auxiliar para esconder a splash screen
function esconderSplash() {
  // Para as dicas (agora definidas no HTML)
  if (window._splashDicaInterval) {
    clearInterval(window._splashDicaInterval);
    window._splashDicaInterval = null;
  }
  const splash = document.getElementById("splash");
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
    }, 300);
  }
}

// =========================
// LISTA CENTRAL DE MODAIS/PÁGINAS DO SISTEMA
// Usada tanto pela tecla Esc quanto pelo clique fora (overlay).
// Para que um novo modal feche com Esc/clique-fora, basta adicioná-lo aqui.
// =========================
function obterModaisEPaginasAbertos() {
  return [
    // Filhos (formulários sobre listas)
    { element: document.getElementById('modalFormAto'), close: fecharFormAto },
    { element: document.getElementById('modalCadastroTurma'), close: fecharModalCadastroTurma },
    { element: document.getElementById('modalCadastroUsuario'), close: fecharModalCadastroUsuario },
    { element: document.getElementById('modalEdicaoUsuario'), close: fecharModalEdicaoUsuario },
    { element: document.getElementById('modalEditarLegislacao'), close: fecharEdicaoLegislacao },
    { element: document.getElementById('modalComunicado'), close: fecharModalComunicado },
    { element: document.getElementById('modalAlterarSenha'), close: fecharModalAlterarSenha },
    { element: document.getElementById('modalImportacao'), close: fecharModalImportacao },
    { element: document.getElementById('modalImportacaoProfissionais'), close: fecharModalImportacaoProfissionais },
    { element: document.getElementById('modalExportacao'), close: fecharModalExportacao },
    { element: document.getElementById('modalPromocao'), close: fecharModalPromocao },
    { element: document.getElementById('modalAtualizarMatriculados'), close: fecharModalAtualizarMatriculados },
    { element: document.getElementById('modalConsentimento'), close: logout }, // logout fecha o consentimento
    { element: document.getElementById('modalGeradorDocumentos'), close: fecharModalGeradorDocumentos },
    { element: document.getElementById('modalPlanoTaticoMensal'), close: fecharModalPlanoTaticoMensal },
    { element: document.getElementById('modalPlanoTaticoTrimestral'), close: fecharModalPlanoTaticoTrimestral },
    { element: document.getElementById('modalAcompanhamentoPT'), close: fecharModalAcompanhamentoPT },

    // Pais (listas e modais principais)
    { element: document.getElementById('modalDetalhes'), close: fecharModalDetalhes },
    { element: document.getElementById('modalChecklistLote'), close: fecharModalChecklistLote },
    { element: document.getElementById('modalDocumentos'), close: fecharModalDocumentos },
    { element: document.getElementById('modalModelos'), close: fecharModalModelos },
    { element: document.getElementById('modalInativos'), close: fecharModalInativos },
    { element: document.getElementById('modalProcessos'), close: fecharModalProcessos },
    { element: document.getElementById('modalLegalizacao'), close: fecharModalLegalizacao },
    { element: document.getElementById('modalLegislacao'), close: fecharModalLegislacao },
    { element: document.getElementById('modalTurmas'), close: fecharModalTurmas },
    { element: document.getElementById('modalListaUsuarios'), close: fecharModalListaUsuarios },
    { element: document.getElementById('modalNotificacoes'), close: fecharNotificacoes },
    { element: document.getElementById('modalAgenda'), close: fecharModalAgenda },
    { element: document.getElementById('modalDashboard'), close: fecharModalDashboard },
    { element: document.getElementById('modalHistorico'), close: fecharModalHistorico },
    { element: document.getElementById('modalAprovacaoTermos'), close: fecharModalAprovacaoTermos },
    { element: document.getElementById('modalMonitoramento'), close: fecharModalMonitoramento },
    { element: document.getElementById('modalDadosEscola'), close: fecharModalDadosEscola },
    { element: document.getElementById('modalDetalhesProfissional'), close: fecharModalDetalhesProfissional },
    { element: document.getElementById('modalDashboardProfissionais'), close: fecharDashboardProfissionais },
    { element: document.getElementById('modalDesempenho'), close: fecharModalDesempenho },
    { element: document.getElementById('modalRanking'), close: fecharModalRanking },

    // Páginas do sistema (telas de tela cheia que também usam .modal-overlay)
    { element: document.getElementById('novoAluno'), close: voltarApp }
  ];
}

// =========================
// EVENTOS GLOBAIS (quando o DOM estiver pronto)
// =========================
// IMPORTANTE: os scripts do sistema são injetados dinamicamente pelo
// js/loader.js (via document.createElement('script')), e não com <script>
// estático no HTML. Isso significa que, quando este arquivo é executado,
// o evento 'DOMContentLoaded' quase sempre JÁ disparou (o parsing do HTML
// termina bem antes do loader.js buscar e rodar cada script em sequência).
// Um listener 'DOMContentLoaded' registrado aqui, portanto, nunca seria
// chamado — e nada dentro dele (atalhos de teclado, Esc, clique fora)
// funcionaria. Por isso rodamos a função direto se o documento já estiver
// pronto, e só usamos o listener como fallback.
function iniciarEventosGlobais() {
  // --- Fechar modais/janelas/páginas ao clicar fora (overlay) ---
  // Centralizado: cobre TODOS os modais e páginas listados em obterModaisEPaginasAbertos(),
  // inclusive os que forem adicionados no futuro (basta incluir na lista da função).
  document.addEventListener('click', function(e) {
    const alvo = e.target;
    if (!alvo || !alvo.classList) return;
    if (!alvo.classList.contains('modal-overlay') && !alvo.classList.contains('mini-modal-overlay')) return;
    if (alvo.style.display !== 'flex') return; // só fecha se o clique foi no fundo (overlay) de algo visível

    const item = obterModaisEPaginasAbertos().find(function(m) { return m.element === alvo; });
    if (item && typeof item.close === 'function') {
      item.close();
    }
  });

  // --- Listener do filtro de turma (guardar valor anterior) ---
  const selectTurma = document.getElementById("filtroTurma");
  if (selectTurma) {
    selectTurma.addEventListener('change', function() {
      this.setAttribute('data-valor-anterior', this.value);
    });
  }

  // --- Atalhos de teclado ---
  document.addEventListener('keydown', function(e) {
    const app = document.getElementById('app');
    if (!app || app.style.display === 'none') return;

    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      // Esc precisa funcionar mesmo com o foco em um campo dentro do modal
      if (!(e.ctrlKey && e.key === 'f') && e.key !== 'Escape') {
        return;
      }
    }

        // Ctrl + S: Salvar dados do aluno (quando modal de detalhes estiver aberto)
    if (e.ctrlKey && e.key === 's') {
      const modalDetalhes = document.getElementById('modalDetalhes');
      if (modalDetalhes && modalDetalhes.style.display === 'flex') {
        e.preventDefault();
        if (typeof salvarDadosAluno === 'function') {
          salvarDadosAluno();
        }
      }
    }

    // Ctrl + N: Novo Aluno
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      abrirNovoAluno();
    }

    // Ctrl + F: Focar no campo de busca
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      const inputBusca = document.getElementById('pesquisaNome');
      if (inputBusca) {
        inputBusca.focus();
        inputBusca.select();
      }
    }
    

// Esc: Fechar menu dropdown ou modais/páginas abertos
if (e.key === 'Escape') {
  const menuDropdown = document.getElementById('menuDropdown');

  const modaisAbertos = obterModaisEPaginasAbertos();

  let modalFechado = false;
  for (let modal of modaisAbertos) {
    if (modal.element && modal.element.style.display === 'flex') {
      e.preventDefault();
      modal.close();
      modalFechado = true;
      break; // Fecha apenas o primeiro encontrado (o mais interno)
    }
  }

    // Se nenhum modal foi fechado, tenta fechar o menu dropdown
  if (!modalFechado && menuDropdown) {
    const menuVisivel = (menuDropdown.style.display !== 'none') || menuDropdown.classList.contains('menu-aberto');
    if (menuVisivel) {
      e.preventDefault();
      if (menuDropdown.classList.contains('menu-aberto')) {
        menuDropdown.classList.remove('menu-aberto');
        const overlay = document.getElementById('menuOverlay');
        if (overlay) overlay.classList.remove('ativo');
      } else {
        menuDropdown.style.display = 'none';
      }
    }
  }
}
  });

  // --- Fechar menu dropdown ao clicar fora ---
  window.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
      const menu = document.getElementById("menuDropdown");
      if (menu) menu.style.display = 'none';
    }
  });

  // --- Ajuste de tooltips (classe tooltip-below) ---
  const style = document.createElement('style');
  style.textContent = `
    [data-tooltip].tooltip-below:before {
      bottom: auto !important;
      top: 125% !important;
    }
    [data-tooltip].tooltip-below:after {
      bottom: auto !important;
      top: 125% !important;
      border-top: none !important;
      border-bottom: 6px solid #1e293b !important;
    }
    [data-theme="dark"] [data-tooltip].tooltip-below:after {
      border-bottom-color: #f1f5f9 !important;
    }
  `;
  document.head.appendChild(style);

// =========================
// EASTER EGG – Sequência de setas (funciona em qualquer lugar)
// =========================
(function() {
  const sequencia = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'
  ];
  let indice = 0;

  document.addEventListener('keydown', function(e) {
    // Se a tecla pressionada for a esperada na sequência
    if (e.key === sequencia[indice]) {
      indice++;
      if (indice === sequencia.length) {
                // Easter Egg ativado – exibe vídeo comemorativo
        const urlVideo = 'https://www.youtube.com/embed/Sb7GTnc36ok?autoplay=1';

        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.85); z-index: 99999;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
          position: relative; width: 80%; max-width: 800px;
          background: #000; border-radius: 16px; overflow: hidden;
          box-shadow: 0 0 40px rgba(250,204,21,0.6);
        `;

        const iframe = document.createElement('iframe');
        iframe.src = urlVideo;
        iframe.style.cssText = 'width: 100%; height: 450px; border: none;';
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = true;

        const btnFechar = document.createElement('button');
        btnFechar.innerHTML = '✕';
        btnFechar.style.cssText = `
          position: absolute; top: 10px; right: 10px;
          background: rgba(0,0,0,0.6); color: white; border: none;
          font-size: 20px; width: 36px; height: 36px; border-radius: 50%;
          cursor: pointer; z-index: 1;
        `;
        btnFechar.addEventListener('click', (e) => {
          e.stopPropagation();
          overlay.remove();
        });

        container.appendChild(iframe);
        container.appendChild(btnFechar);
        overlay.appendChild(container);
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);

        console.log('🥚 Easter Egg ativado!');
        console.log('Desenvolvido por Eder Ramos – SRE Afonso Cláudio');

        indice = 0;
      }
    } else {
      // Tecla errada, reinicia a contagem
      indice = 0;
      // Se a tecla for a primeira da sequência, já conta como início
      if (e.key === sequencia[0]) {
        indice = 1;
      }
    }
  });
})();

  function checkTooltipPosition(el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < 80) {
      el.classList.add('tooltip-below');
    } else {
      el.classList.remove('tooltip-below');
    }
  }

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', function() {
      checkTooltipPosition(this);
    });
  });

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-tooltip')) {
          node.addEventListener('mouseenter', function() {
            checkTooltipPosition(this);
          });
        }
        if (node.nodeType === 1 && node.querySelectorAll) {
          node.querySelectorAll('[data-tooltip]').forEach(el => {
            el.addEventListener('mouseenter', function() {
              checkTooltipPosition(this);
            });
          });
        }
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarEventosGlobais);
} else {
  iniciarEventosGlobais();
}

document.addEventListener('click', function(e) {
  const btn = e.target.closest('button');
  if (btn) {
    window._clickedButton = btn;
  }
});
// =========================
// MODO FOCO
// =========================
function alternarModoFoco() {
  const body = document.body;
  const btn = document.getElementById('btnModoFoco');
  const ativo = body.classList.toggle('modo-foco');
  
  if (ativo) {
    btn.innerHTML = '<i class="fas fa-compress"></i>';
    btn.setAttribute('data-tooltip', 'Sair do Modo Foco');
    localStorage.setItem('modoFoco', '1');
  } else {
    btn.innerHTML = '<i class="fas fa-expand"></i>';
    btn.setAttribute('data-tooltip', 'Modo Foco (tela cheia para a lista)');
    localStorage.removeItem('modoFoco');
  }
}

// Restaurar preferência ao carregar
(function() {
  if (localStorage.getItem('modoFoco') === '1') {
    document.body.classList.add('modo-foco');
    const btn = document.getElementById('btnModoFoco');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-compress"></i>';
      btn.setAttribute('data-tooltip', 'Sair do Modo Foco');
    }
  }
})();

// =========================
// ABRIR DASHBOARD CONFORME ABA ATIVA
// =========================
function abrirDashboard() {
  if (typeof abaAtiva !== 'undefined' && abaAtiva === 'profissionais') {
    // Se a função de abrir dashboard de profissionais existir, chama
    if (typeof abrirDashboardProfissionais === 'function') {
      abrirDashboardProfissionais();
    } else {
      mostrarToast('Dashboard de profissionais não disponível.', 'warning');
    }
  } else {
    // Padrão: dashboard de alunos
    if (typeof abrirModalDashboard === 'function') {
      abrirModalDashboard();
    } else {
      mostrarToast('Dashboard de alunos não disponível.', 'warning');
    }
  }
}
