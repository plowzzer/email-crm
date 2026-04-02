import "dotenv/config";
import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean up
  await prisma.template.deleteMany();
  await prisma.team.deleteMany();
  await prisma.counter.deleteMany();

  // Create teams
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        key: "auto_pf",
        label: "Auto PF",
        pipelines: [
          {
            key: "financiamento_auto",
            label: "Financiamento de Auto",
            stages: [],
          },
          {
            key: "seguro_auto",
            label: "Seguro Auto",
            stages: [],
          },
        ],
      },
    }),
    prisma.team.create({
      data: {
        key: "auto_pj",
        label: "Auto PJ",
        pipelines: [
          { key: "leasing_pj", label: "Leasing PJ", stages: [] },
          {
            key: "frota_empresarial",
            label: "Frota Empresarial",
            stages: [],
          },
        ],
      },
    }),
    prisma.team.create({
      data: {
        key: "home_equity",
        label: "Home Equity",
        pipelines: [
          {
            key: "credito_imovel",
            label: "Crédito com Garantia de Imóvel",
            stages: [],
          },
          {
            key: "refinanciamento",
            label: "Refinanciamento",
            stages: [],
          },
        ],
      },
    }),
    prisma.team.create({
      data: {
        key: "core_banking",
        label: "Core Banking",
        pipelines: [
          {
            key: "conta_digital",
            label: "Conta Digital",
            stages: [
              { key: "negocios", label: "Negócios", color: "#3b82f6" },
              { key: "templateid", label: "TemplateID", color: "#f59e0b" },
              { key: "dev", label: "Desenvolvimento", color: "#10b981" },
              { key: "homol_int", label: "Homol. Interna", color: "#f97316" },
              { key: "producao", label: "Produção", color: "#16a34a" },
            ],
          },
          {
            key: "cartao_credito",
            label: "Cartão de Crédito",
            stages: [],
          },
          {
            key: "pix_ted",
            label: "PIX e TED",
            stages: [
              { key: "negocios", label: "Negócios", color: "#3b82f6" },
              { key: "templateid", label: "TemplateID", color: "#f59e0b" },
              { key: "dev", label: "Desenvolvimento", color: "#10b981" },
              { key: "producao", label: "Produção", color: "#16a34a" },
            ],
          },
        ],
      },
    }),
  ]);

  // Set counter
  await prisma.counter.create({
    data: { name: "template_internal_id", value: 16 },
  });

  // Seed templates
  const now = new Date();
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  const templates = [
    // --- Auto PF: Financiamento de Auto ---
    {
      internalId: "COM-0001",
      templateId: "EXT-FA001",
      name: "Boas-vindas Financiamento",
      channels: [
        { type: "Email", content: { subject: "Bem-vindo ao Financiamento!", body: "<h1>Olá!</h1><p>Seu financiamento foi aprovado.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "SMS", content: { text: "Seu financiamento foi aprovado! Acesse o app para mais detalhes." } },
        { type: "Push", content: { title: "Financiamento Aprovado", body: "Confira os detalhes do seu financiamento", deepLink: "app://financiamento" } },
      ],
      stage: "dev",
      status: "inProgress",
      owner: "Ana Silva",
      days: 3,
      pipelines: ["financiamento_auto"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 15 * 86400000)), by: "Carlos M.", note: "Template criado", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 12 * 86400000)), by: "Carlos M.", note: "Aprovado pelo negócio", files: [] },
        { from: "design", to: "templateid", date: fmt(new Date(now.getTime() - 8 * 86400000)), by: "Julia R.", note: "Design aprovado", files: ["design_v2.pdf"] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 3 * 86400000)), by: "Pedro L.", note: "ID externo atribuído", files: [] },
      ],
    },
    {
      internalId: "COM-0002",
      templateId: null,
      name: "Parcela Vencendo",
      channels: [
        { type: "Email", content: { subject: "Sua parcela vence amanhã", body: "<p>Lembrete: sua parcela vence amanhã.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "SMS", content: { text: "Lembrete: sua parcela vence amanhã. Evite juros!" } },
      ],
      stage: "negocios",
      status: "inProgress",
      owner: "Carlos M.",
      days: 2,
      pipelines: ["financiamento_auto"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 2 * 86400000)), by: "Carlos M.", note: "Novo template solicitado", files: [] },
      ],
    },
    {
      internalId: "COM-0003",
      templateId: "EXT-FA003",
      name: "Contrato Assinado",
      channels: [
        { type: "Email", content: { subject: "Contrato assinado com sucesso", body: "<p>Seu contrato foi assinado digitalmente.</p>", sender: "noreply@c6bank.com.br" } },
      ],
      stage: "homol_integ",
      status: "inProgress",
      owner: "Julia R.",
      days: 1,
      pipelines: ["financiamento_auto"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 20 * 86400000)), by: "Carlos M.", note: "Template criado", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 17 * 86400000)), by: "Carlos M.", note: "Aprovado", files: [] },
        { from: "design", to: "templateid", date: fmt(new Date(now.getTime() - 14 * 86400000)), by: "Julia R.", note: "Design OK", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 10 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
        { from: "dev", to: "homol_int", date: fmt(new Date(now.getTime() - 5 * 86400000)), by: "Ana Silva", note: "Desenvolvimento concluído", files: [] },
        { from: "homol_int", to: "homol_integ", date: fmt(new Date(now.getTime() - 1 * 86400000)), by: "Julia R.", note: "Homologação interna OK", files: ["test_report.pdf"] },
      ],
    },
    {
      internalId: "COM-0004",
      templateId: "EXT-FA004",
      name: "Quitação de Financiamento",
      channels: [
        { type: "Email", content: { subject: "Parabéns! Financiamento quitado", body: "<h1>Parabéns!</h1><p>Seu financiamento foi quitado.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "Push", content: { title: "Financiamento Quitado!", body: "Parabéns pela quitação", deepLink: "app://financiamento/quitacao" } },
      ],
      stage: "producao",
      status: "production",
      owner: "Ana Silva",
      date: fmt(new Date(now.getTime() - 30 * 86400000)),
      days: 0,
      pipelines: ["financiamento_auto"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 60 * 86400000)), by: "Carlos M.", note: "Template criado", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 55 * 86400000)), by: "Carlos M.", note: "Aprovado", files: [] },
        { from: "design", to: "templateid", date: fmt(new Date(now.getTime() - 50 * 86400000)), by: "Julia R.", note: "Design OK", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 45 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
        { from: "dev", to: "homol_int", date: fmt(new Date(now.getTime() - 40 * 86400000)), by: "Ana Silva", note: "Dev concluído", files: [] },
        { from: "homol_int", to: "homol_integ", date: fmt(new Date(now.getTime() - 35 * 86400000)), by: "Julia R.", note: "Homol. interna OK", files: [] },
        { from: "homol_integ", to: "producao", date: fmt(new Date(now.getTime() - 30 * 86400000)), by: "Pedro L.", note: "Aprovado para produção", files: ["final_approval.pdf"] },
      ],
    },
    // --- Auto PF: Seguro Auto ---
    {
      internalId: "COM-0005",
      templateId: null,
      name: "Cotação de Seguro",
      channels: [
        { type: "Email", content: { subject: "Sua cotação de seguro está pronta", body: "<p>Confira sua cotação de seguro auto.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "WhatsApp", content: { text: "Sua cotação de seguro auto está pronta! Acesse: app://seguro/cotacao", whatsappTemplateId: "seguro_cotacao_001" } },
      ],
      stage: "design",
      status: "inProgress",
      owner: "Julia R.",
      days: 4,
      pipelines: ["seguro_auto"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 8 * 86400000)), by: "Carlos M.", note: "Novo template", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 4 * 86400000)), by: "Carlos M.", note: "Aprovado", files: [] },
      ],
    },
    // --- Auto PJ: Leasing PJ ---
    {
      internalId: "COM-0006",
      templateId: "EXT-LP006",
      name: "Proposta de Leasing",
      channels: [
        { type: "Email", content: { subject: "Sua proposta de leasing", body: "<p>Segue sua proposta de leasing PJ.</p>", sender: "noreply@c6bank.com.br" } },
      ],
      stage: "homol_int",
      status: "inProgress",
      owner: "Marcos V.",
      days: 2,
      pipelines: ["leasing_pj"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 18 * 86400000)), by: "Marcos V.", note: "Template criado", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 14 * 86400000)), by: "Marcos V.", note: "Aprovado", files: [] },
        { from: "design", to: "templateid", date: fmt(new Date(now.getTime() - 10 * 86400000)), by: "Julia R.", note: "Design OK", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 7 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
        { from: "dev", to: "homol_int", date: fmt(new Date(now.getTime() - 2 * 86400000)), by: "Ana Silva", note: "Dev concluído", files: [] },
      ],
    },
    {
      internalId: "COM-0007",
      templateId: "EXT-LP007",
      name: "Confirmação de Leasing",
      channels: [
        { type: "Email", content: { subject: "Leasing confirmado", body: "<p>Seu leasing foi confirmado.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "SMS", content: { text: "Leasing PJ confirmado! Confira os detalhes no app." } },
      ],
      stage: "producao",
      status: "production",
      owner: "Marcos V.",
      date: fmt(new Date(now.getTime() - 25 * 86400000)),
      days: 0,
      pipelines: ["leasing_pj"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 50 * 86400000)), by: "Marcos V.", note: "Template criado", files: [] },
        { from: "negocios", to: "producao", date: fmt(new Date(now.getTime() - 25 * 86400000)), by: "Marcos V.", note: "Fast-track para produção", files: [] },
      ],
    },
    // --- Home Equity ---
    {
      internalId: "COM-0008",
      templateId: null,
      name: "Análise de Crédito Imobiliário",
      channels: [
        { type: "Email", content: { subject: "Análise de crédito em andamento", body: "<p>Sua análise de crédito com garantia de imóvel está em andamento.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "Push", content: { title: "Análise em andamento", body: "Acompanhe sua análise de crédito", deepLink: "app://home-equity/analise" } },
      ],
      stage: "templateid",
      status: "inProgress",
      owner: "Fernanda C.",
      days: 5,
      pipelines: ["credito_imovel"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 12 * 86400000)), by: "Fernanda C.", note: "Template criado", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 9 * 86400000)), by: "Fernanda C.", note: "Aprovado", files: [] },
        { from: "design", to: "templateid", date: fmt(new Date(now.getTime() - 5 * 86400000)), by: "Julia R.", note: "Design finalizado", files: ["design_home.pdf"] },
      ],
    },
    {
      internalId: "COM-0009",
      templateId: "EXT-HE009",
      name: "Aprovação de Refinanciamento",
      channels: [
        { type: "Email", content: { subject: "Refinanciamento aprovado!", body: "<h1>Parabéns!</h1><p>Seu refinanciamento foi aprovado.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "SMS", content: { text: "Refinanciamento aprovado! Acesse o app para assinar o contrato." } },
        { type: "WhatsApp", content: { text: "Olá! Seu refinanciamento foi aprovado. Acesse o app para os próximos passos.", whatsappTemplateId: "refi_approved_001" } },
      ],
      stage: "producao",
      status: "production",
      owner: "Fernanda C.",
      date: fmt(new Date(now.getTime() - 15 * 86400000)),
      days: 0,
      pipelines: ["refinanciamento"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 40 * 86400000)), by: "Fernanda C.", note: "Template criado", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 35 * 86400000)), by: "Fernanda C.", note: "Aprovado", files: [] },
        { from: "design", to: "templateid", date: fmt(new Date(now.getTime() - 30 * 86400000)), by: "Julia R.", note: "Design OK", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 25 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
        { from: "dev", to: "homol_int", date: fmt(new Date(now.getTime() - 22 * 86400000)), by: "Ana Silva", note: "Dev concluído", files: [] },
        { from: "homol_int", to: "homol_integ", date: fmt(new Date(now.getTime() - 18 * 86400000)), by: "Julia R.", note: "Homol. interna OK", files: [] },
        { from: "homol_integ", to: "producao", date: fmt(new Date(now.getTime() - 15 * 86400000)), by: "Pedro L.", note: "Produção aprovada", files: [] },
      ],
    },
    // --- Core Banking: Conta Digital ---
    {
      internalId: "COM-0010",
      templateId: "EXT-CD010",
      name: "Boas-vindas Conta Digital",
      channels: [
        { type: "Email", content: { subject: "Bem-vindo à sua Conta Digital!", body: "<h1>Olá!</h1><p>Sua conta digital está ativa.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "SMS", content: { text: "Conta Digital ativa! Baixe o app e comece a usar." } },
        { type: "Push", content: { title: "Conta Ativa!", body: "Sua conta digital está pronta", deepLink: "app://conta" } },
        { type: "WhatsApp", content: { text: "Olá! Sua Conta Digital está ativa. Acesse o app para começar.", whatsappTemplateId: "conta_welcome_001" } },
      ],
      stage: "dev",
      status: "inProgress",
      owner: "Ricardo S.",
      days: 2,
      pipelines: ["conta_digital"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 10 * 86400000)), by: "Ricardo S.", note: "Template criado", files: [] },
        { from: "negocios", to: "templateid", date: fmt(new Date(now.getTime() - 7 * 86400000)), by: "Ricardo S.", note: "Aprovado", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 2 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
      ],
    },
    {
      internalId: "COM-0011",
      templateId: "EXT-CD011",
      name: "Extrato Mensal",
      channels: [
        { type: "Email", content: { subject: "Seu extrato mensal", body: "<p>Confira seu extrato mensal da Conta Digital.</p>", sender: "noreply@c6bank.com.br" } },
      ],
      stage: "producao",
      status: "production",
      owner: "Ricardo S.",
      date: fmt(new Date(now.getTime() - 45 * 86400000)),
      days: 0,
      pipelines: ["conta_digital"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 60 * 86400000)), by: "Ricardo S.", note: "Template criado", files: [] },
        { from: "negocios", to: "templateid", date: fmt(new Date(now.getTime() - 55 * 86400000)), by: "Ricardo S.", note: "Aprovado", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 52 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
        { from: "dev", to: "homol_int", date: fmt(new Date(now.getTime() - 49 * 86400000)), by: "Ana Silva", note: "Dev concluído", files: [] },
        { from: "homol_int", to: "producao", date: fmt(new Date(now.getTime() - 45 * 86400000)), by: "Julia R.", note: "Aprovado para produção", files: [] },
      ],
    },
    // --- Core Banking: Cartão de Crédito ---
    {
      internalId: "COM-0012",
      templateId: null,
      name: "Fatura Disponível",
      channels: [
        { type: "Email", content: { subject: "Sua fatura está disponível", body: "<p>A fatura do seu cartão de crédito está disponível.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "Push", content: { title: "Fatura Disponível", body: "Confira sua fatura do cartão", deepLink: "app://cartao/fatura" } },
      ],
      stage: "negocios",
      status: "inProgress",
      owner: "Ricardo S.",
      days: 1,
      pipelines: ["cartao_credito"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 1 * 86400000)), by: "Ricardo S.", note: "Novo template", files: [] },
      ],
    },
    {
      internalId: "COM-0013",
      templateId: "EXT-CC013",
      name: "Limite Aprovado",
      channels: [
        { type: "SMS", content: { text: "Seu novo limite de crédito foi aprovado! Confira no app." } },
        { type: "Push", content: { title: "Limite Aprovado!", body: "Seu novo limite está disponível", deepLink: "app://cartao/limite" } },
      ],
      stage: "producao",
      status: "production",
      owner: "Ricardo S.",
      date: fmt(new Date(now.getTime() - 20 * 86400000)),
      days: 0,
      pipelines: ["cartao_credito"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 50 * 86400000)), by: "Ricardo S.", note: "Template criado", files: [] },
        { from: "negocios", to: "producao", date: fmt(new Date(now.getTime() - 20 * 86400000)), by: "Ricardo S.", note: "Aprovado direto", files: [] },
      ],
    },
    // --- Core Banking: PIX e TED ---
    {
      internalId: "COM-0014",
      templateId: "EXT-PT014",
      name: "Confirmação PIX",
      channels: [
        { type: "Push", content: { title: "PIX Enviado", body: "Sua transferência PIX foi realizada", deepLink: "app://pix/comprovante" } },
        { type: "SMS", content: { text: "PIX de R$ {valor} enviado para {destinatario}." } },
      ],
      stage: "dev",
      status: "inProgress",
      owner: "Lucas T.",
      days: 3,
      pipelines: ["pix_ted"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 9 * 86400000)), by: "Lucas T.", note: "Template criado", files: [] },
        { from: "negocios", to: "templateid", date: fmt(new Date(now.getTime() - 6 * 86400000)), by: "Lucas T.", note: "Aprovado", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 3 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
      ],
    },
    {
      internalId: "COM-0015",
      templateId: "EXT-PT015",
      name: "Comprovante TED",
      channels: [
        { type: "Email", content: { subject: "Comprovante de TED", body: "<p>Segue o comprovante da sua transferência TED.</p>", sender: "noreply@c6bank.com.br" } },
      ],
      stage: "producao",
      status: "production",
      owner: "Lucas T.",
      date: fmt(new Date(now.getTime() - 10 * 86400000)),
      days: 0,
      pipelines: ["pix_ted"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 30 * 86400000)), by: "Lucas T.", note: "Template criado", files: [] },
        { from: "negocios", to: "templateid", date: fmt(new Date(now.getTime() - 25 * 86400000)), by: "Lucas T.", note: "Aprovado", files: [] },
        { from: "templateid", to: "dev", date: fmt(new Date(now.getTime() - 18 * 86400000)), by: "Pedro L.", note: "ID atribuído", files: [] },
        { from: "dev", to: "producao", date: fmt(new Date(now.getTime() - 10 * 86400000)), by: "Ana Silva", note: "Aprovado para produção", files: [] },
      ],
    },
    // --- Update example ---
    {
      internalId: "COM-0016",
      templateId: "EXT-FA004",
      name: "[Update] Quitação de Financiamento",
      channels: [
        { type: "Email", content: { subject: "Parabéns! Financiamento quitado - v2", body: "<h1>Parabéns!</h1><p>Seu financiamento foi quitado. Novo layout.</p>", sender: "noreply@c6bank.com.br" } },
        { type: "Push", content: { title: "Financiamento Quitado!", body: "Parabéns pela quitação - atualizado", deepLink: "app://financiamento/quitacao" } },
      ],
      stage: "design",
      status: "inProgress",
      owner: "Julia R.",
      days: 2,
      pipelines: ["financiamento_auto"],
      transitions: [
        { from: null, to: "negocios", date: fmt(new Date(now.getTime() - 5 * 86400000)), by: "Ana Silva", note: "Solicitação de update - novo layout", files: [] },
        { from: "negocios", to: "design", date: fmt(new Date(now.getTime() - 2 * 86400000)), by: "Carlos M.", note: "Aprovado para redesign", files: [] },
      ],
      isUpdate: true,
      parentTemplateId: "COM-0004",
    },
  ];

  for (const t of templates) {
    await prisma.template.create({ data: t });
  }

  console.log("Seed completed: 4 teams, 16 templates");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
