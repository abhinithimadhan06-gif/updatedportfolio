const RECIPIENT = 'abhinithimadhan06@gmail.com';
const SERVICE_LABELS = {
  'fashion-styling': 'Fashion Styling & Wardrobe',
  'campaign-commercial': 'Campaign & Commercial',
  'red-carpet-vip': 'Celebrity Red Carpet / VIP'
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[character]);

const cleanField = (value) => typeof value === 'string' ? value.trim() : '';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { success: false, error: 'Use POST to submit this form.' });
  }

  let form;
  try {
    form = JSON.parse(event.body || '{}');
  } catch (error) {
    return jsonResponse(400, { success: false, error: 'The submitted form data is invalid.' });
  }

  if (!form || typeof form !== 'object' || Array.isArray(form)) {
    return jsonResponse(400, { success: false, error: 'The submitted form data is invalid.' });
  }

  if (cleanField(form['bot-field'])) {
    return jsonResponse(400, { success: false, error: 'The form submission could not be verified.' });
  }

  const name = cleanField(form.name);
  const email = cleanField(form.email);
  const phone = cleanField(form.phone);
  const serviceKey = cleanField(form.service);
  const service = Object.prototype.hasOwnProperty.call(SERVICE_LABELS, serviceKey) ? SERVICE_LABELS[serviceKey] : '';
  const message = cleanField(form.message);
  const phoneDigits = phone.replace(/\D/g, '');

  if (
    !name || name.length > 120 || /[\r\n]/.test(name) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
    !/^[+\d().\-\s]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15 ||
    !service ||
    message.length < 8 || message.length > 5000
  ) {
    return jsonResponse(400, { success: false, error: 'Please check the form details and try again.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    console.error('Contact email configuration is missing RESEND_API_KEY or RESEND_FROM_EMAIL.');
    return jsonResponse(503, { success: false, error: 'Email delivery is not configured yet.' });
  }

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeService = escapeHtml(service);
  const safeMessage = escapeHtml(message).replace(/\r?\n/g, '<br>');
  const text = [
    'New website contact enquiry',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Service: ${service}`,
    '',
    'Project brief:',
    message
  ].join('\n');
  const html = [
    '<h2>New website contact enquiry</h2>',
    '<table style="border-collapse:collapse">',
    `<tr><th align="left" style="padding:6px 12px 6px 0">Name</th><td>${safeName}</td></tr>`,
    `<tr><th align="left" style="padding:6px 12px 6px 0">Email</th><td>${safeEmail}</td></tr>`,
    `<tr><th align="left" style="padding:6px 12px 6px 0">Phone</th><td>${safePhone}</td></tr>`,
    `<tr><th align="left" style="padding:6px 12px 6px 0">Service</th><td>${safeService}</td></tr>`,
    '</table>',
    '<h3>Project brief</h3>',
    `<p>${safeMessage}</p>`
  ].join('');

  let providerResponse;
  try {
    providerResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to: [RECIPIENT],
        reply_to: email,
        subject: `Website enquiry from ${name}`,
        text,
        html
      })
    });
  } catch (error) {
    console.error('The email provider could not be reached.', error);
    return jsonResponse(502, { success: false, error: 'Email delivery failed. Please try again.' });
  }

  if (!providerResponse.ok) {
    const providerError = await providerResponse.text();
    console.error(`The email provider returned ${providerResponse.status}: ${providerError}`);
    return jsonResponse(502, { success: false, error: 'Email delivery failed. Please try again.' });
  }

  return jsonResponse(200, { success: true });
};
