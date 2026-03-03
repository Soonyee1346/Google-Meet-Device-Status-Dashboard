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

    if (actionType === "Resolve") {
      logSheet.getRange(rowIndex, 9).setValue(true);
    } else if (actionType === "Ignore") {
      logSheet.getRange(rowIndex, 8).setValue(true);
    } else if (actionType === "Unignore") {
      logSheet.getRange(rowIndex, 8).clearContent(false);
    }
  });

  const targetSpreadsheetID = REGION_CONFIG[region].spreadsheetID;

  const sheetName = location + " Meet Device Status"

  const regionSheet = SpreadsheetApp.openById(targetSpreadsheetID).getSheetByName(sheetName);
  if (!regionSheet) throw new Error(`Sheet not found: ${sheetName}`);
  const regionData = regionSheet.getDataRange().getValues();

  let regionalRowIndex = regionData.findIndex(row => row[2] === roomName) + 1;

  if (actionType === "Resolve") {
    regionSheet.getRange(regionalRowIndex, 12).setValue(true);
  } else if (actionType === "Ignore") {
    regionSheet.getRange(regionalRowIndex, 11).setValue(true);
  } else if (actionType === "Unignore") {
    regionSheet.getRange(regionalRowIndex, 11).setValue(false);
  };

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