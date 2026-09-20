/**
 * Cloudflare Pages Function — enquiry handler.
 *
 * Receives the site's forms, validates them and forwards the contents by
 * email. Nothing is stored.
 *
 * Required environment variables (Cloudflare dashboard → Settings →
 * Environment variables). Until they are set the endpoint replies with a
 * clear message telling the sender to write in directly, so the site never
 * silently swallows an enquiry.
 *
 *   RESEND_API_KEY   API key for resend.com
 *   ENQUIRY_TO       Address enquiries are delivered to
 *   ENQUIRY_FROM     Verified sender, e.g. "site@featherstonevaults.com"
 */

interface Env {
  RESEND_API_KEY?: string;
  ENQUIRY_TO?: string;
  ENQUIRY_FROM?: string;
}

const FORM_TITLES: Record<string, string> = {
  'general-enquiry': 'General enquiry',
  'private-acquisition': 'Private acquisition brief',
  'sell-an-object': 'Object submitted for consideration',
  'private-access': 'Private Access request',
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  firstName: 'First name',
  surname: 'Surname',
  email: 'Email',
  object: 'Object',
  objectType: 'Object type',
  interest: 'Area of interest',
  interests: 'Collector interests',
  budget: 'Approximate budget',
  range: 'Acquisition range',
  value: 'Approximate value',
  description: 'Description',
  provenance: 'Known provenance',
  photographs: 'Photographs',
  notes: 'Notes',
  message: 'Message',
};

const json = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, 'That enquiry could not be read. Please try again.');
  }

  /* Honeypot — a real person never fills this in. */
  if ((form.get('_confirm') as string | null)?.trim()) {
    return json(200, 'Thank you. Your enquiry has been received.');
  }

  const formName = String(form.get('form') ?? 'general-enquiry');
  const email = String(form.get('email') ?? '').trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) {
    return json(400, 'Please give an email address we can reply to.');
  }

  /* Collect the submitted fields, keeping multi-value inputs together. */
  const entries: Array<[string, string]> = [];
  for (const key of new Set(form.keys())) {
    if (key === 'form' || key === '_confirm') continue;
    const values = form
      .getAll(key)
      .map((v) => String(v).trim())
      .filter(Boolean);
    if (!values.length) continue;
    if (values.join(', ').length > 5000) {
      return json(400, 'That enquiry is longer than this form accepts. Please email us directly.');
    }
    entries.push([FIELD_LABELS[key] ?? key, values.join(', ')]);
  }

  if (!entries.length) {
    return json(400, 'The form was empty.');
  }

  const title = FORM_TITLES[formName] ?? 'Website enquiry';
  const text = [title, '', ...entries.map(([k, v]) => `${k}\n${v}\n`)].join('\n');
  const html = `<h2 style="font-family:Georgia,serif">${escapeHtml(title)}</h2>${entries
    .map(
      ([k, v]) =>
        `<p style="font-family:Helvetica,Arial,sans-serif;margin:0 0 1em"><strong style="display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#777">${escapeHtml(
          k,
        )}</strong>${escapeHtml(v).replace(/\n/g, '<br>')}</p>`,
    )
    .join('')}`;

  if (!env.RESEND_API_KEY || !env.ENQUIRY_TO || !env.ENQUIRY_FROM) {
    return json(
      503,
      'Enquiries by form are not yet connected. Please write to enquiries@featherstonevaults.com and we will reply directly.',
    );
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ENQUIRY_FROM,
      to: [env.ENQUIRY_TO],
      reply_to: email,
      subject: `${title}, featherstonevaults.com`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    return json(
      502,
      'That enquiry could not be sent. Please write to enquiries@featherstonevaults.com and we will reply directly.',
    );
  }

  return json(
    200,
    'Thank you. Your enquiry has been received and will be answered personally.',
  );
};

/** Anything other than POST gets a clear answer rather than a 404. */
export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json(405, 'This endpoint accepts enquiry submissions only.');
};
