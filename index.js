const express = require("express");
const app = express();

const rotationToDirection = {
  0: 'North',
  45: 'NorthEast',
  90: 'East',
  135: 'SouthEast',
  180: 'South',
  225: 'SouthWest',
  270: 'West',
  315: 'NorthWest',
};

const directionToStreetSide = {
  'North': 'East',
  'South': 'West',
  'East': 'South',
  'West': 'North',
  'NorthEast': 'SouthEast',
  'SouthWest': 'NorthWest',
  'NorthWest': 'NorthEast',
  'SouthEast': 'SouthWest',
};

app.get("/", (req, res) => {
  res.send('SF Street Cleaning Alerts');
});

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});

function getDirection(rotation) {
  let smallestDiff = 1000;
  let myDirection;

  Object.entries(rotationToDirection).forEach(entry => {
    const degrees = Number(entry[0]);
    const direction = entry[1];
    const diff = Math.abs(rotation - degrees);
    if (diff < smallestDiff) {
      myDirection = direction;
      smallestDiff = diff;
    }
  });

  return myDirection;
}

function getStreetSide(carDirection) {
  return directionToStreetSide[carDirection];
}

// TODO function isParallelToLine(rotation, coordinates)

async function getNextCleaningTime() {
  const result = await fetch('https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data/neighborhoods/Marina.geojson');
  const marinaGeoJson = await result.json();
  // Test location: 101 Cervantez Boulevard, NorthWest rotation. Has to retrieve Cervantez Boulevard
  const myLocation = { coordinates: [-122.439706, 37.804484], rotation: 315 };
  const [myLong, myLat] = myLocation.coordinates;
  const myDirection = getDirection(myLocation.rotation);
  const streetSide = getStreetSide(myDirection);
  console.log({ myDirection, possibleStreetSides: streetSide });

  let closestStreetObj;
  let smallestDistance = 1000;

  for (const feature of marinaGeoJson.features) {
    // TODO: instead of filtering it here, filter it when determining the sides of the street
    if (feature.properties.Sides[streetSide]) {
      const { coordinates } = feature.geometry;
      // iterate through every possible line of the coordinates and get the distance between this line and a point
      coordinates.forEach(coordinate => {
        const [long, lat] = coordinate;
        const distance = Math.sqrt((myLong - long)*(myLong - long) + (myLat - lat)*(myLat - lat));
        if (distance < smallestDistance) {
          closestStreetObj = feature;
          smallestDistance = distance;
          console.log(closestStreetObj.properties.Corridor)
        }
      });
    }
  }

  let nextCleaning;
  for (const [side, schedule] of Object.entries(closestStreetObj.properties.Sides)) {
    if (streetSide.includes(side)) {
      console.log({ side, street: closestStreetObj.properties.Corridor });
      nextCleaning = schedule.NextCleaning;
      break;
    }
  }

  return nextCleaning;
}

getNextCleaningTime().then(nextCleaning => {
  console.log('Next cleaning time is', nextCleaning);
})
