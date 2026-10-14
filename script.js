/**
 * RITMO — INTERACCIONES DE LA LANDING
 * Este archivo se carga al final del HTML, cuando sus elementos ya existen.
 * Orden de lectura:
 * 1. Avisos y errores. 2. Imágenes. 3. Contador y persistencia.
 * 4. Colección. 5. Datos. 6. Detalles. 7. Hero. 8. Partículas.
 * Las secciones inicializadas mediante runSafely pueden fallar por separado.
 */
// 1. AVISOS Y MANEJO DE ERRORES
// Un fallo dentro de runSafely muestra un aviso y no interrumpe el resto del script.
// Muestra un mensaje legible y, si corresponde, el botón para reintentar imágenes.
function notify(message, images = false) {
  const panel = document.querySelector("#site-feedback"),
    text = document.querySelector("#feedback-message"),
    retry = document.querySelector("#retry-images");
  if (!panel || !text) return;
  text.textContent = message;
  panel.hidden = false;
  if (retry) retry.hidden = !images;
}
// Ejecuta una acción con try/catch. El detalle técnico queda en la consola.
// Este wrapper captura errores síncronos, no promesas ni eventos posteriores.
function runSafely(action, message) {
  try {
    return action();
  } catch (error) {
    console.error("RITMO:", error);
    notify(message);
  }
}
// El encadenamiento opcional (?.) evita fallar si este botón no existe.
document.querySelector("#dismiss-feedback")?.addEventListener("click", () => {
  document.querySelector("#site-feedback").hidden = true;
});
// 2. CARGA Y RECUPERACIÓN DE IMÁGENES
// Set registra cada imagen fallida una sola vez.
const failedImages = new Set();
// Cuando la imagen carga, quitamos su aviso y la sacamos del registro de fallos.
function clearImageFailure(image) {
  image.classList.remove("image-failed");
  image._fallback?.remove();
  image._fallback = null;
  failedImages.delete(image);
}
// Escucha error/load y revisa imágenes que terminaron de cargar antes del script.
function watchImages() {
  document.querySelectorAll("img").forEach((image) => {
    // Creamos un aviso de reemplazo sin eliminar el producto ni su botón.
    function failure() {
      if (!image.getAttribute("src")) return;
      failedImages.add(image);
      image.classList.add("image-failed");
      if (!image._fallback) {
        const label = document.createElement("span");
        label.className = "image-unavailable";
        label.textContent = "Imagen no disponible";
        image.insertAdjacentElement("afterend", label);
        image._fallback = label;
      }
      notify(
        "Algunas imágenes no se pudieron cargar. Puedes seguir explorando los productos.",
        true,
      );
    }
    image.addEventListener("error", failure);
    image.addEventListener("load", () => clearImageFailure(image));
    if (image.getAttribute("src") && image.complete && image.naturalWidth === 0)
      failure();
  });
  // Reasignar src vuelve a solicitar la imagen sin recargar toda la página.
  document.querySelector("#retry-images")?.addEventListener("click", () => {
    if (!failedImages.size) {
      document.querySelector("#site-feedback").hidden = true;
      return;
    }
    const images = [...failedImages];
    document.querySelector("#site-feedback").hidden = true;
    images.forEach((image) => {
      const original = image.getAttribute("src");
      clearImageFailure(image);
      image.removeAttribute("src");
      image.src = original;
    });
  });
}
runSafely(
  watchImages,
  "No pudimos preparar todas las imágenes. Puedes seguir consultando los productos.",
);

// 3. CONTADOR PERSISTENTE CON localStorage
// Guardamos el vencimiento en milisegundos, no los segundos que faltan.
// Así el tiempo sigue pasando aunque cierres la página.
const OFFER_STORAGE_KEY = "ritmo.flashOffer.v1.endsAt";
// 2 horas × 60 minutos × 60 segundos × 1000 milisegundos.
const OFFER_DURATION_MS = 2 * 60 * 60 * 1000;
// Devuelve { end, persistent }: vencimiento y disponibilidad de almacenamiento.
// Cambia la clave OFFER_STORAGE_KEY solo si quieres iniciar otra campaña.
function loadOfferDeadline(now = Date.now()) {
  const fallback = now + OFFER_DURATION_MS;
  try {
    const stored = Number(localStorage.getItem(OFFER_STORAGE_KEY));
    // Conservamos incluso una fecha vencida: recargar no debe renovar la oferta.
    // El límite superior corresponde al máximo admitido por Date.
    if (
      Number.isSafeInteger(stored) &&
      stored > 0 &&
      stored <= 8640000000000000
    )
      return { end: stored, persistent: true };
    localStorage.setItem(OFFER_STORAGE_KEY, String(fallback));
    return { end: fallback, persistent: true };
  } catch {
    // Si el navegador bloquea el almacenamiento, el contador funciona
    // durante esta visita; persistent:false permite avisar al usuario.
    return { end: fallback, persistent: false };
  }
}
// Recuperamos o creamos la fecha una sola vez durante la carga de la página.
const offer = loadOfferDeadline();
const end = offer.end;
// El timestamp es un instante absoluto; toLocaleString lo muestra en hora local.
const localDeadline = new Date(end).toLocaleString("es-MX", {
  dateStyle: "short",
  timeStyle: "short",
});
document.querySelector("#offer-deadline").textContent =
  "Vence el " + localDeadline + " (hora de tu dispositivo).";
document.querySelector("#celebrate-offer").title =
  "Vence el " + localDeadline + ". ¡Haz clic para celebrar!";
if (!offer.persistent)
  document.querySelector("#offer-storage-note").textContent =
    "Tu navegador no permite guardar el contador; se reiniciará al actualizar.";
const clock = document.querySelector("#clock");
// Respetamos la preferencia de movimiento reducido del sistema operativo.
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const flash = document.querySelector(".flash"),
  flashMotion = document.querySelector("#flash-motion");
let effectsPaused = motionPreference.matches;
// Mantiene sincronizados el estilo de pausa y los atributos de accesibilidad.
function syncEffects() {
  flash.classList.toggle("effects-paused", effectsPaused);
  flashMotion.setAttribute("aria-pressed", String(effectsPaused));
  flashMotion.setAttribute(
    "aria-label",
    effectsPaused
      ? "Activar efectos de la oferta"
      : "Pausar efectos de la oferta",
  );
}
flashMotion.onclick = () => {
  effectsPaused = !effectsPaused;
  syncEffects();
};
syncEffects();
// Convierte el tiempo restante en horas, minutos y segundos.
// Math.max evita valores negativos cuando vence la oferta.
function tick() {
  const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
  const values = [
    Math.floor(left / 3600),
    Math.floor((left % 3600) / 60),
    left % 60,
  ];
  clock.setAttribute(
    "aria-label",
    `${values[0]} horas, ${values[1]} minutos y ${values[2]} segundos restantes`,
  );
  // Actualizamos solo los dígitos que cambiaron y les damos una animación breve.
  clock.querySelectorAll(".time-value").forEach((element, i) => {
    const value = String(values[i]).padStart(2, "0");
    if (element.textContent !== value) {
      element.textContent = value;
      if (
        !effectsPaused &&
        !motionPreference.matches &&
        typeof element.animate === "function"
      )
        element.animate(
          [
            { transform: "translateY(-4px)", opacity: 0.4 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          { duration: 280, easing: "ease-out" },
        );
    }
  });
  // El vencimiento detiene el reloj, pero permite seguir usando los fuegos artificiales.
  if (left === 0) {
    clock.textContent = "Oferta finalizada";
    clock.setAttribute("aria-label", "Oferta finalizada");
    flash.classList.add("offer-ended");
    const link = document.querySelector("#featured-offer");
    if (link) link.textContent = "Ver producto ↗";
    const badge = document.querySelector("#detail-offer");
    if (badge && !badge.hidden) {
      badge.classList.add("expired");
      badge.textContent = "La oferta flash ha finalizado. Precio ilustrativo.";
    }
    clearInterval(timer);
  }
}
// Pintamos el tiempo inmediatamente y programamos una actualización por segundo.
let timer;
runSafely(() => {
  timer = setInterval(
    () => runSafely(tick, "No pudimos actualizar el contador."),
    1000,
  );
  tick();
}, "El contador no está disponible en este momento.");
// Al volver a la pestaña, recalculamos con el reloj real del dispositivo.
// setInterval puede ejecutarse con menos frecuencia en segundo plano.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tick();
});
window.addEventListener("pageshow", tick);
runSafely(() => {
  // 4. CARRUSEL DE LA COLECCIÓN
  // Cada clic desplaza el ancho de una tarjeta más los 24 px de separación.
  const track = document.querySelector("#carousel"),
    prev = document.querySelector("#prev"),
    next = document.querySelector("#next"),
    cards = [...document.querySelectorAll(".card")];
  const reduced = motionPreference.matches;
  if (!track || !prev || !next || !cards.length)
    throw Error("Missing collection controls");
  // direction vale -1 para retroceder y 1 para avanzar.
  function move(direction) {
    track.scrollBy({
      left: direction * (cards[0].offsetWidth + 24),
      behavior: reduced ? "auto" : "smooth",
    });
  }
  prev.onclick = () => move(-1);
  next.onclick = () => move(1);
  // Actualiza la posición y desactiva las flechas cuando se llega a un extremo.
  function update() {
    prev.disabled = track.scrollLeft < 5;
    next.disabled =
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 5;
    document.querySelector("#position").textContent =
      String(
        Math.min(
          cards.length,
          Math.round(track.scrollLeft / (cards[0].offsetWidth + 24)) + 1,
        ),
      ).padStart(2, "0") +
      " / " +
      String(cards.length).padStart(2, "0");
  }
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(e.key === "ArrowRight" ? 1 : -1);
    }
  });
}, "Los controles de la colección no están disponibles; puedes desplazarte entre los productos.");
// 5. DATOS DE LOS CINCO PRODUCTOS
// Edita aquí las descripciones, opciones y precios del modal.
// Las tarjetas del HTML tienen su propio texto: mantenlo sincronizado al editar.
// Cada color se representa como [nombre, hexadecimal]; featured marca la oferta.
const products = {
  running: {
    name: "Tenis de running",
    category: "RUNNING",
    image: "shoe.jpg",
    price: 1399,
    original: 1999,
    description:
      "Un estilo deportivo para acompañar tus salidas y completar tu equipo de entrenamiento.",
    optionLabel: "Talla MX (cm)",
    sizes: ["25", "26", "27", "28", "29"],
    colors: [
      ["Blanco", "#fafafa"],
      ["Negro", "#262626"],
    ],
    featured: true,
  },
  training: {
    name: "Playera de entrenamiento",
    category: "TRAINING",
    image: "tee.png",
    price: 399,
    original: 499,
    description:
      "Una playera de corte clásico para combinar con tus básicos deportivos dentro y fuera del gimnasio.",
    optionLabel: "Talla",
    sizes: ["CH", "M", "G", "EG"],
    colors: [
      ["Negro", "#262626"],
      ["Blanco", "#fafafa"],
      ["Violeta", "#7344ed"],
    ],
  },
  basket: {
    name: "Balón de básquetbol",
    category: "BASKETBALL",
    image: "ball.webp",
    price: 599,
    original: 799,
    description:
      "Completa tu equipo de cancha y prepara la siguiente sesión de pases, tiros y juego.",
    optionLabel: "Tamaño",
    sizes: ["Número 7"],
    colors: [["Naranja", "#ce7b2d"]],
  },
  bag: {
    name: "Bolsa deportiva",
    category: "EQUIPO",
    image: "bag.jpg",
    price: 699,
    original: 899,
    description:
      "Una bolsa para reunir tu ropa, calzado y accesorios antes de salir a entrenar.",
    optionLabel: "Tamaño",
    sizes: ["Único"],
    colors: [
      ["Negro", "#262626"],
      ["Violeta", "#7344ed"],
    ],
  },
  bottle: {
    name: "Botella deportiva",
    category: "HIDRATACIÓN",
    image: "bottle.jpg",
    price: 299,
    original: 399,
    description:
      "Lleva tu bebida contigo y haz espacio para una pausa entre cada actividad.",
    optionLabel: "Capacidad",
    sizes: ["950 ml"],
    colors: [
      ["Lima", "#d6fa52"],
      ["Negro", "#262626"],
    ],
  },
};
// Rechaza datos incompletos o inválidos antes de construir los detalles.
function validProduct(p) {
  return (
    !!p &&
    typeof p.name === "string" &&
    typeof p.category === "string" &&
    typeof p.description === "string" &&
    typeof p.image === "string" &&
    Number.isFinite(p.price) &&
    p.price >= 0 &&
    Number.isFinite(p.original) &&
    p.original >= p.price &&
    Array.isArray(p.sizes) &&
    p.sizes.length > 0 &&
    p.sizes.every((s) => typeof s === "string") &&
    Array.isArray(p.colors) &&
    p.colors.length > 0 &&
    p.colors.every(
      (c) =>
        Array.isArray(c) &&
        typeof c[0] === "string" &&
        /^#[0-9a-f]{6}$/i.test(c[1]),
    )
  );
}
// 6. VENTANA DE DETALLES Y SELECCIÓN DE VARIANTES
// <dialog> proporciona cierre con Escape y gestión del foco en navegadores compatibles.
function initializeDetails() {
  const dialog = document.querySelector("#details"),
    options = document.querySelector("#detail-options");
  if (!dialog || !options) throw Error("Missing product detail container");
  const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
  // Busca el producto usando el identificador data-product del botón o enlace.
  function openProduct(id) {
    const p = products[id];
    if (!validProduct(p)) {
      notify(
        "No pudimos cargar los detalles de este producto. Prueba con otro o actualiza la página.",
      );
      return;
    }
    if (typeof dialog.showModal !== "function") {
      notify(
        "Este navegador no puede abrir los detalles. Puedes consultar los productos en la colección o usar un navegador actualizado.",
      );
      return;
    }
    document.querySelector("#detail-title").textContent = p.name;
    document.querySelector("#detail-category").textContent = p.category;
    document.querySelector("#detail-description").textContent = p.description;
    const image = document.querySelector("#detail-image");
    clearImageFailure(image);
    image.alt = p.name;
    image.src = p.image;
    const price = document.querySelector("#detail-price");
    price.textContent = money.format(p.price) + " MXN";
    const old = document.createElement("del");
    old.textContent = money.format(p.original);
    price.append(old);
    const badge = document.querySelector("#detail-offer");
    badge.hidden = !p.featured;
    badge.classList.toggle("expired", end <= Date.now());
    badge.textContent =
      end > Date.now()
        ? "Oferta destacada · ahorra " + money.format(p.original - p.price)
        : "La oferta flash ha finalizado. Precio ilustrativo.";
    // Eliminamos las opciones anteriores para no mezclar productos al reabrir.
    options.replaceChildren();
    // Genera un fieldset con radios: solo se puede elegir una opción por grupo.
    // Usamos textContent/createTextNode para insertar texto, no HTML arbitrario.
    function addOptions(title, name, values, isColor) {
      const fieldset = document.createElement("fieldset");
      fieldset.className = "option-group";
      const legend = document.createElement("legend");
      legend.textContent = title;
      fieldset.append(legend);
      const list = document.createElement("div");
      list.className = "option-list";
      values.forEach((value, index) => {
        const text = isColor ? value[0] : value;
        const label = document.createElement("label");
        label.className = "option-chip";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = name;
        input.value = text;
        input.checked = index === 0;
        const span = document.createElement("span");
        if (isColor) {
          const dot = document.createElement("i");
          dot.className = "color-dot";
          dot.style.background = value[1];
          dot.setAttribute("aria-hidden", "true");
          span.append(dot);
        }
        span.append(document.createTextNode(text));
        label.append(input, span);
        list.append(label);
      });
      fieldset.append(list);
      options.append(fieldset);
    }
    addOptions(p.optionLabel, "product-size", p.sizes, false);
    addOptions("Color", "product-color", p.colors, true);
    // Lee los radios seleccionados y actualiza el resumen accesible del usuario.
    function summary() {
      const size = options.querySelector(
        '[name="product-size"]:checked',
      )?.value;
      const color = options.querySelector(
        '[name="product-color"]:checked',
      )?.value;
      document.querySelector("#detail-selection").textContent =
        size && color
          ? "Tu selección: " + size + " · " + color
          : "Elige una opción de cada grupo.";
    }
    options.onchange = summary;
    summary();
    if (!dialog.open) dialog.showModal();
  }
  // Tanto las tarjetas como el enlace de oferta abren la misma ventana.
  document.querySelectorAll("[data-product]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      runSafely(
        () => openProduct(button.dataset.product),
        "No pudimos abrir el producto. Inténtalo de nuevo.",
      );
    }),
  );
  dialog
    .querySelector(".close")
    .addEventListener("click", () => dialog.close());
  // Cierra si se pulsa fuera del rectángulo del modal, sin cerrar por clics internos.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
}
runSafely(
  initializeDetails,
  "Los detalles de productos no están disponibles en este momento. Puedes seguir viendo la colección.",
);

runSafely(() => {
  // Carrusel principal: avance automático, pausa y navegación con teclado o toque.
  // 7. CARRUSEL DEL HERO
  // slides son las diapositivas; dots son los indicadores de navegación.
  const hero = document.querySelector(".hero-carousel"),
    slides = [...hero.querySelectorAll(".hero-slide")],
    dots = [...hero.querySelectorAll("[data-slide]")],
    pause = document.querySelector("#hero-pause");
  if (!hero || !slides.length || !pause) throw Error("Missing hero controls");
  let activeSlide = 0,
    heroPaused = motionPreference.matches,
    hovered = false,
    heroTimer;
  // Evita acumular intervalos y pausa al interactuar o al ocultarse la pestaña.
  function scheduleHero() {
    clearInterval(heroTimer);
    if (
      !heroPaused &&
      !hovered &&
      !document.hidden &&
      !hero.contains(document.activeElement)
    )
      heroTimer = setInterval(() => showSlide(activeSlide + 1), 5500);
  }
  // La posición de cada color corresponde a la posición del producto en el hero.
  const heroColors = ["#e9e2ff", "#eaf3cb", "#fae6d8", "#dbedf7", "#f8e2ef"];
  // El módulo (%) permite pasar del último producto al primero y viceversa.
  // aria-hidden e inert excluyen las diapositivas ocultas de la interacción.
  function showSlide(index) {
    if (!slides.length) return;
    activeSlide = (index + slides.length) % slides.length;
    hero.style.backgroundColor = heroColors[activeSlide % heroColors.length];
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === activeSlide);
      slide.setAttribute("aria-hidden", String(i !== activeSlide));
      slide.inert = i !== activeSlide;
    });
    dots.forEach((dot, i) => {
      if (i === activeSlide) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
    document.querySelector("#hero-position").textContent =
      `${String(activeSlide + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  }
  // Reinicia el intervalo después de una navegación manual.
  function manualSlide(index) {
    showSlide(index);
    scheduleHero();
  }
  document.querySelector("#hero-prev").onclick = () =>
    manualSlide(activeSlide - 1);
  document.querySelector("#hero-next").onclick = () =>
    manualSlide(activeSlide + 1);
  dots.forEach(
    (dot) => (dot.onclick = () => manualSlide(Number(dot.dataset.slide))),
  );
  // Cambia el icono y el nombre accesible según el estado de reproducción.
  function syncPause() {
    pause.textContent = heroPaused ? "▶" : "Ⅱ";
    pause.setAttribute(
      "aria-label",
      heroPaused ? "Reproducir carrusel" : "Pausar carrusel",
    );
  }
  pause.onclick = () => {
    heroPaused = !heroPaused;
    syncPause();
    scheduleHero();
  };
  hero.addEventListener("mouseenter", () => {
    hovered = true;
    scheduleHero();
  });
  hero.addEventListener("mouseleave", () => {
    hovered = false;
    scheduleHero();
  });
  hero.addEventListener("focusin", scheduleHero);
  hero.addEventListener("focusout", () => setTimeout(scheduleHero, 0));
  document.addEventListener("visibilitychange", scheduleHero);
  hero.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      manualSlide(activeSlide + (e.key === "ArrowRight" ? 1 : -1));
    }
  });
  // Guardamos el punto inicial del toque y comparamos los desplazamientos.
  // Solo un gesto predominantemente horizontal y mayor a 45 px cambia el producto.
  let touchStart = null;
  hero.addEventListener(
    "touchstart",
    (e) => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      clearInterval(heroTimer);
    },
    { passive: true },
  );
  hero.addEventListener(
    "touchend",
    (e) => {
      if (touchStart) {
        const dx = e.changedTouches[0].clientX - touchStart.x,
          dy = e.changedTouches[0].clientY - touchStart.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy))
          manualSlide(activeSlide + (dx < 0 ? 1 : -1));
        touchStart = null;
        scheduleHero();
      }
    },
    { passive: true },
  );
  hero.addEventListener(
    "touchcancel",
    () => {
      touchStart = null;
      scheduleHero();
    },
    { passive: true },
  );
  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) {
      heroPaused = true;
      effectsPaused = true;
      syncPause();
      syncEffects();
      scheduleHero();
    }
  });
  syncPause();
  scheduleHero();
}, "No pudimos iniciar el carrusel principal. Puedes explorar la colección de abajo.");
// 8. FUEGOS ARTIFICIALES EN TODO EL BANNER
// El evento click del banner también recibe los clics de sus elementos hijos.
const celebrate = document.querySelector("#celebrate-offer"),
  fireworks = document.querySelector("#offer-fireworks");
let lastBurst = -Infinity;
flash.addEventListener("click", (event) => {
  // El botón de pausa conserva su función y no lanza partículas.
  if (event.target.closest("#flash-motion")) return;
  // Limitamos la frecuencia de las explosiones para evitar trabajo excesivo.
  const now = performance.now();
  if (now - lastBurst < 180) return;
  lastBurst = now;
  // Con teclado, la explosión nace en el centro del control activado.
  // Con ratón o toque, nace en las coordenadas del clic dentro de la barra.
  const keyboardTarget = event.target.closest("button, a") || flash;
  const rect = (event.detail ? flash : keyboardTarget).getBoundingClientRect();
  if (effectsPaused || motionPreference.matches) {
    flash.classList.add("celebrated");
    setTimeout(() => flash.classList.remove("celebrated"), 400);
    return;
  }
  if (typeof Element.prototype.animate !== "function") {
    flash.classList.add("celebrated");
    setTimeout(() => flash.classList.remove("celebrated"), 400);
    return;
  }
  const x = event.detail
    ? Math.min(rect.right, Math.max(rect.left, event.clientX))
    : rect.left + rect.width / 2;
  const y = event.detail
    ? Math.min(rect.bottom, Math.max(rect.top, event.clientY))
    : rect.top + rect.height / 2;
  // Paleta de las partículas. Puedes cambiarla sin modificar el resto del efecto.
  const colors = ["#d6fa52", "#a881ff", "#ff79ce", "#ffca66", "#64e3ff"];
  // Retiramos partículas antiguas antes de añadir 24 nuevas (máximo: 72).
  while (fireworks.children.length > 48) fireworks.firstElementChild.remove();
  for (let i = 0; i < 24; i++) {
    const particle = document.createElement("span");
    particle.className = "offer-particle";
    // Distribución radial: seno y coseno convierten ángulo y distancia en x/y.
    const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.15,
      distance = 48 + Math.random() * 90;
    const dx = Math.cos(angle) * distance,
      dy = Math.sin(angle) * distance;
    const size = 4 + Math.random() * 5;
    Object.assign(particle.style, {
      left: x + "px",
      top: y + "px",
      width: size + "px",
      height: size + "px",
      background: colors[i % colors.length],
      borderRadius: i % 3 ? "2px" : "50%",
    });
    fireworks.append(particle);
    // Tres etapas: nacimiento, expansión y caída con desvanecimiento.
    const animation = particle.animate(
      [
        { transform: "translate(-50%, -50%) scale(.4)", opacity: 1 },
        {
          transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) rotate(120deg) scale(1)`,
          opacity: 1,
          offset: 0.55,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 35}px)) rotate(240deg) scale(.2)`,
          opacity: 0,
        },
      ],
      {
        duration: 650 + Math.random() * 250,
        easing: "cubic-bezier(.15,.65,.3,1)",
      },
    );
    // Retiramos los nodos al terminar; el timeout sirve de limpieza de respaldo.
    animation.onfinish = () => particle.remove();
    animation.oncancel = () => particle.remove();
    setTimeout(() => particle.remove(), 1100);
  }
});
// Al pausar los efectos o activar movimiento reducido, limpiamos la capa visual.
function clearFireworks() {
  fireworks.replaceChildren();
}
flashMotion.addEventListener("click", () => {
  if (effectsPaused) clearFireworks();
});
motionPreference.addEventListener("change", () => {
  if (motionPreference.matches) clearFireworks();
});
