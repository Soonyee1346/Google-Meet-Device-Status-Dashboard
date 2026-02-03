function slackAlertScheduler(region) {
  let slackMessage = "";
  const headers = ["Offline", "Camera", "Microphone", "Speaker", "Display", "Touch Display", "Application Load Failure"];

  region.locations.forEach(location => {

    // Scan each location status
    let sheetName = location + " Meet Device Status";
    const sheet = SpreadsheetApp.openById(region.spreadsheetID).getSheetByName(sheetName);
    if(!sheet) return;

    const data = sheet.getDataRange().getValues();
    for(let i = 1; i < data.length; i++){
      const row = data[i];

      //Ignore row if Ignore Checkbox is true
      if(row[10] == true){
        Logger.log(`Ignoring ${row[2]}`);
        continue;
      };

      // Gather details for response
      const roomNumber = row[1] ? `${row[1]}` : "";
      const room = row[2];

      // Each issue has a timestamp, those with timestamps are noted
      const issues = row.slice(3, 10).map((cell, index) => {
        return cell !== "" ? headers[index] : null; // When cell is not empty, return the peripheral that has issues
      }).filter(issue => issue !== null);

      // Add room details and issue to message
      if(issues.length > 0){ 
        slackMessage += `${location} - ${roomNumber} ${room} has issues: ${issues.join(', ')}\n`;
        Logger.log(`Creating an alert for ${room}`);
      }
    }
  })

  // Getting day so as to only run Weekdays
  const localTimeString = Utilities.formatDate(new Date(), region.timezone, "yyyy-MM-dd'T'HH:mm:ss");
  const localDate = new Date(localTimeString); 
  var dayOfWeek = localDate.getDay();

  if(slackMessage !== "" && dayOfWeek !== 0 && dayOfWeek !== 6){

    sendSlackAlert(region.webhookURL, `:alert-1: <${region.gDocURL}|Meet Hardware Check-In> :alert-1:\n\n${slackMessage}`);

  }
}

function sendSlackAlert(webhookURL, message){
  UrlFetchApp.fetch(webhookURL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: message})
    })
}