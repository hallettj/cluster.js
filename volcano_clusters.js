/*globals load print cluster */

load('cluster.js');

var volcanos;

function readJSON(data) {
  volcanos = data;
}
load('volcanos.json');

// Returns the distance between two objects in meters.
function geo_distance(a, b) {
  var meters_per_degree = 111132.09;
  return (Math.sqrt(Math.pow(meters_per_degree * (a.lat - b.lat), 2) +
          Math.pow(meters_per_degree * (a.lng - b.lng) * Math.cos((a.lat * 2.0 * Math.PI) / 360.0), 2)));
}

var clusters = cluster(geo_distance, volcanos);
print(clusters.length);
