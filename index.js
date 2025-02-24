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
    }
  });

  return myDirection;
}

function getPossibleStreetSides(carDirection) {
  const possibleSides = [];
  Object.entries(directionToStreetSide).forEach(entry => {
    const direction = entry[0];
    const streetSide = entry[1];
    if (carDirection.includes(direction)) {
      possibleSides.push(streetSide);
    }
  });

  return possibleSides;
}

async function getNextCleaningTime() {
  const result = await fetch('https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data/neighborhoods/Marina.geojson');
  const marinaGeoJson = await result.json();
  // Test location: 59 Rico Way, SouthWest rotation. Has to retrieve the cleaning schedule for Rico Way North Side (which it does)
  const myLocation = { coordinates: [-122.439612, 37.804950], rotation: 330 };
  const [myLong, myLat] = myLocation.coordinates;
  const myDirection = getDirection(myLocation.rotation);
  const possibleStreetSides = getPossibleStreetSides(myDirection);

  let closestStreetObj;
  let smallestDistance = 1000;

  for (const feature of marinaGeoJson.features) {
    let isPossibleSide = false;
    for (const streetSide of possibleStreetSides) {
      if (feature.properties.Sides[streetSide]) {
        isPossibleSide = true;
        break;
      }
    }

    if (isPossibleSide) {
      const { coordinates } = feature.geometry;
      // iterate through every coordinate of the street and determine the distance between my location and the coordinate
      coordinates.forEach(coordinate => {
        const [long, lat] = coordinate;
        const distance = Math.sqrt((myLong - long)*(myLong - long) + (myLat - lat)*(myLat - lat));
        if (distance < smallestDistance) {
          closestStreetObj = feature;
          smallestDistance = distance;
        }
      });
    }
  }

  let nextCleaning;
  for (const [side, schedule] of Object.entries(closestStreetObj.properties.Sides)) {
    if (possibleStreetSides.includes(side)) {
      nextCleaning = schedule.NextCleaning;
      break;
    }
  }

  return nextCleaning;
}

getNextCleaningTime().then(nextCleaning => {
  console.log('Next cleaning time is', nextCleaning);
})
