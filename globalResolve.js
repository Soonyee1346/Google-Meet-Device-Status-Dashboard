function globalResolve() {
  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('Logs');
  const processedLogSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('ProcessedLogs');
  const processedRows = processedLogSheet.getDataRange().getValues();
  const processedSet = new Set(processedRows.map(row => `${row[0]}|${row[1]}`));
  const currentOpenSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName("CurrentOpenIssues");
  if (!currentOpenSheet) throw new Error(`Sheet not found: CurrentOpenIssues`);
  const currentOpenData = currentOpenSheet.getDataRange().getValues();

  for (let i = 1; i < currentOpenData.length; i++) {
    let row = currentOpenData[i];

    if (row[7] == "TRUE" || row[7] == true) {
      let location = row[1];
      let room = row[2];
      let serial = row[3];
      let peripheral = row[4];
      let issueID = row[5];
      const closedLabel = getOrCreateLabel(CLOSED_LABEL_NAME);
      const openedLabel = getOrCreateLabel(OPENED_LABEL_NAME);
      const query = `label:inbox -label:${CLOSED_LABEL_NAME} subject:"${issueID}"`;
      const threads = GmailApp.search(query);

      if (threads.length <= 0) {
        Logger.log("Alert has been archived");
      } else {
        let timeStamp = Utilities.formatDate(new Date(), "Australia/Melbourne", "MM/dd/yyyy HH:mm:ss").trim();

        threads.forEach(thread => {
          Logger.log(`Archiving ${issueID} email thread`);
          thread.addLabel(closedLabel);
          thread.removeLabel(openedLabel);
          thread.moveToArchive();
        });

        createLog(processedSet, processedLogSheet, logSheet, timeStamp, location, room, serial, peripheral, issueID, "Closed");
        Logger.log("Closing issue: " + issueID);
      }

      //Edit the Dashboard
      syncToRegionalSheet(location, room, "Resolve")
    }
  }

  Logger.log("globalResolve done.")
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
