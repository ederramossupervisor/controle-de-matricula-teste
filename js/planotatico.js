// js/planotatico.js
// Módulo de preenchimento do Plano Tático (indicadores mensais)

function abrirModalPlanoTaticoMensal() {
  if (!algumPerfilUsuario(['PEDAGOGICO', 'SUPERVISOR'])) {
    mostrarToast('Acesso restrito a pedagogos e supervisores.', 'warning');
    return;
  }

  document.getElementById('modalPlanoTaticoMensal').style.display = 'flex';

  // Limpa campos
  document.getElementById('planoTaticoMes').value = '';
  document.getElementById('planoTaticoFrequencia').value = '';
  document.getElementById('planoTaticoTutoria').value = '';

  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('planoTaticoEscolaWrapper').style.display = 'block';
    preencherSelectEscolasPlanoTatico();
  } else {
    document.getElementById('planoTaticoEscolaWrapper').style.display = 'none';
  }

  // Associa o evento onchange do seletor de mês para carregar dados existentes
  document.getElementById('planoTaticoMes').onchange = function() {
    carregarDadosMensais();
  };
}

function carregarDadosMensais() {
  const mes = document.getElementById('planoTaticoMes').value;
  if (!mes) return;

  mostrarLoading();
  jsonp(`${API_URL}?tipo=indicadoresMensais&email=${encodeURIComponent(emailUsuario)}`, function(dados) {
    esconderLoading();
    if (dados && dados.meses && dados.meses[mes]) {
      const info = dados.meses[mes];
      if (info.frequencia !== null) {
        document.getElementById('planoTaticoFrequencia').value = info.frequencia;
      }
      if (info.tutoria) {
        document.getElementById('planoTaticoTutoria').value = info.tutoria;
      }
    } else {
      // Limpa se não houver dados para o mês
      document.getElementById('planoTaticoFrequencia').value = '';
      document.getElementById('planoTaticoTutoria').value = '';
    }
  });
}

function fecharModalPlanoTaticoMensal() {
  document.getElementById('modalPlanoTaticoMensal').style.display = 'none';
  limparInputsArquivo('modalPlanoTaticoMensal');
}

function preencherSelectEscolasPlanoTatico() {
  const select = document.getElementById('planoTaticoEscola');
  const escolas = getEscolasPermitidas();
  select.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(escola => {
    const opt = document.createElement('option');
    opt.value = escola;
    opt.textContent = escola;
    select.appendChild(opt);
  });
}

async function salvarPlanoTaticoMensal() {
  const mes = document.getElementById('planoTaticoMes').value;
  const frequencia = document.getElementById('planoTaticoFrequencia').value.trim();
  const tutoria = document.getElementById('planoTaticoTutoria').value;
  let escola = '';

  if (perfilUsuario === 'SUPERVISOR') {
    escola = document.getElementById('planoTaticoEscola').value;
    if (!escola) {
      mostrarToast('Selecione a escola.', 'warning');
      return;
    }
  }

  if (!mes) {
    mostrarToast('Selecione o mês.', 'warning');
    return;
  }

  if (frequencia === '' && tutoria === '') {
    mostrarToast('Preencha ao menos um dos indicadores.', 'warning');
    return;
  }

  const btn = document.getElementById('btnSalvarPlanoTaticoMensal');
  showButtonLoading(btn);

  // 1. Salva os indicadores mensais
  const dadosIndicador = {
    acao: 'salvarIndicadorMensalFrequencia',
    email: emailUsuario,
    mes: mes,
    frequencia: frequencia || '0',
    tutoria: tutoria || '',
    escola: escola
  };

  await new Promise(resolve => {
    postSemResposta(dadosIndicador, null, () => resolve());
  });

  // 2. Envia evidências, se houver
  const freqFile = document.getElementById('ptMensalEvidenciaFreq').files[0];
  const tutFile = document.getElementById('ptMensalEvidenciaTut').files[0];

  try {
    if (freqFile) {
      const base64 = await lerArquivoBase64(freqFile);
      await new Promise(resolve => {
        postSemResposta({
          acao: 'uploadEvidenciaPT',
          email: emailUsuario,
          escola: escola,
          tipo: 'mensal',
          periodo: mes,
          indicador: 'frequencia',
          fileBase64: base64,
          fileName: freqFile.name,
          mimeType: freqFile.type
        }, null, () => resolve());
      });
    }

    if (tutFile) {
      const base64 = await lerArquivoBase64(tutFile);
      await new Promise(resolve => {
        postSemResposta({
          acao: 'uploadEvidenciaPT',
          email: emailUsuario,
          escola: escola,
          tipo: 'mensal',
          periodo: mes,
          indicador: 'tutoria',
          fileBase64: base64,
          fileName: tutFile.name,
          mimeType: tutFile.type
        }, null, () => resolve());
      });
    }

    mostrarToast('Indicadores e evidências salvos com sucesso!', 'success');
    hideButtonLoading(btn);
    fecharModalPlanoTaticoMensal();
  } catch (e) {
    hideButtonLoading(btn);
    mostrarToast('Indicadores salvos, mas houve erro ao enviar evidências.', 'warning');
  }
}
// =========================
// INDICADORES TRIMESTRAIS
// =========================

function abrirModalPlanoTaticoTrimestral() {
  if (!algumPerfilUsuario(['PEDAGOGICO', 'SUPERVISOR'])) {
    mostrarToast('Acesso restrito a pedagogos e supervisores.', 'warning');
    return;
  }

  document.getElementById('modalPlanoTaticoTrimestral').style.display = 'flex';

  // Limpa campos
  document.getElementById('planoTaticoTrimestre').value = '';
  document.getElementById('ptrimEstrategiasIntervencao').value = '';
  document.getElementById('ptrimRpePortugues').value = '';
  document.getElementById('ptrimRpeMatematica').value = '';
  document.getElementById('ptrimAcoesPedagogicas').value = '';
  document.getElementById('ptrimFormacaoLP').value = '';
  document.getElementById('ptrimFormacaoMAT').value = '';

  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('planoTaticoTrimEscolaWrapper').style.display = 'block';
    preencherSelectEscolasPlanoTaticoTrim();
  } else {
    document.getElementById('planoTaticoTrimEscolaWrapper').style.display = 'none';
  }

  // Carrega dados ao selecionar trimestre
  document.getElementById('planoTaticoTrimestre').onchange = function() {
    carregarDadosTrimestrais();
  };
}

function carregarDadosTrimestrais() {
  const trimestre = document.getElementById('planoTaticoTrimestre').value;
  if (!trimestre) return;

  mostrarLoading();
  jsonp(`${API_URL}?tipo=indicadoresTrimestrais&email=${encodeURIComponent(emailUsuario)}&trimestre=${trimestre}`, function(dados) {
    esconderLoading();
    if (dados && !dados.erro) {
      document.getElementById('ptrimEstrategiasIntervencao').value = dados.estrategiasIntervencao || '';
      document.getElementById('ptrimRpePortugues').value = dados.rpePortugues !== null ? dados.rpePortugues : '';
      document.getElementById('ptrimRpeMatematica').value = dados.rpeMatematica !== null ? dados.rpeMatematica : '';
      document.getElementById('ptrimAcoesPedagogicas').value = dados.acoesPedagogicas || '';
      document.getElementById('ptrimFormacaoLP').value = dados.formacaoLP !== null ? dados.formacaoLP : '';
      document.getElementById('ptrimFormacaoMAT').value = dados.formacaoMAT !== null ? dados.formacaoMAT : '';
    } else {
      // Limpa se não houver dados
      document.getElementById('ptrimEstrategiasIntervencao').value = '';
      document.getElementById('ptrimRpePortugues').value = '';
      document.getElementById('ptrimRpeMatematica').value = '';
      document.getElementById('ptrimAcoesPedagogicas').value = '';
      document.getElementById('ptrimFormacaoLP').value = '';
      document.getElementById('ptrimFormacaoMAT').value = '';
    }
  });
}

function fecharModalPlanoTaticoTrimestral() {
  document.getElementById('modalPlanoTaticoTrimestral').style.display = 'none';
  limparInputsArquivo('modalPlanoTaticoTrimestral');
}

function preencherSelectEscolasPlanoTaticoTrim() {
  const select = document.getElementById('planoTaticoTrimEscola');
  const escolas = getEscolasPermitidas();
  select.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(escola => {
    const opt = document.createElement('option');
    opt.value = escola;
    opt.textContent = escola;
    select.appendChild(opt);
  });
}

async function salvarPlanoTaticoTrimestral() {
  const trimestre = document.getElementById('planoTaticoTrimestre').value;
  let escola = '';

  if (perfilUsuario === 'SUPERVISOR') {
    escola = document.getElementById('planoTaticoTrimEscola').value;
    if (!escola) {
      mostrarToast('Selecione a escola.', 'warning');
      return;
    }
  }

  if (!trimestre) {
    mostrarToast('Selecione o trimestre.', 'warning');
    return;
  }

  const btn = document.getElementById('btnSalvarPlanoTaticoTrim');
  showButtonLoading(btn);

  const dadosIndicadores = {
    acao: 'salvarIndicadoresTrimestrais',
    email: emailUsuario,
    trimestre: trimestre,
    escola: escola,
    estrategiasIntervencao: document.getElementById('ptrimEstrategiasIntervencao').value,
    rpePortugues: document.getElementById('ptrimRpePortugues').value,
    rpeMatematica: document.getElementById('ptrimRpeMatematica').value,
    acoesPedagogicas: document.getElementById('ptrimAcoesPedagogicas').value,
    formacaoLP: document.getElementById('ptrimFormacaoLP').value,
    formacaoMAT: document.getElementById('ptrimFormacaoMAT').value
  };

  await new Promise(resolve => {
    postSemResposta(dadosIndicadores, null, () => resolve());
  });

  // Upload de evidências (código existente mantido)
  const uploads = [
    { el: 'ptTrimEvidenciaEstrategias', indicador: 'estrategiasIntervencao' },
    { el: 'ptTrimEvidenciaRpeLP', indicador: 'rpePortugues' },
    { el: 'ptTrimEvidenciaRpeMAT', indicador: 'rpeMatematica' },
    { el: 'ptTrimEvidenciaAcoes', indicador: 'acoesPedagogicas' },
    { el: 'ptTrimEvidenciaFormacaoLP', indicador: 'formacaoLP' },
    { el: 'ptTrimEvidenciaFormacaoMAT', indicador: 'formacaoMAT' }
  ];

  try {
    for (const up of uploads) {
      const file = document.getElementById(up.el).files[0];
      if (file) {
        const base64 = await lerArquivoBase64(file);
        await new Promise(resolve => {
          postSemResposta({
            acao: 'uploadEvidenciaPT',
            email: emailUsuario,
            escola: escola,
            tipo: 'trimestral',
            periodo: trimestre,
            indicador: up.indicador,
            fileBase64: base64,
            fileName: file.name,
            mimeType: file.type
          }, null, () => resolve());
        });
      }
    }

    mostrarToast('Indicadores trimestrais e evidências salvos!', 'success');
    hideButtonLoading(btn);
    fecharModalPlanoTaticoTrimestral();
  } catch (e) {
    hideButtonLoading(btn);
    mostrarToast('Indicadores salvos, mas houve erro ao enviar evidências.', 'warning');
  }
}
// =========================
// PAINEL DE ACOMPANHAMENTO DO SUPERVISOR
// =========================

function abrirModalAcompanhamentoPT() {
  if (perfilUsuario !== 'SUPERVISOR') {
    mostrarToast('Apenas supervisores.', 'warning');
    return;
  }
  document.getElementById('modalAcompanhamentoPT').style.display = 'flex';
  
  // Trava a rolagem do fundo (como Agenda/Legislação)
  document.body.style.overflow = 'hidden';

  // Exibe o botão de exportação completa apenas para o Admin
  const btnExportarCompleta = document.getElementById('btnExportarPlanilhaCompleta');
  if (btnExportarCompleta) {
    btnExportarCompleta.style.display = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br') ? 'inline-block' : 'none';
  }

  carregarIndicadoresGerais();
}

function fecharModalAcompanhamentoPT() {
  document.getElementById('modalAcompanhamentoPT').style.display = 'none';
  
  // Restaura a rolagem da página
  document.body.style.overflow = '';
}
function carregarIndicadoresGerais() {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=indicadoresGerais&email=${encodeURIComponent(emailUsuario)}`, function(dados) {
    esconderLoading();
    renderizarTabelaAcompanhamento(dados);
  });
}

function renderizarTabelaAcompanhamento(dados) {
  const container = document.getElementById('tabelaAcompanhamentoPT');
  if (!dados || dados.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--text-muted);">Nenhum dado disponível.</p>';
    return;
  }

  const meses = ['Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro'];
  const trimestres = ['TRIM_1', 'TRIM_2', 'TRIM_3'];

  // Paleta profissional
  const corSim = '#2d6a4f';   // verde musgo escuro
  const corNao = '#9b2226';   // bordô escuro
  const corFundo = '#f8fafc'; // fundo levemente azulado
  const corCard = '#ffffff';
  const corBorda = '#e2e8f0';

  let html = '<div style="display:flex; flex-direction:column; gap:16px;">';

  dados.forEach(item => {
    html += `
      <div style="background:${corCard}; border:1px solid ${corBorda}; border-radius:12px; padding:20px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
        <!-- Cabeçalho da escola -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid ${corBorda}; padding-bottom:12px;">
          <h3 style="margin:0; font-size:17px; color:#1e293b; font-weight:600;">${item.escola}</h3>
          <span style="font-size:12px; color:#64748b;">
            <i class="fas fa-user-tie"></i> ${item.supervisor || '—'}
          </span>
        </div>

        <!-- Indicadores Mensais -->
        <details open style="margin-bottom:10px;">
          <summary style="font-weight:600; cursor:pointer; color:#334155; font-size:14px;">
            <i class="fas fa-calendar-alt"></i> Frequência & Tutoria (Mensal)
          </summary>
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:6px; margin-top:10px;">
            ${meses.map(m => {
              const d = item.mensal[m] || {};
              const freq = d.frequencia !== null ? parseFloat(d.frequencia).toFixed(1) + '%' : '—';
              const tut = d.tutoria || '—';
              const evFreq = (d.evidencias && d.evidencias.frequencia && d.evidencias.frequencia.length > 0);
              const evTut = (d.evidencias && d.evidencias.tutoria && d.evidencias.tutoria.length > 0);
              const linkFreq = evFreq ? d.evidencias.frequencia[0].viewUrl : '';
              const linkTut = evTut ? d.evidencias.tutoria[0].viewUrl : '';

              return `
                <div style="background:${corFundo}; border-radius:8px; padding:8px 6px; text-align:center; font-size:12px; border:1px solid ${corBorda};">
                  <strong style="color:#475569;">${m.substring(0,3)}</strong>
                  <div style="margin-top:4px; color:#1e293b;">
                    <span title="Frequência ≥ 80%">📊 ${freq}</span>
                    ${evFreq ? `<a href="${linkFreq}" target="_blank" title="Ver evidência" style="text-decoration:none;">📎</a>` : ''}
                  </div>
                  <div style="color:#1e293b;">
                    <span title="Tutoria coletiva realizada?">👥 ${tut}</span>
                    ${evTut ? `<a href="${linkTut}" target="_blank" title="Ver evidência" style="text-decoration:none;">📎</a>` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </details>

        <!-- Indicadores Trimestrais -->
        <details open>
          <summary style="font-weight:600; cursor:pointer; color:#334155; font-size:14px;">
            <i class="fas fa-chart-bar"></i> Indicadores Trimestrais
          </summary>
          <div style="margin-top:10px; display:flex; flex-direction:column; gap:12px;">
            ${trimestres.map(t => {
              const d = (item.trimestral && item.trimestral[t]) ? item.trimestral[t] : {};
              const indicadores = [
                { label: 'Estrat. Intervenção', key: 'estrategiasIntervencao', title: 'Estratégias de intervenção pedagógica alinhadas à AMA', icon: '💡' },
                { label: 'RPE – L. Portuguesa', key: 'rpePortugues', title: 'Cumprimento integral das RPEs de Língua Portuguesa', icon: '📖' },
                { label: 'RPE – Matemática', key: 'rpeMatematica', title: 'Cumprimento integral das RPEs de Matemática', icon: '🔢' },
                { label: 'Ações Pedagógicas', key: 'acoesPedagogicas', title: 'Implementação de ações pedagógicas a partir da AMA', icon: '👩‍🏫' },
                { label: 'Formação – LP', key: 'formacaoLP', title: '≥ 80% dos professores de Língua Portuguesa com formação', icon: '🗣️' },
                { label: 'Formação – MAT', key: 'formacaoMAT', title: '≥ 80% dos professores de Matemática com formação', icon: '📐' }
              ];

              return `
                <div style="background:${corFundo}; border-radius:8px; padding:12px; border:1px solid ${corBorda};">
                  <strong style="font-size:13px; color:#1e293b;">${t.replace('_', 'º Trimestre')}</strong>
                  <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
                    ${indicadores.map(ind => {
                      let valor = d[ind.key];
                      let corValor = '#64748b'; // cinza para ausente
                      let badge = '—';

                      if (valor === 'SIM') {
                        corValor = corSim;
                        badge = '✓ SIM';
                      } else if (valor === 'NÃO') {
                        corValor = corNao;
                        badge = '✗ NÃO';
                      }

                      const evs = (d.evidencias && d.evidencias[ind.key]) ? d.evidencias[ind.key] : [];
                      const linkEv = evs.length > 0 ? evs[0].viewUrl : '';
                      const evIcon = evs.length > 0 ? ` <a href="${linkEv}" target="_blank" title="Ver evidência" style="text-decoration:none;">📎</a>` : '';

                      return `
                        <span title="${ind.title}" style="background:#fff; border:1px solid ${corBorda}; border-radius:6px; padding:6px 10px; font-size:12px; white-space:nowrap; cursor:help;">
                          ${ind.icon} ${ind.label}: <span style="color:${corValor}; font-weight:600;">${badge}</span>${evIcon}
                        </span>`;
                    }).join('')}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </details>
      </div>`;
  });

  html += '</div>';
  html += '<p style="font-size:11px; color:#94a3b8; margin-top:12px;">Passe o mouse sobre as siglas para ver o significado. 📎 = evidência anexada.</p>';
  container.innerHTML = html;
}
function abrirModalPlanoTaticoTrimestral() {
  if (!algumPerfilUsuario(['PEDAGOGICO', 'SUPERVISOR'])) {
    mostrarToast('Acesso restrito a pedagogos e supervisores.', 'warning');
    return;
  }

  document.getElementById('modalPlanoTaticoTrimestral').style.display = 'flex';

  // Limpa campos
  document.getElementById('planoTaticoTrimestre').value = '';
  document.getElementById('ptrimEstrategiasIntervencao').value = '';
  document.getElementById('ptrimRpePortugues').value = '';
  document.getElementById('ptrimRpeMatematica').value = '';
  document.getElementById('ptrimAcoesPedagogicas').value = '';
  document.getElementById('ptrimFormacaoLP').value = '';
  document.getElementById('ptrimFormacaoMAT').value = '';

  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('planoTaticoTrimEscolaWrapper').style.display = 'block';
    preencherSelectEscolasPlanoTaticoTrim();
  } else {
    document.getElementById('planoTaticoTrimEscolaWrapper').style.display = 'none';
  }

  // Carrega dados ao selecionar trimestre
  document.getElementById('planoTaticoTrimestre').onchange = function() {
    carregarDadosTrimestrais();
  };
}
// =========================
// UPLOAD DE EVIDÊNCIAS
// =========================

// --- Evidências Mensais ---

async function uploadEvidenciaMensal() {
  const indicador = document.getElementById('ptMensalIndicadorEvidencia').value;
  const mes = document.getElementById('planoTaticoMes').value;
  const fileInput = document.getElementById('ptMensalArquivoEvidencia');
  const file = fileInput.files[0];

  if (!indicador) { mostrarToast('Selecione o indicador.', 'warning'); return; }
  if (!mes) { mostrarToast('Selecione o mês primeiro.', 'warning'); return; }
  if (!file) { mostrarToast('Selecione um arquivo.', 'warning'); return; }
  if (file.size > 10 * 1024 * 1024) { mostrarToast('Arquivo muito grande. Máximo 10 MB.', 'warning'); return; }

  let escola = '';
  if (perfilUsuario === 'SUPERVISOR') {
    escola = document.getElementById('planoTaticoEscola').value;
    if (!escola) { mostrarToast('Selecione a escola.', 'warning'); return; }
  }

  mostrarLoading();
  try {
    const base64 = await lerArquivoBase64(file);
    await new Promise(resolve => {
      postSemResposta({
        acao: 'uploadEvidenciaPT',
        email: emailUsuario,
        escola: escola,
        tipo: 'mensal',
        periodo: mes,
        indicador: indicador,
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type
      }, 'Evidência enviada!', () => resolve());
    });
    fileInput.value = '';
    carregarEvidenciasMensais();
    esconderLoading();
  } catch (e) {
    esconderLoading();
    mostrarToast('Erro ao enviar arquivo.', 'error');
  }
}

function carregarEvidenciasMensais() {
  // Por enquanto, apenas limpa o status; a listagem completa será implementada depois
  document.getElementById('ptMensalEvidenciasLista').innerHTML = '';
}

// --- Evidências Trimestrais ---

async function uploadEvidenciaTrimestral() {
  const indicador = document.getElementById('ptTrimIndicadorEvidencia').value;
  const trimestre = document.getElementById('planoTaticoTrimestre').value;
  const fileInput = document.getElementById('ptTrimArquivoEvidencia');
  const file = fileInput.files[0];

  if (!indicador) { mostrarToast('Selecione o indicador.', 'warning'); return; }
  if (!trimestre) { mostrarToast('Selecione o trimestre primeiro.', 'warning'); return; }
  if (!file) { mostrarToast('Selecione um arquivo.', 'warning'); return; }
  if (file.size > 10 * 1024 * 1024) { mostrarToast('Arquivo muito grande. Máximo 10 MB.', 'warning'); return; }

  let escola = '';
  if (perfilUsuario === 'SUPERVISOR') {
    escola = document.getElementById('planoTaticoTrimEscola').value;
    if (!escola) { mostrarToast('Selecione a escola.', 'warning'); return; }
  }

  mostrarLoading();
  try {
    const base64 = await lerArquivoBase64(file);
    await new Promise(resolve => {
      postSemResposta({
        acao: 'uploadEvidenciaPT',
        email: emailUsuario,
        escola: escola,
        tipo: 'trimestral',
        periodo: trimestre,
        indicador: indicador,
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type
      }, 'Evidência enviada!', () => resolve());
    });
    fileInput.value = '';
    carregarEvidenciasTrimestrais();
    esconderLoading();
  } catch (e) {
    esconderLoading();
    mostrarToast('Erro ao enviar arquivo.', 'error');
  }
}

function carregarEvidenciasTrimestrais() {
  document.getElementById('ptTrimEvidenciasLista').innerHTML = '';
}
function limparInputsArquivo(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  const inputs = modal.querySelectorAll('input[type="file"]');
  inputs.forEach(input => { input.value = ''; });
}

let dadosPlanoTaticoGlobal = null;

function carregarIndicadoresGerais() {
  mostrarLoading();
  jsonp(`${API_URL}?tipo=indicadoresGerais&email=${encodeURIComponent(emailUsuario)}`, function(dados) {
    esconderLoading();
    dadosPlanoTaticoGlobal = dados;   // guarda para exportação
    renderizarTabelaAcompanhamento(dados);
  });
}

function exportarPlanoTaticoPDF() {
  if (!dadosPlanoTaticoGlobal || dadosPlanoTaticoGlobal.length === 0) {
    mostrarToast('Nenhum dado para exportar.', 'warning');
    return;
  }

  const meses = ['Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro'];
  const trimestres = ['TRIM_1', 'TRIM_2', 'TRIM_3'];
  const corSim = '#2d6a4f';
  const corNao = '#9b2226';

  let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Plano Tático - Acompanhamento</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 30px; }
    h2 { font-size: 22px; border-bottom: 2px solid #0369a1; padding-bottom: 8px; color: #0f172a; }
    h3 { font-size: 16px; margin: 20px 0 8px; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #f1f5f9; padding: 8px; text-align: center; font-weight: 600; border: 1px solid #cbd5e1; }
    td { padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; }
    .sim { color: ${corSim}; font-weight: 600; }
    .nao { color: ${corNao}; font-weight: 600; }
    .evidencia { text-decoration: none; }
    @page { size: A4 landscape; margin: 10mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head><body>`;

  html += `<h2>Plano Tático – Acompanhamento da Regional</h2>`;
  html += `<p style="color:#64748b;">Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>`;

  dadosPlanoTaticoGlobal.forEach(item => {
    html += `<h3>${item.escola} — Supervisor: ${item.supervisor || '—'}</h3>`;

    // Mensal
    html += `<table><thead><tr><th>Mês</th><th>Frequência ≥ 80%</th><th>Tutoria Coletiva</th></tr></thead><tbody>`;
    meses.forEach(m => {
      const d = item.mensal[m] || {};
      const freq = d.frequencia !== null ? parseFloat(d.frequencia).toFixed(1) + '%' : '—';
      const tut = d.tutoria || '—';
      html += `<tr><td>${m}</td><td>${freq}</td><td>${tut}</td></tr>`;
    });
    html += `</tbody></table>`;

    // Trimestral
    html += `<table><thead><tr><th>Trimestre</th><th>Estrat. Intervenção</th><th>RPE – L. Portuguesa</th><th>RPE – Matemática</th><th>Ações Pedagógicas</th><th>Formação – LP</th><th>Formação – MAT</th></tr></thead><tbody>`;
    trimestres.forEach(t => {
      const d = (item.trimestral && item.trimestral[t]) ? item.trimestral[t] : {};
      const indicadores = [
        'estrategiasIntervencao', 'rpePortugues', 'rpeMatematica',
        'acoesPedagogicas', 'formacaoLP', 'formacaoMAT'
      ];
      html += `<tr><td>${t.replace('_', 'º Trimestre')}</td>`;
      indicadores.forEach(key => {
        let valor = d[key] || '—';
        if (valor === 'SIM') valor = '<span class="sim">✓ SIM</span>';
        else if (valor === 'NÃO') valor = '<span class="nao">✗ NÃO</span>';
        html += `<td>${valor}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
  });

  html += `</body></html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = function() {
    printWindow.print();
  };
}function exportarPlanilhaCompletaPDF() {
  if (emailUsuario !== 'eder.ramos@educador.edu.es.gov.br') {
    mostrarToast('Apenas Administrador.', 'warning');
    return;
  }

  mostrarLoading();
  jsonp(`${API_URL}?tipo=planilhaCompleta&email=${encodeURIComponent(emailUsuario)}`, function(dados) {
    esconderLoading();

    if (!dados || dados.erro) {
      mostrarToast('Erro ao carregar dados da planilha.', 'error');
      return;
    }

    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Plano Tático - Completo</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h2 { color: #0f172a; border-bottom: 2px solid #0369a1; padding-bottom: 5px; }
      h3 { color: #334155; margin-top: 25px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }
      th { background: #f1f5f9; padding: 6px; border: 1px solid #cbd5e1; font-weight: 600; }
      td { padding: 5px; border: 1px solid #cbd5e1; text-align: center; }
      @page { size: A4 landscape; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      .aba-separator { page-break-before: always; }
    </style></head><body>`;

    const abas = ['Mensal', 'TRIM_1', 'TRIM_2', 'TRIM_3', 'Compilado_Regional'];

    abas.forEach((nomeAba, index) => {
      const dadosAba = dados[nomeAba];
      if (!dadosAba || dadosAba.length === 0) return;

      // Adiciona quebra de página entre abas (exceto a primeira)
      if (index > 0) html += '<div class="aba-separator"></div>';

      html += `<h2>Aba: ${nomeAba}</h2>`;
      html += '<table>';

      dadosAba.forEach((linha, rowIdx) => {
        html += '<tr>';
        linha.forEach(celula => {
          const valor = celula !== null && celula !== undefined ? celula.toString() : '';
          if (rowIdx === 0) {
            html += `<th>${valor}</th>`;
          } else {
            html += `<td>${valor}</td>`;
          }
        });
        html += '</tr>';
      });

      html += '</table>';
    });

    html += '</body></html>';

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  });
}
