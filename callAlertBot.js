// Alert Bot in Slack
function auSlackAlertScheduler() {
  const region = REGION_CONFIG.AU;

  slackAlertScheduler(region);
}

function nzSlackAlertScheduler() {
  const region = REGION_CONFIG.NZ;

  slackAlertScheduler(region);
}

function ukSlackAlertScheduler() {
  const region = REGION_CONFIG.UK;

  slackAlertScheduler(region);
}

function usSlackAlertScheduler() {
  const region = REGION_CONFIG.US;

  slackAlertScheduler(region);
}