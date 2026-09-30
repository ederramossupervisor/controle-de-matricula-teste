// =========================
// RENDERIZAÇÃO DA INTERFACE (LISTAS, PAINÉIS, PAGINAÇÃO)
// =========================

// ------ LISTA DE ALUNOS (CARDS OU TABELA) ------
function renderLista(dados) {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  if (modoVisualizacao === 'lista') {
    lista.style.display = 'block';
    lista.style.padding = '0 20px 20px';
    renderTabela(dados, lista);
    return;
  }
  
  lista.style.display = "grid";
  lista.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
  lista.style.gap = "12px";
  lista.style.padding = "0 20px 20px";

  dados.forEach(aluno => {
    const div = document.createElement("div");
    div.className = "fade";
    
    div.style.borderRadius = "16px";
    div.style.padding = "12px 16px";
    div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
    div.style.border = "1px solid #f1f5f9";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.alignItems = "stretch";
    div.style.gap = "0";
    div.style.transition = "all 0.2s";
    div.style.position = "relative";
    div.style.zIndex = "auto";
    div.style.overflow = "visible";
    
    let statusClass = "";
    if (aluno.STATUS && aluno.STATUS.includes("✅")) statusClass = "status-completo";
    else if (aluno.STATUS && aluno.STATUS.includes("⚠️")) statusClass = "status-pendente";
    else if (aluno.STATUS && aluno.STATUS.includes("🔴")) statusClass = "status-vencido";

    div.className = "fade " + statusClass;

    let prazoTexto = "";
    let prazoClasse = "";
    
    if (aluno.STATUS !== "✅ Completo") {
      if (aluno.PRAZO_FINAL) {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const prazo = new Date(aluno.PRAZO_FINAL);
        prazo.setHours(0,0,0,0);
        const diff = Math.floor((prazo - hoje) / (1000*60*60*24));
        
        if (diff < 0) {
          prazoTexto = `Vencido: ${Math.abs(diff)} dia(s)`;
          prazoClasse = "prazo-urgente";
        } else if (diff === 0) {
          prazoTexto = "Vence hoje";
          prazoClasse = "prazo-atencao";
        } else if (diff <= 5) {
          prazoTexto = `${diff} dia(s) restante(s)`;
          prazoClasse = "prazo-atencao";
        } else {
          prazoTexto = `${diff} dias restantes`;
          prazoClasse = "prazo-normal";
        }
      } else {
        prazoTexto = "Sem prazo";
        prazoClasse = "";
      }
    }

    // Ícones de documentos
    let docsIconsHtml = '<div class="docs-icons">';
    
    CONFIG_DOCS_CARD.forEach(doc => {
      if (doc.coluna === 'RG') return;
      const entregue = aluno[doc.coluna] === true;
      const status = getDocIconStatus(entregue, aluno.PRAZO_FINAL, doc.label);
      docsIconsHtml += `
        <span class="doc-icon ${status.classe}" data-tooltip="${status.tooltip}">
          <i class="fas ${doc.icone}"></i>
        </span>
      `;
    });

    const rgPreenchido = aluno.RG === true;
    const classeRG = rgPreenchido ? 'entregue' : 'nao-declarado';
    const tooltipRG = rgPreenchido ? 'RG: presente' : 'RG: não informado';
    docsIconsHtml += `
      <span class="doc-icon ${classeRG}" data-tooltip="${tooltipRG}">
        <i class="fas fa-address-card"></i>
      </span>
    `;
    
    if (aluno.ID) {
      const tooltipId = `ID Aluno: ${aluno.ID}`;
      docsIconsHtml += `
        <span class="doc-icon info" data-tooltip="${tooltipId}">
          <i class="fas fa-id-badge"></i>
        </span>
      `;
    }
    
    if (aluno.ED_ESPECIAL === true) {
      const entregueEsp = aluno.ED_ESPECIAL === true;
      const statusEsp = getDocIconStatus(entregueEsp, aluno.PRAZO_FINAL, DOC_ESPECIAL.label);
      docsIconsHtml += `
        <span class="doc-icon ${statusEsp.classe}" data-tooltip="${statusEsp.tooltip}">
          <i class="fas ${DOC_ESPECIAL.icone}"></i>
        </span>
      `;
    }

    const racaCorPreenchida = aluno.RACA_COR && aluno.RACA_COR.trim() !== "";
    const classeRacaCor = racaCorPreenchida ? 'info' : 'nao-declarado';
    const tooltipRacaCor = racaCorPreenchida ? `Raça/Cor: ${aluno.RACA_COR}` : 'Raça/Cor: não declarada';
    docsIconsHtml += `
      <span class="doc-icon ${classeRacaCor}" data-tooltip="${tooltipRacaCor}">
        <i class="fa-solid fa-person"></i>
      </span>
    `;

    if (aluno._TERMO_RESP_ID) {
      docsIconsHtml += `
        <span class="doc-icon info" data-tooltip="Termo de Responsabilidade anexado">
          <i class="fas fa-file-signature"></i>
        </span>
      `;
    }

    if (aluno.ED_ESPECIAL === true) {
      const temDecl = aluno._DECL_ED_ESPECIAL_ID ? true : false;
      const classe = temDecl ? 'info' : 'pendente';
      const tooltip = temDecl ? 'Declaração de Ed. Especial anexada' : 'Declaração de Ed. Especial pendente';
      docsIconsHtml += `
        <span class="doc-icon ${classe}" data-tooltip="${tooltip}">
          <i class="fas fa-solid fa-universal-access"></i>
        </span>
      `;
    }
    
    docsIconsHtml += '</div>';

    const inicial = (aluno.ALUNO && typeof aluno.ALUNO === 'string' && aluno.ALUNO.trim().length > 0)
      ? aluno.ALUNO.trim().charAt(0).toUpperCase()
      : "?";

       // ID único para o input file de cada card
    const fotoInputId = `fotoCard_${aluno._row}`;
    let avatarHtml;
    if (aluno.FOTO) {
      avatarHtml = `<img src="${aluno.FOTO}" class="aluno-foto" id="foto_${aluno._row}" style="width:44px;height:44px;border-radius:12px;object-fit:cover;flex-shrink:0;cursor:pointer;" alt="Foto do aluno" onclick="document.getElementById('${fotoInputId}').click()">`;
    } else {
      avatarHtml = `<div class="aluno-avatar" id="foto_${aluno._row}" style="width:44px;height:44px;background:#e0e7ff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#2563eb;flex-shrink:0;cursor:pointer;" title="Clique para adicionar foto" onclick="document.getElementById('${fotoInputId}').click()">${inicial}</div>`;
    }
    const turmaHtml = aluno.TURMA
      ? `<div style="font-size:10px;color:#64748b;text-align:center;margin-top:4px;max-width:44px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${aluno.TURMA}">${aluno.TURMA}</div>`
      : '';

    // Container vertical para botões de ação (gap reduzido para 1px)
    let botoesAcaoHtml = '';
    if (perfilUsuario !== 'PEDAGOGICO') {
      botoesAcaoHtml = '<div class="botoes-acao-vertical" style="display:flex;flex-direction:column;gap:0;align-self:flex-start;flex-shrink:0;border-left:1px solid #94a3b8;padding-left:6px;margin-left:4px;"></div>';
    }

    div.innerHTML = `
<div style="font-weight:600;color:#0f172a;font-size:15px;line-height:1.3;min-height:40px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:8px;text-align:center;" title="${aluno.ALUNO || ''}">${aluno.ALUNO || 'Nome inválido'}</div>      <div style="display:flex; align-items:center; gap:12px;">
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
          ${avatarHtml}
          ${turmaHtml}
        </div>
        <div style="flex:1;min-width:0;">
          ${aluno.SITUACAO && aluno.SITUACAO !== 'Ativo' ? `<div style="font-size:11px; color:#dc2626; margin-bottom:4px;"><i class="fas fa-thumbtack"></i> ${aluno.SITUACAO}</div>` : ''}
          ${docsIconsHtml}
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;">
            <span class="status-badge ${statusClass}" style="padding:2px 8px;border-radius:40px;font-size:11px;font-weight:500;">${aluno.STATUS}</span>
            ${prazoTexto ? `<span class="prazo-info ${prazoClasse}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#64748b;"><i class="fas fa-hourglass-half"></i> ${prazoTexto}</span>` : ''}
          </div>
        </div>
        ${botoesAcaoHtml}
      </div>
    `;
    // Pré‑visualização da foto ao passar o mouse
    const avatarEl = div.querySelector('.aluno-foto, .aluno-avatar');
    if (avatarEl && aluno.FOTO) {
      let tooltipFoto = null;
      avatarEl.addEventListener('mouseenter', function(e) {
        tooltipFoto = document.createElement('img');
        tooltipFoto.src = aluno.FOTO;
        tooltipFoto.style.cssText = `
          position: fixed;
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          z-index: 10000;
          pointer-events: none;
        `;
        document.body.appendChild(tooltipFoto);
        atualizarPosicaoTooltip(e);
      });
      avatarEl.addEventListener('mousemove', function(e) {
        if (tooltipFoto) atualizarPosicaoTooltip(e);
      });
      avatarEl.addEventListener('mouseleave', function() {
        if (tooltipFoto) {
          tooltipFoto.remove();
          tooltipFoto = null;
        }
      });
      function atualizarPosicaoTooltip(e) {
        if (!tooltipFoto) return;
        const x = e.clientX + 15;
        const y = e.clientY + 15;
        tooltipFoto.style.left = x + 'px';
        tooltipFoto.style.top = y + 'px';
      }
    }
        // Input file oculto para upload de foto no card
    const inputFoto = document.createElement('input');
    inputFoto.type = 'file';
    inputFoto.accept = 'image/*';
    inputFoto.id = fotoInputId;
    inputFoto.style.display = 'none';
    inputFoto.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        mostrarToast('A imagem deve ter no máximo 5 MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = function(ev) {
        const base64 = ev.target.result.split(',')[1];
        const dados = {
          acao: 'uploadFotoAluno',
          email: emailUsuario,
          escola: aluno.ESCOLA,
          row: aluno._row,
          fileBase64: base64,
          fileName: `aluno_${aluno.ID || aluno._row}.jpg`,
          mimeType: file.type
        };
        postSemResposta(dados, 'Foto atualizada!', () => {
          // Atualiza a visualização do card imediatamente
          const fotoEl = document.getElementById(`foto_${aluno._row}`);
          if (fotoEl) {
            if (fotoEl.tagName === 'IMG') {
              fotoEl.src = URL.createObjectURL(file);
            } else {
              // Substitui a div inicial pela nova imagem
              const novaImg = document.createElement('img');
              novaImg.src = URL.createObjectURL(file);
              novaImg.className = 'aluno-foto';
              novaImg.id = `foto_${aluno._row}`;
              novaImg.style.cssText = 'width:44px;height:44px;border-radius:12px;object-fit:cover;flex-shrink:0;cursor:pointer;';
              novaImg.title = 'Foto do aluno';
              novaImg.onclick = () => document.getElementById(fotoInputId).click();
              fotoEl.parentNode.replaceChild(novaImg, fotoEl);
            }
          }
        });
      };
      reader.readAsDataURL(file);
    });
    div.appendChild(inputFoto);
    // Duplo clique no card abre a ficha do aluno
    div.addEventListener('dblclick', function(e) {
      if (e.target.closest('button, a, input, select, textarea, .btn-icone')) return;
      abrirAluno(aluno._row);
    });

    // Botão lápis (editar) no canto inferior direito
    const btnLapis = document.createElement('button');
    btnLapis.className = 'btn-icone';
    btnLapis.setAttribute('data-tooltip', 'Abrir ficha do aluno');
    btnLapis.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
    btnLapis.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      background: transparent;
      border: none;
      cursor: pointer;
      z-index: 5;
    `;
    btnLapis.addEventListener('click', (e) => {
      e.stopPropagation();
      abrirAluno(aluno._row);
    });
    div.appendChild(btnLapis);

    // Preencher o container vertical de ações (WhatsApp, Histórico, PDF)
    if (perfilUsuario !== 'PEDAGOGICO') {
      const containerAcoes = div.querySelector('.botoes-acao-vertical');
      if (containerAcoes) {
        // Botão WhatsApp
        const infoWhatsApp = gerarLinkWhatsApp(aluno);
        if (infoWhatsApp.pendentes.length > 0) {
          const btnWhatsApp = document.createElement('a');
          const temTelefone = !!infoWhatsApp.url;

          btnWhatsApp.href = temTelefone ? infoWhatsApp.url : '#';
          btnWhatsApp.target = temTelefone ? '_blank' : '';
          btnWhatsApp.rel = 'noopener noreferrer';
          btnWhatsApp.setAttribute('data-tooltip',
            temTelefone
              ? 'Abrir WhatsApp - Documentos Pendentes'
              : 'Telefone não cadastrado'
          );
          btnWhatsApp.innerHTML = `<i class="fab fa-whatsapp" style="font-size:14px; color:${temTelefone ? '#25D366' : '#9ca3af'}; line-height:1;"></i>`;
          btnWhatsApp.style.cssText = `
            width: 28px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: none;
            cursor: ${temTelefone ? 'pointer' : 'not-allowed'};
            text-decoration: none;
            padding: 0;
            margin: 0;
            line-height: 1;
            vertical-align: middle;
            opacity: ${temTelefone ? '1' : '0.6'};
          `;
          btnWhatsApp.classList.add('btn-acao-card');
          btnWhatsApp.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
              const msg = infoWhatsApp.mensagem;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(msg).then(() => {
                  mostrarToast('Mensagem copiada!', 'success');
                }).catch(() => {
                  mostrarToast('Erro ao copiar.', 'error');
                });
              } else {
                const textarea = document.createElement('textarea');
                textarea.value = msg;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                mostrarToast('Mensagem copiada!', 'success');
              }
            } else {
              if (temTelefone) {
                window.open(infoWhatsApp.url, '_blank');
              } else {
                mostrarToast('Telefone do responsável não cadastrado.', 'warning');
              }
            }
          });

          containerAcoes.appendChild(btnWhatsApp);
        }

        // Botão Gerar Histórico
        // Botão Gerar Histórico
        const btnHistorico = document.createElement('button');
        btnHistorico.className = 'btn-icone btn-acao-card';
        btnHistorico.setAttribute('data-tooltip', 'Gerar Histórico');
        btnHistorico.innerHTML = '<i class="fas fa-file-export" style="font-size:14px; line-height:1;"></i>';
        btnHistorico.style.cssText = `
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          margin: 0;
          line-height: 1;
          vertical-align: middle;
        `;
        btnHistorico.addEventListener('click', (e) => {
          e.stopPropagation();
          if (aluno.ID && aluno.ESCOLA && aluno.TURMA) {
            gerarHistoricoAluno(aluno.ID, aluno.ESCOLA, aluno.TURMA);
          } else {
            mostrarToast("Dados incompletos do aluno.", "warning");
          }
        });
        btnHistorico.style.marginTop = '-14px';   // mesmo valor usado no PDF
        containerAcoes.appendChild(btnHistorico);

        // Botão Ficha PDF
        // Botão Ficha PDF
        const btnFicha = document.createElement('button');
        btnFicha.className = 'btn-icone btn-acao-card';
        btnFicha.setAttribute('data-tooltip', 'Gerar ficha em PDF');
        btnFicha.innerHTML = '<i class="fas fa-file-pdf" style="font-size:14px; color:#ef4444; line-height:1;"></i>';
        btnFicha.style.cssText = `
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          margin: 0;
          line-height: 1;
          vertical-align: middle;
        `;
        btnFicha.addEventListener('click', (e) => {
          e.stopPropagation();
          gerarFichaPDF(aluno);
        });
        btnFicha.style.marginTop = '-18px';   // ← aumente este valor se quiser subir mais (ex.: -6px)
        containerAcoes.appendChild(btnFicha);
      }
    }

    div.style.opacity = '0';
    div.style.transform = 'translateY(20px)';
    div.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    lista.appendChild(div);
    
    const index = dados.indexOf(aluno);
    setTimeout(() => {
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    }, index * 30);
  });
}

function renderTabela(alunos, container) {
  const tabela = document.createElement('table');
  tabela.className = 'tabela-alunos';
  tabela.style.width = '100%';
  tabela.style.borderCollapse = 'collapse';
  tabela.style.fontSize = '14px';
  
  const thead = document.createElement('thead');
  thead.innerHTML = `
  <tr style="border-bottom: 2px solid var(--card-border);">
    <th style="padding: 12px 8px; text-align: left; cursor: pointer;" onclick="ordenarAlunos('nome')">Nome ${ordenacaoAtual.campo === 'nome' ? (ordenacaoAtual.direcao === 'asc' ? '▲' : '▼') : ''}</th>
    <th style="padding: 12px 8px; text-align: left; cursor: pointer;" onclick="ordenarAlunos('turma')">Turma ${ordenacaoAtual.campo === 'turma' ? (ordenacaoAtual.direcao === 'asc' ? '▲' : '▼') : ''}</th>
    <th style="padding: 12px 8px; text-align: left; cursor: pointer;" onclick="ordenarAlunos('status')">Status ${ordenacaoAtual.campo === 'status' ? (ordenacaoAtual.direcao === 'asc' ? '▲' : '▼') : ''}</th>
    <th style="padding: 12px 8px; text-align: left;">Docs Pendentes</th>
    <th style="padding: 12px 8px; text-align: left; cursor: pointer;" onclick="ordenarAlunos('prazo')">Prazo ${ordenacaoAtual.campo === 'prazo' ? (ordenacaoAtual.direcao === 'asc' ? '▲' : '▼') : ''}</th>
    <th style="padding: 12px 8px; text-align: center;">Ações</th>
  </tr>
`;
  tabela.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  alunos.forEach(aluno => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--card-border)';
    tr.style.transition = 'background 0.1s';
    tr.addEventListener('mouseenter', () => tr.style.background = 'var(--card-border)');
    tr.addEventListener('mouseleave', () => tr.style.background = 'transparent');
    
        const tdNome = document.createElement('td');
    tdNome.style.padding = '6px 8px';
    tdNome.style.maxWidth = '220px';
    
    // Container para foto + nome
    const nomeContainer = document.createElement('div');
    nomeContainer.style.cssText = 'display:flex; align-items:center; gap:8px;';
    
    // Miniatura da foto (ou inicial)
    if (aluno.FOTO) {
      const img = document.createElement('img');
      img.src = aluno.FOTO;
      img.style.cssText = 'width:32px;height:32px;border-radius:6px;object-fit:cover;flex-shrink:0;';
      nomeContainer.appendChild(img);
    } else {
      const inicial = (aluno.ALUNO || '').charAt(0).toUpperCase() || '?';
      const divInicial = document.createElement('div');
      divInicial.style.cssText = 'width:32px;height:32px;background:#e0e7ff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;color:#2563eb;flex-shrink:0;';
      divInicial.textContent = inicial;
      nomeContainer.appendChild(divInicial);
    }
    
    // Nome truncado
    const spanNome = document.createElement('span');
    spanNome.textContent = aluno.ALUNO;
    spanNome.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    spanNome.title = aluno.ALUNO;
    nomeContainer.appendChild(spanNome);
    
    tdNome.appendChild(nomeContainer);
    
    const tdTurma = document.createElement('td');
    tdTurma.style.padding = '10px 8px';
    tdTurma.textContent = aluno.TURMA || '—';
    
    const tdStatus = document.createElement('td');
    tdStatus.style.padding = '10px 8px';
    let statusClass = '';
    if (aluno.STATUS.includes('✅')) statusClass = 'status-completo';
    else if (aluno.STATUS.includes('⚠️')) statusClass = 'status-pendente';
    else if (aluno.STATUS.includes('🔴')) statusClass = 'status-vencido';
    tdStatus.innerHTML = `<span class="status-badge ${statusClass}" style="padding:2px 8px; border-radius:40px; font-size:12px;">${aluno.STATUS}</span>`;
    
    const tdDocs = document.createElement('td');
    tdDocs.style.padding = '10px 8px';
    const pendentes = [];
    CONFIG_DOCS_CARD.forEach(doc => {
      if (!aluno[doc.coluna]) {
        pendentes.push(`<span class="doc-icon pendente" data-tooltip="${doc.label} - Pendente" style="margin-right:4px;"><i class="fas ${doc.icone}"></i></span>`);
      }
    });
    // Ícone de ID SEGES
    if (aluno.ID) {
      pendentes.push(`<span class="doc-icon info" data-tooltip="ID Aluno: ${aluno.ID}" style="margin-right:4px;"><i class="fas fa-id-badge"></i></span>`);
    }
    tdDocs.innerHTML = pendentes.join('') || '<span style="color: var(--text-muted);">—</span>';
    
    const tdPrazo = document.createElement('td');
    tdPrazo.style.padding = '10px 8px';
    let prazoTexto = '';
    if (aluno.STATUS !== '✅ Completo' && aluno.PRAZO_FINAL) {
      const hoje = new Date(); hoje.setHours(0,0,0,0);
      const prazo = new Date(aluno.PRAZO_FINAL); prazo.setHours(0,0,0,0);
      const diff = Math.floor((prazo - hoje) / (1000*60*60*24));
      if (diff < 0) prazoTexto = `Vencido: ${Math.abs(diff)} d`;
      else if (diff === 0) prazoTexto = 'Vence hoje';
      else prazoTexto = `${diff} dias`;
    } else {
      prazoTexto = '—';
    }
    tdPrazo.textContent = prazoTexto;
    
    const tdAcoes = document.createElement('td');
    tdAcoes.style.padding = '10px 8px';
    tdAcoes.style.textAlign = 'center';
    tdAcoes.innerHTML = `<button class="btn-icone" onclick="abrirAluno(${aluno._row})" data-tooltip="Abrir ficha" style="width:32px; height:32px;"><i class="fa-regular fa-pen-to-square"></i></button>`;
    
    tr.appendChild(tdNome);
    tr.appendChild(tdTurma);
    tr.appendChild(tdStatus);
    tr.appendChild(tdDocs);
    tr.appendChild(tdPrazo);
    tr.appendChild(tdAcoes);
    tbody.appendChild(tr);
  });
  
  tabela.appendChild(tbody);
  container.appendChild(tabela);
}

// ------ PAINEL DE MÉTRICAS ------
function gerarResumo(dados) {
  let resumo = {
    total: dados.length,
    completos: 0,
    pendentes: 0,
    vencidos: 0
  };

  dados.forEach(aluno => {
    if (aluno.STATUS === "✅ Completo") resumo.completos++;
    if (aluno.STATUS === "⚠️ Pendente") resumo.pendentes++;
    if (aluno.STATUS !== "✅ Completo" && aluno.ALERTA === "🔴 Vencido") resumo.vencidos++;
  });

  return resumo;
}

function renderPainel(resumo) {
  const painel = document.getElementById("painel");
  painel.innerHTML = `
    <div class="metrica-card metrica-total" onclick="filtrarPorStatus('total')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-clipboard-list"></i> Total de alunos</div>
      <div class="metrica-valor">${resumo.total}</div>
      <div class="metrica-detalhe">matriculados</div>
    </div>
    <div class="metrica-card metrica-completos" onclick="filtrarPorStatus('completo')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-check-circle"></i> Completos</div>
      <div class="metrica-valor">${resumo.completos}</div>
      <div class="metrica-detalhe">documentação ok</div>
    </div>
    <div class="metrica-card metrica-pendentes" onclick="filtrarPorStatus('pendente')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-exclamation-triangle"></i> Pendentes</div>
      <div class="metrica-valor">${resumo.pendentes}</div>
      <div class="metrica-detalhe">faltam documentos</div>
    </div>
    <div class="metrica-card metrica-vencidos" onclick="filtrarPorStatus('vencido')" style="cursor:pointer;">
      <div class="metrica-titulo"><i class="fas fa-hourglass-end" style="color:#dc2626;"></i> Vencidos</div>
      <div class="metrica-valor">${resumo.vencidos}</div>
      <div class="metrica-detalhe">prazo expirado</div>
    </div>
  `;
}

// ------ CARDS POR ESCOLA ------
function renderPorEscola(mapa, metricas) {
  const painel = document.getElementById("painel");
  const isAdmin = (emailUsuario === 'eder.ramos@educador.edu.es.gov.br');
  
  const card = document.createElement('div');
  card.className = 'metrica-card metrica-escola';
  
  if (isAdmin) {
    const totalAlunos = metricas ? metricas.total : 0;
    const completos = metricas ? metricas.completos : 0;
    const pendentes = metricas ? metricas.pendentes : 0;
    const vencidos = metricas ? metricas.vencidos : 0;
    
    card.innerHTML = `
      <div class="metrica-titulo"><i class="fas fa-building"></i> Por SRE</div>
      <div class="metrica-valor" style="font-size: 28px;">${totalAlunos}</div>
      <div class="metrica-detalhe">total de alunos</div>
      <div style="margin-top: 12px; display: flex; justify-content: space-between; gap: 8px;">
        <div style="text-align: center; flex:1;">
          <span style="font-weight:bold; color:#10b981;">${completos}</span><br>
          <span style="font-size:11px;">Completos</span>
        </div>
        <div style="text-align: center; flex:1;">
          <span style="font-weight:bold; color:#f59e0b;">${pendentes}</span><br>
          <span style="font-size:11px;">Pendentes</span>
        </div>
        <div style="text-align: center; flex:1;">
          <span style="font-weight:bold; color:#dc2626;">${vencidos}</span><br>
          <span style="font-size:11px;">Vencidos</span>
        </div>
      </div>
    `;
  } else {
    let iconesHtml = '';
    if (mapa && Object.keys(mapa).length > 0) {
      const cores = gerarCoresPorEscola(Object.keys(mapa));
      for (let escola in mapa) {
        const dados = mapa[escola];
        const cor = cores[escola];
        const tooltipText = `${escola}\nTotal: ${dados.total}\nPendentes: ${dados.pendentes}`;
        iconesHtml += `
          <div class="escola-icone" 
               style="background-color: ${cor};" 
               data-tooltip="${tooltipText.replace(/\n/g, '&#10;')}">
            <i class="fas fa-school"></i>
          </div>
        `;
      }
    } else {
      iconesHtml = '<p style="font-size:13px; color: var(--text-muted);">Nenhuma escola encontrada.</p>';
    }
    
    card.innerHTML = `
      <div class="metrica-titulo"><i class="fas fa-school"></i> Por Escola</div>
      <div class="metrica-valor" style="font-size: 24px; line-height: 1.2;">
        <div class="escola-icones-container">
          ${iconesHtml}
        </div>
      </div>
      <div class="metrica-detalhe" style="margin-top: 8px;">
      </div>
    `;
  }
  
  painel.appendChild(card);
}

function gerarCoresPorEscola(escolas) {
  const cores = {};
  escolas.forEach((escola, index) => {
    let hash = 0;
    for (let i = 0; i < escola.length; i++) {
      hash = escola.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    cores[escola] = `hsl(${hue}, 70%, 60%)`;
  });
  return cores;
}

// ------ PAGINAÇÃO DA LISTA PRINCIPAL ------
function renderizarPaginacao(totalPaginas, totalRegistros = dadosFiltradosGlobais.length) {
  const container = document.getElementById('paginacao');
  if (!container) return;
  
  if (totalPaginas <= 1 && alunosPorPagina >= totalRegistros) {
    container.style.display = 'none';
    return;
  }
  
  container.style.display = 'flex';
  container.innerHTML = '';

  const btnFirst = document.createElement('button');
  btnFirst.innerHTML = '<i class="fas fa-angle-double-left"></i>';
  btnFirst.className = 'btn-paginacao';
  btnFirst.disabled = (paginaAtual === 1);
  btnFirst.addEventListener('click', () => {
    if (paginaAtual !== 1) {
      aplicarFiltros(1);
    }
  });
  container.appendChild(btnFirst);

  const btnPrev = document.createElement('button');
  btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
  btnPrev.className = 'btn-paginacao';
  btnPrev.disabled = (paginaAtual === 1);
  btnPrev.addEventListener('click', () => {
    if (paginaAtual > 1) {
      aplicarFiltros(paginaAtual - 1);
    }
  });
  container.appendChild(btnPrev);

  const paginaSpan = document.createElement('span');
  paginaSpan.className = 'pagina-info';
  paginaSpan.textContent = `Página ${paginaAtual} de ${totalPaginas} (${totalRegistros} registros)`;
  container.appendChild(paginaSpan);

  const btnNext = document.createElement('button');
  btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
  btnNext.className = 'btn-paginacao';
  btnNext.disabled = (paginaAtual === totalPaginas);
  btnNext.addEventListener('click', () => {
    if (paginaAtual < totalPaginas) {
      aplicarFiltros(paginaAtual + 1);
    }
  });
  container.appendChild(btnNext);

  const btnLast = document.createElement('button');
  btnLast.innerHTML = '<i class="fas fa-angle-double-right"></i>';
  btnLast.className = 'btn-paginacao';
  btnLast.disabled = (paginaAtual === totalPaginas);
  btnLast.addEventListener('click', () => {
    if (paginaAtual !== totalPaginas) {
      aplicarFiltros(totalPaginas);
    }
  });
  container.appendChild(btnLast);

  const selectItens = document.createElement('select');
  selectItens.className = 'btn-paginacao';
  selectItens.style.marginLeft = '12px';
  [20, 50, 100, 200].forEach(qtd => {
    const opt = document.createElement('option');
    opt.value = qtd;
    opt.textContent = `${qtd} por página`;
    if (alunosPorPagina === qtd) opt.selected = true;
    selectItens.appendChild(opt);
  });
  selectItens.addEventListener('change', (e) => {
    alunosPorPagina = parseInt(e.target.value);
    paginaAtual = 1;
    aplicarFiltros(1);
  });
  container.appendChild(selectItens);
}

// ------ LISTA DE INATIVOS ------
function renderizarListaInativos(alunos) {
  const container = document.getElementById("listaInativosContainer");
  container.innerHTML = "";
  
  if (!alunos || alunos.length === 0) {
    container.innerHTML = "<p style='padding:16px; text-align:center;'>Nenhum aluno inativo encontrado.</p>";
    return;
  }
  
  alunos.forEach(aluno => {
    const div = document.createElement("div");
    div.className = "usuario-card";
    div.style.marginBottom = "8px";
    
    const situacaoBadge = aluno.SITUACAO === "Transferido" 
      ? '<span class="status-badge" style="background:#fef3c7;color:#92400e;"><i class="fas fa-exchange-alt"></i> Transferido</span>'
      : '<span class="status-badge" style="background:#e0e7ff;color:#3730a3;"><i class="fas fa-graduation-cap"></i> Concluído</span>';
    
    div.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-user-graduate"></i></div>
      <div class="usuario-info">
        <strong>${aluno.ALUNO}</strong>
        <p><i class="fas fa-school"></i> ${aluno.ESCOLA} | <i class="fas fa-book"></i> ${aluno.TURMA || "—"}</p>
        <p>${situacaoBadge} <span style="margin-left:8px;"><i class="fas fa-calendar"></i> Matrícula: ${new Date(aluno.DATA_MATRICULA).toLocaleDateString('pt-BR')}</span></p>
        <div style="margin-top:8px;">
          <button class="btn-pequeno" onclick="reativarAlunoInativo('${aluno.ID}', '${aluno.ALUNO}', ${aluno._row}, '${aluno.ESCOLA}')">
            <i class="fas fa-undo-alt"></i> Reativar
          </button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderizarPaginacaoInativos() {
  const container = document.getElementById("paginacaoInativos");
  if (!container) return;
  
  if (totalPaginasInativos <= 1) {
    container.style.display = "none";
    return;
  }
  
  container.style.display = "flex";
  container.innerHTML = "";
  
  const btnPrev = document.createElement("button");
  btnPrev.innerHTML = '<i class="fas fa-chevron-left"></i>';
  btnPrev.className = "btn-paginacao";
  btnPrev.disabled = (paginaAtualInativos === 1);
  btnPrev.addEventListener("click", () => {
    if (paginaAtualInativos > 1) buscarInativos(paginaAtualInativos - 1);
  });
  container.appendChild(btnPrev);
  
  const span = document.createElement("span");
  span.className = "pagina-info";
  span.textContent = `Página ${paginaAtualInativos} de ${totalPaginasInativos}`;
  container.appendChild(span);
  
  const btnNext = document.createElement("button");
  btnNext.innerHTML = '<i class="fas fa-chevron-right"></i>';
  btnNext.className = "btn-paginacao";
  btnNext.disabled = (paginaAtualInativos === totalPaginasInativos);
  btnNext.addEventListener("click", () => {
    if (paginaAtualInativos < totalPaginasInativos) buscarInativos(paginaAtualInativos + 1);
  });
  container.appendChild(btnNext);
}

// ------ PROCESSOS ------
function renderizarListaProcessos(processos) {
  const container = document.getElementById("listaProcessosContainer");
  container.innerHTML = "";
  
  if (!Array.isArray(processos) || processos.length === 0) {
    container.innerHTML = "<p>Nenhum processo encontrado.</p>";
    return;
  }
  
  processos.forEach(p => {
    if (!p.codigo && !p.tipo) return;
    
    const div = document.createElement("div");
    div.className = "usuario-card";
    
    let detalhes = `<i class="fas fa-school"></i> ${p.escola || '—'}`;
    if (p.aluno) detalhes += ` | <i class="fas fa-user"></i> ${p.aluno}`;
    if (p.categoria) detalhes += ` | <i class="fas fa-folder"></i> ${p.categoria}`;
    if (p.subcategoria) detalhes += ` / ${p.subcategoria}`;
    if (p.observacoes) detalhes += `<br><i class="fas fa-pencil-alt"></i> ${p.observacoes}`;
    
    const linkButton = p.link 
  ? `<a href="${p.link}" target="_blank" class="btn-icone" title="Abrir processo no Edocs" style="color:#0ea5e9; margin-left:4px;"><i class="fas fa-external-link-alt"></i></a>` 
  : '';

div.innerHTML = `
  <div class="usuario-avatar"><i class="fas fa-file-alt"></i></div>
  <div class="usuario-info">
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
      <strong>${p.codigo || 'Sem código'} (${p.tipo || 'Sem tipo'})</strong>
      <div style="display: flex; align-items: center; gap: 4px;">
        <button class="btn-icone" onclick="copiarCodigo('${p.codigo}')" title="Copiar código"><i class="fas fa-copy"></i></button>
        ${linkButton}
      </div>
    </div>
    <p>${detalhes}</p>
  </div>
`;
    container.appendChild(div);
  });
}

// ------ DOCUMENTOS ------
function renderizarListaDocumentos(docs) {
  const container = document.getElementById("listaDocumentosContainer");
  container.innerHTML = "";
  if (!docs.length) { container.innerHTML = "<p>Nenhum documento encontrado.</p>"; return; }
  docs.forEach(doc => {
    const div = document.createElement("div");
    div.className = "usuario-card";
    div.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-file"></i></div>
      <div class="usuario-info">
        <strong>${doc.fileName}</strong>
        <p><i class="fas fa-school"></i> ${doc.escola} | <i class="fas fa-user"></i> ${doc.nomeAluno} | <i class="fas fa-calendar-alt"></i> ${new Date(doc.dataUpload).toLocaleDateString()}</p>
        <div style="margin-top:8px;">
          <a href="${doc.viewUrl}" target="_blank" class="btn-pequeno"><i class="fas fa-eye"></i> Visualizar</a>
          <a href="${doc.downloadUrl}" class="btn-pequeno"><i class="fas fa-download"></i> Baixar</a>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// ------ USUÁRIOS (LISTA NO MODAL) ------
async function carregarUsuarios() {
  mostrarLoading();
  const url = `${API_URL}?tipo=usuarios&email=${emailUsuario}`;
  
  jsonp(url, function(dados) {
    if (dados.erro) {
      mostrarToast("Acesso não autorizado", "error");
      esconderLoading();
      return;
    }
    renderUsuarios(dados);
    esconderLoading();
  });
}

function renderUsuarios(usuarios) {
  const container = document.getElementById("listaUsuariosContainer");
  container.innerHTML = "";

  if (!Array.isArray(usuarios)) {
    container.innerHTML = "<p>Erro ao carregar usuários</p>";
    return;
  }

  if (usuarios.length === 0) {
    container.innerHTML = "<p>Nenhum usuário cadastrado</p>";
    return;
  }

  window._usuariosCache = usuarios;

  const classesPerfil = { SUPERVISOR: 'perfil-supervisor', SECRETARIA: 'perfil-secretaria', PEDAGOGICO: 'perfil-pedagogico' };

  usuarios.forEach((u, idx) => {
    const div = document.createElement("div");
    div.className = "usuario-card";

    const perfisArray = (u.PERFIL || "").toString().split(',').map(p => p.trim().toUpperCase()).filter(Boolean);
    const avatarIcon = perfisArray.includes('SUPERVISOR') ? '<i class="fas fa-crown"></i>' : '<i class="fas fa-user-tie"></i>';
    const badges = perfisArray.map(p => `<span class="perfil-badge ${classesPerfil[p] || 'perfil-secretaria'}">${p}</span>`).join('');

    div.innerHTML = `
      <div class="usuario-avatar">${avatarIcon}</div>
      <div class="usuario-info">
        <strong>${u.NOME || u.EMAIL}</strong>
        <p><i class="fas fa-envelope"></i> ${u.EMAIL} · <i class="fas fa-school"></i> ${u.ESCOLA || "—"}</p>
        <p>${badges}</p>
        <div class="usuario-acoes">
          <button class="btn-pequeno" onclick="resetarSenhaUsuario('${u.EMAIL}')">
            <i class="fas fa-key"></i> Resetar senha
          </button>
          <button class="btn-pequeno" onclick="abrirModalEdicaoUsuario(window._usuariosCache[${idx}])">
            <i class="fas fa-edit"></i> Editar
          </button>
          <button class="btn-pequeno btn-excluir" onclick="excluirUsuarioAdmin('${u.EMAIL}')">
            <i class="fas fa-trash"></i> Excluir
          </button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
}

// ------ ATOS AUTORIZATIVOS ------
function renderizarListaAtos(atos) {
  const container = document.getElementById('listaAtosContainer');
  container.innerHTML = '';
  atosSelecionados.clear();  // limpa seleções anteriores
  atualizarBotaoExportarSelecionados();

  if (!atos || atos.length === 0) {
    container.innerHTML = '<p>Nenhum ato cadastrado.</p>';
    return;
  }

  const isSupervisor = (perfilUsuario === 'SUPERVISOR');

  // Se for supervisor, agrupa por escola
  if (isSupervisor) {
    const atosPorEscola = {};
    atos.forEach(ato => {
      if (!atosPorEscola[ato.escola]) atosPorEscola[ato.escola] = [];
      atosPorEscola[ato.escola].push(ato);
    });
    const escolasOrdenadas = Object.keys(atosPorEscola).sort();
    escolasOrdenadas.forEach(escola => {
      container.appendChild(criarTituloEscola(escola));
      atosPorEscola[escola].forEach(ato => {
        container.appendChild(criarCardAto(ato, isSupervisor));
      });
    });
  } else {
    atos.forEach(ato => {
      container.appendChild(criarCardAto(ato, false));
    });
  }
}

function criarTituloEscola(escola) {
  const div = document.createElement('div');
  div.style.cssText = 'font-weight: 600; font-size: 16px; margin: 16px 0 4px; padding: 8px 12px; background: var(--card-border); border-radius: 8px; display: flex; align-items: center; gap: 8px; grid-column: 1 / -1;';
  div.innerHTML = `<i class="fas fa-school"></i> ${escola}`;
  return div;
}

function criarCardAto(ato, mostrarEscola) {
  const div = document.createElement('div');
  div.className = 'usuario-card';
  div.style.position = 'relative';
  div.style.paddingLeft = '52px'; // espaço para checkbox

  let statusClass = '';
  if (ato.status === 'Válido') statusClass = 'status-completo';
  else if (ato.status.includes('Vencendo')) statusClass = 'status-pendente';
  else if (ato.status === 'Vencido') statusClass = 'status-vencido';

  // Checkbox de seleção
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.style.cssText = 'position: absolute; left: 16px; top: 24px; width: 24px; height: 24px; cursor: pointer;';
  checkbox.addEventListener('change', function() {
    if (this.checked) {
      atosSelecionados.add(ato.id);
      div.classList.add('ato-selecionado');   // destaque visual
    } else {
      atosSelecionados.delete(ato.id);
      div.classList.remove('ato-selecionado'); // remove destaque
    }
    atualizarBotaoExportarSelecionados();
  });
  div.appendChild(checkbox);

  const conteudo = document.createElement('div');
  conteudo.style.flex = '1';
  conteudo.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
      <strong>${ato.numeroAto}</strong>
      <span class="status-badge ${statusClass}">${ato.status}</span>
    </div>
    <p style="margin: 4px 0;">
      <i class="fas fa-tag"></i> ${ato.tipoAto}
      ${mostrarEscola ? ` | <i class="fas fa-school"></i> ${ato.escola}` : ''}
    </p>
    ${ato.cursoEtapa ? `<p style="margin: 4px 0;"><i class="fas fa-book"></i> ${ato.cursoEtapa}</p>` : ''}
    ${ato.cursoTecnico ? `<p style="margin: 4px 0;"><i class="fas fa-graduation-cap"></i> Curso: ${ato.cursoTecnico}</p>` : ''}
    <p style="margin: 4px 0;"><i class="fas fa-calendar-alt"></i> Publicação: ${new Date(ato.dataPublicacao).toLocaleDateString('pt-BR')}</p>
    <p style="margin: 4px 0;"><i class="fas fa-calendar-check"></i> Homologação: ${new Date(ato.dataHomologacao).toLocaleDateString('pt-BR')}</p>
    <p style="margin: 4px 0;"><i class="fas fa-hourglass-half"></i> Validade: ${ato.validadeAnos} anos</p>
    ${ato.fundamentacao ? `<p style="margin: 4px 0; font-size: 12px;"><i class="fas fa-gavel"></i> Fund.: ${ato.fundamentacao}</p>` : ''}
    <div style="margin-top: 8px;">
      ${ato.arquivoId ? `<a href="https://drive.google.com/file/d/${ato.arquivoId}/view" target="_blank" class="btn-pequeno"><i class="fas fa-file-pdf"></i> Ver Ato</a>` : ''}
      <button class="btn-pequeno" onclick="event.stopPropagation(); editarAto('${ato.id}')"><i class="fas fa-edit"></i> Editar</button>
      <button class="btn-pequeno" onclick="event.stopPropagation(); excluirAto('${ato.id}')"><i class="fas fa-trash"></i> Excluir</button>
    </div>
  `;
  div.appendChild(conteudo);
  return div;
}

function atualizarBotaoExportarSelecionados() {
  const btn = document.getElementById('btnExportarSelecionados');
  if (atosSelecionados.size > 0) {
    btn.style.display = 'inline-block';
    btn.textContent = `Exportar Selecionados (${atosSelecionados.size})`;
  } else {
    btn.style.display = 'none';
  }
}

// ------ PREVIEW DE IMPORTAÇÃO CSV ------
function renderizarPreview(alunos) {
  const container = document.getElementById('previewContainer');
  if (alunos.length === 0) {
    container.innerHTML = '<p style="padding:16px;color:#dc2626;">Nenhum aluno válido encontrado.</p>';
    return;
  }

  let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
  html += '<thead><tr style="background:#f1f5f9;">';
  html += '<th>Nome</th><th>Escola</th><th>Turma</th><th>Resp.</th><th>Tel.</th><th>CPF</th><th>SUS</th><th>RG</th><th>Resid.</th><th>Ed.Especial</th>';
  html += '</tr></thead><tbody>';
  alunos.slice(0, 50).forEach(a => {
    html += `<tr style="border-bottom:1px solid #e2e8f0;">`;
    html += `<td>${a.nome || '-'}</td><td>${a.escola || '-'}</td><td>${a.turma || '-'}</td><td>${a.responsavel || '-'}</td><td>${a.telefone || '-'}</td>`;
    html += `<td>${a.cpfAluno ? '✓' : '-'}</td><td>${a.sus ? '✓' : '-'}</td><td>${a.rg ? '✓' : '-'}</td><td>${a.residencia ? '✓' : '-'}</td>`;
    html += `<td>${a.edEspecial ? 'Sim' : 'Não'}</td>`;
    html += `</tr>`;
  });
  html += '</tbody></table>';
  if (alunos.length > 50) html += `<p style="padding:8px;">Exibindo 50 de ${alunos.length} alunos.</p>`;
  container.innerHTML = html;
}

// ------ LOGO E FUNDO DO HEADER ------
function atualizarLogoEscola(escolaOuEmail) {
  const img = document.getElementById("logoEscola");
  if (!img) return;
  
  let primaryUrl = "", fallbackUrl = "";
  
  if (perfilUsuario === "SUPERVISOR") {
    primaryUrl = LOGOS_SUPERVISORES[emailUsuario] || "";
    fallbackUrl = LOGOS_SUPERVISORES["default"] || "";
  } else {
    primaryUrl = LOGOS_ESCOLAS[escolaOuEmail] || "";
    fallbackUrl = LOGOS_ESCOLAS["default"] || "";
  }
  
  function tryLoad(url, nextUrl) {
    if (!url) {
      if (nextUrl) tryLoad(nextUrl, null);
      else img.style.display = "none";
      return;
    }
    
    img.src = url + "?v=" + Date.now();
    img.style.display = "inline-block";
    
    img.onerror = function() {
      console.warn("❌ Falha ao carregar:", url);
      if (nextUrl) {
        console.log("↪️ Tentando fallback:", nextUrl);
        tryLoad(nextUrl, null);
      } else {
        img.style.display = "none";
      }
    };
    
    img.onload = function() {
      console.log("✅ Imagem carregada:", url);
    };
  }
  
  tryLoad(primaryUrl, fallbackUrl);
}

function aplicarFundoHeader(escolaOuEmail) {
  const header = document.querySelector('header');
  if (!header) return;
  
  let imagemUrl = "";
  
  if (perfilUsuario === "SUPERVISOR") {
    imagemUrl = FUNDOS_HEADER_SUPERVISORES[emailUsuario] || FUNDOS_HEADER_SUPERVISORES["default"] || "";
  } else {
    imagemUrl = FUNDOS_HEADER_ESCOLAS[escolaOuEmail] || FUNDOS_HEADER_ESCOLAS["default"] || "";
  }
  
  if (imagemUrl) {
    header.style.backgroundImage = `url('${imagemUrl}')`;
  } else {
    header.style.backgroundImage = "linear-gradient(145deg, #b8c6db 0%, #f5d0d9 100%)";
  }
}

function aplicarFundoPorEscola(escola) {
  const body = document.body;
  let imagemFundo = FUNDOS_ESCOLAS[escola];
  
  if (!imagemFundo) {
    imagemFundo = FUNDOS_ESCOLAS["default"];
  }
  
  if (imagemFundo) {
    body.style.backgroundImage = `url('${imagemFundo}')`;
    body.classList.add("fundo-personalizado");
  } else {
    body.style.backgroundImage = "";
    body.classList.remove("fundo-personalizado");
  }
}

// ------ ALTERNAR VISUALIZAÇÃO CARDS/LISTA ------
function alternarVisualizacao() {
  const btn = document.getElementById('toggleVisualizacao');
  const lista = document.getElementById('lista');
  
  if (modoVisualizacao === 'cards') {
    modoVisualizacao = 'lista';
    btn.classList.add('ativo');
    btn.innerHTML = '<i class="fas fa-list"></i>';
    lista.classList.add('modo-lista');
  } else {
    modoVisualizacao = 'cards';
    btn.classList.remove('ativo');
    btn.innerHTML = '<i class="fas fa-th-large"></i>';
    lista.classList.remove('modo-lista');
  }
  
  const inicio = (paginaAtual - 1) * alunosPorPagina;
  const alunosPagina = dadosFiltradosGlobais.slice(inicio, inicio + alunosPorPagina);
  renderLista(alunosPagina);
}

// ------ LISTA DE TURMAS (MODAL TURMAS) ------
let turmasGlobais = [];

function renderListaTurmas(turmas) {
  const container = document.getElementById("listaTurmasContainer");
  if (!container) return;
  container.innerHTML = "";
  if (!turmas.length) {
    container.innerHTML = "<p>Nenhuma turma cadastrada.</p>";
    return;
  }
  turmas.forEach(t => {
    const div = document.createElement("div");
    div.className = "usuario-card";
    div.innerHTML = `
      <div class="usuario-avatar"><i class="fas fa-book"></i></div>
      <div class="usuario-info">
        <strong>${t.turma}</strong>
        <p><i class="fas fa-school"></i> ${t.escola}</p>
      </div>
    `;
    container.appendChild(div);
  });
}
function filtrarPorStatus(tipo) {
  let status = '';
  switch (tipo) {
    case 'total': status = ''; break;
    case 'completo': status = '✅ Completo'; break;
    case 'pendente': status = '⚠️ Pendente / Vencido'; break;
    case 'vencido': status = '🔴 Vencido'; break;
    default: status = '';
  }

  const selectStatus = document.getElementById('filtroStatus');
  if (selectStatus) selectStatus.value = status;

  if (typeof aplicarFiltros === 'function') {
    aplicarFiltros(1);
  }
}
function ordenarAlunos(campo) {
  if (ordenacaoAtual.campo === campo) {
    ordenacaoAtual.direcao = (ordenacaoAtual.direcao === 'asc') ? 'desc' : 'asc';
  } else {
    ordenacaoAtual.campo = campo;
    ordenacaoAtual.direcao = 'asc';
  }

  // Ordena a lista filtrada global
  dadosFiltradosGlobais.sort((a, b) => {
    let valA, valB;

    switch (campo) {
      case 'nome':
        valA = (a.ALUNO || '').toLowerCase();
        valB = (b.ALUNO || '').toLowerCase();
        break;
      case 'turma':
        valA = (a.TURMA || '').toLowerCase();
        valB = (b.TURMA || '').toLowerCase();
        break;
      case 'status':
        // Ordenar por status: Completo > Pendente > Vencido
        const statusOrder = { '✅ Completo': 1, '⚠️ Pendente': 2, '🔴 Vencido': 3 };
        valA = statusOrder[a.STATUS] || 4;
        valB = statusOrder[b.STATUS] || 4;
        break;
      case 'prazo':
        // Ordenar por data do prazo (mais próximo = menor)
        valA = a.PRAZO_FINAL ? new Date(a.PRAZO_FINAL).getTime() : Number.MAX_SAFE_INTEGER;
        valB = b.PRAZO_FINAL ? new Date(b.PRAZO_FINAL).getTime() : Number.MAX_SAFE_INTEGER;
        break;
      default:
        return 0;
    }

    if (valA < valB) return ordenacaoAtual.direcao === 'asc' ? -1 : 1;
    if (valA > valB) return ordenacaoAtual.direcao === 'asc' ? 1 : -1;
    return 0;
  });

  // Re-renderiza a lista (tabela ou cards) a partir da primeira página
  paginaAtual = 1;
  const inicio = 0;
  const fim = alunosPorPagina;
  const alunosPagina = dadosFiltradosGlobais.slice(inicio, fim);
  renderLista(alunosPagina);
  renderizarPaginacao(Math.ceil(dadosFiltradosGlobais.length / alunosPorPagina), dadosFiltradosGlobais.length);
}
function ordenarTabela(campo) {
  // Se já está ordenando pelo mesmo campo, inverte a direção
  if (ordenacaoAtual.campo === campo) {
    ordenacaoAtual.direcao = ordenacaoAtual.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    ordenacaoAtual.campo = campo;
    ordenacaoAtual.direcao = 'asc';
  }

  // Ordena os dados filtrados
  dadosFiltradosGlobais.sort((a, b) => {
    let valorA = a[campo] || '';
    let valorB = b[campo] || '';

    // Ordenação especial para status (extrai texto)
    if (campo === 'STATUS') {
      // Ordenação por status (Completo > Pendente > Vencido > vazio)
      const statusOrder = { '✅ completo': 1, '⚠️ pendente': 2, '🔴 vencido': 3 };
      valorA = statusOrder[String(valorA).toLowerCase()] || 99;
      valorB = statusOrder[String(valorB).toLowerCase()] || 99;
      return ordenacaoAtual.direcao === 'asc' ? valorA - valorB : valorB - valorA;
    }

    // Ordenação para datas (campo PRAZO_FINAL ou DATA_MATRICULA)
    if (campo === 'PRAZO_FINAL' || campo === 'DATA_MATRICULA') {
      valorA = new Date(valorA).getTime() || 0;
      valorB = new Date(valorB).getTime() || 0;
      return ordenacaoAtual.direcao === 'asc' ? valorA - valorB : valorB - valorA;
    }

    // Ordenação alfabética padrão
    if (typeof valorA === 'string') valorA = valorA.toLowerCase();
    if (typeof valorB === 'string') valorB = valorB.toLowerCase();

    if (valorA < valorB) return ordenacaoAtual.direcao === 'asc' ? -1 : 1;
    if (valorA > valorB) return ordenacaoAtual.direcao === 'asc' ? 1 : -1;
    return 0;
  });

  // Re-renderiza a tabela com os dados ordenados
  const lista = document.getElementById('lista');
  lista.innerHTML = '';
  renderTabela(dadosFiltradosGlobais, lista);
}
// =========================
// GERAR FICHA DO ALUNO EM PDF (COMPLETA)
// =========================
function gerarFichaPDF(aluno) {
  // Foto ou inicial
  const fotoHtml = aluno.FOTO
    ? `<img src="${aluno.FOTO}" style="width:120px;height:120px;border-radius:8px;object-fit:cover;border:2px solid #ccc;">`
    : `<div style="width:120px;height:120px;background:#e0e7ff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:40px;color:#2563eb;">${aluno.ALUNO ? aluno.ALUNO.charAt(0).toUpperCase() : '?'}</div>`;

  // Data de nascimento formatada
  const dataNasc = aluno.DATA_NASCIMENTO 
    ? new Date(aluno.DATA_NASCIMENTO).toLocaleDateString('pt-BR') 
    : '—';
  
  // Data de matrícula formatada
  const dataMat = aluno.DATA_MATRICULA 
    ? new Date(aluno.DATA_MATRICULA).toLocaleDateString('pt-BR') 
    : '—';


  const html = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Ficha do Aluno</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; }
  h1 { color: #1e3a8a; border-bottom: 2px solid #2563eb; padding-bottom: 8px; font-size: 22px; }
  .cabecalho { display: flex; gap: 24px; align-items: center; margin-bottom: 24px; }
  .foto { flex-shrink: 0; }
  .info-resumo { flex:1; }
  .info-resumo h2 { margin:0 0 4px; font-size: 20px; color: #0f172a; }
  .info-resumo p { margin: 2px 0; color: #475569; font-size: 13px; }
  .secao { margin: 20px 0; }
  .secao h3 { background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 14px; color: #1e3a8a; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #f8fafc; padding: 8px 12px; text-align: left; width: 40%; font-size: 13px; color: #64748b; }
  td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
  .status-geral { padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; font-size: 14px; }
  @page { size: A4; margin: 15mm; }
  @media print { body { -webkit-print-color-adjust: exact; } }
</style></head><body>
  <h1>Ficha do Aluno</h1>

  <div class="cabecalho">
    <div class="foto">${fotoHtml}</div>
    <div class="info-resumo">
      <h2>${aluno.ALUNO || '—'}</h2>
      <p>${aluno.ESCOLA || '—'} — ${aluno.TURMA || '—'}</p>
      <p>ID SEGES: ${aluno.ID || '—'}</p>
    </div>
  </div>

  <div class="secao">
    <h3>Dados Pessoais</h3>
    <table>
      <tr><th>Nome completo</th><td>${aluno.ALUNO || '—'}</td></tr>
      <tr><th>Data de nascimento</th><td>${dataNasc}</td></tr>
      <tr><th>CPF</th><td>${aluno.CPF_NUMERO || '—'}</td></tr>
      <tr><th>RG</th><td>${aluno.RG === true ? 'Presente' : 'Não informado'}</td></tr>
      <tr><th>Raça/Cor</th><td>${aluno.RACA_COR || '—'}</td></tr>
      <tr><th>Filiação 1</th><td>${aluno.FILIACAO_1 || '—'}</td></tr>
      <tr><th>Filiação 2</th><td>${aluno.FILIACAO_2 || '—'}</td></tr>
      <tr><th>Naturalidade</th><td>${aluno.NATURALIDADE || '—'} / ${aluno.UF_NASCIMENTO || '—'}</td></tr>
      <tr><th>Nacionalidade</th><td>${aluno.NACIONALIDADE || '—'}</td></tr>
    </table>
  </div>

  <div class="secao">
    <h3>Dados Escolares</h3>
    <table>
      <tr><th>Escola</th><td>${aluno.ESCOLA || '—'}</td></tr>
      <tr><th>Turma</th><td>${aluno.TURMA || '—'}</td></tr>
      <tr><th>Data de matrícula</th><td>${dataMat}</td></tr>
      <tr><th>Situação</th><td>${aluno.SITUACAO || 'Ativo'}</td></tr>
      <tr><th>Responsável</th><td>${aluno.RESPONSAVEL || '—'}</td></tr>
      <tr><th>Telefone</th><td>${aluno.TELEFONE || '—'}</td></tr>
      <tr><th>Educação Especial</th><td>${aluno.ED_ESPECIAL ? 'Sim' : 'Não'}</td></tr>
    </table>
  </div>

  ${aluno.OBSERVACOES ? `
  <div class="secao">
    <h3>Observações</h3>
    <p style="padding:8px;background:#f8fafc;border-radius:6px;">${aluno.OBSERVACOES}</p>
  </div>` : ''}

  <script>window.print();</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(html);
  w.document.close();
}
// =========================
// COMPARTILHAR LEGISLAÇÃO
// =========================
function compartilharLegislacao(item) {
  // Garante que os campos sejam strings
  const tipo = String(item.tipo || '');
  const numero = String(item.numero || '');
  const ano = String(item.ano || '');
  const assunto = String(item.assunto || '');

  const titulo = `${tipo} ${numero}/${ano}`;
  const texto = `${titulo} - ${assunto || 'Sem assunto'}`;
  
  const viewUrl = item.arquivoId 
    ? `https://drive.google.com/file/d/${item.arquivoId}/view` 
    : '';
  
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
        copiarTexto(shareText);
      }
    });
  } else {
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
function renderListaProfissionais(dados) {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  // Por enquanto, usamos apenas o modo cards (depois podemos expandir)
  lista.style.display = "grid";
  lista.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";
  lista.style.gap = "12px";
  lista.style.padding = "0 20px 20px";

  dados.forEach(prof => {
    const div = document.createElement("div");
    div.className = "fade";
    
    div.style.borderRadius = "16px";
    div.style.padding = "12px 16px";
    div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.04)";
    div.style.border = "1px solid #f1f5f9";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "12px";
    div.style.transition = "all 0.2s";
    
    // Nome e cargo
    const nome = prof.NOME || prof["Nome do profissional"] || "Sem nome";
    const cargo = prof.CARGO || prof["Descrição Cargo"] || "—";
    const regime = prof.REGIME || prof["Regime Trabalho"] || "—";
    const situacao = prof.SITUACAO_LOTACAO || prof["Situação Lotação"] || "—";
    
    // Inicial
    const inicial = nome.trim().charAt(0).toUpperCase();

    // Avatar
    let avatarHtml;
    if (prof.FOTO) {
      avatarHtml = `<img src="${prof.FOTO}" style="width:44px;height:44px;border-radius:12px;object-fit:cover;flex-shrink:0;" alt="Foto">`;
    } else {
      avatarHtml = `<div class="aluno-avatar" style="width:44px;height:44px;background:#e0e7ff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;color:#2563eb;flex-shrink:0;">${inicial}</div>`;
    }

    div.innerHTML = `
      ${avatarHtml}
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;color:#0f172a;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;" title="${nome}">${nome}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:2px;"><i class="fas fa-briefcase"></i> ${cargo}</div>
        <div style="font-size:12px;color:#64748b;"><i class="fas fa-building"></i> ${regime}</div>
        ${situacao !== 'ATIVO' ? `<div style="font-size:11px; color:#dc2626; margin-top:2px;"><i class="fas fa-thumbtack"></i> ${situacao}</div>` : ''}
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;">
        <!-- Botão de editar (futuro) -->
        <button class="btn-icone" onclick="abrirFichaProfissional('${prof.ID || prof.MATRICULA}')" data-tooltip="Abrir ficha do profissional" style="color:#64748b;">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
      </div>
    `;

    // Animação de fade
    div.style.opacity = '0';
    div.style.transform = 'translateY(20px)';
    div.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    lista.appendChild(div);
    
    const index = dados.indexOf(prof);
    setTimeout(() => {
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    }, index * 30);
  });
}
