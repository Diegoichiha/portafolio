# Portafolio · Diego Torres (UX/UI + desarrollo web)

Rediseño de [diegotdesigner.com](https://diegotdesigner.com/) como sitio **estático** con scrollytelling y animación 3D.
Reemplaza al WordPress/Elementor actual (sin librerías de animación) por HTML/CSS/JS vanilla + GSAP + Lenis.

## La historia (Home)

Una tarjeta 3D con el retrato recorre toda la página (se mueve, gira y se "guarda" en la píldora de navegación):

1. **Hero** · nombre gigante, tarjeta con la cabeza saliendo del marco (profundidad real con `translateZ`), chips orbitando y tilt que sigue al cursor.
2. **¿Por qué elegirme?** · texto que se ilumina palabra por palabra + 3 principios (Guiar / Generar acción / Medir resultados) con ilustraciones que se dibujan.
3. **Proyectos destacados** · tarjetas apiladas con profundidad (la anterior se aleja e inclina al llegar la siguiente).
4. **Cómo trabajo** · escena 3D fija: cuatro capas (Descubrimiento → Diseño → Desarrollo → Lanzamiento) que se separan, se iluminan una a una y al final colapsan en el sitio publicado.
5. **Servicios** · acordeón tipográfico con barrido de color.
6. **Sobre mí** · la tarjeta vuelve y se voltea (cara B); las *skills* son un arco de logos (uno por herramienta, en `assets/img/skills/`) que recorren el arco de un lado a otro y se difuminan en los extremos, con tu marca al centro; y contadores.
7. **Contacto** · la tarjeta vuelve a la derecha, CTA magnético y marquee gigante.

Página interna: **/proyectos/** con los 17 proyectos, filtros animados (Figma / Sitios web / E-commerce) y tilt en cada tarjeta.

## Tecnología

- HTML/CSS/JS vanilla, sin framework. `GSAP 3.12 + ScrollTrigger + Lenis` vendorizados en `assets/vendor/`.
- Tipografías (Google Fonts): Figtree para todo (títulos en negrita 800, minúsculas y tracking cerrado; es la de la marca actual) y JetBrains Mono en detalles técnicos. Los títulos se "escriben" palabra por palabra con el scroll (`scrubWords` en `main.js`).
- Colores de la marca actual: negro `#111`/`#0b0b0c` y verde menta `#1fffc2`.
- Accesible por defecto: `prefers-reduced-motion` desactiva Lenis, pines y la tarjeta viajera; en móvil (<900 px) no hay pines ni tarjeta fija (retrato estático) y el proceso se muestra completo.

## Estructura y build

```
build.py                 genera index.html, proyectos/index.html, sitemap.xml y robots.txt
src/pages/               plantillas (home.html, proyectos.html)
src/partials/            head, header (píldora + menú) y footer
src/data/projects.json   los 17 proyectos (título, categoría, año, URL, imagen)
assets/css/style.css     estilos
assets/js/main.js        animaciones (loader, tarjeta 3D, proceso, filtros…)
assets/img/              retratos, logo, og.jpg y miniaturas WebP de proyectos
```

**No edites a mano los `.html` generados**: cambia `src/` y ejecuta

```bash
python build.py
```

Vista previa local: `npx http-server . -p 5200 -c-1` y abre <http://localhost:5200/>.
Para agregar un proyecto: añade la imagen WebP 1200×800 en `assets/img/projects/`, agrega su entrada en `src/data/projects.json` (con `"featured": true` y `desc`/`tags`/`cta` si va en la home) y vuelve a ejecutar `build.py`.

## Pendientes / por validar con Diego

- **"98%"**: en el sitio actual no tiene texto; se rotuló "Clientes satisfechos". Confirmar la cifra y el rótulo.
- **Textos que se ajustaron**: se quitó el bullet repetido de "Diseño web" y se corrigió "pácifico" → "Pacífico". Las barras de porcentaje de skills se reemplazaron por marquees (sin porcentajes).
- **Descripciones de los 4 proyectos destacados** (Invest Pacific, Fundación Valle del Lili, Tapetes y Pisos del Pacífico, Asoclicper): se redactaron a partir de lo que muestran las imágenes. Revisarlas.
- **"La Llar de Foccachella"**: el título del sitio actual dice *Foccachella* pero el dominio es *lallardefoccalella.com*. Confirmar cuál es el correcto.
- **Pastilla "Disponible para proyectos"**: confirmar que se quiere mostrar (o cambiar el texto).
- **Falta contenido real**: testimonios, correo/teléfono de contacto, casos de estudio por proyecto, métricas de resultados. El único canal hoy es WhatsApp (`wa.link/ydvb9j`) y LinkedIn.
- **Dominio**: `canonical`, `og:url`, `sitemap.xml` y `robots.txt` apuntan a `https://diegotdesigner.com/`.
- **Analítica**: no se incluyó (el sitio actual no mostraba etiquetas visibles). Agregar GA4/Tag Manager si se necesita.
- Las fuentes se cargan desde Google Fonts; si se quiere cero dependencias externas, hay que autoalojarlas.
- **Logo de CapCut**: `assets/img/skills/capcut.svg` es el logo oficial (vectorizado a partir del PNG que envió Diego el 2026-11-04). Los demás logos son los oficiales de cada plataforma (repositorio público gilbarbara/logos).
