let loadingButton = null;
// =========================
// FUNÇÕES UTILITÁRIAS
// =========================

function jsonp(url, callback) {
  const barra = document.getElementById('nprogress-bar');
  if (barra) { barra.style.width = '90%'; barra.style.opacity = '1'; }

  const btn = window._clickedButton;
  if (btn && typeof showButtonLoading === 'function') {
    showButtonLoading(btn);
  }

  function finalizar() {
    if (barra) { barra.style.width = '100%'; setTimeout(() => { barra.style.opacity = '0'; }, 200); }
    if (btn && typeof hideButtonLoading === 'function') {
      hideButtonLoading(btn);
    }
    window._clickedButton = null;
  }

  fetch(url)
    .then(resp => resp.json())
    .then(data => {
      finalizar();
      callback(data);
    })
    .catch(erro => {
      console.error('Erro na chamada à API:', erro);
      finalizar();
      callback({ erro: 'falha_rede' });
    });
}
// ------ POST sem esperar resposta (evita CORS) ------
function postSemResposta(dados, msgSucesso, callback) {
  const barra = document.getElementById('nprogress-bar');
  if (barra) { barra.style.width = '90%'; barra.style.opacity = '1'; }

  const btn = window._clickedButton;
  if (btn && typeof showButtonLoading === 'function') {
    showButtonLoading(btn);
  }

  fetch(API_URL, {
    method: "POST",
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(dados)
  })
  .then(() => {
    if (barra) { barra.style.width = '100%'; setTimeout(() => { barra.style.opacity = '0'; }, 200); }
    if (msgSucesso) mostrarToast(msgSucesso, 'success');
    if (callback) callback();
  })
  .catch(() => {
    if (barra) { barra.style.width = '100%'; setTimeout(() => { barra.style.opacity = '0'; }, 200); }
    mostrarToast("Erro de conexão.", "error");
  })
  .finally(() => {
    if (btn && typeof hideButtonLoading === 'function') {
      hideButtonLoading(btn);
    }
    window._clickedButton = null;
  });
}

// =========================
// BARRA DE PROGRESSO (NPROGRESS)
// =========================
function iniciarNProgress() {
  let barra = document.getElementById('nprogress');
  if (!barra) {
    barra = document.createElement('div');
    barra.id = 'nprogress';
    barra.innerHTML = '<div class="bar"></div>';
    document.body.appendChild(barra);
  }
  const bar = barra.querySelector('.bar');
  bar.style.width = '0%';
  // Força um reflow para reiniciar a animação
  bar.getBoundingClientRect();
  bar.style.width = '90%';
}

function finalizarNProgress() {
  const barra = document.getElementById('nprogress');
  if (!barra) return;
  const bar = barra.querySelector('.bar');
  bar.style.width = '100%';
  setTimeout(() => {
    barra.remove();
  }, 300);
}

// ------ POST sem esperar resposta (evita CORS) ------
function postSemResposta(dados, msgSucesso, callback) {
  const btn = window._clickedButton;
  if (btn && typeof showButtonLoading === 'function') {
    showButtonLoading(btn);
  }

  fetch(API_URL, {
    method: "POST",
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(dados)
  })
  .then(() => {
    if (msgSucesso) mostrarToast(msgSucesso, 'success');
    if (callback) callback();
  })
  .catch(() => {
    mostrarToast("Erro de conexão.", "error");
  })
  .finally(() => {
    if (btn && typeof hideButtonLoading === 'function') {
      hideButtonLoading(btn);
    }
    window._clickedButton = null;
  });
}

// ------ CACHE LOCAL (localStorage) ------
function salvarCache(chave, dados) {
  try {
    const item = {
      dados: dados,
      timestamp: Date.now()
    };
    localStorage.setItem(chave, JSON.stringify(item));
    return true;
  } catch (e) {
    console.warn('Erro ao salvar cache:', e);
    return false;
  }
}

function lerCache(chave) {
  const raw = localStorage.getItem(chave);
  if (!raw) return null;
  try {
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp > CACHE_TTL) {
      localStorage.removeItem(chave);
      return null;
    }
    return item.dados;
  } catch (e) {
    return null;
  }
}

function limparCacheTurmas(escola = null) {
  if (escola) {
    const chave = `cache_turmas_${escola}`;
    localStorage.removeItem(chave);
  } else {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_turmas_')) localStorage.removeItem(key);
    });
  }
}

function getChaveTurmasCache(escola) {
  return `cache_turmas_${escola || 'todas'}`;
}

// ------ TOAST NOTIFICATIONS ------
function mostrarToast(mensagem, tipo = 'info', duracao = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  let icone = '';
  switch (tipo) {
    case 'success': icone = '<i class="fas fa-check-circle"></i>'; break;
    case 'error': icone = '<i class="fas fa-exclamation-circle"></i>'; break;
    case 'warning': icone = '<i class="fas fa-exclamation-triangle"></i>'; break;
    default: icone = '<i class="fas fa-info-circle"></i>';
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `
    ${icone}
    <div class="toast-content">${mensagem}</div>
    <button class="toast-close"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  });

  const duracaoReal = (duracao !== undefined) ? duracao : 4000;

  if (duracaoReal > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, duracaoReal);
  }
}

// ------ LOADING SCREEN ------
function mostrarLoading() {
  document.getElementById("loading").style.display = "flex";
}

function esconderLoading() {
  document.getElementById("loading").style.display = "none";
}

// ------ LOADING NOS BOTÕES ------
function showButtonLoading(btn) {
  if (!btn) return;
  if (!btn.hasAttribute('data-original-html')) {
    btn.setAttribute('data-original-html', btn.innerHTML);
  }
  btn.disabled = true;
  const textSpan = btn.querySelector('.btn-text');
  const iconElement = btn.querySelector('i');
  const iconClass = iconElement ? iconElement.className : '';
  const spinner = document.createElement('span');
  spinner.className = 'spinner-btn';
  spinner.style.display = 'inline-block';
  if (textSpan) {
    textSpan.style.display = 'none';
    btn.appendChild(spinner);
  } else {
    btn.innerHTML = '';
    if (iconElement) {
      const newIcon = document.createElement('i');
      newIcon.className = iconClass;
      btn.appendChild(newIcon);
    }
    btn.appendChild(spinner);
  }
}

function hideButtonLoading(btn) {
  if (!btn) return;
  const originalHTML = btn.getAttribute('data-original-html');
  if (originalHTML) {
    btn.innerHTML = originalHTML;
    btn.removeAttribute('data-original-html');
  }
  btn.disabled = false;
}

// ------ DEBOUNCE ------
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// ------ NORMALIZAR TEXTO ------
function normalizarTexto(str) {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

// ------ MÁSCARAS ------
function aplicarMascaraCPF(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length > 11) valor = valor.slice(0, 11);
  if (valor.length > 9) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else if (valor.length > 3) {
    valor = valor.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
  }
  input.value = valor;
}

function aplicarMascaraTelefone(event) {
  let valor = event.target.value.replace(/\D/g, '');
  if (valor.length > 11) valor = valor.slice(0, 11);
  if (valor.length > 10) {
    valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (valor.length > 6) {
    valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (valor.length > 2) {
    valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
  } else if (valor.length > 0) {
    valor = valor.replace(/^(\d*)/, '($1');
  }
  event.target.value = valor;
}

function extrairPrimeiroTelefone(telefones) {
  if (!telefones) return '';
  const match = telefones.match(/\(?\d{2}\)?\s?\d{4,5}-?\d{4}/);
  return match ? match[0] : telefones.split(/[e\s]+/)[0];
}

// ------ STATUS DE ÍCONES DE DOCUMENTOS ------
function getDocIconStatus(entregue, prazoFinal, nomeDoc) {
  let statusTexto;
  let dataVenc = '';

  if (entregue) {
    statusTexto = '✓ Entregue';
  } else {
    if (prazoFinal) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const prazo = new Date(prazoFinal);
      prazo.setHours(0, 0, 0, 0);

      // Formata a data de vencimento no padrão brasileiro
      const dia = String(prazo.getDate()).padStart(2, '0');
      const mes = String(prazo.getMonth() + 1).padStart(2, '0');
      const ano = prazo.getFullYear();
      dataVenc = ` (vence ${dia}/${mes}/${ano})`;

      if (prazo < hoje) {
        statusTexto = '✗ Vencido';
      } else {
        statusTexto = '⏳ Pendente';
      }
    } else {
      statusTexto = '⏳ Pendente';
    }
  }

  return {
    classe: entregue ? 'entregue' : (statusTexto.includes('Vencido') ? 'vencido' : 'pendente'),
    tooltip: `${nomeDoc}\n${statusTexto}${dataVenc}`
  };
}

// ------ VERIFICAÇÃO DE MÚLTIPLOS PERFIS ------
// Use estas funções (em vez de comparar perfilUsuario === 'X') sempre que um
// recurso deve ficar visível para um perfil que NÃO é o de maior prioridade
// (ex: um recurso exclusivo de PEDAGOGICO deve aparecer mesmo se o usuário
// também for SECRETARIA, já que perfilUsuario nesse caso vira "SECRETARIA").
function temPerfilUsuario(perfil) {
  return Array.isArray(perfisUsuario) && perfisUsuario.includes(perfil);
}
function algumPerfilUsuario(perfis) {
  return Array.isArray(perfisUsuario) && perfis.some(p => perfisUsuario.includes(p));
}

// ------ ESCOLAS PERMITIDAS ------
function getEscolasPermitidas() {
  if (emailUsuario === 'eder.ramos@educador.edu.es.gov.br') {
    return LISTA_ESCOLAS.slice();
  }
  if (perfilUsuario === 'SUPERVISOR') {
    return window.escolasSupervisionadas || [];
  }
  if (perfilUsuario === 'SECRETARIA' || perfilUsuario === 'PEDAGOGICO') {
    return escolaUsuario ? [escolaUsuario] : [];
  }
  return [];
}

function aplicarMascaraData(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length > 8) valor = valor.slice(0, 8);
  let resultado = '';
  if (valor.length > 0) resultado = valor.substring(0, 2);
  if (valor.length > 2) resultado += '/' + valor.substring(2, 4);
  if (valor.length > 4) resultado += '/' + valor.substring(4, 8);
  input.value = resultado;
}

function aplicarMascaraHora(input) {
  let valor = input.value.replace(/\D/g, '');
  if (valor.length > 4) valor = valor.slice(0, 4);
  let resultado = '';
  if (valor.length > 0) resultado = valor.substring(0, 2);
  if (valor.length > 2) resultado += ':' + valor.substring(2, 4);
  input.value = resultado;
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(10))) return false;
  return true;
}

function normalizarRacaCor(valor) {
  if (!valor) return '';
  const v = valor.trim().toUpperCase();
  const mapa = {
    'PARDA': 'Pardo',
    'BRANCA': 'Branco',
    'PRETA': 'Preto',
    'INDÍGENA': 'Indígena',
    'AMARELA': 'Amarelo'
  };
  return mapa[v] || '';
}

/**
 * Ativa o acionamento de busca/filtro ao pressionar Enter nos campos de um container.
 */
function ativarEnterNoModal(containerSelector, callback) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.querySelectorAll('input, select').forEach(el => {
    if (el.dataset.enterListener === 'true') return;
    el.dataset.enterListener = 'true';
    el.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (typeof callback === 'function') callback();
      }
    });
  });
}

/**
 * Converte uma data de string para o formato ISO (YYYY-MM-DD).
 */
function parseDataCSV(str) {
  if (!str) return '';
  const limpo = str.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) return limpo;
  const partes = limpo.split(/[/-]/);
  if (partes.length === 3) {
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const ano = partes[2].length === 2 ? '20' + partes[2] : partes[2];
    return `${ano}-${mes}-${dia}`;
  }
  return '';
}

function formatarDataISO(dataStr) {
  if (!dataStr) return '';
  if (dataStr instanceof Date) {
    const ano = dataStr.getFullYear();
    const mes = String(dataStr.getMonth() + 1).padStart(2, '0');
    const dia = String(dataStr.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
  const limpo = dataStr.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(limpo)) return limpo.substring(0, 10);
  const partes = limpo.split(/[/-]/);
  if (partes.length === 3) {
    const dia = partes[0].padStart(2, '0');
    const mes = partes[1].padStart(2, '0');
    const ano = partes[2].length === 2 ? '20' + partes[2] : partes[2];
    return `${ano}-${mes}-${dia}`;
  }
  return limpo;
}

function gerarLinkWhatsApp(aluno) {
  const docsPendentes = [];
  CONFIG_DOCS_CARD.forEach(doc => {
    if (doc.coluna === 'RG') return;
    if (aluno[doc.coluna] !== true) {
      docsPendentes.push(doc.label);
    }
  });

  if (docsPendentes.length === 0) {
    return { url: null, pendentes: [], mensagem: '' };
  }

  const telefone = aluno.TELEFONE ? aluno.TELEFONE.replace(/\D/g, '') : '';
  let url = null;
  const listaDocs = docsPendentes.join(', ');
  const mensagem = `Olá! A escola ${aluno.ESCOLA} informa que o(a) aluno(a) ${aluno.ALUNO} está com os seguintes documentos pendentes: ${listaDocs}. Por favor, regularize o quanto antes. Obrigado!`;

  if (telefone) {
    let numero = telefone;
    if (numero.startsWith('0')) numero = numero.substring(1);
    if (!numero.startsWith('55')) numero = '55' + numero;
    url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  }

  return { url, pendentes: docsPendentes, mensagem };
}
// =========================
// COMPARTILHAR LEGISLAÇÃO
// =========================
function compartilharLegislacao(item) {
  // Monta os dados para compartilhamento
  const titulo = `${item.tipo} ${item.numero}/${item.ano}`;
  const texto = `${titulo} - ${item.assunto || 'Sem assunto'}`;
  
  // Link para visualização do PDF (se existir)
  const viewUrl = item.arquivoId 
    ? `https://drive.google.com/file/d/${item.arquivoId}/view` 
    : '';
  
  // Texto completo para compartilhar
  const shareText = `📜 ${texto}\n\n${viewUrl ? `🔗 Acesse o documento: ${viewUrl}` : 'Documento sem PDF anexado.'}`;

  // Verifica se a API Web Share está disponível
  if (navigator.share) {
    navigator.share({
      title: titulo,
      text: shareText,
      url: viewUrl || window.location.href
    })
    .then(() => mostrarToast('Compartilhado com sucesso!', 'success'))
    .catch(err => {
      if (err.name !== 'AbortError') {
        // Se falhar (ex.: navegador não suporta), copia para área de transferência
        copiarTexto(shareText);
      }
    });
  } else {
    // Fallback: copia o texto para a área de transferência
    copiarTexto(shareText);
  }
}

// Função auxiliar para copiar texto
function copiarTexto(texto) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto)
      .then(() => mostrarToast('Link copiado! Cole no aplicativo desejado.', 'success'))
      .catch(() => mostrarToast('Não foi possível copiar o link.', 'error'));
  } else {
    // Fallback para navegadores antigos
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      mostrarToast('Link copiado! Cole no aplicativo desejado.', 'success');
    } catch (e) {
      mostrarToast('Não foi possível copiar o link.', 'error');
    }
    document.body.removeChild(textarea);
  }
}
