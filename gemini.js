/* Halted due to not having Gemini API Key

// Apps Script Entry point 
function doPost(e) {
  const params = e.parameter;
  const question = params.text;

  const answer = askGeminiQuestion(question);

  // Creates text answer, tells Slack that the response is plain/text
  return ContentService.createTextOutput(answer)
    .setMimeType(ContentService.MimeType.TEXT);
}

// Reads all logs, creates prompt to ask Gemini
function askGeminiQuestion(question){
  const sheet = SpreadsheetApp.openById(LOGS_SPREADSHEET_ID).getSheetByName('Logs');
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1); // Gets rid of header

  // Collates all logs
  const logs = rows.map(row => {
    const [timeStamp, location, room, serial, peripheral, issueID, status] = row;

    // Formats the time for users and Gemini to read better
    const formattedTime = Utilities.formatDate(new Date(timeStamp), Session.getScriptTimeZone(), "yyyy-dd-MM HH:mm:ss");

    return `Timestamp: ${formattedTime}, Location: ${location}, Room: ${room}, Serial Number: ${serial}, Peripheral: ${peripheral}, Issue ID: ${issueID}, Status: ${status}`
  }).join("\n");

  // Prompt Creation
  const prompt = `
    Below is a log of Google Meet hardware issues.

    ${logs}

    Question: ${question}
    Answer:
      `;

  return queryGemini(prompt);
}

// Using API Key, gets response from Gemini
function queryGemini(prompt){
  // Taken from Gemini API quickstart guide
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
        ],
      },
    ],
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const options = {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);

  // Parse response into JSON object
  const result = JSON.parse(response.getContentText());

  // Gathers response from Gemini response (JSON)
  let reply = "Sorry, I couldn't understand the question.";
  try {
    reply = result['candidates'][0]['content']['parts'][0]['text'] || reply;
  } catch (err) {
    Logger.log("Error parsing Gemini response: " + err);
  }
  return reply;

}*/