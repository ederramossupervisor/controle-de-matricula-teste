// js/loader.js – Carrega todos os scripts com a versão atual
//
// IMPORTANTE: não usa mais document.write(). document.write() só funciona de
// forma confiável durante o parse síncrono inicial da página; se o navegador
// atrasar esse script por qualquer motivo (cache HTTP, Service Worker,
// conexão lenta), o comportamento vira imprevisível — em casos extremos o
// navegador descarta o documento inteiro, deixando a tela de splash travada
// sem erro visível. É a causa mais provável do sistema "só funcionar em aba
// anônima": aba anônima nunca tem cache, então document.write() sempre roda
// no momento certo; aba normal, com cache, é onde ele falha.
//
// Em vez disso, criamos os <script> dinamicamente e os carregamos em
// sequência (cada um só começa depois que o anterior terminou de executar),
// preservando a ordem de dependência entre os arquivos sem depender de
// timing de parsing.
(function() {
  const scripts = [
    'config.js',
    'utils.js',
    'supabase-client.js',
    'data.js',
    'ui.js',
    'modals.js',
    'filtros.js',
    'main.js',
    'notificacoes.js',
    'perfil.js',
    'agenda.js',
    'dashboard.js',
    'log.js',
    'termo.js',
    'planotatico.js',
    'gerador-documentos.js',
    'dados-escolas.js',
    'monitoramento.js',
    'orgs-curriculares.js',
    'importar-profissionais.js',
    'importador.js',
    'profissionais.js',
    'tour.js'
  ];

  function carregarScript(nome) {
    return new Promise(function(resolve, reject) {
      const el = document.createElement('script');
      el.src = 'js/' + nome + '?v=' + APP_VERSION;
      el.onload = function() { resolve(); };
      el.onerror = function() { reject(new Error('Falha ao carregar js/' + nome)); };
      document.head.appendChild(el);
    });
  }

  function mostrarErroCarregamento(erro) {
    console.error('Erro ao carregar a aplicação:', erro);
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
    const aviso = document.createElement('div');
    aviso.style.cssText = 'text-align:center;margin-top:40vh;font-family:sans-serif;color:#333;';
    aviso.innerHTML =
      '<p>Não foi possível carregar o sistema completamente.</p>' +
      '<p style="font-size:13px;color:#888;">' + (erro && erro.message ? erro.message : '') + '</p>' +
      '<button onclick="location.reload()" style="margin-top:10px;padding:8px 16px;">Tentar novamente</button>';
    document.body.appendChild(aviso);
  }

  scripts
    .reduce(function(promessaAnterior, nome) {
      return promessaAnterior.then(function() { return carregarScript(nome); });
    }, Promise.resolve())
    .catch(mostrarErroCarregamento);
})();
