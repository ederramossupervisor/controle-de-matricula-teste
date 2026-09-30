// =========================
// FOTO DE PERFIL
// =========================

// Carrega a foto ao logar (ou após login)
function carregarFotoPerfil() {
  const urlAPI = `${API_URL}?tipo=fotoPerfil&email=${emailUsuario}&_=${Date.now()}`;
  jsonp(urlAPI, function(res) {
    const img = document.getElementById('fotoPerfilImg');
    const iniciais = document.getElementById('fotoPerfilIniciais');
    
    if (res.url && res.url.trim() !== "") {
      img.src = res.url;
      img.style.display = 'block';
      iniciais.style.display = 'none';
    } else {
      // Exibe ícone de câmera convidativo
      img.style.display = 'none';
      iniciais.style.display = 'flex';
      iniciais.innerHTML = '<i class="fas fa-camera"></i>';
    }
  });
}

// Dispara o seletor de arquivo quando o usuário clica na foto
// (o script é injetado dinamicamente pelo loader.js, então o DOM já está
// pronto quando este arquivo roda — ver explicação em js/main.js)
function iniciarEventosPerfil() {
  const container = document.getElementById('fotoPerfilContainer');
  if (container) {
    container.addEventListener('click', function() {
      document.getElementById('inputUploadFoto').click();
    });
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarEventosPerfil);
} else {
  iniciarEventosPerfil();
}

// Faz o upload da foto selecionada
function fazerUploadFoto(file) {
  if (!file) return;
  
  // Verifica tamanho (máx. 5 MB)
  if (file.size > 5 * 1024 * 1024) {
    mostrarToast("A imagem deve ter no máximo 5 MB.", "error");
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64 = e.target.result.split(',')[1];
    const dados = {
      acao: "uploadFotoPerfil",
      email: emailUsuario,
      fileBase64: base64,
      fileName: "perfil_" + emailUsuario.replace(/[^a-zA-Z0-9]/g, '_') + ".jpg",
      mimeType: file.type
    };
    
    // Reutiliza a função postSemResposta (já existente)
    postSemResposta(dados, "Foto atualizada com sucesso!", function() {
      // Recarrega a foto imediatamente
      carregarFotoPerfil();
    });
  };
  reader.readAsDataURL(file);
}
