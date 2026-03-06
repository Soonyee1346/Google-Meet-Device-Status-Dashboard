function globalResolve() {
  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('Logs');
  const processedLogSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('ProcessedLogs');
  const processedRows = processedLogSheet.getDataRange().getValues();
  const processedSet = new Set(processedRows.map(row => `${row[0]}|${row[1]}`));
  const currentOpenSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName("CurrentOpenIssues");
  if (!currentOpenSheet) throw new Error(`Sheet not found: CurrentOpenIssues`);
  const currentOpenData = currentOpenSheet.getDataRange().getValues();

  let issuesToResolve = [];

  for (let i = 1; i < currentOpenData.length; i++) {
    let row = currentOpenData[i];
    if (row[7] == "TRUE" || row[7] == true) {
      issuesToResolve.push({
        location: row[1],
        room: row[2],
        serial: row[3],
        peripheral: row[4],
        issueID: row[5]
      });
    }
  }

  // Only call Gmail if there is actually work to do
  if (issuesToResolve.length > 0) {
    Logger.log(`Issues to resolve: ${issuesToResolve.length}`);
    const closedLabel = getOrCreateLabel(CLOSED_LABEL_NAME);
    const openedLabel = getOrCreateLabel(OPENED_LABEL_NAME);

    // Batch query
    const idQueries = issuesToResolve.map(issue => `subject:"${issue.issueID}"`).join(" OR ");
    const query = `label:inbox -label:${CLOSED_LABEL_NAME} (${idQueries})`;
    const threads = GmailApp.search(query); 
    
    let timeStamp = Utilities.formatDate(new Date(), "Australia/Melbourne", "MM/dd/yyyy HH:mm:ss").trim();
    
    // Handle threads
    threads.forEach(thread => {
      thread.addLabel(closedLabel);
      thread.removeLabel(openedLabel);
      thread.moveToArchive();
      thread.markRead();
    });

    // Log
    issuesToResolve.forEach(issue => {
      createLog(processedSet, processedLogSheet, logSheet, timeStamp, issue.location, issue.room, issue.serial, issue.peripheral, issue.issueID, "Closed");
      syncToRegionalSheet(issue.location, issue.room, "Resolve");
      Logger.log("Closed and Synced issue: " + issue.issueID);
    });
  } else {
    Logger.log("No issues to resolve");
  }

  Logger.log("globalResolve done.");
}

function syncToRegionalSheet(locationName, roomName, action) {
  const locationInfo = getLocation(locationName);
  if (!locationInfo) return;

  const sheetName = `${locationName} Meet Device Status`;
  const sheet = SpreadsheetApp.openById(locationInfo.spreadsheetID).getSheetByName(sheetName);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  const rowIndex = data.findIndex(row => row[2] === roomName) + 1;

  if (rowIndex > 0) {
    if (action === "Resolve") {
      for (let col = 4; col <= 10; col++) {
        sheet.getRange(rowIndex, col).clearContent().setBackground("#00fc00");
      }
      sheet.getRange(rowIndex, 12).setValue(false);
    }
  }
}