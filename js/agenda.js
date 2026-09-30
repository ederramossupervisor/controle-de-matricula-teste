// =========================
// CALENDÁRIO ESCOLAR SEDU 2026 - ENSINO REGULAR
// =========================
const CALENDARIO_ESCOLAR = {
  F: [
    { dia: 1, mes: 1, descricao: "Confraternização Universal (Feriado)" },
    { dia: 16, mes: 2, descricao: "Feriado" },
    { dia: 17, mes: 2, descricao: "Carnaval (Feriado)" },
    { dia: 18, mes: 2, descricao: "Quarta-feira de Cinzas (Feriado)" },
    { dia: 3, mes: 4, descricao: "Sexta-feira Santa (Feriado)" },
    { dia: 13, mes: 4, descricao: "Nossa Senhora da Penha" },
    { dia: 21, mes: 4, descricao: "Tiradentes (Feriado)" },
    { dia: 1, mes: 5, descricao: "Dia do Trabalho (Feriado)" },
    { dia: 4, mes: 6, descricao: "Corpus Christi (Feriado)" },
    { dia: 7, mes: 9, descricao: "Independência do Brasil (Feriado)" },
    { dia: 12, mes: 10, descricao: "N. Sra. Aparecida (Feriado)" },
    { dia: 15, mes: 10, descricao: "Dia do Professor (Feriado)" },
    { dia: 2, mes: 11, descricao: "Finados (Feriado)" },
    { dia: 15, mes: 11, descricao: "Proclamação da República (Feriado)" },
    { dia: 20, mes: 11, descricao: "Consciência Negra (Feriado)" },
    { dia: 25, mes: 12, descricao: "Natal (Feriado)" }
  ],
  FE: [
    { dia: 1, mes: 1, ate: 30, descricao: "Férias de Verão" },
    { dia: 13, mes: 7, ate: 19, descricao: "Férias de Julho" },
    { dia: 24, mes: 12, ate: 31, descricao: "Férias de Natal" }
  ],
  RE: [
    { dia: 5, mes: 6, descricao: "Recesso Escolar" },
    { dia: 16, mes: 10, descricao: "Recesso Escolar" },
    { dia: 21, mes: 12, ate: 23, descricao: "Recesso Escolar (pós Conselho Final)" }
  ],
  JPP: [
    { dia: 2, mes: 2, ate: 3, descricao: "Jornada de Planejamento Pedagógico" },
    { dia: 20, mes: 7, descricao: "Jornada de Planejamento Pedagógico" }
  ],
  CC: [
    { dia: 15, mes: 5, descricao: "Conselho de Classe" },
    { dia: 4, mes: 9, descricao: "Conselho de Classe" },
    { dia: 16, mes: 12, descricao: "Conselho de Classe" }
  ],
  CCF: [
    { dia: 21, mes: 12, descricao: "Conselho de Classe Final e Divulgação de Resultados" }
  ],
  RF: [
    { dia: 17, mes: 12, ate: 18, descricao: "Recuperação Final" }
  ],
  EER: [
    { dia: 22, mes: 12, descricao: "Prova EER e Divulgação dos Resultados Finais" }
  ],
  FPM: [
    { dia: 24, mes: 3, descricao: "Formação Profissionais do Magistério" },
    { dia: 25, mes: 3, descricao: "Formação Profissionais do Magistério" },
    { dia: 26, mes: 3, descricao: "Formação Profissionais do Magistério" },
    { dia: 23, mes: 6, descricao: "Formação Profissionais do Magistério" },
    { dia: 24, mes: 6, descricao: "Formação Profissionais do Magistério" },
    { dia: 25, mes: 6, descricao: "Formação Profissionais do Magistério" },
    { dia: 22, mes: 9, descricao: "Formação Profissionais do Magistério" },
    { dia: 23, mes: 9, descricao: "Formação Profissionais do Magistério" },
    { dia: 24, mes: 9, descricao: "Formação Profissionais do Magistério" }
  ],
  FM: [
    { dia: 12, mes: 6, descricao: "Feriado Municipal - Domingos Martins - Dia do Patrono Domingos José Martins" },
    { dia: 6, mes: 5, descricao: "Feriado Municipal - Santa Maria de Jetibá - Dia da Emancipação Política de Santa Maria de Jetibá" },
    { dia: 24, mes: 6, descricao: "Feriado Municipal - Laranja da Terra - Dia de São João" },
    { dia: 29, mes: 6, descricao: "Feriado Municipal - Brejetuba - Dia do Sagrado Coração de Jesus" },
    { dia: 29, mes: 6, descricao: "Feriado Municipal - Venda Nova do Imigrante - Dia São Pedro" },
    { dia: 11, mes: 2, descricao: "Feriado Municipal - Afonso Cláudio - Festa de Nossa Senhora de Lourdes" },
    { dia: 8, mes: 12, descricao: "Feriado Municipal - Conceição do Castelo - Dia de Nossa Senhora da Conceição" }
  ],
  "*": [
    { dia: 4, mes: 2, descricao: "Início do Ano Letivo" },
    { dia: 18, mes: 5, descricao: "Início do 2º Trimestre" },
    { dia: 8, mes: 9, descricao: "Início do 3º Trimestre" }
  ],
  "ÚLTIMO": [
    { dia: 15, mes: 12, descricao: "Último Dia Letivo do Ano" }
  ]
};

// =========================
// VARIÁVEIS GLOBAIS DO CALENDÁRIO
// =========================
let eventosAgendaGlobal = [];
let eventosCache = [];
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

function encontrarEventoPorId(id) {
  // Busca no global (carregado) ou no cache (última renderização)
  const pool = eventosAgendaGlobal.length > 0 ? eventosAgendaGlobal : eventosCache;
  return pool.find(ev => ev.id === id) || null;
}
// =========================
// ABERTURA / FECHAMENTO DA AGENDA
// =========================
function abrirModalAgenda() {
  document.body.style.overflow = 'hidden';   // trava o fundo
  document.getElementById('modalAgenda').style.display = 'flex';
  if (perfilUsuario === 'SUPERVISOR') {
    document.getElementById('btnNovaVisita').style.display = 'inline-block';
    carregarEscolasPermitidasNoSelect('selectEscolaVisita');
  } else {
    document.getElementById('btnNovaVisita').style.display = 'none';
  }
  carregarAgenda();
}

function fecharModalAgenda() {
  document.body.style.overflow = '';         // restaura
  document.getElementById('modalAgenda').style.display = 'none';
}

// =========================
// ABAS DO MODAL
// =========================
function mostrarAbaMinhaAgenda() {
  document.getElementById('abaMinhaAgenda').style.display = 'block';
  document.getElementById('abaNovaVisita').style.display = 'none';
  document.getElementById('abaNovoEventoPessoal').style.display = 'none';
  carregarAgenda();
}

function mostrarAbaNovaVisita() {
  document.getElementById('abaMinhaAgenda').style.display = 'none';
  document.getElementById('abaNovaVisita').style.display = 'block';
  document.getElementById('abaNovoEventoPessoal').style.display = 'none';
}

function mostrarAbaNovoEventoPessoal() {
  document.getElementById('abaMinhaAgenda').style.display = 'none';
  document.getElementById('abaNovaVisita').style.display = 'none';
  document.getElementById('abaNovoEventoPessoal').style.display = 'block';
}

// =========================
// UTILITÁRIOS
// =========================
function carregarEscolasPermitidasNoSelect(idSelect) {
  const select = document.getElementById(idSelect);
  select.innerHTML = '<option value="">Selecione a escola</option>';
  const escolas = getEscolasPermitidas();
  escolas.forEach(esc => select.appendChild(new Option(esc, esc)));
}

function converterDataHoraParaISO(valor) {
  const partes = valor.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!partes) return null;
  const [, dia, mes, ano, hora, min] = partes;
  return `${ano}-${mes}-${dia}T${hora}:${min}:00`;
}

// =========================
// CRIAÇÃO DE EVENTOS
// =========================
function criarVisita() {
  const data = document.getElementById('dataVisita').value.trim();
  const hora = document.getElementById('horaVisita').value.trim();
  const descricao = document.getElementById('descricaoVisita').value.trim();
  const escola = document.getElementById('selectEscolaVisita').value;
  
  if (!data || !hora || !escola) {
    mostrarToast('Escola, data e hora são obrigatórios.', 'warning');
    return;
  }
  
  const dataHoraISO = converterDataHoraParaISO(`${data} ${hora}`);
  if (!dataHoraISO) {
    mostrarToast('Data ou hora inválida.', 'error');
    return;
  }
  
  const dados = {
    acao: 'criarEventoAgenda',
    email: emailUsuario,
    tipo: 'Visita_Circuito',
    escola: escola,
    dataHora: dataHoraISO,
    descricao: descricao
  };
  
  postSemResposta(dados, 'Visita agendada e escola notificada!', () => {
    mostrarAbaMinhaAgenda();
    carregarAgenda();
    document.getElementById('dataVisita').value = '';
    document.getElementById('horaVisita').value = '';
    document.getElementById('descricaoVisita').value = '';
  });
}

function criarEventoPessoal() {
  const data = document.getElementById('dataPessoal')?.value.trim();
  const hora = document.getElementById('horaPessoal')?.value.trim();
  const descricao = document.getElementById('descricaoPessoal').value.trim();
  
  if (!data || !hora) {
    mostrarToast('Data e hora são obrigatórias.', 'warning');
    return;
  }
  
  const dataHoraISO = converterDataHoraParaISO(`${data} ${hora}`);
  if (!dataHoraISO) {
    mostrarToast('Data ou hora inválida.', 'error');
    return;
  }
  
  const dados = {
    acao: 'criarEventoAgenda',
    email: emailUsuario,
    tipo: 'Pessoal',
    dataHora: dataHoraISO,
    descricao: descricao
  };
  
  postSemResposta(dados, 'Evento pessoal criado!', () => {
    mostrarAbaMinhaAgenda();
    carregarAgenda();
    document.getElementById('dataPessoal').value = '';
    document.getElementById('horaPessoal').value = '';
    document.getElementById('descricaoPessoal').value = '';
  });
}

function criarEventoPorChat(escola, data, hora, descricao) {
  if (!data || !hora) {
    mostrarToast('Data e hora são obrigatórios para agendar.', 'warning');
    return;
  }

  const dataHoraISO = converterDataHoraParaISO(`${data} ${hora}`);
  if (!dataHoraISO) {
    mostrarToast('Data ou hora inválida.', 'error');
    return;
  }

  const dados = {
    acao: 'criarEventoAgenda',
    email: emailUsuario,
    tipo: escola ? 'Visita_Circuito' : 'Pessoal',
    escola: escola || '',
    dataHora: dataHoraISO,
    descricao: descricao || ''
  };

  postSemResposta(dados, 'Evento agendado com sucesso!', () => {
    if (typeof carregarAgenda === 'function') carregarAgenda();
  });
}

// =========================
// CARREGAR LISTA E CALENDÁRIO
// =========================
function carregarAgenda() {
  mostrarLoading();
  const url = `${API_URL}?tipo=agenda&email=${emailUsuario}&_=${Date.now()}`;
  jsonp(url, function(res) {
    esconderLoading();
    const container = document.getElementById('listaAgenda');  // ← FALTANDO
    container.innerHTML = '';                                   // ← FALTANDO
    
    // Aceita tanto array direto quanto objeto { eventos: [...] }
    const eventos = Array.isArray(res) ? res : (res && res.eventos ? res.eventos : []);
    console.log('📅 Eventos recebidos:', eventos.length, eventos);
    eventosAgendaGlobal = eventos;
    eventosCache = eventos; // já atualiza o cache

    if (!eventos || eventos.length === 0) {
      container.innerHTML = '<p>Nenhum evento na agenda.</p>';  // ← Agora container existe
    } else {
      eventos.forEach(ev => {
        const dataFormatada = new Date(ev.dataHora).toLocaleString('pt-BR');
        container.innerHTML += `
          <div class="usuario-card">
            <div class="usuario-avatar"><i class="fas fa-calendar-check"></i></div>
            <div class="usuario-info">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${ev.tipo} ${ev.escola ? '- ' + ev.escola : ''}</strong>
                <div style="display: flex; gap: 4px;">
                  <!-- Botão de editar (lápis) -->
                  <button class="btn-icone" onclick="abrirEdicaoEvento(encontrarEventoPorId('${ev.id}'))" data-tooltip="Editar evento" style="color: #3b82f6; width: 24px; height: 24px;">
                    <i class="fas fa-pen"></i>
                  </button>
                  <!-- Botão de excluir (já existente) -->
                  <button class="btn-icone tooltip-below" onclick="excluirEvento('${ev.id}')" data-tooltip="Excluir evento" style="color: #ef4444; width: 24px; height: 24px;">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>
              <p>${dataFormatada} - ${ev.descricao || 'Sem descrição'}</p>
              <small>Criado por: ${ev.criador}</small>
            </div>
          </div>`;
      });
    }

    carregarEventosParaCalendario();
  });
}

// =========================
// CALENDÁRIO (NOVA VERSÃO)
// =========================
function carregarEventosParaCalendario() {
  eventosCache = eventosAgendaGlobal || [];
  renderizarCalendario(mesAtual, anoAtual);
}

function navegarCalendario(direcao) {
  mesAtual += direcao;
  if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
  if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
  renderizarCalendario(mesAtual, anoAtual);
}

function mostrarEventosDia(dia) {
  const dataRef = new Date(anoAtual, mesAtual, dia);
  const eventosDia = eventosCache.filter(ev => {
    const evData = new Date(ev.dataHora);
    return evData.getFullYear() === dataRef.getFullYear() && 
           evData.getMonth() === dataRef.getMonth() && 
           evData.getDate() === dataRef.getDate();
  });

  const container = document.getElementById('eventosDoDia');
  if (eventosDia.length === 0) {
    container.innerHTML = '<p>Nenhum evento neste dia.</p>';
    return;
  }

  let html = `<strong>${dia}/${mesAtual+1}/${anoAtual}</strong><br>`;
    eventosDia.forEach(ev => {
    // Dentro do loop forEach de eventosDia:
    html += `
      <div class="evento-arrastavel" draggable="true" data-id="${ev.id}" 
          style="margin: 6px 0; padding: 6px; background: var(--card-border); border-radius: 4px; cursor: grab;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><i class="fas fa-circle"></i> ${ev.tipo} ${ev.escola ? '- ' + ev.escola : ''}</span>
          <div style="display: flex; gap: 4px;">
            <!-- Botão de editar -->
            <button class="btn-icone" onclick="event.stopPropagation(); abrirEdicaoEvento(encontrarEventoPorId('${ev.id}'))" data-tooltip="Editar evento" style="color: #3b82f6; width: 20px; height: 20px;">
              <i class="fas fa-pen" style="font-size: 12px;"></i>
            </button>
            <!-- Botão de excluir -->
            <button class="btn-icone" onclick="event.stopPropagation(); excluirEvento('${ev.id}')" data-tooltip="Excluir evento" style="color: #ef4444; width: 20px; height: 20px;">
              <i class="fas fa-trash-alt" style="font-size: 12px;"></i>
            </button>
          </div>
        </div>
        ${ev.descricao || ''} <br><small>${new Date(ev.dataHora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</small>
      </div>`;
  });
  container.innerHTML = html;

  document.querySelectorAll('.evento-arrastavel').forEach(el => {
    el.addEventListener('dragstart', function(e) {
      e.dataTransfer.setData('text/plain', this.dataset.id);
      this.style.opacity = '0.5';
    });
    el.addEventListener('dragend', function(e) {
      this.style.opacity = '1';
    });
  });
}

function reagendarEvento(e, elementoDia) {
  e.preventDefault();
  elementoDia.style.background = '';
  
  const idEvento = e.dataTransfer.getData('text/plain');
  const dia = parseInt(elementoDia.dataset.dia);
  const mes = parseInt(elementoDia.dataset.mes);
  const ano = parseInt(elementoDia.dataset.ano);
  
  if (!idEvento || isNaN(dia)) return;
  
  const eventoOriginal = eventosCache.find(ev => ev.id === idEvento);
  if (!eventoOriginal) return;
  
  const horaOriginal = new Date(eventoOriginal.dataHora);
  const novaData = new Date(ano, mes, dia, horaOriginal.getHours(), horaOriginal.getMinutes());
  
  const dados = {
    acao: 'reagendarEvento',
    email: emailUsuario,
    id: idEvento,
    novaDataHora: novaData.toISOString()
  };
  
  postSemResposta(dados, 'Evento reagendado!', () => {
    carregarAgenda();
  });
}

function obterInfoCalendarioEscolar(dia, mes) {
  const descricoes = [];
  let classePrioritaria = '';
  
  // Função auxiliar para processar uma lista de eventos (com suporte a intervalos)
  function processarLista(lista, classe, tipoIcone) {
    const encontrados = [];
    for (let item of lista) {
      if (item.ate) {
        const inicio = new Date(2026, item.mes - 1, item.dia);
        const fim = new Date(2026, item.mes - 1, item.ate);
        const data = new Date(2026, mes, dia);
        if (data >= inicio && data <= fim) {
          encontrados.push(item.descricao);
        }
      } else if (item.dia === dia && item.mes === (mes + 1)) {
        encontrados.push(item.descricao);
      }
    }
    if (encontrados.length > 0) {
      descricoes.push(...encontrados);
      // Define a classe com prioridade (feriado > recesso > JPP > conselho > recuperação > FPM > outros)
      if (!classePrioritaria || classe === 'feriado') {
        classePrioritaria = classe;
      }
    }
  }

  // Processa todas as categorias
  processarLista(CALENDARIO_ESCOLAR.F, 'feriado');
  processarLista(CALENDARIO_ESCOLAR.FE, 'ferias');
  processarLista(CALENDARIO_ESCOLAR.RE, 'recesso');
  processarLista(CALENDARIO_ESCOLAR.JPP, 'jpp');
  processarLista(CALENDARIO_ESCOLAR.CC, 'conselho');
  processarLista(CALENDARIO_ESCOLAR.CCF, 'conselho');
  processarLista(CALENDARIO_ESCOLAR.RF, 'recuperacao');
  processarLista(CALENDARIO_ESCOLAR.EER, 'recuperacao');
  processarLista(CALENDARIO_ESCOLAR.FPM, 'jpp');
  processarLista(CALENDARIO_ESCOLAR.FM, 'feriado');
  processarLista(CALENDARIO_ESCOLAR["*"], 'inicio-letivo');
  processarLista(CALENDARIO_ESCOLAR["ÚLTIMO"], 'recesso');

  if (descricoes.length === 0) {
    return { tipo: null, descricao: '', classe: '' };
  }

  // Concatena as descrições com quebra de linha (usando &#10; para tooltip HTML)
  const descricaoFinal = descricoes.join(' &#10;');

  // Define o tipo principal para o ícone
  let tipoPrincipal = '';
  if (classePrioritaria === 'feriado') tipoPrincipal = 'feriado';
  else if (classePrioritaria === 'ferias') tipoPrincipal = 'férias';
  else if (classePrioritaria === 'recesso') tipoPrincipal = 'recesso';
  else if (classePrioritaria === 'jpp') tipoPrincipal = 'JPP';
  else if (classePrioritaria.includes('conselho')) tipoPrincipal = 'Conselho';
  else tipoPrincipal = 'Outro';

  return { tipo: tipoPrincipal, descricao: descricaoFinal, classe: classePrioritaria };
}

function renderizarCalendario(mes, ano) {
  const grid = document.getElementById('calendarioGrid');
  const titulo = document.getElementById('tituloMesCalendario');
  const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  titulo.textContent = `${meses[mes]} de ${ano}`;
  
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const totalDias = new Date(ano, mes + 1, 0).getDate();
  
  grid.innerHTML = '';
  
  const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  diasSemana.forEach(d => {
    grid.innerHTML += `<div class="dia-semana">${d}</div>`;
  });
  
  for (let i = 0; i < primeiroDia; i++) {
    grid.innerHTML += '<div></div>';
  }
  
  const hoje = new Date();
  for (let dia = 1; dia <= totalDias; dia++) {
    const data = new Date(ano, mes, dia);
        const temEvento = eventosCache.some(ev => {
      // Converte a data do evento para objeto Date e zera horas
      const evData = new Date(ev.dataHora);
      evData.setHours(0, 0, 0, 0);
      // Data do dia do calendário também zerada
      const dataCalendario = new Date(ano, mes, dia);
      dataCalendario.setHours(0, 0, 0, 0);
      return evData.getTime() === dataCalendario.getTime();
    });
    const classeDia = temEvento ? 'com-evento' : '';
    const classeHoje = (hoje.getFullYear() === ano && hoje.getMonth() === mes && hoje.getDate() === dia) ? 'hoje' : '';

    const infoCalendario = obterInfoCalendarioEscolar(dia, mes);
    const classeCalendario = infoCalendario.classe ? ` ${infoCalendario.classe}` : '';
    const tooltipCalendario = infoCalendario.descricao ? infoCalendario.descricao : '';

    let iconeIndicador = '';
    if (infoCalendario.tipo) {
      if (infoCalendario.tipo === 'feriado') iconeIndicador = '🔴';
      else if (infoCalendario.tipo === 'férias') iconeIndicador = '🏖️';
      else if (infoCalendario.tipo === 'recesso') iconeIndicador = '🟡';
      else if (infoCalendario.tipo === 'JPP') iconeIndicador = '📋';
      else if (infoCalendario.tipo.includes('Conselho')) iconeIndicador = '👥';
      else iconeIndicador = '📌';
    }

        grid.innerHTML += `
        <div class="dia ${classeDia} ${classeHoje}${classeCalendario}" 
            data-dia="${dia}" data-mes="${mes}" data-ano="${ano}"
            data-tooltip="${tooltipCalendario}"
            ondragover="event.preventDefault(); this.style.background='var(--input-border)';"
            ondragleave="this.style.background='';"
            ondrop="reagendarEvento(event, this)"
            onclick="mostrarEventosDia(${dia})">
          ${dia}${temEvento ? '<span class="bolinha-evento"></span>' : ''}
          ${iconeIndicador ? `<span class="calendario-indicador">${iconeIndicador}</span>` : ''}
        </div>`;
  }
  
  document.getElementById('eventosDoDia').innerHTML = '';
}
function excluirEvento(id) {
  if (!confirm("Excluir este evento permanentemente?")) return;
  
  const dados = {
    acao: 'excluirEventoAgenda',
    email: emailUsuario,
    id: id
  };
  
  postSemResposta(dados, 'Evento excluído!', () => {
    carregarAgenda(); // recarrega a lista e o calendário
  });
}
let eventoEditandoId = null;
let eventoEditandoTipo = null;

function abrirEdicaoEvento(ev) {
  eventoEditandoId = ev.id;
  eventoEditandoTipo = ev.tipo;

  const data = new Date(ev.dataHora);
  document.getElementById('editDataEvento').value = data.toISOString().split('T')[0];
  document.getElementById('editHoraEvento').value = data.toTimeString().slice(0,5);
  document.getElementById('editDescricaoEvento').value = ev.descricao || '';

  if (ev.tipo === 'Visita_Circuito' && perfilUsuario === 'SUPERVISOR') {
    document.getElementById('labelEditEscola').style.display = 'block';
    document.getElementById('editSelectEscola').style.display = 'block';
    carregarEscolasPermitidasNoSelect('editSelectEscola');
    document.getElementById('editSelectEscola').value = ev.escola || '';
  } else {
    document.getElementById('labelEditEscola').style.display = 'none';
    document.getElementById('editSelectEscola').style.display = 'none';
  }

  document.getElementById('modalEditarEvento').style.display = 'flex';
}

function fecharEdicaoEvento() {
  document.getElementById('modalEditarEvento').style.display = 'none';
  eventoEditandoId = null;
}

function salvarEdicaoEvento() {
  const data = document.getElementById('editDataEvento').value; // YYYY-MM-DD
  const hora = document.getElementById('editHoraEvento').value; // HH:MM
  const descricao = document.getElementById('editDescricaoEvento').value;
  const escola = eventoEditandoTipo === 'Visita_Circuito'
    ? document.getElementById('editSelectEscola').value
    : undefined;

  if (!data || !hora) {
    mostrarToast('Data e hora são obrigatórios.', 'warning');
    return;
  }

  // Monta a data/hora ISO 8601 diretamente
  const dataHoraISO = `${data}T${hora}:00`; // Ex: "2025-05-02T14:30:00"

  const dados = {
    acao: 'editarEventoAgenda',
    email: emailUsuario,
    id: eventoEditandoId,
    dataHora: dataHoraISO,
    descricao: descricao,
    tipo: eventoEditandoTipo,
    escola: escola
  };

  postSemResposta(dados, 'Evento atualizado!', () => {
    fecharEdicaoEvento();
    carregarAgenda();
  });
}
