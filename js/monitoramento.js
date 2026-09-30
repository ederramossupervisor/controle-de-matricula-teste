// =========================
// MONITORAMENTO DE VISITAS ESCOLARES
// =========================

// Estrutura do checklist baseada no texto institucional
const CATEGORIAS_MONITORAMENTO = [
  {
    categoria: "LIVROS/PLANILHAS",
    itens: [
      { id: "LP1", descricao: "Planilha de controle e entrega de Histórico Escolar conforme Guia de Documentos Escolares SEDU 2023" },
      { id: "LP2", descricao: "Planilha de controle e entrega de Certificado (se aplicável)" },
      { id: "LP3", descricao: "Planilha de controle e entrega de Diploma (se aplicável)" },
      { id: "LP4", descricao: "Livro Ponto/Ponto Eletrônico – processos no e-Docs abertos e encerrados conforme Portaria 018-R/2024" }
    ]
  },
  {
    categoria: "LIVROS",
    itens: [
      { id: "L1", descricao: "Livro de registro de Classificação, Reclassificação e Avanço escriturado adequadamente" },
      { id: "L2", descricao: "Termo de visita – pasta/livro disponível para registros de visitas" },
      { id: "L3", descricao: "Eliminação de documentos – responsáveis definidos e procedimentos de guarda" }
    ]
  },
  {
    categoria: "PASTAS",
    itens: [
      { id: "PA1", descricao: "Pasta de Atos Oficiais (leis, decretos, resoluções) atualizada" },
      { id: "PA2", descricao: "Calendário Escolar – pasta organizada por ano" },
      { id: "PA3", descricao: "Organizações Curriculares – pasta por ano com OCs publicadas e customizadas" },
      { id: "PA4", descricao: "Atas de Resultados Finais – pasta organizada por ano" },
      { id: "PA5", descricao: "Pasta de Fluxo e Resultados – escriturada conforme movimentação anual" },
      { id: "PA6", descricao: "Documentação de Cursos Técnicos (se houver) – Plano de Curso, resoluções, pareceres" },
      { id: "PA7", descricao: "Programa de Autoavaliação Institucional (PAI) – relatórios organizados" },
      { id: "PA8", descricao: "Pasta de documentação dos professores – atualizada com dados da equipe" }
    ]
  },
  {
    categoria: "ARQUIVO ESCOLAR – ORGANIZAÇÃO E GUARDA",
    itens: [
      { id: "ARQ1", descricao: "Diários de Classe – arquivo físico (caixas por ano) e digital (e-Docs)" },
      { id: "ARQ2", descricao: "Atas de Classificação, Reclassificação e Avanço – 3 vias (aluno, ARF, SRE)" },
      { id: "ARQ3", descricao: "Atas de Resultados Finais – arquivo físico e digital (e-Docs)" },
      { id: "ARQ4", descricao: "Lista de Concluintes – arquivo físico e tramitação no e-Docs" },
      { id: "ARQ5", descricao: "Atas de Conselho de Classe – arquivo físico e digital (e-Docs, sigiloso)" },
      { id: "ARQ6", descricao: "Atas de Reuniões de Pais – arquivo físico e digital" },
      { id: "ARQ7", descricao: "Registros de Alunos – arquivo permanente" },
      { id: "ARQ8", descricao: "Registros de servidores/Livro Ponto – físicos até 2023 e digitais no e-Docs" },
      { id: "ARQ9", descricao: "Arquivo dos prontuários dos estudantes – ativos e permanentes organizados" }
    ]
  },
  {
    categoria: "SISTEMA DE GESTÃO – SEGES",
    itens: [
      { id: "SEG1", descricao: "Registro de informações atualizadas no SEGES em conformidade com os prontuários" },
      { id: "SEG2", descricao: "Equipe pedagógica monitora semanalmente notas, frequência e aulas dadas" },
      { id: "SEG3", descricao: "Documentação escolar disponível para emissão a qualquer momento" }
    ]
  }
];

// =========================
// ABERTURA / FECHAMENTO DO MODAL
// =========================

function abrirModalMonitoramento() {
  document.body.style.overflow = 'hidden';
  document.getElementById('modalMonitoramento').style.display = 'flex';
  
  // Reseta ID de edição para garantir que uma nova visita não use ID antigo
  const checklist = document.getElementById('monitoramentoChecklist');
  if (checklist) checklist.dataset.idVisita = '';

  // Restaura textos originais dos botões
  const btnRascunho = document.querySelector('#novaVisitaAba .btn-salvar');
  const btnFinalizar = document.querySelector('#novaVisitaAba .btn-primary');
  if (btnRascunho) btnRascunho.innerHTML = 'Salvar Rascunho';
  if (btnFinalizar) btnFinalizar.innerHTML = 'Finalizar e Gerar Relatório';

  // Preenche o select de escolas e abre a aba "Nova Visita"
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
    ativarEnterNoModal('#modalMonitoramento', carregarListaVisitas);
  }
}

// =========================
// PREENCHIMENTO DE SELECTS
// =========================

function preencherSelectEscolaMonitoramento() {
  const select = document.getElementById('monitoramentoEscola');
  if (!select) return;
  const escolas = getEscolasPermitidas();
  select.innerHTML = '<option value="">Selecione a escola</option>';
  escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
}

// =========================
// RENDERIZAÇÃO DO CHECKLIST
// =========================

function renderizarChecklist() {
  const container = document.getElementById('monitoramentoChecklist');
  if (!container) return;

  let html = '';
  CATEGORIAS_MONITORAMENTO.forEach(cat => {
    html += `<h3 style="margin-top: 20px; border-bottom: 2px solid var(--card-border);">${cat.categoria}</h3>`;
    cat.itens.forEach(item => {
      html += `
        <div class="item-monitoramento" data-id="${item.id}" style="margin-bottom: 16px; padding: 12px; border: 1px solid var(--card-border); border-radius: 12px;">
          <p style="font-weight: 500;"><strong>${item.id}</strong>: ${item.descricao}</p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <select class="status-item" style="width: 180px;">
              <option value="">Selecione...</option>
              <option value="Conforme">Conforme</option>
              <option value="Não Conforme">Não Conforme</option>
              <option value="Não se aplica">Não se aplica</option>
            </select>
            <textarea class="obs-item" rows="2" placeholder="Observações (opcional)" style="flex: 2; min-width: 200px;"></textarea>
            <input type="file" class="anexo-item" multiple accept=".pdf,.jpg,.jpeg,.png" style="flex: 1; min-width: 180px;">
          </div>
        </div>
      `;
    });
  });
  container.innerHTML = html;
}

// =========================
// UTILITÁRIOS
// =========================

function getItemInfo(id) {
  for (const cat of CATEGORIAS_MONITORAMENTO) {
    const item = cat.itens.find(i => i.id === id);
    if (item) return { categoria: cat.categoria, descricao: item.descricao };
  }
  return { categoria: '', descricao: '' };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =========================
// SALVAR VISITA (usando postSemResposta, sem CORS)
// =========================

async function salvarVisita(finalizar = false) {
  const escola = document.getElementById('monitoramentoEscola').value;
  if (!escola) {
    mostrarToast('Selecione a escola.', 'warning');
    return;
  }

  // Coleta dados dos itens e arquivos anexos
  const itensData = [];
  const elementos = document.querySelectorAll('.item-monitoramento');

  // Converter arquivos em paralelo (promessas)
  const promessas = [];
  for (const el of elementos) {
    const id = el.dataset.id;
    const status = el.querySelector('.status-item').value;
    const obs = el.querySelector('.obs-item').value;
    const info = getItemInfo(id);                         // retorna { categoria, descricao }
    const anexoInput = el.querySelector('.anexo-item');
    const arquivos = anexoInput ? Array.from(anexoInput.files) : [];

    const arquivosPromises = arquivos.map(file =>
      fileToBase64(file).then(base64 => ({
        fileName: file.name,
        mimeType: file.type,
        base64: base64
      }))
    );
    promessas.push(Promise.all(arquivosPromises).then(anexosConvertidos => {
      itensData.push({
        id,
        status,
        obs,
        categoria: info.categoria,
        descricao: info.descricao,
        anexos: anexosConvertidos
      });
    }));
  }

  mostrarLoading();
  await Promise.all(promessas);

  // Verifica se está editando um rascunho (ID armazenado no dataset)
  const idVisitaEditando = document.getElementById('monitoramentoChecklist').dataset.idVisita || '';
  const idVisita = idVisitaEditando || ('MON_' + Date.now());

  const dados = {
    acao: 'salvarMonitoramento',
    email: emailUsuario,
    escola: escola,
    finalizar: finalizar,
    obsGerais: document.getElementById('monitoramentoObsGerais').value,
    itens: itensData,
    idVisita: idVisita
  };

  // Envio sem esperar resposta (no-cors)
  postSemResposta(dados, finalizar ? 'Visita finalizada!' : 'Rascunho atualizado!', () => {
    esconderLoading();
    fecharModalMonitoramento();

    if (finalizar) {
      // Pequeno delay para garantir que o backend processou
      setTimeout(() => gerarRelatorioMonitoramento(idVisita), 2000);
    }

    // Limpa formulário e reseta estado de edição
    document.getElementById('monitoramentoEscola').value = '';
    document.getElementById('monitoramentoObsGerais').value = '';
    document.getElementById('monitoramentoChecklist').dataset.idVisita = '';
    const btnRascunho = document.querySelector('#novaVisitaAba .btn-salvar');
    const btnFinalizar = document.querySelector('#novaVisitaAba .btn-primary');
    if (btnRascunho) btnRascunho.innerHTML = 'Salvar Rascunho';
    if (btnFinalizar) btnFinalizar.innerHTML = 'Finalizar e Gerar Relatório';
  });
}

// =========================
// LISTAGEM DE VISITAS (HISTÓRICO) – usa JSONP (GET)
// =========================

function carregarListaVisitas() {
  mostrarLoading();
  const escola = document.getElementById('historicoFiltroEscola')?.value || '';
  let url = `${API_URL}?tipo=historicoMonitoramento&email=${encodeURIComponent(emailUsuario)}`;
  if (escola) url += `&escola=${encodeURIComponent(escola)}`;

  jsonp(url, function(dados) {
    esconderLoading();
    const container = document.getElementById('historicoVisitasLista');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(dados) || dados.length === 0) {
      container.innerHTML = '<p>Nenhuma visita encontrada.</p>';
      return;
    }
    dados.forEach(visita => {
      const div = document.createElement('div');
      div.className = 'usuario-card';
      
      const btnEditar = !visita.finalizada ? 
        `<button class="btn-pequeno" onclick="carregarRascunhoMonitoramento('${visita.id}')"><i class="fas fa-edit"></i> Editar</button>` : '';
      
      div.innerHTML = `
        <div class="usuario-avatar"><i class="fas fa-clipboard-check"></i></div>
        <div class="usuario-info">
          <strong>${visita.escola}</strong>
          <p><i class="fas fa-calendar"></i> ${new Date(visita.data).toLocaleDateString('pt-BR')} | <i class="fas fa-user"></i> ${visita.supervisor}</p>
          <p><span class="status-badge ${visita.finalizada ? 'status-completo' : 'status-pendente'}">${visita.finalizada ? 'Finalizada' : 'Rascunho'}</span></p>
          <button class="btn-pequeno" onclick="gerarRelatorioMonitoramento('${visita.id}')"><i class="fas fa-file-pdf"></i> Relatório</button>
          ${btnEditar}
        </div>
      `;
      container.appendChild(div);
    });
  });
}

function carregarRascunhoMonitoramento(idVisita) {
  mostrarLoading();
  const url = `${API_URL}?tipo=detalhesMonitoramento&email=${emailUsuario}&idVisita=${encodeURIComponent(idVisita)}`;
  jsonp(url, function(dados) {
    esconderLoading();
    if (!dados || dados.erro) {
      mostrarToast('Erro ao carregar rascunho.', 'error');
      return;
    }

    // Preenche a escola
    document.getElementById('monitoramentoEscola').value = dados.cabecalho.escola;
    // Dispara a renderização do checklist (se necessário)
    renderizarChecklist();

    // Aguarda um pequeno tempo para garantir que o checklist foi renderizado
    setTimeout(() => {
      // Preenche status e observações de cada item
      dados.itens.forEach(item => {
        const el = document.querySelector(`.item-monitoramento[data-id="${item.id}"]`);
        if (el) {
          el.querySelector('.status-item').value = item.status;
          el.querySelector('.obs-item').value = item.obs || '';
          // Anexos existentes: apenas exibe os nomes (não permite exclusão)
          if (item.anexos && item.anexos.length > 0) {
            const anexosContainer = el.querySelector('.lista-anexos');
            if (anexosContainer) {
              anexosContainer.innerHTML = item.anexos.map(id => 
                `<span class="anexo-existente" style="background:var(--card-border); padding:2px 8px; border-radius:12px; font-size:12px;">📎 Anexo</span>`
              ).join('');
            }
          }
        }
      });
      // Preenche observações gerais
      document.getElementById('monitoramentoObsGerais').value = dados.cabecalho.obsGerais || '';
      
      // Armazena o id da visita que está sendo editada
      document.getElementById('monitoramentoChecklist').dataset.idVisita = idVisita;
      
      // Altera o texto dos botões de salvar
      const btnRascunho = document.querySelector('#novaVisitaAba .btn-salvar');
      const btnFinalizar = document.querySelector('#novaVisitaAba .btn-primary');
      if (btnRascunho) btnRascunho.innerHTML = 'Atualizar Rascunho';
      if (btnFinalizar) btnFinalizar.innerHTML = 'Finalizar e Gerar Relatório';
      
    }, 300);
    
    // Vai para a aba "Nova Visita"
    mostrarAbaMonitoramento('nova');
  });
}
// =========================
// GERAÇÃO DE RELATÓRIO EM PDF (via impressão)
// =========================

function gerarRelatorioMonitoramento(idVisita) {
  mostrarLoading();
  const url = `${API_URL}?tipo=detalhesMonitoramento&email=${emailUsuario}&idVisita=${encodeURIComponent(idVisita)}`;
  jsonp(url, function(dados) {
    esconderLoading();
    if (!dados || dados.erro) {
      mostrarToast('Erro ao carregar dados da visita.', 'error');
      return;
    }

    const { cabecalho, itens } = dados;
    let html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Monitoramento</title>`;
    html += `<style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #333; }
      h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; }
      h2 { margin: 0; font-size: 18px; }
      .info { margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #1e3a8a; color: white; padding: 8px; }
      td { padding: 8px; border: 1px solid #ccc; }
      .conforme { background: #d4edda; }
      .nao-conforme { background: #f8d7da; }
      .nao-aplica { background: #e2e3e5; }
      @page { size: A4; margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    </style></head><body>`;
    html += `<h1>Relatório de Monitoramento Escolar</h1>`;
    html += `<div class="info">
      <p><strong>Escola:</strong> ${cabecalho.escola}</p>
      <p><strong>Supervisor:</strong> ${cabecalho.supervisor}</p>
      <p><strong>Data:</strong> ${new Date(cabecalho.data).toLocaleDateString('pt-BR')}</p>
      <p><strong>Observações gerais:</strong> ${cabecalho.obsGerais || 'Nenhuma'}</p>
    </div>`;
    html += `<table><thead><tr><th>Item</th><th>Descrição</th><th>Status</th><th>Observações</th></tr></thead><tbody>`;
    itens.forEach(item => {
      let classe = '';
      if (item.status === 'Conforme') classe = 'conforme';
      else if (item.status === 'Não Conforme') classe = 'nao-conforme';
      else if (item.status === 'Não se aplica') classe = 'nao-aplica';
      html += `<tr class="${classe}">
        <td>${item.id}</td>
        <td>${item.descricao}</td>
        <td>${item.status}</td>
        <td>${item.obs || ''}</td>
      </tr>`;
    });
    html += `</tbody></table></body></html>`;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = function() {
      printWindow.print();
    };
  });
}
