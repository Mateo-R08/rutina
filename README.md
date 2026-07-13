# Registro de Entrenamiento — Proyecto Longevidad

Página interactiva para registrar y sincronizar tu entrenamiento, macros y movilidad entre móvil y computador.

## Uso

Abre https://mateo-r08.github.io/rutina/ en tu móvil o PC.

**Cómo registrar:**
1. Anota el **peso** y **reps** de cada ejercicio.
2. Marca la casilla cuando termines un ejercicio.
3. Escribe las **macros consumidas hoy** (kcal, proteína, carbos, grasa).
4. Marca **"Marcar como hecho"** en movilidad/estiramientos.
5. Pulsa **"Guardar día"** → verás "Guardado ✓ hh:mm".

**Móvil:** abre la URL en el navegador y usa "Añadir a pantalla de inicio" para crear un acceso directo como app.

**Sincronización:** cuando abres la página en otro dispositivo, todos los datos aparecen solos. Si no hay internet, se guardan localmente y se suben cuando vuelva la conexión.

---

## Arquitectura

```
PÁGINA                          BACKEND                         DATOS
(GitHub Pages, HTTPS)           (Google Apps Script)            (Tu Google Sheet)
   index.html                   doGet() / doPost()              "Registro entrenamiento"
       ⇕ fetch (JSON)               ⇕                              ⇕
   localStorage                 Apps Script API                 Hoja "registro"
   (respaldo offline)           (URL /exec)                     (editable a mano)
```

- **Lectura:** GET → devuelve tu registro del día.
- **Escritura:** POST (con token) → guarda/actualiza entradas.
- **Offline:** localStorage guarda localmente; se sincroniza al volver la red.

---

## Archivos del repo

### `index.html`
Página completa, autocontenida (imágenes embebidas en base64). Hacia el final, dentro del bloque `<script>`, encontrarás:

```js
var SCRIPT_URL = "";                     // Pega aquí tu URL de Apps Script
var TOKEN = "longevidad-mateo-2026";     // Debe coincidir con el TOKEN del Apps Script
```

Llena `SCRIPT_URL` con la URL que generes en el paso "Re-desplegar el backend" de abajo.

### `apps-script.gs`
Backend escrito en Google Apps Script. Pégalo completo en el editor de tu Google Sheet (ver "Re-desplegar el backend" abajo).

---

## Cómo re-desplegar el backend (si se rompe)

Si la página muestra "Sin conexión" o los datos no se guardan:

1. **Abre tu Google Sheet:** "Registro entrenamiento" (o crea una nueva en blanco si no existe).
2. **Menú → Extensiones → Apps Script** — se abre el editor.
3. **Borra todo lo que haya** y **pega el contenido completo de `apps-script.gs`** (el archivo del repo).
4. **Botón Guardar** (💾 arriba a la izquierda).
5. **Arriba a la derecha → Implementar → Nueva implementación**:
   - Haz clic en **⚙️ (engranaje)** y elige **Aplicación web**.
   - **Ejecutar como:** *Yo* (tu correo).
   - **Quién tiene acceso:** *Cualquier persona*.
   - Pulsa **Implementar**.
   - Google te pedirá autorizar — acepta (te avisará que no está verificada; es tuya, así que continúa: "Configuración avanzada → Ir a …").
6. **Copia la URL** que te muestra (termina en `/exec`).
7. **Vuelve a este repo, abre `index.html`** (o edítalo vía GitHub):
   - Busca la línea `var SCRIPT_URL = "";`.
   - Pega la URL entre las comillas: `var SCRIPT_URL = "https://script.google.com/macros/s/AKfy...../exec";`.
   - Guarda y sube el archivo (si lo editaste en GitHub, Commit; si es local, sube vía GitHub web UI).
8. **Recarga la página** en el navegador. Los datos deberían sincronizar.

---

## Modelo de datos

Tu Google Sheet tendrá una hoja llamada **"registro"** con estas columnas:

| timestamp | fecha | dia | categoria | item | peso | reps | valor | hecho | nota |
|-----------|-------|-----|-----------|------|------|------|-------|-------|------|

**Categorías de datos:**
- **ejercicio** → `item` = nombre del ejercicio; `peso`, `reps`, `hecho`.
- **macro** → `item` ∈ {kcal, proteina, carbs, grasa}; `valor` = número.
- **movilidad** → `item` = bloque (ej. "Movilidad"); `hecho` = TRUE/FALSE.

La hoja se llena automáticamente cuando registras, pero **puedes editarla a mano** si necesitas corregir algo.

---

## Seguridad

⚠️ **Importante:**
- `SCRIPT_URL` y `TOKEN` son **visibles en el código fuente** — cualquiera que abra "Ver código fuente" en el navegador (Ctrl+U) los ve.
- El `TOKEN` solo protege **escritura** (`doPost`). **Lectura (`doGet`) es pública** para quien tenga la URL — no uses esto para datos sensibles.
- **Tu Google Sheet es privada**, pero los datos registrados son accesibles a través de la URL del Apps Script si alguien la obtiene.

Si quieres mayor privacidad:
- Cambia el `TOKEN` por una frase más larga y aleatoria en ambos lugares (`apps-script.gs` + `index.html`).
- O cierra el acceso en Apps Script a "Solo yo" (pero entonces solo funcionaría desde tu cuenta).

---

## Notas

- **No es tiempo real:** sincroniza al guardar y al recargar, no hace push automático entre dos pantallas abiertas.
- **Cada semana:** si se te proporciona un `index.html` nuevo para una rutina diferente, solo sube ese archivo. El backend (Sheet + Apps Script) se reutiliza.
- **Proyecto personal:** esto es un flujo custom para el Proyecto Longevidad, no una plantilla genérica. Úsalo como base si lo necesitas en otro contexto, pero no es un producto que se reutilice tal cual.

---

## Troubleshooting

**"Modo local: los cambios se guardan solo en este dispositivo"**
→ `SCRIPT_URL` está vacío. Rellénalo con la URL del Apps Script (ver "Re-desplegar el backend").

**"Sin conexión — guardado local, se subirá luego"**
→ No hay conexión de red, o el Apps Script no responde. Verifica que:
- Pasaste la URL correcta en `SCRIPT_URL`.
- El Apps Script está desplegado (arriba a la derecha debería decir "Implementación completada").
- El token en `index.html` coincide con el token en `apps-script.gs`.

**Los datos no se guardan en la Sheet**
→ Abre la consola del navegador (F12), intenta registrar algo, y comparte el error que aparezca.
