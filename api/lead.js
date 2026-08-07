// Función serverless (Vercel) que recibe los envíos de los formularios del sitio
// (Obtener Información + solicitud de información de cada postgrado) y los
// sincroniza con ActiveCampaign: crea/actualiza el contacto, lo agrega a la
// lista IIO, guarda el programa de interés y el mensaje, y crea un Trato en
// el pipeline "IIO 2026" en la etapa "Interesado - Cola de Asesor".
//
// Variables de entorno requeridas (configurar en Vercel → Settings →
// Environment Variables, NUNCA en el código):
//   AC_API_URL    -> ej. https://galileo96250.api-us1.com
//   AC_API_TOKEN  -> el Api-Token de ActiveCampaign
//
// Constantes de la cuenta de ActiveCampaign (no son secretas, son solo IDs):
const AC_LIST_ID = '198';        // Lista "IIO"
const AC_FIELD_CAREER = '36';    // Campo "career"
const AC_FIELD_MESSAGE = '129';  // Campo "Mensaje o descripción breve"
const AC_PIPELINE_ID = '221';    // Pipeline "IIO 2026"
const AC_STAGE_ID = '2024';      // Etapa "Interesado - Cola de Asesor"

function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/);
  const firstName = parts.shift() || '';
  const lastName = parts.join(' ');
  return { firstName, lastName };
}

async function acRequest(baseUrl, token, method, path, body) {
  const res = await fetch(baseUrl + '/api/3' + path, {
    method,
    headers: {
      'Api-Token': token,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method_not_allowed' }); return; }

  const AC_API_URL = process.env.AC_API_URL;
  const AC_API_TOKEN = process.env.AC_API_TOKEN;
  if (!AC_API_URL || !AC_API_TOKEN) {
    // Config incompleta: no bloqueamos al usuario del sitio, solo reportamos.
    res.status(200).json({ ok: false, error: 'ac_not_configured' });
    return;
  }

  try {
    const body = req.body || {};
    const { nombre, email, telefono, grado, mensaje, programa } = body;

    if (!email) {
      res.status(400).json({ ok: false, error: 'email_required' });
      return;
    }

    const { firstName, lastName } = splitName(nombre);

    const fieldValues = [{ field: AC_FIELD_CAREER, value: programa || '' }];
    if (mensaje) fieldValues.push({ field: AC_FIELD_MESSAGE, value: mensaje });

    // 1) crear/actualizar contacto
    const sync = await acRequest(AC_API_URL, AC_API_TOKEN, 'POST', '/contact/sync', {
      contact: { email, firstName, lastName, phone: telefono || '', fieldValues },
    });
    if (!sync.ok) {
      res.status(200).json({ ok: false, error: 'contact_sync_failed', detail: sync.data });
      return;
    }
    const contactId = sync.data.contact && sync.data.contact.id;

    // 2) agregar a la lista IIO (no bloqueante si falla)
    await acRequest(AC_API_URL, AC_API_TOKEN, 'POST', '/contactLists', {
      contactList: { list: AC_LIST_ID, contact: contactId, status: '1' },
    });

    // 3) crear el trato en el pipeline "IIO 2026"
    const dealTitle = `${nombre || email} - ${programa || 'Programa IIO'}`.slice(0, 250);
    const deal = await acRequest(AC_API_URL, AC_API_TOKEN, 'POST', '/deals', {
      deal: { title: dealTitle, contact: contactId, group: AC_PIPELINE_ID, stage: AC_STAGE_ID, value: 0, currency: 'gtq' },
    });

    res.status(200).json({ ok: true, contactId, dealId: deal.data.deal && deal.data.deal.id });
  } catch (err) {
    res.status(200).json({ ok: false, error: 'unexpected', detail: String(err) });
  }
};
