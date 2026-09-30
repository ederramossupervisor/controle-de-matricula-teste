const LISTA_ORGANIZACOES_CURRICULARES = [
  { codigo: "OCEB.26-001", nome: "Ensino Fundamental Anos Iniciais", etapaModalidade: "Ensino Fundamental (Anos Iniciais)", tipo: "OCEB" },
  { codigo: "OCEB.26-002", nome: "Ensino Fundamental Anos Finais (916h40min)", etapaModalidade: "Ensino Fundamental (Anos Finais)", tipo: "OCEB" },
  { codigo: "OCEB.26-003", nome: "Ensino Fundamental Anos Finais (com Projeto de Vida e Estudo Orientado)", etapaModalidade: "Ensino Fundamental (Anos Finais)", tipo: "OCEB" },
  { codigo: "OCEB.26-004", nome: "Ensino Fundamental Anos Finais - Povo Tradicional Pomerano", etapaModalidade: "Ensino Fundamental (Anos Finais) - Educação do Campo", tipo: "OCEB" },
  { codigo: "OCEB.26-005", nome: "Ensino Fundamental Anos Finais - Povo Tradicional Pomerano (versão 2)", etapaModalidade: "Ensino Fundamental (Anos Finais) - Educação do Campo", tipo: "OCEB" },
  { codigo: "OCEB.26-006", nome: "Ensino Médio (diurno) - Itinerário de Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Regular Diurno)", tipo: "OCEB" },
  { codigo: "OCEB.26-007", nome: "Ensino Médio (diurno) - Itinerário de Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Regular Diurno)", tipo: "OCEB" },
  { codigo: "OCEB.26-008", nome: "Ensino Médio (diurno) - Itinerário de Linguagens e Ciências Humanas (com Língua Espanhola)", etapaModalidade: "Ensino Médio (Regular Diurno)", tipo: "OCEB" },
  { codigo: "OCEB.26-009", nome: "Ensino Médio (noturno) - Itinerário das quatro áreas", etapaModalidade: "Ensino Médio (Regular Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-010", nome: "Ensino Médio (Tempo Integral 7h) - Itinerário Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Tempo Integral 7h)", tipo: "OCEB" },
  { codigo: "OCEB.26-011", nome: "Ensino Médio (Tempo Integral 7h) - Itinerário Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Tempo Integral 7h)", tipo: "OCEB" },
  { codigo: "OCEB.26-012", nome: "Ensino Médio (Tempo Integral 7h) - Itinerário Linguagens e Ciências Humanas (com Espanhol)", etapaModalidade: "Ensino Médio (Tempo Integral 7h)", tipo: "OCEB" },
  { codigo: "OCEB.26-013", nome: "Ensino Médio (Tempo Integral 9h30) - Itinerário Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Tempo Integral 9h30)", tipo: "OCEB" },
  { codigo: "OCEB.26-014", nome: "Ensino Médio (Tempo Integral 9h30) - Itinerário Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Tempo Integral 9h30)", tipo: "OCEB" },
  { codigo: "OCEB.26-015", nome: "Ensino Médio (Tempo Integral 9h30) - Itinerário Linguagens e Ciências Humanas (com Espanhol)", etapaModalidade: "Ensino Médio (Tempo Integral 9h30)", tipo: "OCEB" },
  { codigo: "OCEB.26-016", nome: "Ensino Médio - Educação do Campo (Tempo Integral 7h) - Itinerário Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Educação do Campo - Tempo Integral 7h)", tipo: "OCEB" },
  { codigo: "OCEB.26-017", nome: "Ensino Médio - Educação do Campo (Tempo Integral 7h) - Itinerário Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Educação do Campo - Tempo Integral 7h)", tipo: "OCEB" },
  { codigo: "OCEB.26-018", nome: "Ensino Fundamental Anos Finais (Tempo Integral 7h)", etapaModalidade: "Ensino Fundamental (Tempo Integral 7h)", tipo: "OCEB" },
  { codigo: "OCEB.26-019", nome: "Ensino Fundamental Anos Finais (Tempo Integral 9h30)", etapaModalidade: "Ensino Fundamental (Tempo Integral 9h30)", tipo: "OCEB" },
  { codigo: "OCEB.26-020", nome: "Ensino Fundamental Anos Finais (Tempo Integral) - Educação do Campo - CEIER", etapaModalidade: "Ensino Fundamental (Educação do Campo - CEIER)", tipo: "OCEB" },
  { codigo: "OCEB.26-021", nome: "Ensino Fundamental Anos Finais - Povo Tradicional Pomerano (multisseriado)", etapaModalidade: "Ensino Fundamental (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-022", nome: "Ensino Fundamental Anos Iniciais - Povo Tradicional Pomerano", etapaModalidade: "Ensino Fundamental (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-023", nome: "Ensino Fundamental Anos Finais - Povo Tradicional Pomerano (55min aula)", etapaModalidade: "Ensino Fundamental (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-024", nome: "Ensino Fundamental Anos Finais - Povo Tradicional Pomerano (com Projeto de Vida e Estudo Orientado)", etapaModalidade: "Ensino Fundamental (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-025", nome: "Ensino Fundamental Anos Iniciais - Educação do Campo", etapaModalidade: "Ensino Fundamental (Educação do Campo)", tipo: "OCEB" },
  { codigo: "OCEB.26-026", nome: "Ensino Fundamental Anos Iniciais - Educação do Campo em Área de Assentamento (Pedagogia da Alternância)", etapaModalidade: "Ensino Fundamental (Educação do Campo - Alternância)", tipo: "OCEB" },
  { codigo: "OCEB.26-027", nome: "Ensino Fundamental Anos Iniciais - Educação do Campo - Povo Tradicional Pomerano", etapaModalidade: "Ensino Fundamental (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-028", nome: "Ensino Fundamental Anos Iniciais - Educação Escolar Quilombola - EEEF \"Graúna\"", etapaModalidade: "Ensino Fundamental (Educação Escolar Quilombola)", tipo: "OCEB" },
  { codigo: "OCEB.26-029", nome: "Ensino Fundamental Anos Finais - Educação do Campo", etapaModalidade: "Ensino Fundamental (Educação do Campo)", tipo: "OCEB" },
  { codigo: "OCEB.26-030", nome: "Ensino Fundamental Anos Finais - Educação do Campo (com Projeto de Vida e Estudo Orientado)", etapaModalidade: "Ensino Fundamental (Educação do Campo)", tipo: "OCEB" },
  { codigo: "OCEB.26-031", nome: "Ensino Fundamental Anos Finais - Educação do Campo - Povo Tradicional Pomerano", etapaModalidade: "Ensino Fundamental (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-032", nome: "Ensino Fundamental Anos Finais - Educação do Campo - Povo Tradicional Pomerano (versão 2)", etapaModalidade: "Ensino Fundamental (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-033", nome: "Ensino Fundamental Anos Finais - Educação do Campo em Área de Assentamento (Pedagogia da Alternância)", etapaModalidade: "Ensino Fundamental (Educação do Campo - Alternância)", tipo: "OCEB" },
  { codigo: "OCEB.26-034", nome: "Ensino Fundamental Anos Iniciais - Educação do Campo (Tempo Integral) - CEIER", etapaModalidade: "Ensino Fundamental (Educação do Campo - CEIER)", tipo: "OCEB" },
  { codigo: "OCEB.26-035", nome: "Ensino Fundamental Anos Iniciais - Educação do Campo (Tempo Integral) - CEIER (versão 2)", etapaModalidade: "Ensino Fundamental (Educação do Campo - CEIER)", tipo: "OCEB" },
  { codigo: "OCEB.26-036", nome: "Ensino Fundamental Anos Finais - Educação Escolar Quilombola - EEEFM \"Graúna\"", etapaModalidade: "Ensino Fundamental (Educação Escolar Quilombola)", tipo: "OCEB" },
  { codigo: "OCEB.26-037", nome: "Ensino Fundamental Anos Iniciais - Educação do Campo por Área de Conhecimento", etapaModalidade: "Ensino Fundamental (Educação do Campo - Área de Conhecimento)", tipo: "OCEB" },
  { codigo: "OCEB.26-038", nome: "Ensino Fundamental Anos Iniciais - Educação do Campo por Área de Conhecimento - EEEF \"Córrego Queixada\"", etapaModalidade: "Ensino Fundamental (Educação do Campo - Área de Conhecimento)", tipo: "OCEB" },
  { codigo: "OCEB.26-039", nome: "Ensino Fundamental Anos Finais - Educação do Campo por Área de Conhecimento", etapaModalidade: "Ensino Fundamental (Educação do Campo - Área de Conhecimento)", tipo: "OCEB" },
  { codigo: "OCEB.26-040", nome: "Ensino Médio (diurno) - Itinerário de Matemática e Ciências da Natureza da Educação do Campo", etapaModalidade: "Ensino Médio (Educação do Campo)", tipo: "OCEB" },
  { codigo: "OCEB.26-041", nome: "Ensino Médio (diurno) - Itinerário de Matemática e Ciências da Natureza da Educação do Campo (Pomerano)", etapaModalidade: "Ensino Médio (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-042", nome: "Ensino Médio (diurno) - Itinerário de Linguagens e Ciências Humanas da Educação do Campo", etapaModalidade: "Ensino Médio (Educação do Campo)", tipo: "OCEB" },
  { codigo: "OCEB.26-043", nome: "Ensino Médio (diurno) - Itinerário de Linguagens e Ciências Humanas da Educação do Campo (Pomerano)", etapaModalidade: "Ensino Médio (Educação do Campo - Pomerano)", tipo: "OCEB" },
  { codigo: "OCEB.26-044", nome: "Ensino Médio (diurno) - Itinerário de Linguagens e Ciências Humanas da Educação do Campo (com Espanhol)", etapaModalidade: "Ensino Médio (Educação do Campo)", tipo: "OCEB" },
  { codigo: "OCEB.26-045", nome: "Ensino Médio (noturno) - Itinerário das quatro áreas da Educação do Campo", etapaModalidade: "Ensino Médio (Educação do Campo - Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-046", nome: "Ensino Médio (diurno) - Educação Escolar Quilombola - Itinerário Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Educação Escolar Quilombola)", tipo: "OCEB" },
  { codigo: "OCEB.26-047", nome: "Ensino Médio (diurno) - Educação Escolar Quilombola - Itinerário Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Educação Escolar Quilombola)", tipo: "OCEB" },
  { codigo: "OCEB.26-048", nome: "Ensino Médio (diurno) - Educação Escolar Indígena - Itinerário Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Educação Escolar Indígena)", tipo: "OCEB" },
  { codigo: "OCEB.26-049", nome: "Ensino Médio (diurno) - Educação Escolar Indígena - Itinerário Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Educação Escolar Indígena)", tipo: "OCEB" },
  { codigo: "OCEB.26-050", nome: "EJA Ensino Fundamental 1º Segmento (Noturno) - Educação do Campo - Ciclo 1", etapaModalidade: "EJA (Educação do Campo - Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-051", nome: "EJA Ensino Fundamental 2º Segmento (Noturno) - Educação do Campo - Ciclo 2 e 3", etapaModalidade: "EJA (Educação do Campo - Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-052", nome: "EJA Ensino Médio 3º Segmento (Noturno) - Educação do Campo - Ciclo 4", etapaModalidade: "EJA (Educação do Campo - Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-053", nome: "EJA Ensino Fundamental 2º Segmento (Diurno) - Ciclos 2 e 3", etapaModalidade: "EJA (Diurno)", tipo: "OCEB" },
  { codigo: "OCEB.26-054", nome: "EJA Ensino Médio 3º Segmento (Diurno) - Ciclo 4", etapaModalidade: "EJA (Diurno)", tipo: "OCEB" },
  { codigo: "OCEB.26-055", nome: "EJA Ensino Fundamental 1º Segmento (Noturno) - Ciclo 1", etapaModalidade: "EJA (Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-056", nome: "EJA Ensino Fundamental 2º Segmento (Noturno) - Ciclos 2 e 3", etapaModalidade: "EJA (Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-057", nome: "EJA Ensino Médio 3º Segmento (Noturno) - Ciclo 4", etapaModalidade: "EJA (Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-058", nome: "EJA Ensino Fundamental 1º Segmento (Noturno) - Escolas em Áreas de Assentamento - Ciclo 1", etapaModalidade: "EJA (Áreas de Assentamento - Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-059", nome: "EJA Ensino Fundamental 2º Segmento (Noturno) - Escolas em Áreas de Assentamento - Ciclo 2 e 3", etapaModalidade: "EJA (Áreas de Assentamento - Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-060", nome: "EJA Ensino Médio 3º Segmento (Noturno) - Escolas em Áreas de Assentamento - Ciclo 4", etapaModalidade: "EJA (Áreas de Assentamento - Noturno)", tipo: "OCEB" },
  { codigo: "OCEB.26-061", nome: "EJA Ensino Fundamental 1º Segmento - Educação em Prisões - Ciclo 1", etapaModalidade: "EJA (Sistema Prisional)", tipo: "OCEB" },
  { codigo: "OCEB.26-062", nome: "EJA Ensino Fundamental 2º Segmento - Educação em Prisões - Ciclo 2 e 3", etapaModalidade: "EJA (Sistema Prisional)", tipo: "OCEB" },
  { codigo: "OCEB.26-063", nome: "EJA Ensino Médio - Educação em Prisões - Ciclo 4", etapaModalidade: "EJA (Sistema Prisional)", tipo: "OCEB" },
  { codigo: "OCEB.26-064", nome: "EJA Ensino Fundamental 2º Segmento - Noturno Educação Escolar Indígena - Ciclo 2 e 3", etapaModalidade: "EJA (Educação Escolar Indígena)", tipo: "OCEB" },
  { codigo: "OCEB.26-065", nome: "EJA Ensino Médio - Noturno Educação Escolar Indígena - Ciclo 4", etapaModalidade: "EJA (Educação Escolar Indígena)", tipo: "OCEB" },
  { codigo: "OCEB.26-066", nome: "EJA Ensino Fundamental Ciclo 1 (Tempo Integral) - Educação Escolar na Socioeducação", etapaModalidade: "EJA (Socioeducação - Tempo Integral)", tipo: "OCEB" },
  { codigo: "OCEB.26-067", nome: "EJA Ensino Fundamental 1º Segmento - Educação Escolar na Socioeducação (UNIMETRO/UNIS/UFI) - Ciclo 1", etapaModalidade: "EJA (Socioeducação)", tipo: "OCEB" },
  { codigo: "OCEB.26-068", nome: "EJA Ensino Fundamental 2º Segmento - Educação Escolar na Socioeducação (UNIMETRO/UNIS/UFI) - Ciclo 2 e 3", etapaModalidade: "EJA (Socioeducação)", tipo: "OCEB" },
  { codigo: "OCEB.26-069", nome: "EJA Ensino Médio 3º Segmento - Educação Escolar na Socioeducação (UNIMETRO/UNIS/UFI) - Ciclo 4", etapaModalidade: "EJA (Socioeducação)", tipo: "OCEB" },
  { codigo: "OCEB.26-071", nome: "Ensino Fundamental Anos Finais - Educação Escolar na Socioeducação (UNIS SUL)", etapaModalidade: "Ensino Fundamental (Socioeducação)", tipo: "OCEB" },
  { codigo: "OCEB.26-072", nome: "EJA Ensino Fundamental 1º Segmento - Educação Escolar na Socioeducação (UNIS SUL) - Ciclo 1", etapaModalidade: "EJA (Socioeducação)", tipo: "OCEB" },
  { codigo: "OCEB.26-073", nome: "Ensino Fundamental Anos Iniciais - Educação Escolar na Socioeducação (UNIS/UFI/UNIS NORTE)", etapaModalidade: "Ensino Fundamental (Socioeducação)", tipo: "OCEB" },
  { codigo: "OCEB.26-074", nome: "Ensino Fundamental Anos Finais - Educação Escolar na Socioeducação (UNIS/UFI/UNIS NORTE)", etapaModalidade: "Ensino Fundamental (Socioeducação)", tipo: "OCEB" },
  { codigo: "OCEB.26-075", nome: "Ensino Fundamental Anos Iniciais (Tempo Integral) - Educação Escolar na Socioeducação", etapaModalidade: "Ensino Fundamental (Socioeducação - Tempo Integral)", tipo: "OCEB" },
  { codigo: "OCEB.26-076", nome: "Ensino Fundamental Anos Finais (Tempo Integral) - Educação Escolar na Socioeducação (UNIS SUL)", etapaModalidade: "Ensino Fundamental (Socioeducação - Tempo Integral)", tipo: "OCEB" },
  { codigo: "OCEB.26-077", nome: "Ensino Médio (Tempo Integral) - Educação Escolar na Socioeducação - Itinerário Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Socioeducação - Tempo Integral)", tipo: "OCEB" },
  { codigo: "OCEB.26-078", nome: "Ensino Médio (Tempo Integral) - Educação Escolar na Socioeducação - Itinerário Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Socioeducação - Tempo Integral)", tipo: "OCEB" },
  { codigo: "OCEB.26-079", nome: "Ensino Médio (diurno) - Educação Escolar na Socioeducação (UNIS/UFI/UNIS NORTE/UNIS SUL) - Itinerário Matemática e Ciências da Natureza", etapaModalidade: "Ensino Médio (Socioeducação - Regular)", tipo: "OCEB" },
  { codigo: "OCEB.26-080", nome: "Ensino Médio (diurno) - Educação Escolar na Socioeducação (UNIS/UFI/UNIS NORTE/UNIS SUL) - Itinerário Linguagens e Ciências Humanas", etapaModalidade: "Ensino Médio (Socioeducação - Regular)", tipo: "OCEB" },
  { codigo: "OCT.26-01", nome: "Análises Clínicas (3.600h) - MOCT_03", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Ambiente e Saúde)", tipo: "OCT" },
  { codigo: "OCT.26-02", nome: "Análises Clínicas (4.300h) - MOCT_01", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Ambiente e Saúde)", tipo: "OCT" },
  { codigo: "OCT.26-03", nome: "Meio Ambiente (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Ambiente e Saúde)", tipo: "OCT" },
  { codigo: "OCT.26-04", nome: "Meio Ambiente (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Ambiente e Saúde)", tipo: "OCT" },
  { codigo: "OCT.26-05", nome: "Automação Industrial (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-06", nome: "Automação Industrial (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-07", nome: "Eletromecânica (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-08", nome: "Eletromecânica (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-09", nome: "Eletrotécnica (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-10", nome: "Eletrotécnica (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-11", nome: "Mecânica (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-12", nome: "Mecânica (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-13", nome: "Sistemas de Energia Renovável (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-14", nome: "Sistemas de Energia Renovável (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Controle e Processos Industriais)", tipo: "OCT" },
  { codigo: "OCT.26-15", nome: "Administração (3.000h) - MOCT_04", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-16", nome: "Administração (3.500h) - MOCT_02", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-17", nome: "Administração (4.300h) - MOCT_01", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-18", nome: "Comércio (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-19", nome: "Comércio (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-20", nome: "Comércio (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-21", nome: "Comércio Exterior (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-22", nome: "Comércio Exterior (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-23", nome: "Comércio Exterior (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-24", nome: "Logística (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-25", nome: "Logística (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-26", nome: "Logística (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-27", nome: "Marketing (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-28", nome: "Marketing (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-29", nome: "Marketing (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-30", nome: "Recursos Humanos (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-31", nome: "Recursos Humanos (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-32", nome: "Recursos Humanos (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-33", nome: "Secretariado (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-34", nome: "Secretariado (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-35", nome: "Secretariado (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-36", nome: "Vendas (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-37", nome: "Vendas (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-38", nome: "Vendas (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Gestão e Negócios)", tipo: "OCT" },
  { codigo: "OCT.26-39", nome: "Computação Gráfica (3.100h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-40", nome: "Computação Gráfica (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-41", nome: "Computação Gráfica (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-42", nome: "Informática para Internet (3.100h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-43", nome: "Informática para Internet (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-44", nome: "Informática para Internet (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-45", nome: "Manutenção e Suporte em Informática (3.100h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-46", nome: "Manutenção e Suporte em Informática (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-47", nome: "Manutenção e Suporte em Informática (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-48", nome: "Redes de Computadores (3.100h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-49", nome: "Redes de Computadores (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-50", nome: "Redes de Computadores (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Informação e Comunicação)", tipo: "OCT" },
  { codigo: "OCT.26-51", nome: "Edificações (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Infraestrutura)", tipo: "OCT" },
  { codigo: "OCT.26-52", nome: "Edificações (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Infraestrutura)", tipo: "OCT" },
  { codigo: "OCT.26-53", nome: "Design de Interiores (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-54", nome: "Design de Interiores (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-55", nome: "Design Gráfico (3.100h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-56", nome: "Design Gráfico (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-57", nome: "Design Gráfico (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-58", nome: "Produção de Áudio e Vídeo (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-59", nome: "Produção de Áudio e Vídeo (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-60", nome: "Publicidade (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-61", nome: "Publicidade (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-62", nome: "Publicidade (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Cultural e Design)", tipo: "OCT" },
  { codigo: "OCT.26-63", nome: "Química (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Industrial)", tipo: "OCT" },
  { codigo: "OCT.26-64", nome: "Química (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Produção Industrial)", tipo: "OCT" },
  { codigo: "OCT.26-65", nome: "Agronegócio (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Recursos Naturais)", tipo: "OCT" },
  { codigo: "OCT.26-66", nome: "Agronegócio (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Recursos Naturais)", tipo: "OCT" },
  { codigo: "OCT.26-67", nome: "Agropecuária (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Recursos Naturais)", tipo: "OCT" },
  { codigo: "OCT.26-68A", nome: "Agropecuária (3.800h) - EEEFM Fazenda Emilio Schroeder (Regime de Alternância)", etapaModalidade: "Ensino Médio Técnico Integrado (Educação do Campo - Alternância)", tipo: "OCT" },
  { codigo: "OCT.26-69", nome: "Agropecuária (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Recursos Naturais)", tipo: "OCT" },
  { codigo: "OCT.26-70A", nome: "Agropecuária (4.300h) - CEIER", etapaModalidade: "Ensino Médio Técnico Integrado (Educação do Campo - CEIER)", tipo: "OCT" },
  { codigo: "OCT.26-71", nome: "Cafeicultura (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Recursos Naturais)", tipo: "OCT" },
  { codigo: "OCT.26-72", nome: "Cafeicultura (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Recursos Naturais)", tipo: "OCT" },
  { codigo: "OCT.26-73", nome: "Segurança do Trabalho (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Segurança)", tipo: "OCT" },
  { codigo: "OCT.26-74", nome: "Segurança do Trabalho (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Segurança)", tipo: "OCT" },
  { codigo: "OCT.26-75", nome: "Guia de Turismo (3.000h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Turismo, Hospitalidade e Lazer)", tipo: "OCT" },
  { codigo: "OCT.26-76", nome: "Guia de Turismo (3.500h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Turismo, Hospitalidade e Lazer)", tipo: "OCT" },
  { codigo: "OCT.26-77", nome: "Guia de Turismo (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Turismo, Hospitalidade e Lazer)", tipo: "OCT" },
  { codigo: "OCT.26-78", nome: "Controle Ambiental (3.600h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Ambiente e Saúde)", tipo: "OCT" },
  { codigo: "OCT.26-79", nome: "Controle Ambiental (4.300h)", etapaModalidade: "Ensino Médio Técnico Integrado (Eixo Ambiente e Saúde)", tipo: "OCT" }
];

let orgsSelecionadas = []; // Array local para armazenar as OCs adicionadas

// Preenche o dropdown de etapas (valores únicos)
function preencherEtapasModalidade() {
  const select = document.getElementById('selectEtapaModalidade');
  select.innerHTML = '<option value="">Selecione a Etapa/Modalidade</option>';
  const etapas = [...new Set(LISTA_ORGANIZACOES_CURRICULARES.map(org => org.etapaModalidade))].sort();
  etapas.forEach(etapa => {
    const opt = document.createElement('option');
    opt.value = etapa;
    opt.textContent = etapa;
    select.appendChild(opt);
  });
}

// Atualiza o segundo dropdown com base na etapa selecionada
function atualizarSelectOCs() {
  const etapaSelecionada = document.getElementById('selectEtapaModalidade').value;
  const selectOC = document.getElementById('selectOrganizacao');
  selectOC.innerHTML = '<option value="">Selecione...</option>';
  selectOC.disabled = !etapaSelecionada;
  if (!etapaSelecionada) return;

  const opcoes = LISTA_ORGANIZACOES_CURRICULARES.filter(org => org.etapaModalidade === etapaSelecionada);
  opcoes.forEach(org => {
    const opt = document.createElement('option');
    opt.value = org.codigo;
    opt.textContent = `${org.codigo} - ${org.nome}`;
    opt.dataset.nome = org.nome;
    opt.dataset.tipo = org.tipo;
    selectOC.appendChild(opt);
  });
}

// Adiciona a OC selecionada à lista visual
function adicionarOrganizacao() {
  const selectOC = document.getElementById('selectOrganizacao');
  if (!selectOC.value) {
    mostrarToast('Selecione uma organização curricular.', 'warning');
    return;
  }

  const codigo = selectOC.value;
  const nome = selectOC.options[selectOC.selectedIndex].dataset.nome;
  const etapaModalidade = document.getElementById('selectEtapaModalidade').value;
  const tipo = selectOC.options[selectOC.selectedIndex].dataset.tipo;

  // Evita duplicatas
  if (orgsSelecionadas.find(org => org.codigo === codigo)) {
    mostrarToast('Esta OC já foi adicionada.', 'warning');
    return;
  }

  orgsSelecionadas.push({ codigo, nome, etapaModalidade, tipo });
  renderizarOrgsAdicionadas();

  // Limpa o select para facilitar a próxima seleção
  selectOC.value = '';
  selectOC.disabled = true;   // será reabilitado quando outra etapa for selecionada
  document.getElementById('selectEtapaModalidade').value = '';
}

// Renderiza a lista de cards com as OCs adicionadas
function renderizarOrgsAdicionadas() {
  const container = document.getElementById('listaOrgsAdicionadas');
  container.innerHTML = '';

  if (orgsSelecionadas.length === 0) {
    container.innerHTML = '<p style="font-size:13px; color:var(--text-muted);">Nenhuma organização curricular adicionada.</p>';
    return;
  }

  // Contador
  const header = document.createElement('p');
  header.style.cssText = 'font-size:13px; color:var(--text-primary); margin-bottom:8px; font-weight:500; grid-column: 1 / -1;';
  header.textContent = `${orgsSelecionadas.length} organização(ões) vinculada(s):`;
  container.appendChild(header);

  orgsSelecionadas.forEach((org, index) => {
    const card = document.createElement('div');
    card.className = 'usuario-card';
    card.style.cssText = 'display:flex; align-items:center; gap:10px; padding:10px; border-radius:12px; background:var(--card-bg); border:1px solid var(--card-border);';

    card.innerHTML = `
      <div class="usuario-avatar" style="width:42px;height:42px;background:#e0e7ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#2563eb;flex-shrink:0;">
        <i class="fas fa-book"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <strong style="font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;">${org.codigo}</strong>
        <p style="margin:0;font-size:12px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${org.nome}</p>
        <p style="margin:0;font-size:11px;color:var(--text-muted);">${org.etapaModalidade} · ${org.tipo}</p>
      </div>
      <button class="btn-icone" onclick="removerOrganizacao(${index})" style="color:#dc2626;flex-shrink:0;">
        <i class="fas fa-times"></i>
      </button>
    `;
    container.appendChild(card);
  });
}

function removerOrganizacao(index) {
  orgsSelecionadas.splice(index, 1);
  renderizarOrgsAdicionadas();
}