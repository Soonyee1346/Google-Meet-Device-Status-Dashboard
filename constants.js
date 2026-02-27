const props = PropertiesService.getScriptProperties();

// Spreadsheet IDs
const AU_SPREADSHEET_ID = '13tfUY6hU2bvrFT3UbZ8lF3jUk9Sjhkv8NqVKpRoXy-s';
const NZ_SPREADSHEET_ID = '15clDS6MPlXD49XhXfEOu7xLR-XUoOc8qa27U6djmqIo';
const UK_SPREADSHEET_ID = '';
const US_SPREADSHEET_ID = '';
const LOGS_SPREADSHEET_ID = '1VhTxdblFpv71-z7LoPe3vynIbJyZ3yrItyK20XzhKMk';
const TEST_SPREADSHEET_ID = '1-DNxFsrqYtKHu93e2PvC6qLFgqsL8ES3Z0vyn-2M5LA'

// Labels
  // Create Label for threads that are closed
  const CLOSED_LABEL_NAME = "MeetAlert-Processed";
  const CLOSED_LABEL = getOrCreateLabel(CLOSED_LABEL_NAME);

  // Create Label for threads that are opened
  const OPENED_LABEL_NAME = "MeetAlert-Opened";
  const OPENED_LABEL = getOrCreateLabel(OPENED_LABEL_NAME);

// All Locations
const LOCATIONS = ["Melbourne", "Sydney", "Brisbane", "Canberra", "Singapore", "Auckland", "Wellington", "Hawkes Bay"];

// Regional Config
const REGION_CONFIG = {
  AU: {
    spreadsheetID: AU_SPREADSHEET_ID,
    gDocURL: 'https://docs.google.com/spreadsheets/d/13tfUY6hU2bvrFT3UbZ8lF3jUk9Sjhkv8NqVKpRoXy-s/',
    webhookURL: props.getProperty("Webhook_URL_AU"),
    locations: ["Melbourne", "Sydney", "Brisbane", "Canberra", "Singapore"],
    timezone: 'Australia/Melbourne'
  },
  NZ: {
    spreadsheetID: NZ_SPREADSHEET_ID,
    gDocURL: 'https://docs.google.com/spreadsheets/d/15clDS6MPlXD49XhXfEOu7xLR-XUoOc8qa27U6djmqIo/',
    webhookURL: '',
    locations: ["Auckland", "Wellington", "Hawkes Bay"],
    timezone: 'Pacific/Auckland'
  },
  UK: {
    spreadsheetID: UK_SPREADSHEET_ID,
    gDocURL: '',
    webhookURL: '',
    locations: [''],
    timezone: 'Europe/London'
  },
  US: {
    spreadsheetID: US_SPREADSHEET_ID,
    gDocURL: '',
    webhookURL: '',
    locations: [''],
    timezone: 'America/Denver'
  }
}

const COLUMN_MAP = {
  offline: 4,
  camera: 5,
  microphone: 6,
  speaker: 7,
  display: 8,
  monitor: 8,
  "touch display": 9,
  controller: 9,
  "application load failure": 10,
};