# Conectar el formulario "Obtener Información" a Google Sheets

El formulario ya funciona y descarga el PDF sin configurar nada. Estos pasos son
para que además **guarde cada solicitud en una Hoja de Google** (tu base de datos)
y **te avise por correo** cada vez que alguien pida información.

Toma unos 10 minutos y es gratis.

---

## Paso 1 — Crear la Hoja de Google

1. Entra a <https://sheets.google.com> y crea una hoja nueva.
2. Ponle un nombre, por ejemplo: **IIO — Solicitudes de Información**.
3. Déjala vacía; el script crea los encabezados solo.

## Paso 2 — Pegar el script

1. En esa misma hoja, ve al menú **Extensiones → Apps Script**.
2. Borra todo el código que aparece y pega **exactamente** esto:

```javascript
// ==== CONFIGURACIÓN ====
// Correo(s) que reciben el aviso de cada nueva solicitud.
// Para varios, sepáralos con coma: 'uno@galileo.edu,dos@galileo.edu'
var AVISAR_A = 'iio@galileo.edu,gabriel.mejia@galileo.edu';

// Nombre de la pestaña donde se guardan los datos.
var HOJA = 'Solicitudes';


function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);
    guardar(datos);
    avisar(datos);
    return responder({ ok: true });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

function guardar(d) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA);

  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
    hoja.appendRow([
      'Fecha', 'Programa', 'Nombre', 'Correo', 'Teléfono',
      'Grado académico', 'Mensaje', 'Página de origen'
    ]);
    hoja.getRange('A1:H1')
        .setFontWeight('bold')
        .setBackground('#c49a00')
        .setFontColor('#ffffff');
    hoja.setFrozenRows(1);
  }

  hoja.appendRow([
    new Date(),
    d.programa || '',
    d.nombre || '',
    d.email || '',
    textoSeguro(d.telefono),
    d.grado || '',
    d.mensaje || '',
    d.origen || ''
  ]);
}

// Evita que Sheets interprete un teléfono como "+502 12345678" como el
// inicio de una fórmula (por el símbolo +) y muestre "#ERROR!".
function textoSeguro(v) {
  return v ? "'" + v : '';
}

function avisar(d) {
  if (!AVISAR_A) return;
  MailApp.sendEmail({
    to: AVISAR_A,
    subject: 'Nueva solicitud de información — ' + (d.programa || 'IIO'),
    htmlBody:
      '<h2 style="font-family:Arial;color:#1c1400">Nueva solicitud de información</h2>' +
      '<table style="font-family:Arial;font-size:14px;border-collapse:collapse">' +
      fila('Programa',  d.programa) +
      fila('Nombre',    d.nombre) +
      fila('Correo',    d.email) +
      fila('Teléfono',  d.telefono) +
      fila('Grado',     d.grado) +
      fila('Mensaje',   d.mensaje) +
      '</table>' +
      '<p style="font-family:Arial;font-size:12px;color:#888">' +
      'Enviado desde el formulario "Obtener Información" del sitio del IIO.</p>'
  });
}

function fila(etiqueta, valor) {
  if (!valor) return '';
  return '<tr>' +
    '<td style="padding:6px 14px 6px 0;color:#888">' + etiqueta + '</td>' +
    '<td style="padding:6px 0;font-weight:bold">' + valor + '</td>' +
    '</tr>';
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Cambia la línea de `AVISAR_A` por el correo (o correos) que deban recibir el aviso.
4. Guarda con el ícono del disquete.

## Paso 3 — Publicar el script

1. Arriba a la derecha, haz clic en **Implementar → Nueva implementación**.
2. En el ícono del engranaje (junto a "Seleccionar tipo"), elige **Aplicación web**.
3. Configura así:
   - **Descripción:** `Formulario IIO`
   - **Ejecutar como:** `Yo` (tu cuenta)
   - **Quién tiene acceso:** **`Cualquier usuario`** ← *importante*
4. Haz clic en **Implementar**.
5. Google te pedirá permisos: acepta (**Revisar permisos → tu cuenta → Configuración avanzada → Ir a … (no seguro) → Permitir**).
   Ese aviso es normal: es tu propio script, no está publicado en la tienda de Google.
6. Copia la **URL de la aplicación web**. Se ve así:
   ```
   https://script.google.com/macros/s/AKfycb.....largo...../exec
   ```

## Paso 4 — Pegar la URL en el sitio

Abre el archivo **`assets/config.js`** (es el único lugar que debes editar) y pega
tu URL entre las comillas:

```javascript
window.IIO_LEAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycb...../exec';
```

Con eso quedan conectados **todos** los formularios del sitio a la vez:
"Obtener Información" y las solicitudes de información de cada Postgrado.

Guarda. **Listo.**

---

## Cómo probar

1. Abre `/obtener-informacion/` en el sitio.
2. Elige un programa, llena el formulario y envía.
3. Debe pasar todo esto:
   - Se descarga el PDF del programa.
   - Aparece una fila nueva en tu Hoja de Google.
   - Te llega el correo de aviso.

## Notas

- **Si el script falla o la hoja no responde, el usuario igual recibe su PDF.**
  El formulario está hecho para nunca dejar al visitante sin su folleto.
- Los datos quedan en tu Hoja de Google: puedes filtrarlos, exportarlos a Excel
  o conectarlos a otras herramientas cuando quieras.
- Si algún día cambias el script, tienes que volver a **Implementar → Gestionar
  implementaciones → editar → Nueva versión**, o la URL seguirá sirviendo el
  código viejo.
