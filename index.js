const express = require("express");
const app = express();

const directions = {
  0: 'North',
  45: 'NorthEast',
  90: 'East',
  135: 'SouthEast',
  180: 'South',
  225: 'SouthWest',
  270: 'West',
  315: 'NorthWest',
};

const carDirectionToStreetSide = {
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
  // Rico Way street between Avila and Retiro
  const coordinates = [ [ -122.438141726427006, 37.804929656543003 ], [ -122.438817461097997, 37.804848769625998 ], [ -122.438975644593995, 37.804854386000997 ], [ -122.439124591332003, 37.804881403631001 ], [ -122.439248915598995, 37.804924487843998 ], [ -122.440328098742, 37.805498532663002 ] ]

  const myCoordinate = [-122.438488, 37.804844];

  let longDiffs = 0;
  let latDiffs = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [long, lat] = coordinates[i];
    const [nextLong, nextLat] = coordinates[i+1];

    longDiffs += Math.abs(nextLong - long);
    latDiffs += Math.abs(nextLat - lat);
  }

  const longGradient = longDiffs / coordinates.length;
  const latGradient = latDiffs / coordinates.length;

  const streetDirection = latGradient > longGradient ? 'vertical' : 'horizontal';

  const [topLong, topLat] = coordinates[0];
  const [bottomLong, bottomLat] = coordinates[coordinates.length - 1];
  const maxLong = Math.max(topLong, bottomLong);
  const minLong = Math.min(topLong, bottomLong);
  const maxLat = Math.max(topLat, bottomLat);
  const minLat = Math.min(topLat, bottomLat);
  const [long, lat] = myCoordinate;
  const isOnStreet = maxLong > long && minLong < long && maxLat > lat && minLat < lat;
  res.send({ minLat, maxLat, minLong, maxLong, lat, long, isOnStreet });
});

app.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});

async function getNextCleaningTime() {
  let streetObj;
  const myLocation = { coordinates: [-122.439612, 37.804950], rotation: 330 };
  const matchStreetObjects = [];
  const [myLong, myLat] = myLocation.coordinates;
  const result = await fetch('https://raw.githubusercontent.com/kaushalpartani/sf-street-cleaning/refs/heads/main/data/neighborhoods/Marina.geojson');
  const marinaGeoJson = await result.json();
  for (const feature of marinaGeoJson.features) {
    const { coordinates } = feature.geometry;
    const [firstLong, firstLat] = coordinates[0];
    const [lastLong, lastLat] = coordinates[coordinates.length - 1];
    const maxLong = Math.max(firstLong, lastLong);
    const minLong = Math.min(firstLong, lastLong);
    const maxLat = Math.max(firstLat, lastLat);
    const minLat = Math.min(firstLat, lastLat);
    const inRangeLong = maxLong > myLong && myLong > minLong;
    const inRangeLat = maxLat > myLat && myLat > minLat;
    if (inRangeLong && inRangeLat) {
      streetObj = feature;
      break;
    } else if (inRangeLat || inRangeLong) {
      matchStreetObjects.push({ feature, inRangeLat, inRangeLong });
    }
  }

  console.log(matchStreetObjects);
}

getNextCleaningTime();
