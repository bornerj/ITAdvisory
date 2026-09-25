// Vercel Serverless Function — envia o formulário de contato via Brevo (transactional email API).
// Variáveis de ambiente necessárias (configurar no painel da Vercel):
//   BREVO_API_KEY      - chave de API da conta Brevo
//   BREVO_SENDER_EMAIL  - remetente verificado na conta Brevo
//   BREVO_SENDER_NAME   - nome exibido como remetente (opcional)
//   CONTACT_TO_EMAIL    - caixa postal que recebe as solicitações (opcional, tem padrão abaixo)

const DEFAULT_TO_EMAIL = 'jeiel.borner+advisory@gmail.com';

const REQUIRED_FIELDS = [
  'nome',
  'empresa',
  'cargo',
  'email',
  'telefone',
  'segmento',
  'preocupacao',
  'erp',
  'operacao-distribuida',
  'ia-interna',
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function buildEmailHtml(data) {
  const rows = [
    ['Nome', data.nome],
    ['Empresa', data.empresa],
    ['Cargo', data.cargo],
    ['E-mail', data.email],
    ['Telefone / WhatsApp', data.telefone],
    ['Segmento', data.segmento],
    ['Principal preocupação', data.preocupacao],
    ['Usa ERP', data.erp],
    ['Operação distribuída', data['operacao-distribuida']],
    ['IA interna', data['ia-interna']],
  ]
    .map(([label, value]) => `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`)
    .join('');

  const mensagem = escapeHtml(data.mensagem || '—').replace(/\n/g, '<br>');

  return `
    <h2>Nova solicitação de conversa executiva</h2>
    ${rows}
    <p><strong>Mensagem:</strong><br>${mensagem}</p>
  `;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    console.error('Brevo não configurado: defina BREVO_API_KEY e BREVO_SENDER_EMAIL.');
    return res.status(500).json({ error: 'Serviço de e-mail não configurado.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  const missing = REQUIRED_FIELDS.filter((field) => !String(body[field] || '').trim());
  if (missing.length) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  if (!EMAIL_PATTERN.test(String(body.email).trim())) {
    return res.status(400).json({ error: 'Informe um e-mail válido.' });
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'Site Jeiel IT Advisory',
          email: senderEmail,
        },
        to: [{ email: process.env.CONTACT_TO_EMAIL || DEFAULT_TO_EMAIL }],
        replyTo: { email: body.email, name: body.nome },
        subject: `Nova conversa executiva — ${body.empresa}`,
        htmlContent: buildEmailHtml(body),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Falha ao enviar via Brevo:', response.status, errText);
      return res.status(502).json({ error: 'Não foi possível enviar sua solicitação agora. Tente novamente em instantes.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro ao chamar a API do Brevo:', error);
    return res.status(500).json({ error: 'Erro inesperado ao enviar sua solicitação.' });
  }
};
