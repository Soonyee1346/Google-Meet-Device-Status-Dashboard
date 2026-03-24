function slackAlertScheduler(region) {
  let slackMessage = "";

  const sheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName("CurrentOpenIssues");
  if (!sheet) return;

  const allData = sheet.getDataRange().getValues();
  if (allData.length <= 1) return;
  
  const data = allData.slice(1).filter(row => region.locations.includes(row[1]));

  if (data.length > 0) {
    let groupedRooms = {};

    for (let i = 0; i < data.length; i++) {
      let row = data[i];

      if (row[6] === true || row[6] === "TRUE" || row[7] === true || row[7] === "TRUE") {
        Logger.log(`Skipping ignored/resolved issue for ${row[2]}`);
        continue;
      }

      let location = row[1];
      let room = row[2];
      let peripheral = row[4];

      // If this is the first time we are seeing this room, create an entry for it
      if (!groupedRooms[room]) {
        groupedRooms[room] = {
          location: location,
          issues: []
        };
      }
      groupedRooms[room].issues.push(peripheral);
    }

    for (const roomName in groupedRooms) {
      const roomData = groupedRooms[roomName];
      slackMessage += `*${roomData.location} - ${roomName}* has issues: ${roomData.issues.join(', ')}\n`;
      Logger.log(`Creating an alert for ${roomName}`);
    }
  }

  // Getting day so as to only run Weekdays
  const localTimeString = Utilities.formatDate(new Date(), region.timezone, "yyyy-MM-dd'T'HH:mm:ss");
  const localDate = new Date(localTimeString);
  var dayOfWeek = localDate.getDay();

  if (slackMessage !== "" && dayOfWeek !== 0 && dayOfWeek !== 6) {

    sendSlackAlert(region.webhookURL, `:alert-1: <${DASHBOARD_URL}|Meet Hardware Check-In> :alert-1:\n\n${slackMessage}`);

  }
}

function sendSlackAlert(webhookURL, message) {
  UrlFetchApp.fetch(webhookURL, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ text: message })
  })
}