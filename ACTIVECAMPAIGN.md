# Conectar los formularios a ActiveCampaign

Los formularios "Obtener Información" y las 4 solicitudes de información de
postgrado ya envían sus datos a Google Sheets (ver `GOOGLE-APPS-SCRIPT.md`).
Además, envían los mismos datos a una función serverless (`api/lead.js`) que
los sincroniza con ActiveCampaign — sin exponer ninguna clave en el navegador.

## Qué hace `api/lead.js`

Por cada envío:
1. Crea o actualiza el **Contacto** en ActiveCampaign (nombre, correo, teléfono).
2. Lo agrega a la lista **"IIO"**.
3. Guarda el programa de interés en el campo **`career`**, y el mensaje (si
   escribió algo) en **"Mensaje o descripción breve"**.
4. Crea un **Trato** en el pipeline **"IIO 2026"**, en la etapa
   **"Interesado - Cola de Asesor"** — así el equipo de admisiones lo ve en
   su cola de seguimiento.

Como con Google Sheets: si ActiveCampaign falla por cualquier razón, el
usuario **nunca** se queda sin su PDF ni sin confirmación — el envío a
ActiveCampaign ocurre en paralelo y nunca bloquea nada.

## Configuración (una sola vez, en Vercel)

En el proyecto de Vercel: **Settings → Environment Variables**, agrega:

| Nombre | Valor |
|---|---|
| `AC_API_URL` | La URL de API de tu cuenta, ej. `https://galileo96250.api-us1.com` |
| `AC_API_TOKEN` | Tu Api-Token de ActiveCampaign (Configuración → Desarrollador) |

Estas variables **nunca** deben pegarse en el código ni subirse a GitHub —
solo viven en la configuración de Vercel, y la función `api/lead.js` las lee
en tiempo de ejecución (`process.env.AC_API_URL`, `process.env.AC_API_TOKEN`).

Si alguna vez rotas el Api-Token en ActiveCampaign, solo actualiza el valor
de `AC_API_TOKEN` en Vercel — no hay que tocar ningún archivo.

## Notas

- Si las variables de entorno no están configuradas todavía, la función
  responde sin error pero no hace nada (`ac_not_configured`) — el sitio
  sigue funcionando normalmente, solo sin guardar en ActiveCampaign.
- La lista, los IDs de campo y el pipeline están escritos directamente en
  `api/lead.js` (no son secretos, son solo identificadores internos de la
  cuenta). Si en algún momento cambian de nombre o de ID en ActiveCampaign,
  hay que actualizar esas constantes al inicio del archivo.
