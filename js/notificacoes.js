// =========================
// NOTIFICAÇÕES (apenas agenda)
// =========================

let intervaloNotificacoes = null;

function abrirNotificacoes() {
  document.getElementById("modalNotificacoes").style.display = "flex";
  carregarNotificacoes();
}

function fecharNotificacoes() {
  document.getElementById("modalNotificacoes").style.display = "none";
}

function carregarNotificacoes() {
  mostrarLoading();
  // 🔥 Agora usa a rota específica da agenda
  const url = `${API_URL}?tipo=notificacoesAgenda&email=${emailUsuario}&_=${Date.now()}`;
  jsonp(url, function(mensagens) {
    const container = document.getElementById("listaNotificacoes");
    container.innerHTML = "";
    
    if (!mensagens || mensagens.length === 0) {
      container.innerHTML = "<p style='text-align:center; padding:20px;'>Nenhuma notificação da agenda.</p>";
      esconderLoading();
      return;
    }
    
    // Exibe apenas as NÃO lidas
    const naoLidas = mensagens.filter(msg => !msg.lida);
    
    if (naoLidas.length === 0) {
      container.innerHTML = "<p style='text-align:center; padding:20px;'>Nenhuma notificação pendente.</p>";
      esconderLoading();
      return;
    }
    
    naoLidas.forEach(msg => {
      const div = document.createElement("div");
      div.className = "usuario-card";
      div.style.marginBottom = "8px";
      
      div.innerHTML = `
        <div class="usuario-avatar"><i class="fas fa-calendar-alt"></i></div>
        <div class="usuario-info">
          <strong>📅 Agenda <span class="badge-novo">NOVO</span></strong>
          <p style="margin: 4px 0;">${msg.mensagem}</p>
          <small>${new Date(msg.data).toLocaleString('pt-BR')}</small>
          <div style="margin-top:6px;">
            <button class="btn-pequeno" onclick="marcarLida('${msg.id}')">Marcar como lida</button>
          </div>
        </div>
      `;
      container.appendChild(div);
    });
    
    esconderLoading();
  });
}

function marcarLida(id) {
  const dados = {
    acao: "marcarMensagemLida",
    email: emailUsuario,
    id: id
  };
  postSemResposta(dados, "Notificação marcada como lida.", () => {
    carregarNotificacoes();
    atualizarBadgeNotificacoes();
  });
}

function atualizarBadgeNotificacoes() {
  if (!emailUsuario) return;
  // 🔥 Conta apenas as não lidas da agenda
  const url = `${API_URL}?tipo=notificacoesAgenda&email=${emailUsuario}`;
  jsonp(url, function(mensagens) {
    if (!Array.isArray(mensagens)) {
      console.warn('Notificações: resposta inválida', mensagens);
      return;
    }
    const naoLidas = mensagens.filter(msg => !msg.lida);
    const count = naoLidas.length;
    const badge = document.getElementById("badgeNotificacoes");
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }
  });
}

function iniciarPollingNotificacoes() {
  if (intervaloNotificacoes) clearInterval(intervaloNotificacoes);
  atualizarBadgeNotificacoes();
  intervaloNotificacoes = setInterval(atualizarBadgeNotificacoes, 30000);
}

function pararPollingNotificacoes() {
  if (intervaloNotificacoes) {
    clearInterval(intervaloNotificacoes);
    intervaloNotificacoes = null;
  }
}
