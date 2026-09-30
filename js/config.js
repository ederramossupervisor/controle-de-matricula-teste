// =========================
// CONFIGURAÇÕES GERAIS
// =========================

const API_URL = "https://script.google.com/macros/s/AKfycbzonYYSmXmy1UkmnZGou6bRfdJOoLUmrnw5fFfp1EU4cyB-EkGOmxzfxTA6LfDdc56_FA/exec";
const API_URL_PROFISSIONAIS = API_URL
// =========================
// SUPABASE (chave pública; a segurança é feita pelas regras RLS do banco)
// =========================
const SUPABASE_URL = 'https://kcdlyfejflyyaplterjt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KMiNhwsv2_7zDu7xLuAZag_XIeUFYlm';

// Lista oficial de escolas (disponível para o supervisor)
const LISTA_ESCOLAS = [
  "CEEFMTI Afonso Cláudio",
  "CEEFMTI Elisa Paiva",
  "EE Ivana Casagrande Scabelo",
  "EE Severino Paste",
  "EEEFM Alto Rio Possmoser",
  "EEEFM Álvaro Castelo",
  "EEEFM Domingos Perim",
  "EEEFM Elvira Barros",
  "EEEFM Fazenda Camporês",
  "EEEFM Fazenda Emílio Schroeder",
  "EEEFM Fioravante Caliman",
  "EEEFM Frederico Boldt",
  "EEEFM Gisela Salloker Fayet",
  "EEEFM Graça Aranha",
  "EEEFM Joaquim Caetano de Paiva",
  "EEEFM José Cupertino",
  "EEEFM José Giestas",
  "EEEFM José Roberto Christo",
  "EEEFM Leogildo Severiano de Souza",
  "EEEFM Luiz Jouffroy",
  "EEEFM Maria de Abreu Alvim",
  "EE Mário Bergamin",
  "EEEFM Marlene Brandão",
  "EEEFM Pedra Azul",
  "EEEFM Ponto do Alto",
  "EEEFM Profª Aldy Soares Merçon Vargas",
  "EEEFM Prof Hermann Berger",
  "EEEFM São Jorge",
  "EEEFM São Luís",
  "EEEFM Teófilo Paulino",
  "EEEM Francisco Guilherme",
  "EEEM Mata fria",
  "EEEFM Tutorial Teste",
  "EEEM Sobreiro"
];

const LOGOS_ESCOLAS = {
  "CEEFMTI Afonso Cláudio": "logos/CEEFMTI_Afonso_Cláudio.png",
  "CEEFMTI Elisa Paiva": "logos/CEEFMTI_Elisa_Paiva.png",
  "EE Ivana Casagrande Scabelo": "logos/EE_Ivana_Casagrande_Scabelo.png",
  "EE Severino Paste": "logos/EE_Severino_Paste.png",
  "EEEFM Alto Rio Possmoser": "logos/EEEFM_Alto_Rio_Possmoser.png",
  "EEEFM Álvaro Castelo": "logos/EEEFM_Álvaro_Castelo.png",
  "EEEFM Domingos Perim": "logos/EEEFM_Domingos_Perim.png",
  "EEEFM Elvira Barros": "logos/EEEFM_Elvira_Barros.png",
  "EEEFM Fazenda Camporês": "logos/EEEFM_Fazenda_Camporês.png",
  "EEEFM Fazenda Emílio Schroeder": "logos/EEEFM_Fazenda_Emílio_Schroeder.png",
  "EEEFM Fioravante Caliman": "logos/EEEFM_Fioravante_Caliman.png",
  "EEEFM Frederico Boldt": "logos/EEEFM_Frederico_Boldt.png",
  "EEEFM Gisela Salloker Fayet": "logos/EEEFM_Gisela_Salloker_Fayet.png",
  "EEEFM Graça Aranha": "logos/EEEFM_Graça_Aranha.png",
  "EEEFM Joaquim Caetano de Paiva": "logos/EEEFM_Joaquim_Caetano_de_Paiva.png",
  "EEEFM José Cupertino": "logos/EEEFM_José_Cupertino.png",
  "EEEFM José Giestas": "logos/EEEFM_José_Giestas.png",
  "EEEFM José Roberto Christo": "logos/EEEFM_José_Roberto_Christo.png",
  "EEEFM Leogildo Severiano de Souza": "logos/EEEFM_Leogildo_Severiano_de_Souza.png",
  "EEEFM Luiz Jouffroy": "logos/EEEFM_Luiz_Jouffroy.png",
  "EEEFM Maria de Abreu Alvim": "logos/EEEFM_Maria_de_Abreu_Alvim.png",
  "EE Mário Bergamin": "logos/EE_Mário_Bergamin.png",
  "EEEFM Marlene Brandão": "logos/EEEFM_Marlene_Brandão.png",
  "EEEFM Pedra Azul": "logos/EEEFM_Pedra_Azul.png",
  "EEEFM Ponto do Alto": "logos/EEEFM_Ponto_do_Alto.png",
  "EEEFM Profª Aldy Soares Merçon Vargas": "logos/EEEFM_Profª_Aldy_Soares_Mercon_Vargas.png",
  "EEEFM Prof Hermann Berger": "logos/EEEFM_Prof_Hermann_Berger.png",
  "EEEFM São Jorge": "logos/EEEFM_São_Jorge.png",
  "EEEFM São Luís": "logos/EEEFM_São_Luis.png",
  "EEEFM Teófilo Paulino": "logos/EEEFM_Teófilo_Paulino.png",
  "EEEM Francisco Guilherme": "logos/EEEM_Francisco_Guilherme.png",
  "EEEM Mata fria": "logos/EEEM_Mata_Fria.png",
  "EEEFM Tutorial Teste": "logos/EEEFM_Tutorial_Teste.png",
  "EEEM Sobreiro": "logos/EEEM_Sobreiro.png",
  "default": "logos/default.png"
};

const LOGOS_SUPERVISORES = {
  "ecramos@sedu.es.gov.br": "logos/supervisores/ecramos.png",
  "jvpagotto@sedu.es.gov.br": "logos/supervisores/jvpagotto.png",
  "ceuaraujo@sedu.es.gov.br": "logos/supervisores/ceuaraujo.png",
  "rcspautz@sedu.es.gov.br": "logos/supervisores/rcspautz.png",
  "zanascimento@sedu.es.gov.br": "logos/supervisores/zanascimento.png",
  "jclsouza@sedu.es.gov.br": "logos/supervisores/jclsouza.png",
  "iosilva@sedu.es.gov.br": "logos/supervisores/iosilva.png",
  "mglpires@sedu.es.gov.br": "logos/supervisores/mglpires.png",
  "rfdelarmelina@sedu.es.gov.br": "logos/supervisores/rfdelarmelina.png",
  "slarmelina@sedu.es.gov.br": "logos/supervisores/slarmelina.png",
  "kalopes@sedu.es.gov.br": "logos/supervisores/kalopes.png",
  "eder.ramos@educador.edu.es.gov.br": "logos/supervisores/eder_ramos.png",
  "default": "logos/supervisores/default.png"
};

// Lista de modelos (a mesma do backend)
const LISTA_MODELOS = [
  "HISTÓRICO ESCOLAR - EF",
  "HISTÓRICO ESCOLAR - EF - EJA",
  "HISTÓRICO ESCOLAR - EM",
  "HISTÓRICO ESCOLAR - EM - EJA",
  "CERTIFICADO CONCLUSÃO - EM",
  "CERTIFICADO CONCLUSÃO - EM - EJA",
  "CERTIFICADO CONCLUSÃO - QUALIFICAÇÃO INTEGRADO - EJA",
  "HISTÓRICO ESCOLAR - TÉCNICO INTEGRADO",
  "HISTÓRICO ESCOLAR - TÉCNICO INTEGRADO - EJA",
  "HISTÓRICO ESCOLAR - QUALIFICAÇÃO INTEGRADO - EJA",
  "HISTÓRICO ESCOLAR - TÉCNICO (CONCOMITANTE E SUBSEQUENTE)",
  "DIPLOMA - TÉCNICO INTEGRADO - EJA",
  "DIPLOMA - TÉCNICO CONCOMITANTE",
  "DIPLOMA - TÉCNICO INTEGRADO",
  "DIPLOMA - TÉCNICO SUBSEQUENTE",
  "CERTIFICADO NEEJA - 1º SEGMENTO",
  "CERTIFICADO NEEJA - 2º SEGMENTO",
  "CERTIFICADO NEEJA - EM",
  "REQUERIMENTO DOCUMENTO ESCOLAR",
  "OBSERVAÇÃO DE AULA",
  "PLANO INTERVENÇÃO - PFA",
  "RV CREDENCIAMENTO",
  "REQUERIMENTO - FÉRIAS PRÊMIO"
];

const FUNDOS_HEADER_ESCOLAS = {
  "CEEFMTI Afonso Cláudio": "fundos-header/escolas/CEEFMTI_Afonso_Cláudio.png",
  "CEEFMTI Elisa Paiva": "fundos-header/escolas/CEEFMTI_Elisa_Paiva.png",
  "EE Ivana Casagrande Scabelo": "fundos-header/escolas/EE_Ivana_Casagrande_Scabelo.png",
  "EE Severino Paste": "fundos-header/escolas/EE_Severino_Paste.png",
  "EEEFM Alto Rio Possmoser": "fundos-header/escolas/EEEFM_Alto_Rio_Possmoser.png",
  "EEEFM Álvaro Castelo": "fundos-header/escolas/EEEFM_Álvaro_Castelo.png",
  "EEEFM Domingos Perim": "fundos-header/escolas/EEEFM_Domingos_Perim.png",
  "EEEFM Elvira Barros": "fundos-header/escolas/EEEFM_Elvira_Barros.png",
  "EEEFM Fazenda Camporês": "fundos-header/escolas/EEEFM_Fazenda_Camporês.png",
  "EEEFM Fazenda Emílio Schroeder": "fundos-header/escolas/EEEFM_Fazenda_Emílio_Schroeder.png",
  "EEEFM Fioravante Caliman": "fundos-header/escolas/EEEFM_Fioravante_Caliman.png",
  "EEEFM Frederico Boldt": "fundos-header/escolas/EEEFM_Frederico_Boldt.png",
  "EEEFM Gisela Salloker Fayet": "fundos-header/escolas/EEEFM_Gisela_Salloker_Fayet.png",
  "EEEFM Graça Aranha": "fundos-header/escolas/EEEFM_Graça_Aranha.png",
  "EEEFM Joaquim Caetano de Paiva": "fundos-header/escolas/EEEFM_Joaquim_Caetano_de_Paiva.png",
  "EEEFM José Cupertino": "fundos-header/escolas/EEEFM_José_Cupertino.png",
  "EEEFM José Giestas": "fundos-header/escolas/EEEFM_José_Giestas.png",
  "EEEFM José Roberto Christo": "fundos-header/escolas/EEEFM_José_Roberto_Christo.png",
  "EEEFM Leogildo Severiano de Souza": "fundos-header/escolas/EEEFM_Leogildo_Severiano_de_Souza.png",
  "EEEFM Luiz Jouffroy": "fundos-header/escolas/EEEFM_Luiz_Jouffroy.png",
  "EEEFM Maria de Abreu Alvim": "fundos-header/escolas/EEEFM_Maria_de_Abreu_Alvim.png",
  "EE Mário Bergamin": "fundos-header/escolas/EE_Mário_Bergamin.png",
  "EEEFM Marlene Brandão": "fundos-header/escolas/EEEFM_Marlene_Brandão.png",
  "EEEFM Pedra Azul": "fundos-header/escolas/EEEFM_Pedra_Azul.png",
  "EEEFM Ponto do Alto": "fundos-header/escolas/EEEFM_Ponto_do_Alto.png",
  "EEEFM Profª Aldy Soares Merçon Vargas": "fundos-header/escolas/EEEFM_Profª_Aldy_Soares_Merçon_Vargas.png",
  "EEEFM Prof Hermann Berger": "fundos-header/escolas/EEEFM_Prof_Hermann_Berger.png",
  "EEEFM São Jorge": "fundos-header/escolas/EEEFM_São_Jorge.png",
  "EEEFM São Luís": "fundos-header/escolas/EEEFM_São_Luís.png",
  "EEEFM Teófilo Paulino": "fundos-header/escolas/EEEFM_Teófilo_Paulino.png",
  "EEEM Francisco Guilherme": "fundos-header/escolas/EEEM_Francisco_Guilherme.png",
  "EEEM Mata fria": "fundos-header/escolas/EEEM_Mata_Fria.png",
  "EEEFM Tutorial Teste": "fundos-header/escolas/EEEFM_Tutorial_Teste.png",
  "EEEM Sobreiro": "fundos-header/escolas/EEEM_Sobreiro.png",
  "default": "fundos-header/default.png"
};

const FUNDOS_HEADER_SUPERVISORES = {
  "default": "fundos-header/default.png"
};

// =========================
// CONFIGURAÇÃO DOS ÍCONES DE DOCUMENTOS NOS CARDS
// =========================
const CONFIG_DOCS_CARD = [
  { coluna: "CERTIDAO",   icone: "fa-file-alt",       label: "Certidão de Nascimento" },
  { coluna: "CPF",        icone: "fa-id-card",        label: "CPF" },
  { coluna: "RG",         icone: "fa-address-card",   label: "RG" },
  { coluna: "VACINA",     icone: "fa-syringe",        label: "Carteira de Vacinação" },
  { coluna: "SUS",        icone: "fa-hospital",       label: "Cartão do SUS" },
  { coluna: "RESIDENCIA", icone: "fa-home",           label: "Comprovante de Residência" },
  { coluna: "RESP_DOCS",  icone: "fa-users",          label: "Documentos do Responsável" },
  { coluna: "HISTORICO",  icone: "fa-book",           label: "Histórico Escolar" },
  { coluna: "DECL_TRANSF",icone: "fa-exchange-alt",   label: "Declaração de Transferência" }
];

// Ícone extra para Educação Especial
const DOC_ESPECIAL = {
  coluna: "ED_ESPECIAL",
  icone: "fa-solid fa-universal-access",
  label: "Laudo/Relatório Pedagógico (Ed. Especial)"
};

// =========================
// CACHE LOCAL (localStorage)
// =========================
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos
