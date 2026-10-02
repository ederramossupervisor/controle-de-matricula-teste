// Variáveis para armazenar os dados parseados
let profissionaisImportados = [];

// =========================
// ABRIR / FECHAR MODAL
// =========================
function abrirModalImportacaoProfissionais() {
  // Apenas secretários e supervisores podem importar
  if (perfilUsuario === 'PEDAGOGICO') {
    mostrarToast('Perfil pedagógico não pode importar profissionais.', 'warning');
    return;
  }
  document.getElementById('modalImportacaoProfissionais').style.display = 'flex';
  document.getElementById('arquivoCSVProfissionais').value = '';
  document.getElementById('previewProfissionaisContainer').innerHTML = '<p style="padding:16px;color:var(--text-muted);">Selecione um arquivo CSV para visualizar os dados.</p>';
  document.getElementById('btnExecutarImportProfissionais').disabled = true;
}

function fecharModalImportacaoProfissionais() {
  document.getElementById('modalImportacaoProfissionais').style.display = 'none';
}

// =========================
// PROCESSAR CSV
// =========================
function processarCSVProfissionais() {
  const fileInput = document.getElementById('arquivoCSVProfissionais');
  const file = fileInput.files[0];
  if (!file) {
    mostrarToast('Selecione um arquivo CSV.', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const csvText = e.target.result;
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      delimiter: ";",
      complete: function(results) {
        const dados = results.data;
        if (dados.length === 0) {
          mostrarToast('Nenhum dado encontrado no CSV.', 'warning');
          return;
        }
        profissionaisImportados = dados.map(linha => ({
          id: linha['id'] || '',
          nome: linha['Nome do profissional'] || '',
          // ... (inclua todas as colunas que quiser exibir na pré-visualização)
          // Para simplificar, vamos manter todos os campos do CSV no objeto.
          // O backend fará o mapeamento completo.
          ...linha
        })).filter(a => a.nome);

        renderizarPreviewProfissionais(profissionaisImportados);
        document.getElementById('btnExecutarImportProfissionais').disabled = (profissionaisImportados.length === 0);
      },
      error: function(err) {
        mostrarToast('Erro ao processar CSV: ' + err, 'error');
      }
    });
  };
  reader.readAsText(file, 'ISO-8859-1'); // ou 'UTF-8' dependendo da exportação
}

function renderizarPreviewProfissionais(lista) {
  const container = document.getElementById('previewProfissionaisContainer');
  if (lista.length === 0) {
    container.innerHTML = '<p style="padding:16px;color:#dc2626;">Nenhum profissional válido encontrado.</p>';
    return;
  }

  let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
  html += '<thead><tr style="background:#f1f5f9;">';
  html += '<th>ID</th><th>Nome</th><th>Cargo</th><th>Regime</th><th>Matrícula</th>';
  html += '</tr></thead><tbody>';
  lista.slice(0, 50).forEach(p => {
    html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
    html += `<td>${p.id || '-'}</td><td>${p.nome || p['Nome do profissional'] || '-'}</td>`;
    html += `<td>${p['Descrição Cargo'] || p.CARGO || '-'}</td>`;
    html += `<td>${p['Regime Trabalho'] || p.REGIME || '-'}</td>`;
    html += `<td>${p['Matrícula'] || p.MATRICULA || '-'}</td>`;
    html += `</tr>`;
  });
  html += '</tbody></table>';
  if (lista.length > 50) html += '<p style="padding:8px;">Exibindo 50 de ' + lista.length + ' profissionais.</p>';
  container.innerHTML = html;
}

// =========================
// EXECUTAR IMPORTAÇÃO
// =========================
async function executarImportacaoProfissionais() {
  if (profissionaisImportados.length === 0) {
    mostrarToast('Nenhum profissional para importar.', 'warning');
    return;
  }

  const btn = document.getElementById('btnExecutarImportProfissionais');
  showButtonLoading(btn);
  try {
    const r = await importarProfissionaisSb(profissionaisImportados);
    const ignorados = r.falhas + r.naoPermitidos;
    let msg = `${r.processados} profissionais importados/atualizados.`;
    if (r.falhas) msg += ` ${r.falhas} sem ID, nome ou local de trabalho.`;
    if (r.naoPermitidos) msg += ` ${r.naoPermitidos} de escolas que você não pode alterar.`;
    mostrarToast(msg, ignorados ? 'warning' : 'success');
    profissionaisImportados = [];
    fecharModalImportacaoProfissionais();
    if (typeof carregarProfissionais === 'function') carregarProfissionais();
  } catch (e) {
    console.error('Erro ao importar profissionais:', e);
    mostrarToast('Erro na importação: ' + (e.message || 'falha desconhecida'), 'error');
  } finally {
    hideButtonLoading(btn);
  }
}
