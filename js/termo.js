// js/termo.js
let arquivoTermoSelecionado = null;

const MESES_POR_EXTENSO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

function formatarDataPorExtenso(data) {
  const dia = data.getDate();
  const mes = MESES_POR_EXTENSO[data.getMonth()];
  const ano = data.getFullYear();
  return `${dia} de ${mes} de ${ano}`;
}

// ------ PREENCHIMENTO AUTOMÁTICO DO TERMO ------
// Tenta pré-preencher nome/cargo/escola com o que já se sabe do usuário logado.
// Os campos continuam editáveis — isso é só um atalho, não uma trava.
function prepararFormularioTermo() {
  const mapaFuncao = {
    SUPERVISOR: 'Supervisor(a)',
    SECRETARIA: 'Secretaria Escolar',
    PEDAGOGICO: 'Pedagógico(a)',
    DIRETOR: 'Diretor(a)'
  };

  const campoNome = document.getElementById('termoNome');
  const campoFuncao = document.getElementById('termoFuncao');
  const campoEscola = document.getElementById('termoEscola');
  const campoData = document.getElementById('termoData');

  // Popula o dropdown de escolas (uma vez só) com a lista oficial + SRE
  if (campoEscola && campoEscola.options.length <= 2 && typeof LISTA_ESCOLAS !== 'undefined') {
    const jaTem = new Set(Array.from(campoEscola.options).map(o => o.value));
    LISTA_ESCOLAS.forEach(esc => {
      if (!jaTem.has(esc)) {
        campoEscola.appendChild(new Option(esc, esc));
      }
    });
  }

  if (campoNome && !campoNome.value && typeof nomeUsuario !== 'undefined' && nomeUsuario) {
    campoNome.value = nomeUsuario;
  }
  if (campoFuncao && !campoFuncao.value && typeof perfilUsuario !== 'undefined' && perfilUsuario) {
    campoFuncao.value = mapaFuncao[perfilUsuario] || perfilUsuario;
  }
  if (campoEscola && !campoEscola.value) {
    if (typeof perfilUsuario !== 'undefined' && perfilUsuario === 'SUPERVISOR') {
      campoEscola.value = 'SRE Afonso Cláudio';
    } else if (typeof escolaUsuario !== 'undefined' && escolaUsuario) {
      campoEscola.value = escolaUsuario;
    }
  }
  if (campoData && !campoData.value) {
    campoData.value = formatarDataPorExtenso(new Date());
  }
}

// ------ GERAR PDF DO TERMO A PARTIR DO TEMPLATE ------
function gerarBaixarTermoPDF() {
  const nome = document.getElementById('termoNome').value.trim();
  const cpf = document.getElementById('termoCpf').value.trim();
  const funcao = document.getElementById('termoFuncao').value.trim();
  const escola = document.getElementById('termoEscola').value.trim();
  const cidade = document.getElementById('termoCidade').value.trim();
  const data = document.getElementById('termoData').value.trim();

  if (!nome || !cpf || !funcao || !escola || !cidade || !data) {
    mostrarToast('Preencha todos os campos do termo antes de gerar o PDF.', 'warning');
    return;
  }
  if (!validarCPF(cpf)) {
    mostrarToast('CPF inválido. Confira o número digitado.', 'warning');
    return;
  }

  window._clickedButton = document.getElementById('btnGerarTermoPDF');

  const url = `${API_URL}?tipo=gerarTermoPDF`
    + `&nome=${encodeURIComponent(nome)}`
    + `&cpf=${encodeURIComponent(cpf)}`
    + `&funcao=${encodeURIComponent(funcao)}`
    + `&escola=${encodeURIComponent(escola)}`
    + `&cidade=${encodeURIComponent(cidade)}`
    + `&data=${encodeURIComponent(data)}`;

  jsonp(url, function(resposta) {
    if (!resposta || resposta.erro || !resposta.pdfBase64) {
      mostrarToast('Não foi possível gerar o PDF do termo. Tente novamente.', 'error');
      return;
    }
    try {
      const bytes = atob(resposta.pdfBase64);
      const array = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) array[i] = bytes.charCodeAt(i);
      const blob = new Blob([array], { type: 'application/pdf' });
      const linkUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = linkUrl;
      a.download = resposta.nomeArquivo || 'Termo_Compromisso.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(linkUrl), 5000);

      mostrarToast('PDF gerado! Agora assine no e-docs e envie o arquivo assinado abaixo.', 'success');
    } catch (e) {
      console.error('Erro ao processar PDF do termo:', e);
      mostrarToast('Erro ao processar o PDF gerado.', 'error');
    }
  });
}

function validarArquivoTermo(input) {
  const file = input.files[0];
  const statusEl = document.getElementById('statusUploadTermo') || document.getElementById('statusUploadTermoRecusado');
  if (!file) {
    if (statusEl) statusEl.innerHTML = '';
    arquivoTermoSelecionado = null;
    return;
  }
  if (file.type !== 'application/pdf') {
    if (statusEl) statusEl.innerHTML = '<span style="color: #ef4444;">Apenas arquivos PDF são aceitos.</span>';
    input.value = '';
    arquivoTermoSelecionado = null;
    return;
  }
  if (statusEl) statusEl.innerHTML = `<span style="color: #10b981;">Arquivo selecionado: ${file.name}</span>`;
  arquivoTermoSelecionado = file;
}

async function enviarConsentimentoETermo() {
  if (!document.getElementById('aceiteLgpd').checked) {
    mostrarToast('Você precisa aceitar a Política de Privacidade.', 'warning');
    return;
  }
  if (!document.getElementById('aceiteTermo').checked) {
    mostrarToast('Você precisa aceitar o Termo de Compromisso.', 'warning');
    return;
  }
  if (!arquivoTermoSelecionado) {
    mostrarToast('Envie o Termo de Compromisso preenchido e assinado.', 'warning');
    return;
  }

  const btn = document.getElementById('btnEnviarConsentimento');
  if (!btn) {
    mostrarToast('Erro interno: botão não encontrado.', 'error');
    return;
  }

  // Feedback visual
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-btn"></span> Enviando...';

  try {
    let ip = 'N/A';
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch(e) {}

    await new Promise(resolve => {
      postSemResposta({
        acao: 'registrarConsentimento',
        email: emailUsuario,
        versao: '1.0',
        ip
      }, null, () => resolve());
    });

    const base64 = await lerArquivoBase64(arquivoTermoSelecionado);
    await new Promise(resolve => {
      postSemResposta({
        acao: 'uploadTermoCompromisso',
        email: emailUsuario,
        fileBase64: base64
      }, null, () => resolve());
    });

    // Fecha o modal
    document.getElementById('modalConsentimento').style.display = 'none';

    // Exibe o toast de confirmação
    mostrarToast('Documentos enviados com sucesso! Você receberá um e‑mail quando o acesso for aprovado.', 'success', 0);

    // Faz logout
    logout();

  } catch (e) {
    console.error(e);
    mostrarToast('Erro ao enviar documentos. Tente novamente.', 'error');
  } finally {
    // Restaura o botão
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Enviar e Aceitar';
  }
}


// ---------- Administrador ----------
function abrirModalAprovacaoTermos() {
  if (emailUsuario !== 'eder.ramos@educador.edu.es.gov.br') {
    mostrarToast('Apenas Administrador.', 'error');
    return;
  }
  document.getElementById('modalAprovacaoTermos').style.display = 'flex';
  carregarListaTermos();
}

function fecharModalAprovacaoTermos() {
  document.getElementById('modalAprovacaoTermos').style.display = 'none';
}

function carregarListaTermos() {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=listarTermos&email=${encodeURIComponent(emailUsuario)}`, function(termos) {
    esconderLoading();
    renderizarListaTermos(termos);
  });
}

function renderizarListaTermos(termos) {
  const container = document.getElementById('listaTermosContainer');
  if (!container) return;
  if (!termos || termos.length === 0) {
    container.innerHTML = '<p>Nenhum termo pendente.</p>';
    return;
  }
  let html = '<table style="width:100%; border-collapse:collapse; font-size:14px;">';
  html += '<thead><tr><th>Usuário</th><th>Data Envio</th><th>Status</th><th>Arquivo</th><th>Ações</th></tr></thead><tbody>';
  termos.forEach(t => {
    html += `<tr>
      <td>${t.email}</td>
      <td>${t.dataEnvio ? new Date(t.dataEnvio).toLocaleString('pt-BR') : ''}</td>
      <td>${t.status}</td>
      <td><a href="${t.viewUrl}" target="_blank">Visualizar</a></td>
      <td>`;
    if (t.status === 'pendente') {
      html += `<button class="btn-pequeno" onclick="aprovarTermo('${t.email}')">Aprovar</button>
               <button class="btn-pequeno" onclick="recusarTermo('${t.email}')">Recusar</button>`;
    }
    html += `</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}

function aprovarTermo(emailAlvo) {
  if (!confirm(`Aprovar termo de ${emailAlvo}?`)) return;
  const botoes = document.querySelectorAll(`button[onclick*="${emailAlvo}"]`);
  botoes.forEach(btn => { if (btn.textContent.includes('Aprovar')) btn.disabled = true; });

  postSemResposta({
    acao: 'aprovarTermo',
    emailAdmin: emailUsuario,
    emailAlvo: emailAlvo,
    decisao: 'aprovar'
  }, 'Termo aprovado! E-mail enviado ao usuário.', () => {
    carregarListaTermos();
  });
  setTimeout(() => carregarListaTermos(), 1500);
}

function recusarTermo(emailAlvo) {
  const motivo = prompt('Motivo da recusa (opcional):');
  if (motivo === null) return;
  const botoes = document.querySelectorAll(`button[onclick*="${emailAlvo}"]`);
  botoes.forEach(btn => { if (btn.textContent.includes('Recusar')) btn.disabled = true; });

  postSemResposta({
    acao: 'aprovarTermo',
    emailAdmin: emailUsuario,
    emailAlvo: emailAlvo,
    decisao: 'recusar',
    obs: motivo || ''
  }, 'Termo recusado.', () => {
    carregarListaTermos();
  });
  setTimeout(() => carregarListaTermos(), 1500);
}

// Auxiliar base64 (se não existir)
function lerArquivoBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// Tela de "aguardando aprovação" (termo enviado, ainda não avaliado pelo
// supervisor). Estas duas funções eram chamadas por verificarStatusTermoEAcessar()
// (js/data.js) mas nunca haviam sido definidas em lugar nenhum do código — ao
// serem chamadas, isso gerava um ReferenceError dentro do callback de sucesso
// do jsonp(), que era capturado pelo .catch() interno do jsonp e reexecutava o
// MESMO callback com {erro:'falha_rede'}. Como esse retorno não tem
// "res.enviado", o fluxo caía no "else" final e reabria o modalConsentimento
// completo (LGPD + termo do zero) em vez de mostrar a tela de espera — este
// era o motivo de o modal reaparecer depois do reenvio do termo corrigido.
function exibirTelaEsperaAprovacao() {
  const msgEspera = document.getElementById('mensagemEspera');
  if (!msgEspera) return;
  msgEspera.style.display = 'block';
  msgEspera.innerHTML = `
    <h2><i class="fas fa-hourglass-half"></i> Aguardando aprovação</h2>
    <p style="color: var(--text-secondary);">Seu termo de compromisso foi enviado e está aguardando a aprovação do supervisor.</p>
    <p style="color: var(--text-muted);">Você receberá um e-mail assim que ele for avaliado.</p>
    <button class="btn-cancelar" onclick="logout()" style="margin-top: 12px;">Sair</button>
  `;
  const telaRecusado = document.getElementById('telaTermoRecusado');
  if (telaRecusado) telaRecusado.style.display = 'none';
}

function removerTelaEspera() {
  const msgEspera = document.getElementById('mensagemEspera');
  if (msgEspera) msgEspera.style.display = 'none';
  const telaRecusado = document.getElementById('telaTermoRecusado');
  if (telaRecusado) telaRecusado.style.display = 'none';

  // Restaura os componentes que verificarStatusTermoEAcessar() havia escondido
  const idsParaMostrar = ['painel', 'lista', 'paginacao', 'muralComunicados'];
  idsParaMostrar.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  const barraTitulo = document.querySelector('#app > div[style*="justify-content: space-between"]');
  if (barraTitulo) barraTitulo.style.display = '';
}

function exibirTelaRecusado(motivo) {
  // Esconde a tela de espera e garante que o app esteja visível
  const msgEspera = document.getElementById('mensagemEspera');
  if (msgEspera) msgEspera.style.display = 'none';
  document.getElementById('app').style.display = 'block';

  // Remove a tela de espera padrão e injeta a interface de reenvio
  let tela = document.getElementById('telaTermoRecusado');
  if (!tela) {
    tela = document.createElement('div');
    tela.id = 'telaTermoRecusado';
    tela.style.cssText = 'text-align:center; padding:40px 20px; max-width:500px; margin:0 auto;';
    document.getElementById('app').appendChild(tela);
  }
  tela.style.display = 'block';
  tela.innerHTML = `
    <h2 style="color:#dc2626;"><i class="fas fa-exclamation-triangle"></i> Termo Recusado</h2>
    <p style="color: var(--text-secondary);">Seu termo de compromisso foi recusado pelo supervisor.</p>
    ${motivo ? `<p style="background:#fee2e2; padding:12px; border-radius:8px; color:#991b1b;"><strong>Motivo:</strong> ${motivo}</p>` : ''}
    <p style="color: var(--text-muted);">Por favor, corrija os apontamentos e reenvie o arquivo corrigido.</p>
    <div style="margin-top: 24px;">
      <input type="file" id="novoArquivoTermo" accept=".pdf" onchange="validarArquivoTermo(this)" style="display:block; margin: 0 auto 16px;">
      <p id="statusUploadTermoRecusado" style="font-size:13px; color: var(--text-muted);"></p>
      <button class="btn-salvar" id="btnReenviarTermo" onclick="reenviarTermo()">
        <i class="fas fa-paper-plane"></i> Reenviar Termo Corrigido
      </button>
      <button class="btn-cancelar" onclick="logout()" style="margin-top: 12px;">Sair</button>
    </div>
  `;
}

function reenviarTermo() {
  const fileInput = document.getElementById('novoArquivoTermo');
  const file = fileInput.files[0];
  if (!file) {
    mostrarToast('Selecione o arquivo PDF corrigido.', 'warning');
    return;
  }
  if (file.type !== 'application/pdf') {
    mostrarToast('Apenas arquivos PDF são aceitos.', 'warning');
    return;
  }

  const btn = document.getElementById('btnReenviarTermo');
  showButtonLoading(btn);

  lerArquivoBase64(file).then(base64 => {
    postSemResposta({
      acao: 'uploadTermoCompromisso',
      email: emailUsuario,
      fileBase64: base64
    }, null, () => {
      hideButtonLoading(btn);
      mostrarToast('Termo reenviado com sucesso! Aguardando nova avaliação.', 'success');
      // Volta para a tela de espera (verificação de status)
      verificarStatusTermoEAcessar();
    });
  }).catch(() => {
    mostrarToast('Erro ao ler o arquivo.', 'error');
    hideButtonLoading(btn);
  });
}
