// Serve data to the Frontend

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Meet Device Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getDashboardData() {
  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('CurrentOpenIssues');
  const data = logSheet.getDataRange().getValues();

  if (data.length <= 1) return [];
  const rows = data.slice(1);

  return rows.map(row => {
    if (row[0] instanceof Date) {
      row[0] = Utilities.formatDate(row[0], Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    }
    return row;
  });
}

function processRoomAction(actionType, issueIDs, location, region, roomName) {
  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('Logs');
  const data = logSheet.getDataRange().getValues();

  issueIDs.forEach(issueID => {
    const rowIndex = data.findIndex(row => row[5] == issueID) + 1;

    if (rowIndex > 0) {
      if (actionType === "Resolve") {
        logSheet.getRange(rowIndex, 9).setValue(true);
      } else if (actionType === "Ignore") {
        logSheet.getRange(rowIndex, 8).setValue(true);
      } else if (actionType === "Unignore") {
        logSheet.getRange(rowIndex, 8).clearContent();
      }
    } else {
      Logger.log(`Warning: Issue ID ${issueID} not found in Logs sheet.`);
    }
  });

  const targetSpreadsheetID = REGION_CONFIG[region].spreadsheetID;
  const sheetName = location + " Meet Device Status";

  const regionSheet = SpreadsheetApp.openById(targetSpreadsheetID).getSheetByName(sheetName);
  if (!regionSheet) throw new Error(`Sheet not found: ${sheetName}`);
  const regionData = regionSheet.getDataRange().getValues();

  let regionalRowIndex = regionData.findIndex(row => row[2] === roomName) + 1;

  if (regionalRowIndex > 0) {
    if (actionType === "Resolve") {
      regionSheet.getRange(regionalRowIndex, 12).setValue(true);
    } else if (actionType === "Ignore") {
      regionSheet.getRange(regionalRowIndex, 11).setValue(true);
    } else if (actionType === "Unignore") {
      regionSheet.getRange(regionalRowIndex, 11).setValue(false);
    }
  } else {
    Logger.log(`Warning: Room ${roomName} not found in ${sheetName}.`);
  }

  SpreadsheetApp.flush();
}

function updateRoomNotes(noteText, issueIDs) {
  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('Logs');
  const data = logSheet.getDataRange().getValues();

  issueIDs.forEach(issueID => {
    const rowIndex = data.findIndex(row => row[5] == issueID) + 1;

    logSheet.getRange(rowIndex, 10).setValue(noteText);
  });

  SpreadsheetApp.flush();
}

function getActiveAlertTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  const alertFunctions = ['auSlackAlertScheduler', 'nzSlackAlertScheduler', 'ukSlackAlertScheduler', 'usSlackAlertScheduler'];

  const props = PropertiesService.getScriptProperties();
  const triggerMeta = JSON.parse(props.getProperty('TRIGGER_META') || '{}');

  let activeTriggers = [];
  let meta, triggerId;

  triggers.forEach(trigger => {
    const triggerName = trigger.getHandlerFunction();

    if (alertFunctions.includes(triggerName)) {
      triggerId = trigger.getUniqueId();

      meta = triggerMeta[triggerId] || {
        region: triggerName.substring(0, 2).toUpperCase(),
        hour: 'Unknown'
      };

      activeTriggers.push({
        id: triggerId,
        region: meta.region,
        hour: meta.hour,
        day: meta.day || "N/A",
        frequency: meta.frequency || "daily",
        created: meta.created || new Date(0).toISOString()
      });
    }
  });

  // Sort by Creation Date
  activeTriggers.sort((a, b) => new Date(a.created) - new Date(b.created));

  return activeTriggers;
}

function createActiveAlertTrigger(region, hour, day, frequency) {
  const functionName = region.toLowerCase() + "SlackAlertScheduler";

  day = day.toUpperCase();

  const timezone = REGION_CONFIG[region].timezone;

  const builder = ScriptApp.newTrigger(functionName).timeBased().atHour(parseInt(hour)).inTimezone(timezone);

  if (frequency === "daily") {
    builder.everyDays(1);
  } else if (frequency === "weekly") {
    builder.onWeekDay(ScriptApp.WeekDay[day]).everyWeeks(1);
  } else if (frequency === "fortnightly") {
    builder.onWeekDay(ScriptApp.WeekDay[day]).everyWeeks(2);
  } else if (frequency === "monthly") {
    builder.onMonthDay(1);
  }

  const newTrigger = builder.create();
  const triggerId = newTrigger.getUniqueId();

  const props = PropertiesService.getScriptProperties();
  let triggerMeta = JSON.parse(props.getProperty('TRIGGER_META') || '{}');

  triggerMeta[triggerId] = {
    region: region,
    hour: hour,
    day: day ? day.toString() : "N/A",
    frequency: frequency,
    created: new Date().toISOString()
  }

  props.setProperty('TRIGGER_META', JSON.stringify(triggerMeta));

  return { success: true, id: triggerId };
}

function deleteAlertTrigger(triggerId) {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    let triggerDeleted = false;

    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getUniqueId() === triggerId) {
        ScriptApp.deleteTrigger(triggers[i]);
        triggerDeleted = true;
        break;
      }
    }

    const props = PropertiesService.getScriptProperties();
    let triggerMeta = JSON.parse(props.getProperty('TRIGGER_META') || '{}');

    if (triggerMeta[triggerId]) {
      delete triggerMeta[triggerId];
      props.setProperty('TRIGGER_META', JSON.stringify(triggerMeta));
    }

    return { success: true, deletedFromGoogle: triggerDeleted };
    
  } catch (err) {
    Logger.log("Failed to delete trigger: " + err.message);
    throw new Error("Trigger deletion failed: " + err.message);
  }
}