function manuallyLinkExistingTrigger() {
  const TARGET_FUNCTION = 'auSlackAlertScheduler'; // The function your trigger calls
  const REGION = 'AU';
  const HOUR = '14'; // The hour you originally set (in 24h format)

  const triggers = ScriptApp.getProjectTriggers();
  const props = PropertiesService.getScriptProperties();
  
  // Fetch existing meta or create empty object if it doesn't exist
  let triggerMeta = JSON.parse(props.getProperty('TRIGGER_META') || '{}');
  let found = false;

  triggers.forEach(t => {
    if (t.getHandlerFunction() === TARGET_FUNCTION) {
      const id = t.getUniqueId();
      
      // Add to our metadata object
      triggerMeta[id] = {
        region: REGION,
        hour: HOUR
      };
      
      found = true;
      Logger.log(`Linked Trigger ID: ${id} to ${REGION} at ${HOUR}:00`);
    }
  });

  if (found) {
    // Save the updated object back to Script Properties
    props.setProperty('TRIGGER_META', JSON.stringify(triggerMeta));
    Logger.log('Success: Metadata updated.');
  } else {
    Logger.log('Error: No trigger found for function: ' + TARGET_FUNCTION);
  }
}