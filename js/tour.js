// =========================
// TOUR GUIADO (passo a passo)
// =========================
// Roda automaticamente no primeiro acesso de cada usuário (guardado no
// localStorage, por e-mail) e pode ser reaberto a qualquer momento pelo
// botão "Como usar o sistema" no menu.
//
// Cada passo aponta pra um elemento da tela (por seletor CSS). Se o
// elemento não existir ou estiver escondido (perfil diferente, tela
// menor, etc.), o passo é pulado automaticamente — não precisa manter
// uma lista separada por perfil.

const TOUR_PASSOS = [
  {
    seletor: '#headerTitulo',
    titulo: 'Bem-vindo(a)! 👋',
    texto: 'Este é o Sistema de Controle de Matrículas. Vamos fazer um tour rápido pelas principais funções — leva menos de um minuto.',
    posicao: 'baixo'
  },
  {
    seletor: '#inputBuscaGlobal',
    titulo: 'Busca rápida',
    texto: 'Digite aqui pra encontrar rapidamente um aluno, um processo, uma legislação ou um comunicado — em qualquer parte do sistema.',
    posicao: 'baixo'
  },
  {
    seletor: '#painel',
    titulo: 'Painel de indicadores',
    texto: 'Aqui você vê de relance quantos alunos estão com a matrícula completa, pendente ou com prazo vencido.',
    posicao: 'baixo'
  },
  {
    seletor: '.filtros-container',
    titulo: 'Filtros',
    texto: 'Filtre a lista por turma, status da documentação ou busque um aluno pelo nome, CPF ou telefone.',
    posicao: 'baixo'
  },
  {
    seletor: '#lista',
    titulo: 'Lista de alunos',
    texto: 'Cada card mostra rapidamente a situação da documentação. Clique em um aluno pra ver os detalhes e marcar os documentos entregues.',
    posicao: 'cima'
  },
  {
    seletor: 'button[onclick*="abrirNovoAluno"]',
    titulo: 'Novo aluno',
    texto: 'Cadastre um novo aluno na sua escola por aqui.',
    posicao: 'baixo'
  },
  {
    seletor: 'button[onclick*="abrirModalImportacao"]',
    titulo: 'Importar em lote',
    texto: 'Tem uma planilha ou CSV com vários alunos? Importe todos de uma vez por aqui.',
    posicao: 'baixo'
  },
  {
    seletor: '#btnInativos',
    titulo: 'Transferidos / Concluídos',
    texto: 'Alunos que saíram da escola (transferência, conclusão) ficam aqui, fora da lista principal.',
    posicao: 'baixo'
  },
  {
    seletor: '#btnTurmas',
    titulo: 'Turmas',
    texto: 'Gerencie as turmas da escola por aqui.',
    posicao: 'baixo'
  },
  {
    seletor: '#btnModelos',
    titulo: 'Modelos de documentos',
    texto: 'Baixe modelos oficiais (históricos, certificados, diplomas) ou envie modelos próprios da sua escola.',
    posicao: 'baixo'
  },
  {
    seletor: '#btnLegalizacao',
    titulo: 'Atos Autorizativos',
    texto: 'Controle os atos de criação, aprovação e credenciamento da escola, com alerta de vencimento.',
    posicao: 'baixo'
  },
  {
    seletor: '#btnVerUsuarios',
    titulo: 'Usuários',
    texto: 'Veja, edite ou remova os usuários que têm acesso ao sistema.',
    posicao: 'baixo'
  },
  {
    seletor: '#btnCadastrarUsuario',
    titulo: 'Cadastrar usuário',
    texto: 'Cadastre um novo usuário e escolha um ou mais perfis de acesso pra ele.',
    posicao: 'baixo'
  },
  {
    seletor: '.btn-menu-brilho',
    titulo: 'Mais opções',
    texto: 'Processos (Edocs), Legislação, Agenda, Comunicados, Monitoramento, Dados da Escola e outras funções ficam aqui, no menu.',
    posicao: 'esquerda'
  },
  {
    seletor: '#btnAjudaTour',
    titulo: 'Precisa rever isso depois?',
    texto: 'Pode clicar aqui a qualquer momento pra repetir este tour. Bom trabalho! 🎓',
    posicao: 'esquerda'
  }
];

let tourPassoAtual = 0;
let tourPassosValidos = [];

function elementoVisivel(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  // Garante que não está escondido dentro de um menu/dropdown fechado
  let atual = el;
  while (atual) {
    const s = window.getComputedStyle(atual);
    if (s.display === 'none') return false;
    atual = atual.parentElement;
  }
  return true;
}

function elementoDentroDoMenu(el) {
  const menu = document.getElementById('menuDropdown');
  return !!(menu && el && menu.contains(el));
}

function garantirMenuAberto() {
  const menu = document.getElementById('menuDropdown');
  if (!menu) return;
  const overlayMenu = document.getElementById('menuOverlay');
  if (window.innerWidth <= 800) {
    menu.style.display = '';
    menu.classList.add('menu-aberto');
    if (overlayMenu) overlayMenu.classList.add('ativo');
  } else {
    menu.style.display = 'flex';
  }
}

function fecharMenu() {
  const menu = document.getElementById('menuDropdown');
  if (!menu) return;
  if (window.innerWidth <= 800) {
    menu.classList.remove('menu-aberto');
    const overlayMenu = document.getElementById('menuOverlay');
    if (overlayMenu) overlayMenu.classList.remove('ativo');
  } else {
    menu.style.display = 'none';
  }
}

function iniciarTour() {
  garantirMenuAberto();
  tourPassosValidos = TOUR_PASSOS.filter(passo => elementoVisivel(document.querySelector(passo.seletor)));
  fecharMenu();   // ← linha nova

  if (tourPassosValidos.length === 0) {
    mostrarToast('Não há elementos disponíveis pra mostrar no tour agora.', 'warning');
    return;
  }

  tourPassoAtual = 0;
  criarOverlayTour();
  mostrarPassoTour();
}

function criarOverlayTour() {
  if (document.getElementById('tourOverlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'tourOverlay';
  overlay.className = 'tour-overlay';
  overlay.innerHTML = `
    <div class="tour-spotlight" id="tourSpotlight"></div>
    <div class="tour-tooltip" id="tourTooltip">
      <div class="tour-tooltip-header">
        <span id="tourTituloPasso"></span>
        <button class="tour-fechar" onclick="event.stopPropagation(); encerrarTour()" title="Fechar tour"><i class="fas fa-times"></i></button>
      </div>
      <p id="tourTextoPasso" class="tour-tooltip-texto"></p>
      <div class="tour-tooltip-footer">
        <span id="tourContador" class="tour-contador"></span>
        <div class="tour-tooltip-botoes">
          <button class="btn-pequeno" id="tourBtnVoltar" onclick="event.stopPropagation(); voltarPassoTour()">Voltar</button>
          <button class="btn-primary" id="tourBtnProximo" onclick="event.stopPropagation(); avancarPassoTour()">Próximo</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Impede que qualquer clique dentro do overlay do tour (inclusive fora da
  // caixinha, sobre o "buraco" do spotlight) borbulhe até o listener global
  // de "clique fora fecha o dropdown" — ele fechava o menu no mesmo clique
  // usado para abrir/avançar o tour.
  overlay.addEventListener('click', (e) => e.stopPropagation());
}

function mostrarPassoTour() {
  const passo = tourPassosValidos[tourPassoAtual];
  const el = document.querySelector(passo.seletor);
  if (!el) { avancarPassoTour(); return; }

  if (elementoDentroDoMenu(el)) {
    garantirMenuAberto();
  } else {
    fecharMenu();
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Pequeno atraso pra esperar o scroll suave terminar antes de posicionar
  setTimeout(() => {
    const rect = el.getBoundingClientRect();
    const spot = document.getElementById('tourSpotlight');
    const pad = 8;
    spot.style.top = `${rect.top - pad}px`;
    spot.style.left = `${rect.left - pad}px`;
    spot.style.width = `${rect.width + pad * 2}px`;
    spot.style.height = `${rect.height + pad * 2}px`;

    document.getElementById('tourTituloPasso').textContent = passo.titulo;
    document.getElementById('tourTextoPasso').textContent = passo.texto;
    document.getElementById('tourContador').textContent = `${tourPassoAtual + 1} de ${tourPassosValidos.length}`;
    document.getElementById('tourBtnVoltar').style.visibility = tourPassoAtual === 0 ? 'hidden' : 'visible';
    document.getElementById('tourBtnProximo').textContent = (tourPassoAtual === tourPassosValidos.length - 1) ? 'Concluir' : 'Próximo';

    posicionarTooltipTour(rect, passo.posicao);
  }, 250);
}

function posicionarTooltipTour(rectAlvo, posicaoPreferida) {
  const tooltip = document.getElementById('tourTooltip');
  const margem = 16;
  const larguraTooltip = tooltip.offsetWidth || 320;
  const alturaTooltip = tooltip.offsetHeight || 160;

  let top, left;
  const posicao = window.innerWidth <= 600 ? 'baixo-mobile' : posicaoPreferida;

  switch (posicao) {
    case 'cima':
      top = rectAlvo.top - alturaTooltip - margem;
      left = rectAlvo.left + rectAlvo.width / 2 - larguraTooltip / 2;
      break;
    case 'esquerda':
      top = rectAlvo.top + rectAlvo.height / 2 - alturaTooltip / 2;
      left = rectAlvo.left - larguraTooltip - margem;
      break;
    case 'baixo-mobile':
      top = window.innerHeight - alturaTooltip - margem - 70; // acima do dock inferior
      left = window.innerWidth / 2 - larguraTooltip / 2;
      break;
    case 'baixo':
    default:
      top = rectAlvo.bottom + margem;
      left = rectAlvo.left + rectAlvo.width / 2 - larguraTooltip / 2;
  }

  // Mantém dentro da tela
  top = Math.max(margem, Math.min(top, window.innerHeight - alturaTooltip - margem));
  left = Math.max(margem, Math.min(left, window.innerWidth - larguraTooltip - margem));

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

function avancarPassoTour() {
  if (tourPassoAtual >= tourPassosValidos.length - 1) {
    encerrarTour();
    return;
  }
  tourPassoAtual++;
  mostrarPassoTour();
}

function voltarPassoTour() {
  if (tourPassoAtual === 0) return;
  tourPassoAtual--;
  mostrarPassoTour();
}

function encerrarTour() {
  const overlay = document.getElementById('tourOverlay');
  if (overlay) overlay.remove();

  // Fecha o menu que o tour tenha aberto, do jeito certo pra cada tamanho de tela
  const menu = document.getElementById('menuDropdown');
  if (menu) {
    if (window.innerWidth <= 800) {
      menu.classList.remove('menu-aberto');
      const overlayMenu = document.getElementById('menuOverlay');
      if (overlayMenu) overlayMenu.classList.remove('ativo');
    } else {
      menu.style.display = 'none';
    }
  }

  if (emailUsuario) {
    localStorage.setItem('tourVisto_' + emailUsuario, 'true');
  }
}

// ------ DISPARO AUTOMÁTICO NO PRIMEIRO ACESSO ------
function verificarPrimeiroAcessoTour() {
  if (!emailUsuario) return;
  const chave = 'tourVisto_' + emailUsuario;
  if (localStorage.getItem(chave)) return;

  // Espera a interface terminar de montar antes de iniciar
  setTimeout(() => {
    iniciarTour();
  }, 1200);
}
