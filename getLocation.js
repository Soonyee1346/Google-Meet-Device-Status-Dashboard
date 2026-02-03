function getLocation(location) {
  if (REGION_CONFIG.AU.locations.includes(location)) {
    return REGION_CONFIG.AU;
  } else if (REGION_CONFIG.NZ.locations.includes(location)) {
    return REGION_CONFIG.NZ;
  } else if (REGION_CONFIG.UK.locations.includes(location)){
    return REGION_CONFIG.UK;
  } else if (REGION_CONFIG.US.locations.includes(location)){
    return REGION_CONFIG.US;
  } else {
    return null;
  }
}