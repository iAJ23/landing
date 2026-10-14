# RITMO — Landing deportiva

## Abrir en VS Code
1. Extrae este ZIP (no abras los archivos dentro del ZIP).
2. En VS Code, selecciona Archivo > Abrir carpeta y elige ritmo-sport.
3. Con la extensión Live Server instalada, haz clic derecho en index.html y selecciona Open with Live Server.
4. Conserva el mismo navegador y dirección/puerto para mantener el contador guardado.

No requiere npm, Node.js ni compilación. También puedes abrir index.html directamente para consultar el diseño; para probar localStorage usa Live Server.

## Archivos
- index.html: estructura y contenido.
- styles.css: diseño responsive, carruseles y animaciones.
- script.js: contador persistente, fuegos artificiales, navegación de carruseles, opciones de productos y manejo de errores.
- Archivos JPG, PNG y WEBP: imágenes locales de los cinco productos.

## Contador
El vencimiento se guarda bajo la clave ritmo.flashOffer.v1.endsAt y dura dos horas desde la primera visita en ese navegador y origen. No se reinicia al vencer. La copia local tiene un almacenamiento distinto del sitio publicado.
Para reiniciarlo durante tus pruebas, ejecuta en la consola del navegador:

localStorage.removeItem("ritmo.flashOffer.v1.endsAt");
location.reload();

Si el navegador bloquea localStorage, aparece un aviso y el contador funciona temporalmente sin persistir. Depende del reloj del dispositivo; una promoción comercial compartida requiere un vencimiento validado en servidor.

## Personalización
Busca const products en script.js para editar precios, descripciones, tallas y colores. Las imágenes son de referencia y no cambian con la selección de color. Los precios, variantes y descuentos son demostrativos; no hay compras ni inventario real.

## Recursos
Las imágenes están incluidas. Las tipografías se solicitan a Google Fonts; sin conexión se usan las fuentes alternativas definidas en CSS.
Fuentes de las fotos de referencia:
- Tenis: https://lecoureurnordique.ca/en/products/nike-pegasus-41-fd2722-homme
- Playera: https://penguinuniform.com/tridri-performance-t-shirt/
- Balón: https://wilsonme.com/products/wilson-mvp-basketball-wz3018703xb
- Bolsa: https://insport.com.au/products/adidas-training-defender-60l-black-white-duffle-bag
- Botella: https://adanola.com/en-int/products/adanola-water-bottle-950ml-washed-lime-green?variant=56134174933365


## Versión comentada: cómo leer y editar
Los comentarios están en español. HTML usa <!-- comentario -->, CSS usa /* comentario */ y JavaScript usa // o /* comentario */. No se muestran como texto en la página.

| Qué quieres cambiar | Archivo y bloque |
| --- | --- |
| Títulos, navegación y textos visibles | index.html: bloques numerados de la página |
| Colores principales | styles.css: 1. VARIABLES GLOBALES, :root |
| Tipografía, márgenes y dimensiones | styles.css: bloque de la sección correspondiente |
| Diseño para celular | styles.css: reglas @media |
| Duración de la oferta | script.js: OFFER_DURATION_MS |
| Vencimiento guardado | script.js: loadOfferDeadline y OFFER_STORAGE_KEY |
| Descripciones, tallas, colores y precios del modal | script.js: 5. DATOS DE LOS CINCO PRODUCTOS |
| Precios y textos de tarjetas | index.html: 6. COLECCIÓN |
| Velocidad del hero | script.js: scheduleHero; 5500 significa 5,5 segundos |
| Colores del hero | script.js: heroColors; mismo orden que las diapositivas |
| Cantidad y colores de partículas | script.js: 8. FUEGOS ARTIFICIALES |
| Avisos de error y recuperación de imágenes | script.js: secciones 1 y 2 |

### Antes de editar
- Haz una copia de respaldo o guarda un commit.
- Cambia un bloque por vez y revisa con Live Server.
- Si cambias un id, una clase o data-product, actualiza sus referencias en HTML, CSS y JavaScript.
- Los precios del modal y los de las tarjetas están separados: actualiza ambos.
- En CSS, las reglas posteriores pueden sobrescribir las primeras; los comentarios señalan los bloques complementarios.
- Modificar OFFER_DURATION_MS no cambia una oferta ya guardada: para tus pruebas, elimina únicamente la clave del contador como indica la sección anterior.
- Para más productos hay que actualizar las tarjetas, las diapositivas, sus indicadores, products y heroColors; un comentario no elimina estas dependencias.

Orden sugerido de estudio: HTML → CSS → JavaScript, siguiendo los bloques numerados. Esta edición conserva el comportamiento de la versión anterior.
