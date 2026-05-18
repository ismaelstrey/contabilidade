const API = process.env.API_URL || 'https://api.contabilidadeigrejinha.com.br/api/v1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('Informe ADMIN_EMAIL e ADMIN_PASSWORD no ambiente.');
}

const categories = {
  reforma: 4,
  mei: 5,
  empresas: 6,
};

const sources = {
  receitaEntenda: 'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/programas-e-atividades/reforma-tributaria-do-consumo/entenda',
  receitaObrigacoes2026: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2025/dezembro/receita-federal-e-comite-gestor-do-ibs-definem-regras-relativas-a-obrigacoes-acessorias-da-reforma-tributaria-para-inicio-de-2026',
  fazendaReforma: 'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria',
  fazendaSimples2027: 'https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/abril/comite-define-prazos-de-opcao-pelo-simples-nacional-e-pelo-regime-regular-do-ibs-e-da-cbs-para-2027',
  receitaSemMultas: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/abril/reforma-tributaria-receita-federal-desmentem-aplicacao-imediata-de-multas-e-reforcam-transicao-simplificada-em-2026',
  portalMei: 'https://www.gov.br/mei',
  dasnPrazo: 'https://www.gov.br/memp/pt-br/assuntos/noticias/prazo-para-entrega-da-declaracao-anual-simplificada-do-mei-dasn-simei-termina-no-dia-31-05',
  dasnServico: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/declaracao-anual-de-faturamento',
  exclusaoSimples: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/marco/receita-federal-emite-termo-de-exclusao-para-devedores-do-simples-nacional-incluindo-mei',
  valoresMei: 'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/perguntas-frequentes/pagamento-da-contribuicao-mensal-carne-mensal/qual-o-valor-das-contribuicoes',
  nfse: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/abril/nfs-e-de-padrao-nacional-sera-obrigatoria-para-optantes-do-simples-nacional/',
  nfsePortal: 'https://www.gov.br/nfse/pt-br/noticias/nfs-e-e-simples-nacional-obrigatoriedade-de-emissao-atraves-do-emissor-nacional',
  dte: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2025/novembro/reforma-tributaria-do-consumo-rtc-obrigatoriedade-ao-dte-automatica-a-partir-de-2026',
  det: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/domicilio-eletronico-trabalhista-det/conheca-o-det/conheca-o-det',
  fgtsDigital: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/empregador/fgtsdigital',
  esocial: 'https://www.gov.br/esocial/pt-br/noticias/ministerio-do-trabalho-e-emprego/fgts-digital-inicia-o-recebimento-de-valores-de-emprestimos-consignados-vencidos',
  receitaSimples2027: 'https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/abril/cgsn-define-prazos-de-opcao-pelo-simples-nacional-e-pelo-regime-regular-do-ibs-e-da-cbs-para-2027',
};

const sourceList = (items) => `Fontes consultadas\n${items.map((item) => `- ${item.label}: ${item.url}`).join('\n')}`;

const article = ({ title, slug, excerpt, image, categoryId, metaDescription, context, impacts, checklist, alert, sourceItems }) => ({
  title,
  slug,
  excerpt,
  content: [context, impacts, checklist, alert, sourceList(sourceItems)].join('\n\n'),
  coverImageUrl: `/images/blog/2026/${image}.svg`,
  ogImage: `/images/blog/2026/${image}.svg`,
  categoryId,
  status: 'draft',
  readTimeMinutes: 8,
  metaTitle: title.length > 60 ? `${title.slice(0, 57)}...` : title,
  metaDescription,
  canonicalUrl: null,
});

const articles = [
  article({
    title: 'Reforma Tributária 2026: o que muda para empresas na fase de testes',
    slug: 'reforma-tributaria-2026-o-que-muda-para-empresas-na-fase-de-testes',
    excerpt: 'Entenda por que 2026 é um ano de adaptação da Reforma Tributária do Consumo e quais providências empresas devem iniciar agora.',
    image: 'reforma-tributaria-2026-fase-testes',
    categoryId: categories.reforma,
    metaDescription: 'Guia prático sobre a fase de testes da Reforma Tributária em 2026, com impactos para documentos fiscais, sistemas e rotinas contábeis.',
    context: 'A Reforma Tributária do Consumo entrou em uma fase decisiva de preparação. A Receita Federal explica que o novo modelo cria a CBS, de competência federal, o IBS, de competência estadual e municipal, e o Imposto Seletivo. Em 2026, a lógica central é de teste, calibragem e adaptação operacional. Isso significa que a empresa não deve esperar a cobrança plena para agir: o ano serve para revisar cadastros, sistemas de emissão fiscal, parametrizações, contratos, formação de preços e controles internos.',
    impacts: 'Na prática, a fase de testes exige que gestores acompanhem novos campos em documentos fiscais, integração de sistemas e possíveis mudanças na forma de apurar créditos. Empresas que deixam a preparação para a última hora tendem a enfrentar retrabalho, inconsistências em notas fiscais e dificuldade para medir o impacto real da transição. O ponto mais importante é transformar 2026 em um ano de diagnóstico: mapear produtos e serviços, entender regimes tributários, revisar CNAEs, levantar operações com clientes e fornecedores e preparar a equipe administrativa.',
    checklist: 'Checklist de ação: revise o cadastro fiscal de produtos e serviços; confirme se o sistema emissor será atualizado para campos de IBS e CBS; acompanhe comunicados da Receita Federal e do Comitê Gestor; organize relatórios de faturamento por tipo de operação; avalie com a contabilidade se contratos e preços precisarão de ajuste; mantenha histórico das notas emitidas em 2026 para comparação futura.',
    alert: 'Atenção: este conteúdo é informativo. A aplicação prática da Reforma Tributária depende do regime da empresa, setor de atuação, local de operação e natureza das receitas. Antes de alterar preços, contratos ou parametrizações fiscais, busque orientação contábil individualizada.',
    sourceItems: [
      { label: 'Receita Federal - Entenda a Reforma Tributária do Consumo', url: sources.receitaEntenda },
      { label: 'Receita Federal e Comitê Gestor - Obrigações acessórias para 2026', url: sources.receitaObrigacoes2026 },
      { label: 'Ministério da Fazenda - Reforma Tributária', url: sources.fazendaReforma },
    ],
  }),
  article({
    title: 'IBS e CBS: entenda os novos tributos da Reforma Tributária',
    slug: 'ibs-e-cbs-entenda-os-novos-tributos-da-reforma-tributaria',
    excerpt: 'IBS e CBS são a base do novo IVA dual brasileiro. Veja o que eles substituem e por que sua empresa precisa acompanhar a transição.',
    image: 'ibs-cbs-novos-tributos',
    categoryId: categories.reforma,
    metaDescription: 'Entenda IBS, CBS e IVA dual na Reforma Tributária, com explicação clara para empresas e gestores.',
    context: 'O novo sistema de tributação sobre consumo será estruturado em torno de dois tributos principais: CBS e IBS. A CBS substitui tributos federais sobre consumo, enquanto o IBS substituirá tributos estaduais e municipais, como ICMS e ISS, dentro do calendário de transição definido pela legislação. A ideia do IVA dual é aproximar o Brasil de modelos internacionais de tributação sobre valor agregado, reduzindo cumulatividade e tornando mais claro onde o imposto incide.',
    impacts: 'Para empresas, a mudança não é apenas troca de siglas. O impacto pode aparecer em preço, crédito tributário, emissão de notas, contratos, fluxo de caixa e relacionamento com fornecedores. Empresas prestadoras de serviços, com vendas interestaduais ou com cadeias longas de fornecedores devem prestar atenção especial à documentação das operações. O crédito amplo prometido pela reforma tende a aumentar a importância de notas corretamente emitidas e de fornecedores regularizados.',
    checklist: 'Checklist de ação: identifique operações hoje tributadas por ISS, ICMS, PIS e Cofins; separe receitas por serviço, venda, revenda e operações mistas; confira se fornecedores emitem documentos fiscais válidos; revise cadastros de clientes e municípios de prestação; acompanhe a configuração do seu ERP; converse com a contabilidade sobre simulações de carga e crédito.',
    alert: 'Atenção: a transição é gradual e terá regras específicas. Não substitua a análise do seu caso por informações gerais. O melhor uso deste momento é preparar dados confiáveis para que a contabilidade possa simular cenários com segurança.',
    sourceItems: [
      { label: 'Receita Federal - Entenda a Reforma Tributária do Consumo', url: sources.receitaEntenda },
      { label: 'Ministério da Fazenda - Lei Geral do IBS, CBS e Imposto Seletivo', url: sources.fazendaReforma },
    ],
  }),
  article({
    title: 'Imposto Seletivo: como o novo tributo pode afetar preços e setores',
    slug: 'imposto-seletivo-como-o-novo-tributo-pode-afetar-precos-e-setores',
    excerpt: 'O Imposto Seletivo foi criado para desestimular bens e serviços prejudiciais à saúde ou ao meio ambiente. Entenda os cuidados para empresas.',
    image: 'imposto-seletivo-precos-setores',
    categoryId: categories.reforma,
    metaDescription: 'Veja como o Imposto Seletivo pode afetar setores, preços e planejamento fiscal de empresas na Reforma Tributária.',
    context: 'O Imposto Seletivo é um tributo federal previsto na Reforma Tributária do Consumo. Segundo a Receita Federal, ele foi criado para desestimular o consumo de bens e serviços prejudiciais à saúde ou ao meio ambiente. Isso significa que sua lógica não é apenas arrecadatória: ele também funciona como instrumento de política pública. Ainda assim, para empresas, qualquer incidência adicional pode afetar preço, margem e estratégia comercial.',
    impacts: 'Empresas que atuam com produtos potencialmente enquadráveis no Imposto Seletivo precisam acompanhar a regulamentação com atenção. O impacto pode surgir na indústria, importação, comercialização ou cadeias de distribuição. Mesmo empresas que não serão contribuintes diretas podem sentir efeitos indiretos, como aumento de custo de insumos, alteração de demanda e revisão de contratos. O risco maior é tratar o tema como algo distante e perder tempo de adaptação.',
    checklist: 'Checklist de ação: mapeie produtos e insumos sensíveis; acompanhe listas e regulamentos oficiais; calcule margem por linha de produto; avalie repasse de preço com cuidado comercial; registre contratos que possam exigir revisão; mantenha contato próximo com fornecedores sobre eventual incidência do tributo.',
    alert: 'Atenção: enquadramento no Imposto Seletivo depende de lei e regulamentação aplicável ao produto ou serviço. Antes de comunicar aumento de preço ou alterar contratos, confirme a regra com suporte contábil e jurídico.',
    sourceItems: [
      { label: 'Receita Federal - Entenda a Reforma Tributária do Consumo', url: sources.receitaEntenda },
      { label: 'Ministério da Fazenda - Reforma Tributária', url: sources.fazendaReforma },
    ],
  }),
  article({
    title: 'Simples Nacional, IBS e CBS: o que empresas pequenas precisam acompanhar',
    slug: 'simples-nacional-ibs-e-cbs-o-que-empresas-pequenas-precisam-acompanhar',
    excerpt: 'Empresas do Simples Nacional também precisarão acompanhar a transição da Reforma Tributária e as opções para 2027.',
    image: 'simples-nacional-ibs-cbs',
    categoryId: categories.reforma,
    metaDescription: 'Entenda os pontos de atenção para empresas do Simples Nacional diante do IBS e da CBS na Reforma Tributária.',
    context: 'Microempresas e empresas de pequeno porte optantes pelo Simples Nacional não devem ignorar a Reforma Tributária. A Receita Federal e o Comitê Gestor do Simples Nacional já divulgaram regras sobre prazos de opção para 2027 e a possibilidade de opção pelo regime regular de IBS e CBS em situações específicas. Isso indica que o planejamento tributário de empresas pequenas passará a exigir mais atenção ao calendário e ao impacto das novas regras.',
    impacts: 'A grande mudança para empresas pequenas é que a escolha de regime pode ter reflexos em crédito, competitividade e relação com clientes. Empresas que vendem para outras empresas podem sofrer pressão para permitir melhor aproveitamento de crédito na cadeia. Por outro lado, sair de um regime simplificado sem simulação pode aumentar complexidade administrativa. A decisão deve considerar faturamento, margem, perfil de clientes, fornecedores e capacidade operacional.',
    checklist: 'Checklist de ação: mantenha certidões e débitos regularizados; acompanhe o calendário de opção de setembro de 2026 para efeitos em 2027; simule cenários com a contabilidade; avalie o perfil dos clientes que exigem crédito; revise contratos com grandes compradores; organize demonstrativos de faturamento e custos.',
    alert: 'Atenção: a melhor escolha não é igual para todas as empresas. A decisão entre Simples Nacional e eventual regime regular de IBS e CBS deve ser tomada com números reais, não por comparação genérica.',
    sourceItems: [
      { label: 'Ministério da Fazenda - Prazos do Simples Nacional e regime regular para 2027', url: sources.fazendaSimples2027 },
      { label: 'Receita Federal - Entenda a Reforma Tributária', url: sources.receitaEntenda },
    ],
  }),
  article({
    title: 'Documentos fiscais em 2026: adaptação aos novos campos da Reforma Tributária',
    slug: 'documentos-fiscais-em-2026-adaptacao-aos-novos-campos-da-reforma-tributaria',
    excerpt: 'A transição da Reforma Tributária exige atenção aos documentos fiscais e aos campos relacionados ao IBS e à CBS.',
    image: 'documentos-fiscais-2026-campos',
    categoryId: categories.reforma,
    metaDescription: 'Saiba como empresas devem se preparar para campos de IBS e CBS em documentos fiscais durante a transição de 2026.',
    context: 'A adaptação dos documentos fiscais é uma das partes mais visíveis da Reforma Tributária em 2026. A Receita Federal reforçou que o ano será de transição simplificada e adaptação, com foco em conformidade e preparação. Isso não elimina a necessidade de preparar sistemas; ao contrário, torna 2026 um período importante para testar emissões, conferir cadastros e corrigir inconsistências antes da cobrança plena dos novos tributos.',
    impacts: 'Empresas que emitem notas fiscais manualmente ou dependem de sistemas pouco atualizados precisam redobrar o cuidado. Campos incorretos podem comprometer relatórios, créditos e obrigações futuras. A emissão fiscal passa a depender ainda mais de cadastros bem estruturados, natureza da operação correta e integração entre financeiro, vendas e contabilidade. O dono da empresa deve tratar documento fiscal como dado estratégico, não apenas como burocracia.',
    checklist: 'Checklist de ação: confirme atualização do emissor fiscal; teste emissão com novos campos quando disponível; revise NCM, CNAE, município de incidência e natureza de operação; treine equipe responsável por notas; crie rotina de conferência mensal; arquive XMLs e relatórios de validação.',
    alert: 'Atenção: informações incorretas em documentos fiscais podem gerar retrabalho e risco de inconsistências. Use 2026 para ajustar processo e tecnologia, com acompanhamento técnico.',
    sourceItems: [
      { label: 'Receita Federal - Obrigações acessórias da Reforma Tributária para 2026', url: sources.receitaObrigacoes2026 },
      { label: 'Receita Federal - Transição simplificada em 2026', url: sources.receitaSemMultas },
    ],
  }),
];

articles.push(
  article({
    title: 'MEI 2026: principais obrigações para manter o CNPJ regular',
    slug: 'mei-2026-principais-obrigacoes-para-manter-o-cnpj-regular',
    excerpt: 'Veja as obrigações essenciais do MEI em 2026 para evitar multas, pendências e riscos de exclusão do regime.',
    image: 'mei-2026-obrigacoes',
    categoryId: categories.mei,
    metaDescription: 'Guia de obrigações do MEI em 2026: DAS, DASN-SIMEI, notas, débitos e cuidados para manter o CNPJ regular.',
    context: 'O MEI continua sendo uma porta de entrada simplificada para empreendedores, mas simplificado não significa sem obrigação. Em 2026, o microempreendedor deve manter atenção ao pagamento mensal do DAS, emissão de notas quando obrigatória, controle de faturamento, entrega da DASN-SIMEI e acompanhamento de comunicações oficiais. O Portal do Empreendedor reúne serviços e alertas importantes para quem já é MEI ou pretende se formalizar.',
    impacts: 'A falta de rotina é o principal problema. Muitos MEIs acumulam guias em atraso, esquecem a declaração anual ou não controlam faturamento por mês. Isso pode gerar multa, débitos, dificuldade de emitir certidões e risco de exclusão do Simei em casos de pendência. O CNPJ regular facilita acesso a crédito, emissão de nota, relacionamento com clientes e crescimento organizado.',
    checklist: 'Checklist de ação: pague o DAS até o vencimento mensal; registre receitas por mês; guarde notas emitidas e comprovantes; entregue a DASN-SIMEI até 31 de maio; acompanhe o Portal do Empreendedor; verifique se há débitos em aberto; procure orientação se estiver perto do limite de faturamento.',
    alert: 'Atenção: se o faturamento crescer, se houver contratação, mudança de atividade ou débitos recorrentes, vale conversar com contador. O MEI é simples, mas precisa de controle para não virar um problema maior.',
    sourceItems: [
      { label: 'Portal do Empreendedor', url: sources.portalMei },
      { label: 'Gov.br - Declaração anual de faturamento do MEI', url: sources.dasnServico },
    ],
  }),
  article({
    title: 'DASN-SIMEI: prazo, multa e cuidados na declaração anual do MEI',
    slug: 'dasn-simei-prazo-multa-e-cuidados-na-declaracao-anual-do-mei',
    excerpt: 'A Declaração Anual do MEI deve ser enviada até 31 de maio, mesmo sem faturamento. Entenda multas e cuidados.',
    image: 'dasn-simei-prazo-multa',
    categoryId: categories.mei,
    metaDescription: 'Entenda prazo, multa e cuidados da DASN-SIMEI, a declaração anual obrigatória do MEI.',
    context: 'A DASN-SIMEI é a Declaração Anual Simplificada do Microempreendedor Individual. Ela informa a receita bruta anual do MEI e se houve empregado no período. O prazo geral é até 31 de maio do ano seguinte ao ano-calendário declarado. A obrigação existe mesmo quando o MEI não teve faturamento. Em 2026, quem foi optante pelo Simei em qualquer período de 2025 deve ficar atento ao prazo.',
    impacts: 'Entregar em atraso gera multa. Informações incorretas também podem criar inconsistências, especialmente quando o valor declarado não bate com notas emitidas, extratos e controles de venda. Para evitar problemas, o ideal é não deixar a apuração para o último dia. O MEI deve separar receitas por tipo de atividade, conferir notas fiscais e verificar se houve contratação de empregado.',
    checklist: 'Checklist de ação: levante faturamento mês a mês; separe receitas de comércio/indústria e prestação de serviços quando aplicável; confira notas emitidas; envie pelo Portal do Empreendedor ou App MEI; salve recibo de entrega; se atrasar, emita e pague a multa; em caso de baixa do MEI, verifique a declaração de extinção.',
    alert: 'Atenção: declarar não substitui pagar DAS em atraso. São obrigações diferentes. Se houver débitos, regularize também as guias mensais ou parcelamentos disponíveis.',
    sourceItems: [
      { label: 'Ministério do Empreendedorismo - Prazo DASN-SIMEI 31/05', url: sources.dasnPrazo },
      { label: 'Gov.br - Declaração Anual de Faturamento', url: sources.dasnServico },
    ],
  }),
  article({
    title: 'DAS do MEI: como funciona a contribuição mensal em 2026',
    slug: 'das-do-mei-como-funciona-a-contribuicao-mensal-em-2026',
    excerpt: 'O DAS do MEI reúne a contribuição mensal obrigatória. Veja por que pagar em dia protege benefícios e regularidade.',
    image: 'das-mei-contribuicao-2026',
    categoryId: categories.mei,
    metaDescription: 'Entenda o DAS do MEI em 2026, como funciona a contribuição mensal e por que manter os pagamentos em dia.',
    context: 'O DAS é a guia mensal do MEI. Ele concentra a contribuição previdenciária e os valores fixos de ISS ou ICMS quando aplicáveis à atividade. Em 2026, o valor da contribuição acompanha o salário mínimo e as regras do Simei. O pagamento mensal é uma das obrigações mais importantes para manter o CNPJ regular e preservar acesso a benefícios previdenciários, respeitadas as regras próprias do INSS.',
    impacts: 'Atrasar o DAS cria débitos, juros e dificuldade de regularização. Também pode prejudicar a emissão de certidões, o acesso a parcelamentos e a permanência no regime em situações de cobrança. Para o MEI, o maior ganho está em criar rotina: gerar a guia, pagar até o vencimento e conferir se o pagamento foi reconhecido. O custo de esquecer várias competências costuma ser maior do que o esforço de acompanhar mensalmente.',
    checklist: 'Checklist de ação: gere o DAS pelos canais oficiais; pague dentro do vencimento; confira baixa do pagamento; evite boletos recebidos por links desconhecidos; se atrasar, gere guia atualizada; mantenha comprovantes; revise se sua atividade possui ISS, ICMS ou ambos.',
    alert: 'Atenção: golpes contra MEI são comuns. Use canais oficiais do gov.br, Portal do Empreendedor ou Simples Nacional. Desconfie de cobranças por e-mail, WhatsApp ou boletos que não foram gerados por você.',
    sourceItems: [
      { label: 'Portal do Empreendedor', url: sources.portalMei },
      { label: 'Gov.br - Valores das contribuições mensais do MEI em 2026', url: sources.valoresMei },
    ],
  }),
  article({
    title: 'MEI com débitos: riscos de exclusão e como regularizar',
    slug: 'mei-com-debitos-riscos-de-exclusao-e-como-regularizar',
    excerpt: 'MEIs com débitos podem receber termo de exclusão do Simples/Simei. Entenda como acompanhar e regularizar pendências.',
    image: 'mei-debitos-exclusao-regularizar',
    categoryId: categories.mei,
    metaDescription: 'Veja riscos de débitos para MEI, termo de exclusão do Simei e caminhos para regularização.',
    context: 'Débitos acumulados podem colocar o MEI em situação de risco. A Receita Federal informou a emissão de termos de exclusão para devedores do Simples Nacional, incluindo MEI, com comunicação pelo DTE-SN e relatórios de pendências. Isso reforça a importância de acompanhar canais oficiais, verificar débitos e agir antes que o problema avance para exclusão do regime.',
    impacts: 'A exclusão do Simei pode aumentar a complexidade tributária e administrativa do empreendedor. Além disso, débitos em aberto prejudicam regularidade, certidões, negociações com clientes e acesso a crédito. A boa notícia é que, quando acompanhada a tempo, a pendência pode ser regularizada por pagamento, parcelamento ou contestação, conforme o caso.',
    checklist: 'Checklist de ação: acesse o Portal do Simples Nacional ou e-CAC; consulte DTE-SN; verifique relatórios de pendências; identifique débitos de DAS, declaração ou parcelamentos; negocie dentro do prazo; salve protocolos; se discordar da cobrança, busque orientação para contestar corretamente.',
    alert: 'Atenção: ignorar comunicação eletrônica pode fazer o prazo correr sem que o empreendedor perceba. Crie rotina mensal de consulta aos portais oficiais ou peça apoio contábil.',
    sourceItems: [
      { label: 'Receita Federal - Termo de Exclusão para Simples e MEI', url: sources.exclusaoSimples },
      { label: 'Portal do Empreendedor', url: sources.portalMei },
    ],
  }),
  article({
    title: 'Quando o MEI deve procurar um contador e avaliar desenquadramento',
    slug: 'quando-o-mei-deve-procurar-um-contador-e-avaliar-desenquadramento',
    excerpt: 'Nem todo MEI permanece pequeno para sempre. Veja sinais de que é hora de buscar contador e planejar a transição.',
    image: 'mei-contador-desenquadramento',
    categoryId: categories.mei,
    metaDescription: 'Saiba quando o MEI deve procurar um contador, avaliar limite de faturamento e planejar desenquadramento.',
    context: 'O MEI foi criado para simplificar a formalização, mas há momentos em que o negócio cresce e exige outro nível de organização. Quando o faturamento se aproxima do limite permitido, quando há necessidade de contratar mais empregados, abrir filial, incluir atividades não permitidas ou vender para clientes maiores, o empreendedor deve avaliar se ainda faz sentido continuar no Simei.',
    impacts: 'O desenquadramento mal planejado pode gerar cobrança retroativa, multas e confusão na emissão de notas. Por outro lado, planejar a migração permite escolher regime adequado, organizar caixa, precificar corretamente e evitar sustos. O contador ajuda a comparar cenários, regularizar pendências e preparar a empresa para crescer com segurança.',
    checklist: 'Checklist de ação: acompanhe faturamento mês a mês; confira atividades permitidas; avalie necessidade de contratação; regularize DAS e DASN; projete faturamento dos próximos 12 meses; simule Simples Nacional; revise preço, margem e obrigações acessórias antes da mudança.',
    alert: 'Atenção: esperar ultrapassar limites ou acumular pendências costuma sair mais caro. O ideal é planejar o desenquadramento antes de ele se tornar obrigatório.',
    sourceItems: [
      { label: 'Gov.br - Declaração Anual e orientação sobre limite do MEI', url: sources.dasnServico },
      { label: 'Portal do Empreendedor', url: sources.portalMei },
    ],
  }),
);

articles.push(
  article({
    title: 'NFS-e Nacional obrigatória: o que muda para empresas do Simples',
    slug: 'nfse-nacional-obrigatoria-o-que-muda-para-empresas-do-simples',
    excerpt: 'A NFS-e de padrão nacional será obrigatória para optantes do Simples Nacional na prestação de serviços a partir de setembro de 2026.',
    image: 'nfse-nacional-simples',
    categoryId: categories.empresas,
    metaDescription: 'Entenda a obrigatoriedade da NFS-e Nacional para empresas do Simples Nacional a partir de setembro de 2026.',
    context: 'A Receita Federal divulgou que a NFS-e de padrão nacional será obrigatória para microempresas e empresas de pequeno porte optantes pelo Simples Nacional quando prestarem serviços sujeitos à emissão desse documento. A regra passa a valer em 1º de setembro de 2026 e reforça o movimento de padronização nacional da emissão de notas fiscais de serviço.',
    impacts: 'Para empresas prestadoras de serviços, a mudança exige adaptação de processo. Será necessário entender o Emissor Nacional, revisar dados cadastrais, treinar equipe e verificar integração com sistemas internos. A padronização pode simplificar rotinas no longo prazo, mas a transição demanda cuidado para evitar emissão incorreta, atraso no faturamento e divergências com clientes.',
    checklist: 'Checklist de ação: confirme se sua empresa presta serviço sujeito à NFS-e; acesse o portal nacional da NFS-e; revise cadastro, CNAE e municípios de prestação; teste emissão antes do prazo; ajuste contratos e rotinas de faturamento; treine quem emite notas; salve XMLs e recibos.',
    alert: 'Atenção: empresas com opção pelo Simples pendente ou em discussão também podem ser alcançadas pela regra conforme a norma divulgada. Verifique seu enquadramento com a contabilidade.',
    sourceItems: [
      { label: 'Receita Federal - NFS-e Nacional obrigatória para Simples', url: sources.nfse },
      { label: 'Portal NFS-e - Obrigatoriedade pelo Emissor Nacional', url: sources.nfsePortal },
    ],
  }),
  article({
    title: 'Domicílio Tributário Eletrônico em 2026: por que sua empresa precisa acompanhar',
    slug: 'domicilio-tributario-eletronico-em-2026-por-que-sua-empresa-precisa-acompanhar',
    excerpt: 'A partir de 2026, empresas devem acompanhar o DTE como canal oficial de comunicação tributária com a Receita Federal.',
    image: 'domicilio-tributario-eletronico-2026',
    categoryId: categories.empresas,
    metaDescription: 'Entenda o Domicílio Tributário Eletrônico em 2026 e por que empresas devem acompanhar comunicações oficiais.',
    context: 'O Domicílio Tributário Eletrônico é o canal oficial de comunicação eletrônica entre a Receita Federal e contribuintes. Com a implementação da Reforma Tributária do Consumo, a Receita informou a obrigatoriedade automática do DTE a partir de 2026 para empresas. Isso muda a rotina de acompanhamento: comunicações importantes podem chegar eletronicamente e produzir efeitos jurídicos.',
    impacts: 'Empresas que não consultam o DTE podem perder prazos, deixar de responder intimações ou não perceber pendências. O risco não está apenas na existência de uma obrigação, mas na falta de processo interno para acompanhar avisos. Pequenas empresas, especialmente, devem definir quem acessa, com qual frequência e como os documentos serão encaminhados à contabilidade.',
    checklist: 'Checklist de ação: confirme acesso gov.br ou certificado digital; atualize contatos da empresa; defina responsável pela consulta; crie rotina semanal de verificação; salve comunicados recebidos; compartilhe intimações com a contabilidade imediatamente; registre prazos em agenda.',
    alert: 'Atenção: comunicação eletrônica não deve ser tratada como caixa de entrada secundária. Ignorar mensagens oficiais pode gerar perda de prazo e autuações.',
    sourceItems: [
      { label: 'Receita Federal - DTE obrigatório a partir de 2026', url: sources.dte },
      { label: 'Receita Federal - Reforma Tributária do Consumo', url: sources.receitaEntenda },
    ],
  }),
  article({
    title: 'DET: comunicações trabalhistas eletrônicas e riscos de ignorar notificações',
    slug: 'det-comunicacoes-trabalhistas-eletronicas-e-riscos-de-ignorar-notificacoes',
    excerpt: 'O Domicílio Eletrônico Trabalhista centraliza comunicações da inspeção do trabalho. Veja cuidados para empregadores.',
    image: 'det-comunicacoes-trabalhistas',
    categoryId: categories.empresas,
    metaDescription: 'Guia sobre o DET, comunicações trabalhistas eletrônicas e cuidados para empresas empregadoras.',
    context: 'O Domicílio Eletrônico Trabalhista, conhecido como DET, é o sistema do Governo Federal para comunicação eletrônica entre a Inspeção do Trabalho e o empregador. Ele serve para cientificar atos administrativos, intimações, ações fiscais e avisos em geral, além de permitir o envio de documentação exigida em fiscalizações ou processos administrativos.',
    impacts: 'Para empresas com empregados, o DET exige disciplina. Uma notificação ignorada pode gerar presunção de ciência e perda de prazo de resposta. Isso afeta defesa, recurso e apresentação de documentos. Mesmo empresas pequenas precisam manter dados atualizados e saber quem acompanha o sistema. A área trabalhista passa a exigir rotina digital semelhante à tributária.',
    checklist: 'Checklist de ação: acesse o DET com perfil correto da empresa; atualize e-mail e telefone; defina responsável interno; consulte periodicamente; arquive notificações; responda exigências dentro do prazo; integre contabilidade, RH e jurídico quando houver fiscalização.',
    alert: 'Atenção: o DET não é apenas informativo. Comunicações eletrônicas podem ter efeito legal. Se receber intimação ou exigência, não responda sem avaliar documentos e prazos.',
    sourceItems: [
      { label: 'Ministério do Trabalho e Emprego - Conheça o DET', url: sources.det },
    ],
  }),
  article({
    title: 'FGTS Digital e eSocial: pontos de atenção para empregadores',
    slug: 'fgts-digital-e-esocial-pontos-de-atencao-para-empregadores',
    excerpt: 'FGTS Digital e eSocial reforçam a necessidade de dados trabalhistas corretos, prazos bem acompanhados e integração com a folha.',
    image: 'fgts-digital-esocial-empregadores',
    categoryId: categories.empresas,
    metaDescription: 'Veja cuidados com FGTS Digital, eSocial, guias e informações trabalhistas para empresas empregadoras.',
    context: 'O FGTS Digital consolidou uma nova forma de geração e recolhimento de guias vinculadas às informações trabalhistas prestadas no eSocial. Isso significa que inconsistências em eventos, bases de cálculo, datas ou vínculos podem refletir diretamente na guia do FGTS. O ambiente digital aumenta rastreabilidade e reduz tolerância a dados incompletos.',
    impacts: 'Para empregadores, o principal impacto é a necessidade de fechamento correto da folha e conferência antes do prazo. Informações de admissão, afastamento, desligamento, remuneração e processos trabalhistas precisam estar coerentes. Empresas que deixam ajustes para depois podem enfrentar guias incorretas, encargos, retrabalho e dificuldade de comprovar regularidade.',
    checklist: 'Checklist de ação: confira eventos do eSocial antes do fechamento; valide remunerações e afastamentos; revise dados cadastrais de empregados; gere guias pelo ambiente correto; confira encargos de pagamentos em atraso; mantenha comunicação entre empresa, contabilidade e setor de RH; salve comprovantes e relatórios.',
    alert: 'Atenção: sistemas digitais dependem de informação correta na origem. O erro muitas vezes não está na guia, mas no evento enviado anteriormente.',
    sourceItems: [
      { label: 'Ministério do Trabalho e Emprego - FGTS Digital', url: sources.fgtsDigital },
      { label: 'eSocial - FGTS Digital e valores vencidos', url: sources.esocial },
    ],
  }),
  article({
    title: 'Opção pelo Simples Nacional em setembro: novo calendário para 2027',
    slug: 'opcao-pelo-simples-nacional-em-setembro-novo-calendario-para-2027',
    excerpt: 'Para 2027, a opção pelo Simples Nacional deverá ser formalizada entre 1º e 30 de setembro de 2026.',
    image: 'opcao-simples-setembro-2026',
    categoryId: categories.empresas,
    metaDescription: 'Entenda o novo calendário de opção pelo Simples Nacional em setembro de 2026 para efeitos em 2027.',
    context: 'O Comitê Gestor do Simples Nacional definiu que a opção pelo Simples Nacional para o ano-calendário de 2027 deverá ocorrer entre 1º e 30 de setembro de 2026. A mudança busca alinhar o regime simplificado à transição da Reforma Tributária e ao novo modelo de IBS e CBS. Para empresas, isso antecipa uma decisão que antes era lembrada apenas em janeiro.',
    impacts: 'O novo calendário exige planejamento. Empresas com débitos, pendências cadastrais ou dúvidas sobre regime tributário precisarão se organizar antes de setembro. Quem perder o prazo pode ficar sem o regime desejado no ano seguinte. Além disso, empresas que avaliam o regime regular de IBS e CBS terão de comparar cenários com antecedência, considerando faturamento, clientes, créditos e obrigações acessórias.',
    checklist: 'Checklist de ação: levante débitos federais, estaduais e municipais; regularize pendências antes de setembro; simule Simples Nacional e alternativas; avalie efeitos de crédito de IBS e CBS; acompanhe termos de indeferimento; registre o prazo de 1º a 30 de setembro de 2026; decida com base em números.',
    alert: 'Atenção: o prazo é estratégico. Não espere setembro para descobrir pendências. Regularização fiscal costuma exigir tempo, documentos e acompanhamento.',
    sourceItems: [
      { label: 'Receita Federal - Prazos de opção pelo Simples para 2027', url: sources.receitaSimples2027 },
      { label: 'Ministério da Fazenda - Simples Nacional e regime regular IBS/CBS', url: sources.fazendaSimples2027 },
    ],
  }),
);

const json = async (response) => {
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false) {
    throw new Error(JSON.stringify(body || { status: response.status }));
  }
  return body;
};

const login = await json(await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD }),
}));

const token = login.data.token;
const existingPayload = await json(await fetch(`${API}/admin/articles`, {
  headers: { Authorization: `Bearer ${token}` },
}));
const existingBySlug = new Map(existingPayload.data.map((item) => [item.slug, item]));

const results = [];
for (const post of articles) {
  const existing = existingBySlug.get(post.slug);
  const response = await json(await fetch(`${API}/admin/articles${existing ? `/${existing.id}` : ''}`, {
    method: existing ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(post),
  }));
  results.push({
    slug: post.slug,
    action: existing ? 'updated' : 'created',
    id: response.data?.id || existing?.id,
  });
}

console.log(JSON.stringify({ total: results.length, results }, null, 2));
