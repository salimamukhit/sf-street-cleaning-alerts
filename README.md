# SF Street Cleaning Alerts

This repository represents the portion of the project that determines the street location and next street cleaning, given the GPS readings (longitude and latitude) from the parked car, as well as the compass heading (0-359 degrees)

### Motivation
Street parking in Marina, SF is painful. Getting parking tickets due to street cleaning is even more painful. Sometimes after a long day, when you finally find that parking spot, you are so happy that you forget to check a street cleaning sign.

In an ideal world you would always add a calendar reminder/ or set an alarm to next day to move your car, but sometimes that just doesn’t happen. Therefore, we decided to automate that process to the best of our ability.

### Available Data
The SF street cleaning data is open source, available on SFMTA website. The dataset includes coordinate bounds of each SF neighborhood and then each SF neighborhood has its own dataset with detailed information: what are the street coordinates and street cleaning schedule for each neighborhood. For example: Beach street between Fillmore and Retiro, North Side, next cleaning is at Tuesday March 3rd, 2025.

### Approach

There is a fair amount of uncertainty in determining the exact location of an object. For example, if an object is located at the corner, it could be either of the intersected streets. Not to mention it does not provide an exact side of the street, which is not precise enough for our goal. And that is where the need for compass heading comes in.

In vast majority of cases the car would be parked parallel to the street. So, for instance if the street prolongs from South-East to North-West, the car parked on that street would have a compass heading of ~315 degrees.
If the car is on the corner, the compass heading would indicate which street it is actually located on. Rarely does it happen that a car would be parked “vertically” on a horizontal street.

![diagram1](https://github.com/user-attachments/assets/7d69ecc0-fb74-42b8-8463-03ca39023dac)

1. Iterate through all the street corridors of the neighborhood.
2. Identify points such that if a line is drawn between them, the slope of that line is the same as the arrow of the compass.

![diagram2](https://github.com/user-attachments/assets/7222e4cc-e154-4ebe-aa00-764c3e10e205)

3. If this is satisfied, and slope is approximately the same, find a point that is closest to the car's location.
4. The point of the street is the street the car is parked on.
5. Now, knowing the car’s compass heading and possible street sides of that street, determine which exact side the car is on
6. Once that is determined, fetch the next street cleaning time and schedule an alert to user’s phone

### Things to consider

1. There are a few streets where a parked car is not necessarily parallel to the street. For example, wide streets with “tree” parking. Those streets need to be handled separately
2. One-way streets. If a car is parked on such street, then the alert should be sent twice - for both sides.
