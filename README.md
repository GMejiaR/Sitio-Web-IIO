# Sitio Web IIO

Sitio web del **Instituto de Investigación de Operaciones (IIO)**, Universidad Galileo. Export estático de WordPress, rediseñado y ampliado.

## Qué incluye

- **Modo claro / oscuro** con persistencia, en todo el sitio.
- **Buscador interno** (sin depender de ningún servidor externo).
- **Páginas de programas académicos** (4 maestrías + 4 postgrados) con diseño animado, plan de estudios interactivo, y formularios de solicitud de información.
- **"Obtener Información"**: selector de programa + descarga de folleto en PDF.
- **Blog**: artículos internos completos y vistas previas de noticias externas, con filtros y buscador propio.
- **Equipo docente**: fichas con biografía desplegable por catedrático.
- Sitio **100% autónomo**: todo el CSS, JavaScript, tipografías e imágenes están localizados en `assets/vendor/` (no depende de ningún servidor externo, salvo Google Analytics).

## Formularios y backend

Los formularios ("Obtener Información" y solicitud de información por postgrado) envían los datos a una Hoja de Google mediante un **Google Apps Script** — ver [`GOOGLE-APPS-SCRIPT.md`](./GOOGLE-APPS-SCRIPT.md) para el detalle de configuración. La URL del endpoint vive en [`assets/config.js`](./assets/config.js), el único lugar que hay que editar si el script cambia.

## Estructura

Cada página vive en su propia carpeta con un `index.html` (para que las rutas sean limpias, ej. `/acerca-de/`). Los recursos compartidos están en `assets/`:

```
assets/
  config.js       ← endpoint del formulario (único lugar a editar)
  vendor/         ← CSS, JS, fuentes e imágenes localizadas
  pdf/            ← folletos de las 4 maestrías
  favicon/        ← ícono del sitio
```

## Correr en local

```bash
python3 -m http.server 8080
```

Y abrir `http://localhost:8080`.

## Despliegue

Sitio 100% estático — no requiere build ni configuración especial para desplegarse en Vercel, Netlify, GitHub Pages o cualquier hosting estático.
