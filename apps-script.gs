/**
 * Registro de entrenamiento — backend Google Apps Script
 * Proyecto Longevidad
 *
 * Qué hace:
 *   - doGet()  → devuelve el registro guardado (para rellenar la página).
 *   - doPost() → guarda/actualiza el registro del día (upsert por fecha+categoria+item).
 *
 * Cómo instalarlo (resumen; pasos detallados en SETUP.md):
 *   1. Crea una Google Sheet en blanco.
 *   2. Extensiones → Apps Script. Borra lo que haya y pega TODO este archivo.
 *   3. Cambia el TOKEN de abajo por una palabra secreta tuya.
 *   4. Implementar → Nueva implementación → Aplicación web
 *      · Ejecutar como: Yo
 *      · Quién tiene acceso: Cualquier persona
 *   5. Copia la URL (.../exec) y pégala en index.html (SCRIPT_URL) y el mismo TOKEN.
 */

// ⚠️ Cambia esto por una palabra secreta tuya. Debe ser IGUAL en index.html.
var TOKEN = 'longevidad-mateo-2026';

var SHEET_NAME = 'registro';
var HEADERS = ['timestamp', 'fecha', 'dia', 'categoria', 'item', 'peso', 'reps', 'valor', 'hecho', 'nota'];

// ---------- utilidades ----------

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function keyOf_(fecha, categoria, item) {
  return String(fecha) + '||' + String(categoria) + '||' + String(item);
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- lectura ----------

function doGet(e) {
  try {
    var sh = getSheet_();
    var values = sh.getDataRange().getValues();
    var out = [];
    var filtroFecha = e && e.parameter && e.parameter.fecha ? String(e.parameter.fecha) : null;

    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[1]) continue; // sin fecha → fila vacía
      var fecha = formatFecha_(row[1]);
      if (filtroFecha && fecha !== filtroFecha) continue;
      out.push({
        fecha: fecha,
        dia: row[2],
        categoria: row[3],
        item: row[4],
        peso: row[5],
        reps: row[6],
        valor: row[7],
        hecho: row[8] === true || row[8] === 'TRUE' || row[8] === 'true',
        nota: row[9]
      });
    }
    return jsonOut_({ ok: true, entries: out });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

// La Sheet puede devolver la fecha como Date; la normalizamos a AAAA-MM-DD.
function formatFecha_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).slice(0, 10);
}

// ---------- escritura (upsert) ----------

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(20000);
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) {
      return jsonOut_({ ok: false, error: 'token inválido' });
    }

    var fecha = String(body.fecha);
    var dia = String(body.dia || '');
    var entries = body.entries || [];

    var sh = getSheet_();
    var values = sh.getDataRange().getValues();

    // índice de filas existentes por clave
    var indexByKey = {};
    for (var i = 1; i < values.length; i++) {
      if (!values[i][1]) continue;
      var k = keyOf_(formatFecha_(values[i][1]), values[i][3], values[i][4]);
      indexByKey[k] = i + 1; // fila real en la hoja (1-based)
    }

    var ts = new Date();
    var appended = 0, updated = 0;

    for (var j = 0; j < entries.length; j++) {
      var en = entries[j];
      var rowData = [
        ts,
        fecha,
        dia,
        en.categoria || '',
        en.item || '',
        (en.peso === undefined ? '' : en.peso),
        (en.reps === undefined ? '' : en.reps),
        (en.valor === undefined ? '' : en.valor),
        (en.hecho === true ? true : (en.hecho === false ? false : '')),
        (en.nota === undefined ? '' : en.nota)
      ];
      var key = keyOf_(fecha, en.categoria || '', en.item || '');
      if (indexByKey[key]) {
        sh.getRange(indexByKey[key], 1, 1, HEADERS.length).setValues([rowData]);
        updated++;
      } else {
        sh.appendRow(rowData);
        indexByKey[key] = sh.getLastRow();
        appended++;
      }
    }

    return jsonOut_({ ok: true, appended: appended, updated: updated });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
