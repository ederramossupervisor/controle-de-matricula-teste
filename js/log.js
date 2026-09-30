// js/log.js
let logsGlobais = [];
let logsFiltrados = [];

function abrirModalHistorico() {
  document.getElementById('modalHistorico').style.display = 'flex';
  carregarLogAcoes();
}

function fecharModalHistorico() {
  document.getElementById('modalHistorico').style.display = 'none';
}

function carregarLogAcoes() {
  if (!emailUsuario) return;
  mostrarLoading();
  const url = API_URL + '?tipo=logAcoes&email=' + encodeURIComponent(emailUsuario) + '&limite=200';

  jsonp(url, function(resposta) {
    esconderLoading();
    if (resposta && resposta.erro) {
      mostrarToast(resposta.erro, 'error');
      return;
    }
    logsGlobais = Array.isArray(resposta) ? resposta : (resposta.logs || []);
    logsFiltrados = [...logsGlobais];
    renderizarLogAcoes(logsFiltrados);
  });
}

function filtrarLogs() {
  const termo = document.getElementById('buscaHistorico').value.trim().toLowerCase();
  if (!termo) {
    logsFiltrados = [...logsGlobais];
  } else {
    logsFiltrados = logsGlobais.filter(log =>
      (log.acao || '').toLowerCase().includes(termo) ||
      (log.usuario || '').toLowerCase().includes(termo) ||
      (log.detalhes || '').toLowerCase().includes(termo)
    );
  }
  renderizarLogAcoes(logsFiltrados);
}

function renderizarLogAcoes(logs) {
  const container = document.getElementById('conteudoLog');
  if (!container) return;

  if (!logs || logs.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px; color: var(--text-muted);">Nenhuma ação encontrada.</p>';
    return;
  }

  let html = `<table id="tabelaHistorico">
    <thead>
      <tr>
        <th>Data/Hora</th>
        <th>Usuário</th>
        <th>Ação</th>
        <th>Detalhes</th>
      </tr>
    </thead>
    <tbody>`;

  logs.forEach(log => {
    const data = log.dataHora ? new Date(log.dataHora).toLocaleString('pt-BR') : '—';
    html += `<tr>
      <td class="data-hora" data-label="Data/Hora">${data}</td>
      <td data-label="Usuário">${log.usuario || '—'}</td>
      <td data-label="Ação">${log.acao || '—'}</td>
      <td class="detalhes" data-label="Detalhes" title="${log.detalhes || ''}">${log.detalhes || '—'}</td>
    </tr>`;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

// Log automático via registrarUltimaAcao (opcional)
function registrarLogNoServidor(acao, detalhes) {
  if (!emailUsuario) return;
  postSemResposta({
    acao: 'registrarLogAcao',
    email: emailUsuario,
    acaoLog: acao,
    detalhes: detalhes || ''
  }, null);
}

if (typeof registrarUltimaAcao === 'function') {
  const _original = registrarUltimaAcao;
  registrarUltimaAcao = function(descricao) {
    _original(descricao);
    registrarLogNoServidor(descricao);
  };
}
