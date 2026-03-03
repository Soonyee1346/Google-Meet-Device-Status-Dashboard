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

function processRoomAction(actionType, indicesArray, location, region, roomName) {
  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('CurrentOpenIssues');
  const targetSpreadsheetID = REGION_CONFIG[region].spreadsheetID;

  const sheetName = location + " Meet Device Status"

  const regionSheet = SpreadsheetApp.openById(targetSpreadsheetID).getSheetByName(sheetName);
  if (!regionSheet) throw new Error(`Sheet not found: ${sheetName}`);
  const regionData = regionSheet.getDataRange().getValues();

  let rowIndex = regionData.findIndex(row => row[2] === roomName) + 1;

  indicesArray.forEach(index => {
    const sheetRow = index + 2;

    if (actionType === "Resolve") {
      logSheet.getRange(sheetRow, 8).setValue("Resolved");
    } else if (actionType === "Ignore") {
      logSheet.getRange(sheetRow, 7).setValue("Ignored");
    } else if (actionType === "Unignore") {
      logSheet.getRange(sheetRow, 7).clearContent();
    }
  });

  if (actionType === "Resolve") {
    regionSheet.getRange(rowIndex, 12).setValue(true);
  } else if (actionType === "Ignore") {
    regionSheet.getRange(rowIndex, 11).setValue(true);
  } else if (actionType === "Unignore") {
    regionSheet.getRange(rowIndex, 11).setValue(false);
  };

  SpreadsheetApp.flush();
}

function updateRoomNotes(noteText, indicesArray) {
  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('CurrentOpenIssues');
  
  indicesArray.forEach(index => {
    const sheetRow = index + 2;
    
    logSheet.getRange(sheetRow, 9).setValue(noteText); 
  });

  SpreadsheetApp.flush();
}