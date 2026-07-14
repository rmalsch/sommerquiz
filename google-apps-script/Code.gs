const SHEETS = {
  rsvp: 'rsvp',
  bring: 'bring',
  games: 'games',
  newsletter: 'newsletter',
  team_profiles: 'team_profiles',
  faq_questions: 'faq_questions',
  pickup_requests: 'pickup_requests',
};

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || '';

  try {
    let payload;

    switch (action) {
      case 'rsvpSummary':
        payload = getRsvpSummary_();
        break;
      case 'bringList':
        payload = getBringList_();
        break;
      default:
        payload = { ok: true, message: 'Sommerquiz endpoint alive' };
        break;
    }

    return outputPayload_(payload, params.callback);
  } catch (err) {
    return outputPayload_({
      ok: false,
      error: err && err.message ? err.message : String(err),
      action: action || 'default',
    }, params.callback);
  }
}

function doPost(e) {
  try {
    const data = normalizePayload_(e);
    const formType = data.formType;

    if (!formType || !SHEETS[formType]) {
      return jsonResponse_({ ok: false, error: 'Unknown or missing formType' });
    }

    writeRow_(formType, data);
    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
}

function normalizePayload_(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  return {
    formType: params.formType || '',
    name: params.name || '',
    names: params.names || '',
    comment: params.comment || '',
    item: params.item || '',
    quantity: params.quantity || '',
    contribution_type: params.contribution_type || '',
    description: params.description || '',
    email: params.email || '',
    question: params.question || '',
    note: params.note || '',
    classic_knowledge: params.classic_knowledge || '',
    recognition: params.recognition || '',
    estimation_curiosity: params.estimation_curiosity || '',
    patterns_puzzling: params.patterns_puzzling || '',
    clue_combination: params.clue_combination || '',
    fine_motor_skills: params.fine_motor_skills || '',
    movement_coordination: params.movement_coordination || '',
    explain_coordinate: params.explain_coordinate || '',
    motivate_perform: params.motivate_perform || '',
  };
}

function countPersons_(namesValue) {
  return String(namesValue || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(function(entry) { return entry.trim(); })
    .filter(function(entry) { return entry.length > 0; })
    .length;
}

function writeRow_(formType, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS[formType]);

  if (!sheet) {
    throw new Error('Sheet not found for formType: ' + formType);
  }

  const timestamp = new Date();

  switch (formType) {
    case 'rsvp':
      sheet.appendRow([
        timestamp,
        data.names,
        countPersons_(data.names),
        data.comment,
      ]);
      break;
    case 'bring':
      sheet.appendRow([
        timestamp,
        data.name,
        data.item,
        data.quantity,
      ]);
      break;
    case 'games':
      sheet.appendRow([
        timestamp,
        data.name,
        data.contribution_type,
        data.description,
      ]);
      break;
    case 'newsletter':
      sheet.appendRow([
        timestamp,
        data.name,
        data.email,
      ]);
      break;
    case 'team_profiles':
      sheet.appendRow([
        timestamp,
        data.name,
        data.classic_knowledge,
        data.recognition,
        data.estimation_curiosity,
        data.patterns_puzzling,
        data.clue_combination,
        data.fine_motor_skills,
        data.movement_coordination,
        data.explain_coordinate,
        data.motivate_perform,
      ]);
      break;
    case 'faq_questions':
      sheet.appendRow([
        timestamp,
        data.name,
        data.question,
      ]);
      break;
    case 'pickup_requests':
      sheet.appendRow([
        timestamp,
        data.name,
        data.note,
      ]);
      break;
    default:
      throw new Error('Unsupported formType: ' + formType);
  }
}

function getRsvpSummary_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.rsvp);
  if (!sheet) throw new Error('Sheet not found for rsvp');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, totalPersons: 0, totalEntries: 0 };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  let totalPersons = 0;
  let totalEntries = 0;

  values.forEach(function(row) {
    const names = row[1];
    const personCount = Number(row[2]) || countPersons_(names);
    const hasContent = String(names || '').trim().length > 0;
    if (hasContent) {
      totalEntries += 1;
      totalPersons += personCount;
    }
  });

  return {
    ok: true,
    totalPersons: totalPersons,
    totalEntries: totalEntries,
  };
}

function getBringList_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.bring);
  if (!sheet) throw new Error('Sheet not found for bring');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { ok: true, entries: [] };
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const entries = values
    .filter(function(row) {
      return String(row[1] || '').trim() && String(row[2] || '').trim();
    })
    .map(function(row) {
      return {
        timestamp: row[0],
        name: String(row[1] || '').trim(),
        item: String(row[2] || '').trim(),
        quantity: String(row[3] || '').trim(),
      };
    })
    .reverse();

  return { ok: true, entries: entries };
}

function outputPayload_(obj, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse_(obj);
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
