function extractProperties(body) {
  const singleLineBody = body.replace(/\r?\n/g, ' '); // to find room names that are on separate lines

  // Gathers unformatted properties
  const roomMatch = singleLineBody.match(/Google Meet hardware (.+?)\./i);
  const serialMatch = body.match(/Serial number:\s*(.*)/i);
  const locationMatch = body.match(/Annotated location:\s*(.*)/i);
  const issueMatch = body.match(/Issue:\s*(.*)/i);
  const issueOpenedMatch = body.match(/Issue opened:\s*(.*)/i);
  const issueClosedMatch = body.match(/Issue closed:\s*(.*)/i);
  const issueidMatch = body.match(/Issue id:\s*(\d+)/i);

  // Formats properties
  if (roomMatch) roomName = roomMatch[1].trim();
  if (serialMatch) serial = serialMatch[1].trim();
  if (locationMatch) location = locationMatch[1].trim();
  if (issueOpenedMatch) issueOpenedDate = new Date(issueOpenedMatch[1].trim());
  if (issueClosedMatch) issueClosedDate = new Date(issueClosedMatch[1].trim());
  if (issueidMatch) issueID = issueidMatch[1].trim();

  // Assign correct peripheral
  if (issueMatch) {
    const rawPeripheral = issueMatch[1].toLowerCase().trim();
    const match = rawPeripheral.match(/(application load failure|camera|microphone|speaker|display|touch display|controller|offline|monitor)/i);
    if (match) peripheral = match[1];
  }

  // Clean up room name (new lines in Gmail)
  if (roomMatch) {
    roomName = roomMatch[1]
      .replace(/\s+/g, ' ') // Replace multiple whitespace (including tabs/newlines) with a single space
      .trim();              // Trim leading/trailing whitespace
  }

  return {roomName, serial, location, peripheral, issueOpenedDate, issueClosedDate, issueID};
  
}
