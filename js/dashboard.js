// =========================
// DASHBOARD DE PENDÊNCIAS
// =========================

function abrirModalDashboard() {
  document.getElementById('modalDashboard').style.display = 'flex';
  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('dashboardFiltroEscolaWrapper').style.display = 'block';
    carregarEscolasDashboard();
  } else {
    document.getElementById('dashboardFiltroEscolaWrapper').style.display = 'none';
  }
  carregarDashboard();
}

function fecharModalDashboard() {
  document.getElementById('modalDashboard').style.display = 'none';
}

// Fechar com Esc e clique fora: tratado de forma central em main.js
// (função obterModaisEPaginasAbertos), não precisa de listener aqui.

function carregarEscolasDashboard() {
  const select = document.getElementById('dashboardFiltroEscola');
  select.innerHTML = '<option value="">Todas as escolas</option>';
  const escolas = getEscolasPermitidas();
  escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
}

function carregarDashboard() {
  mostrarLoading();
  const filtroEscola = document.getElementById('dashboardFiltroEscola')?.value || '';
  const url = `${API_URL}?tipo=dashboard&email=${emailUsuario}&escola=${encodeURIComponent(filtroEscola)}&_=${Date.now()}`;
  
  jsonp(url, function(dados) {
    esconderLoading();
    if (dados.erro) {
      document.getElementById('dashboardContainer').innerHTML = '<p>Erro ao carregar dados.</p>';
      return;
    }
    if (!dados || dados.length === 0) {
      document.getElementById('dashboardContainer').innerHTML = '<p>Nenhum dado disponível.</p>';
      return;
    }

    let html = '<table>';
    html += '<thead><tr><th>Turma</th><th>Total</th><th>✅</th><th>⚠️</th><th>🔴</th><th>Doc. pendentes (top 3)</th></tr></thead><tbody>';
    
    dados.forEach(linha => {
      const faltas = linha.topFaltas.length ? linha.topFaltas.join(', ') : '–';
      html += `<tr class="linha-dashboard" data-escola="${linha.escola}" data-turma="${linha.turma}" style="cursor: pointer;">
        <td><strong>${linha.escola} <br> ${linha.turma}</strong></td>
        <td>${linha.total}</td>
        <td style="color:#10b981;">${linha.completos}</td>
        <td class="dashboard-pending"><strong>${linha.pendentes}</strong></td>
        <td class="dashboard-vencidos"><strong>${linha.vencidos}</strong></td>
        <td class="dashboard-faltas">${faltas}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    
    // ÚNICA atribuição do innerHTML
    document.getElementById('dashboardContainer').innerHTML = html;

    // Adicionar eventos de clique nas linhas (após o DOM existir)
    document.querySelectorAll('#dashboardContainer tr.linha-dashboard').forEach(linha => {
      linha.addEventListener('click', function() {
        const escola = this.dataset.escola;
        const turma = this.dataset.turma;
        abrirChecklistPorDashboard(escola, turma);
      });
    });
  });
}

async function abrirChecklistPorDashboard(escola, turma) {
  // Fecha o Dashboard para não sobrepor o Checklist
  fecharModalDashboard();

  if (perfilUsuario === 'SECRETARIA' && escola !== escolaUsuario) {
    mostrarToast('Você só pode acessar o checklist da sua escola.', 'warning');
    return;
  }

  // Abre o modal de checklist diretamente
  const modal = document.getElementById('modalChecklistLote');
  if (modal) modal.style.display = 'flex';

  // Atualiza o nome da escola exibido no modal
  const escolaSpan = document.getElementById('escolaAtualChecklist');
  if (escolaSpan) escolaSpan.textContent = escola;

  // Preenche o select com a turma desejada
  const selectTurma = document.getElementById('selectTurmaChecklist');
  if (!selectTurma) return;
  selectTurma.innerHTML = `<option value="${turma}">${turma}</option>`;
  selectTurma.value = turma;

  // Aguarda o DOM do modal se estabilizar e carrega os alunos
  await new Promise(resolve => setTimeout(resolve, 200));
  if (typeof carregarAlunosParaChecklist === 'function') {
    carregarAlunosParaChecklist();
  }
}

function exportarDashboardPDF() {
  const container = document.getElementById('dashboardContainer');
  if (!container || !container.innerHTML) {
    return mostrarToast('Nada para exportar.', 'warning');
  }

  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`
    <html>
    <head>
      <title>Dashboard de Pendências</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h2 { color: #1e3a8a; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { background: #f1f5f9; padding: 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .dashboard-pending strong { color: #d97706; }
        .dashboard-vencidos strong { color: #dc2626; }
        .dashboard-faltas { font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <h2>📊 Dashboard de Pendências</h2>
      ${container.innerHTML}
      <p style="margin-top: 16px; color: #64748b;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </body>
    </html>
  `);
  w.document.close();
  setTimeout(() => w.print(), 500);
}
