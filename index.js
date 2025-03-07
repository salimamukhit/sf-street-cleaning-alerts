const express = require("express");
const app = express();

const rotationToDirection = {
  0: 'North',
  359: 'North',
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
  console.info(`Server is running on port 3000`);
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

function getStreetSlope(coordinates) {
  const slope = (coordinates[1][1] - coordinates[0][1]) / (coordinates[1][0] - coordinates[0][0]);
  return slope;
}

function getCarSlope(rotation) {
  const step = 1/90;
  let x;
  let y; 
  if (rotation > 0 && rotation <= 90) {
    x = rotation * (step);
    y = 1 - x;
  } else if (rotation > 90 && rotation < 180) {
    x = (180 - rotation) * (step);
    y = (1 - x) * -1;
  } else if (rotation > 180 && rotation <= 270) {
    x = (180 - rotation) * (step);
    y = (1 + x) * -1;
  } else if (rotation > 270 && rotation < 360) {
    x = (360 - rotation) * (step) * -1;
    y = 1 + x;
  }

  return y / x;
}

function isParallelToLine(rotation, coordinates) {
  const streetSlope = getStreetSlope(coordinates);
  const carSlope = getCarSlope(rotation);
  return Math.abs(streetSlope - carSlope) <= 1.5;
}

function getCleaningTimeFromObject(carDirection, streetObject) {
  const carStreetSide = directionToStreetSide[carDirection];
  let cleaningTime;
  let parkedOnSide;
  Object.keys(streetObject.properties.Sides).forEach(side => {
    if (side.includes(carStreetSide) || carStreetSide.includes(side)) {
      parkedOnSide = side;
      cleaningTime = streetObject.properties.Sides[side].NextCleaning;
    }
  });
  return { nextCleaning: cleaningTime, parkedOnSide };
}

async function getNextCleaningTime() {
  const result = await fetch('https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data/neighborhoods/Marina.geojson');
  const marinaGeoJson = await result.json();
  // Test location: 101 Cervantes Boulevard, NorthWest rotation. Has to retrieve Cervantes Boulevard
  const myLocation = { coordinates: [-122.439706, 37.804484], rotation: 330 };
  const [myLong, myLat] = myLocation.coordinates;
  const myDirection = getDirection(myLocation.rotation);

  let closestStreetObj;
  let smallestDistance = 1000;

  for (const feature of marinaGeoJson.features) {
    const { coordinates } = feature.geometry;
    for (let i = 0; i < coordinates.length; i++) {
      const index1 = i === coordinates.length - 1 ? i - 1 : i;
      const index2 = i === coordinates.length - 1 ? i : i + 1;
      const couldBeParkedHere = isParallelToLine(myLocation.rotation, [coordinates[index1], coordinates[index2]]);
      if (couldBeParkedHere) {
        const [long, lat] = coordinates[i];
        const distance = Math.sqrt((myLong - long)*(myLong - long) + (myLat - lat)*(myLat - lat));
        if (distance < smallestDistance) {
          closestStreetObj = feature;
          smallestDistance = distance;
        }
      }
    }
  }

  const { nextCleaning, parkedOnSide } = getCleaningTimeFromObject(myDirection, closestStreetObj);
  return { nextCleaning, street: closestStreetObj.properties.StreetIdentifier, parkedOnSide };
}

getNextCleaningTime().then(({ nextCleaning, street, parkedOnSide }) => {
  console.log(nextCleaning, street, parkedOnSide);
  console.log(getCarSlope(45));
})
