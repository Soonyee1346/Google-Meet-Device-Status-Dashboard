function processMeetHardwareStatus() {

  // Only emails that are in inbox and have specific subject line
  const query = `label:inbox -label:${CLOSED_LABEL_NAME} subject:"Google Meet hardware" subject:"Issue id"`; 
  const threads = GmailApp.search(query);

  const sheetsCache = new Map(); // Cache sheet objects and data
  const processedIDs = new Set(); // Set containing IDs that have been processed already
  const processedOpenIDs = new Set();

  // Add Issue Id to processedIDs if it is closed
  // Add thread to processed Open Threads if it is still open with no closed response
  threads.forEach(thread => {
    const messages = thread.getMessages();
    const labels = thread.getLabels();

    for (const message of messages){
      const body = message.getPlainBody();
      const closedMatch = body.match(/Issue closed:\s*(.*)/i);
      const issueidMatch = body.match(/Issue id:\s*(\d+)/i);

      if(closedMatch && issueidMatch){
        const issueID = issueidMatch[1].trim();
        // Checking if thread doesn't have a closed message
        if (labels && labels.length > 0 && messages.length == 1 && labels[0].getName() == OPENED_LABEL_NAME) {
          processedOpenIDs.add(issueID); // Adding already opened IDs to Opened Set
        }
        if(!closedMatch[1].toLowerCase().includes("ongoing")){
          processedIDs.add(issueID);
        }
      }
    }
  })

  const logSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('Logs');
  const processedLogSheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('ProcessedLogs');
  const processedRows = processedLogSheet.getDataRange().getValues();
  const processedSet = new Set(processedRows.map(row => `${row[0]}|${row[1]}`));

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

    if(processedOpenIDs.has(issueID) && !processedIDs.has(issueID)){ // If already opened, with no closed message return.
      Logger.log(`${thread.getFirstMessageSubject()} is already open and not closed. Skipping.`);
      return;
    }

    if(location.includes("'")){
      location = location.replace(/'/g, "");
    }

    Logger.log("Serial Number: " + serial);
    Logger.log("Is Resolved: " + processedIDs.has(issueID));
    Logger.log("Location: " + location);
    Logger.log("Room: " + roomName);

    if (!serial || !peripheral) return;

    const locationInfo = getLocation(location); // Gets regional object REGION_CONFIG

    if(!locationInfo) return;
    
    const sheetName = `${location} Meet Device Status`;

    Logger.log("Editing sheet: " + sheetName);

    // Caching data from sheet, avoiding having to read the same data multiple times
    let sheetData, sheet;
    if (sheetsCache.has(sheetName)) {
      ({ sheet, data: sheetData } = sheetsCache.get(sheetName));
    } else {
      sheet = SpreadsheetApp.openById(locationInfo.spreadsheetID).getSheetByName(sheetName);
      if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
      sheetData = sheet.getDataRange().getValues();
      sheetsCache.set(sheetName, { sheet, data: sheetData });
    }

    // Find or create row based off room name
    let rowIndex = sheetData.findIndex(row => row[2] === roomName) + 1;
    
    // If no entry is found, create a row
    if (rowIndex === 0) {
      sheet.appendRow([serial, "", roomName, "", "", "", "", "", "", ""]);
      sheetData = sheet.getDataRange().getValues(); // Refresh data
      sheetsCache.set(sheetName, { sheet, data: sheetData }); // Update cache
      rowIndex = sheetData.findIndex(row => row[0] === serial) + 1;

      Logger.log(rowIndex);

      for (let col = 4; col <= 10; col++) {
        sheet.getRange(rowIndex, col).setBackground("#00fc00");
        sheet.getRange(rowIndex, col).setBorder(
          true, true, true, true, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM
        );
      }

      for(let check = 11; check < 13; check++){
        sheet.getRange(rowIndex, check).insertCheckboxes();
        sheet.getRange(rowIndex, check).setValue(false);
        sheet.getRange(rowIndex, check).setBorder(
          true, true, true, true, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM
        );
      }

      Logger.log("New entry for " + serial + " has been created.")
    } else {
      const existingSerial = sheetData[rowIndex - 1][0];

      // If serial number has changed, change serial
      if (existingSerial != serial) {
        sheet.getRange(rowIndex, 1).setValue(serial);
      }
    }

    const col = COLUMN_MAP[peripheral];
    if (!col) return;

    let timeStamp = '';

    if (processedIDs.has(issueID)) {
      sheet.getRange(rowIndex, col).clearContent().setBackground("#00fc00");
      thread.removeLabel(OPENED_LABEL)
      thread.addLabel(CLOSED_LABEL);
      thread.moveToArchive();
      Logger.log(serial + " has been resolved.");
      timeStamp = issueClosedDate;
    } else {
      let regionalTime = Utilities.formatDate(issueOpenedDate, locationInfo.timezone, "dd-MM-yyyy HH:mm:ss");
      sheet.getRange(rowIndex, col).setBackground("#fc0000").setValue(regionalTime);
      Logger.log("Issue for " + serial + " has been opened.");
      timeStamp = issueOpenedDate;
      thread.addLabel(OPENED_LABEL)
    }

    // Log all issues to Meet Device Status Logs
    let status = processedIDs.has(issueID) ? "Closed" : "Open";

    createLog(processedSet, processedLogSheet, logSheet, timeStamp, location, roomName, serial, peripheral, issueID, status);
  });
}