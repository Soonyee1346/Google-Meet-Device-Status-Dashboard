function markAsResolved(location) {

  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('Logs');
  const processedLogSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('ProcessedLogs');
  const processedRows = processedLogSheet.getDataRange().getValues();
  const processedSet = new Set(processedRows.map(row => `${row[0]}|${row[1]}`));
    
  for (let i = 0; i < location.locations.length; i++) {
    const sheetName = `${location.locations[i]} Meet Device Status`;
    Logger.log("Reading sheet: " + sheetName);
    sheet = SpreadsheetApp.openById(location.spreadsheetID).getSheetByName(sheetName);
    if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
    sheetData = sheet.getDataRange().getValues();

    for (let j = 0; j < sheetData.length; j++) {
      let row = sheetData[j];

      if (row[11] == true){
        let serialNumber = row[0]; // Get SN
        let room = row[2]; //Get Room
        const query = `label:inbox -label:${CLOSED_LABEL_NAME} subject:"Google Meet hardware" subject:"${room}"`;
        const threads = GmailApp.search(query);

        if(threads.length == 0){
          Logger.log("Alert has been archived");
        } else{
          let timeStamp = Utilities.formatDate(new Date(), "Australia/Melbourne", "MM/dd/yyyy HH:mm:ss").trim(); //Get Time Stamp

          threads.forEach(thread => {
            const messages = thread.getMessages();
            const latestMessage = messages[messages.length - 1];
            const body = latestMessage.getPlainBody();

            let {
              roomName,
              serial,
              location,
              peripheral,
              issueOpenedDate,
              issueClosedDate,
              issueID
            } = extractProperties(body);

            Logger.log("Closing issue: " + issueID);

            createLog(processedSet, processedLogSheet, logSheet, timeStamp, location, roomName, serial, peripheral, issueID, "Closed");

            Logger.log(`Archiving ${issueID} email thread`);
            thread.addLabel(CLOSED_LABEL);
            thread.removeLabel(OPENED_LABEL);
            thread.moveToArchive();
          });
        }

        //Edit the Dashboard
        let rowIndex = j+1; // Get Row

        for(let k = 3; k < 10; k++){
          let colIndex = k + 1;

          sheet.getRange(rowIndex, colIndex).clearContent().setBackground("#00fc00");
          sheet.getRange(rowIndex, colIndex).setBorder(
            true, true, true, true, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM
          );
        }
        sheet.getRange(rowIndex, 12).setValue(false);
        Logger.log(serialNumber + " has been resolved.");
      } else {
        continue;
      }
    }
  }
}


