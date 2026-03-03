// Logs processed logs to avoid duplicates
function createLog(processedSet, processedLogSheet, logSheet, timeStamp, location, roomName, serial, peripheral, issueID, status) {
  const key = `${issueID}|${status}`;

  if (processedSet.has(key)) {
    return; // is logged
  }

  processedLogSheet.appendRow([issueID, status]);
  processedSet.add(key);
  logSheet.appendRow([
    timeStamp,
    location,
    roomName,
    serial,
    peripheral,
    issueID,
    status,
    "",
    "",
    ""
  ]);

  const lastRow = logSheet.getLastRow();

  logSheet.getRange(lastRow, 8, 1, 2).insertCheckboxes().setValue(false);
}