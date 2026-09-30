// js/importador.js
const ImportProgress = {
  key: 'import_progress',
  timer: null,
  startTime: null,
  alunosEnviadosIds: [],   // Armazena os IDs dos alunos que já foram enviados com sucesso

  salvar: function (estado) {
    localStorage.setItem(this.key, JSON.stringify(estado));
  },

  carregar: function () {
    const raw = localStorage.getItem(this.key);
    return raw ? JSON.parse(raw) : null;
  },

  limpar: function () {
    localStorage.removeItem(this.key);
  },

  mostrar: function () {
    document.getElementById('importProgressContainer').style.display = 'block';
  },

  esconder: function () {
    document.getElementById('importProgressContainer').style.display = 'none';
  },

  atualizarUI: function (enviados, total, tempoRestante, finalizado = false, cancelado = false) {
    const percent = total > 0 ? Math.min(100, Math.round((enviados / total) * 100)) : 0;
    document.getElementById('importProgressBar').style.width = percent + '%';
    document.getElementById('importProgressText').innerText = `${enviados} de ${total} alunos processados`;

    let tempoFormatado = '';
    if (finalizado) {
      tempoFormatado = 'Concluído!';
    } else if (cancelado) {
      tempoFormatado = 'Interrompido pelo usuário';
    } else if (tempoRestante <= 0) {
      tempoFormatado = 'Finalizando...';
    } else if (tempoRestante < 60) {
      tempoFormatado = `Tempo restante: ${tempoRestante} seg`;
    } else {
      const minutos = Math.ceil(tempoRestante / 60);
      tempoFormatado = `Tempo restante: ${minutos} min`;
    }
    document.getElementById('importProgressTime').innerText = tempoFormatado;

    // Exibe o botão de desfazer apenas se houver alunos enviados
    const btnDesfazer = document.getElementById('btnDesfazerImport');
    if (btnDesfazer) {
      btnDesfazer.style.display = (enviados > 0) ? 'inline-block' : 'none';
    }
  },

  iniciar: function (alunos, acao, titulo) {
    this.limpar();
    this.alunosEnviadosIds = [];
    const estado = {
      alunos: alunos,
      acao: acao,
      total: alunos.length,
      enviados: 0,
      loteAtual: 0,
      loteSize: 50,
      titulo: titulo || 'Importando alunos...',
      dataInicio: Date.now()
    };
    this.salvar(estado);
    document.getElementById('importProgressTitle').innerText = estado.titulo;
    this.mostrar();
    this.atualizarUI(0, estado.total, 0);

    // Adiciona o botão de desfazer dinamicamente, se não existir
    if (!document.getElementById('btnDesfazerImport')) {
      const btn = document.createElement('button');
      btn.id = 'btnDesfazerImport';
      btn.className = 'btn-pequeno btn-perigo';
      btn.innerText = 'Desfazer importação';
      btn.style.display = 'none';
      btn.onclick = function () {
        if (confirm('Isso excluirá todos os alunos já importados nesta leva. Continuar?')) {
          desfazerImportacao();
        }
      };
      document.getElementById('importProgressContainer').appendChild(btn);
    }

    this.startTime = Date.now();
    this.processarLote(estado);
  },

  processarLote: function (estado) {
    if (!estado) estado = this.carregar();
    if (!estado || estado.total === 0) {
      this.finalizar(estado);
      return;
    }

    const inicio = estado.loteAtual * estado.loteSize;
    const fim = Math.min(inicio + estado.loteSize, estado.total);
    if (inicio >= estado.total) {
      this.finalizar(estado);
      return;
    }

    const lote = estado.alunos.slice(inicio, fim);
    const self = this;

    postSemResposta(
      { acao: estado.acao, email: emailUsuario, alunos: lote },
      null,
      () => {
        // Sucesso: atualiza progresso e guarda os IDs
        estado.enviados += lote.length;
        estado.loteAtual++;
        self.salvar(estado);

        // Armazena os IDs para possível exclusão
        const idsDoLote = lote.map(a => ({ id: a.id || a.nome, escola: a.escola }));
        self.alunosEnviadosIds = self.alunosEnviadosIds.concat(idsDoLote);

        const decorrido = (Date.now() - estado.dataInicio) / 1000;
        const velocidade = estado.enviados / decorrido;
        const faltam = estado.total - estado.enviados;
        const tempoRestante = velocidade > 0 ? Math.ceil(faltam / velocidade) : 0;
        self.atualizarUI(estado.enviados, estado.total, tempoRestante);

        self.timer = setTimeout(() => self.processarLote(estado), 1000);
      }
    );
  },

  finalizar: function (estado) {
    this.limpar();
    this.atualizarUI(estado.enviados, estado.total, 0, true);
    this.timer = setTimeout(() => {
      this.esconder();
      // Remove o botão de desfazer depois de sumir
      const btn = document.getElementById('btnDesfazerImport');
      if (btn) btn.style.display = 'none';
    }, 12000); // A barra some após 12 segundos, dando tempo para clicar em Desfazer
    mostrarToast(`${estado.titulo} concluída! ${estado.total} alunos processados.`, 'success');
    if (typeof carregarAlunos === 'function') carregarAlunos();
    if (typeof fecharModalImportacao === 'function') fecharModalImportacao();
    if (typeof fecharModalPromocao === 'function') fecharModalPromocao();
    if (typeof fecharModalAtualizarMatriculados === 'function') fecharModalAtualizarMatriculados();
  },

  cancelar: function () {
    clearTimeout(this.timer);
    const estado = this.carregar();
    if (estado) {
      this.atualizarUI(estado.enviados, estado.total, 0, false, true);
      mostrarToast('Importação interrompida.', 'warning');
      this.limpar();
      // Manter barra visível por 12 segundos para possível desfazer
      this.timer = setTimeout(() => {
        this.esconder();
        const btn = document.getElementById('btnDesfazerImport');
        if (btn) btn.style.display = 'none';
      }, 12000);
    } else {
      this.esconder();
    }
  },

  retomarPendente: function () {
    const estado = this.carregar();
    if (estado) {
      this.mostrar();
      document.getElementById('importProgressTitle').innerText = estado.titulo;
      this.startTime = estado.dataInicio;
      this.atualizarUI(estado.enviados, estado.total, 0);
      this.processarLote(estado);
    }
  }
};

// Função chamada pelo botão de fechar (cancelar)
function fecharProgressoImportacao() {
  if (confirm('Tem certeza que deseja interromper a importação?')) {
    ImportProgress.cancelar();
  }
}

// Função de desfazer: exclui todos os alunos importados nesta leva
function desfazerImportacao() {
  if (ImportProgress.alunosEnviadosIds.length === 0) {
    mostrarToast('Nenhum aluno para desfazer.', 'info');
    return;
  }
  mostrarLoading();
  const dados = {
    acao: 'excluirAlunosLote',
    email: emailUsuario,
    alunos: ImportProgress.alunosEnviadosIds
  };
  postSemResposta(dados, 'Alunos removidos com sucesso!', () => {
    ImportProgress.alunosEnviadosIds = [];
    ImportProgress.esconder();
    const btn = document.getElementById('btnDesfazerImport');
    if (btn) btn.style.display = 'none';
    if (typeof carregarAlunos === 'function') carregarAlunos();
  });
}

window.addEventListener('load', function () {
  setTimeout(() => {
    if (emailUsuario) {
      ImportProgress.retomarPendente();
    }
  }, 1000);
});

// Retomar também quando a aba voltar a ficar visível (ex.: após hibernação)
document.addEventListener('visibilitychange', function () {
  if (!document.hidden) {
    const estado = ImportProgress.carregar();
    if (estado) {
      ImportProgress.mostrar();
      ImportProgress.processarLote(estado);
    }
  }
});