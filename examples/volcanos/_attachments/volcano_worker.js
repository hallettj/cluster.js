/*globals volcanos cluster postMessage importScripts */

importScripts('functional.min.js', 'cluster.js', 'volcanos.json');

function pausecomp(millis) {
  var date = new Date();
  var curDate = null;

  do { curDate = new Date(); }
  while(curDate-date < millis);
} 

function coord_func(e) {
  var x, y, meters_per_degree = 111132.09;

  x = e.lng;
  y = e.lat;

  // Handle case where coordinates wrap over 180/-180 degrees longitude.
  if (x < 0) {
    x += 360;
  }

  // Scale longitude degrees appropriately for the given latitude.
  x = x * Math.cos((y * 2.0 * Math.PI) / 360);

  // Return coordinates expressed as meters from 0, 0.
  return [x * meters_per_degree, y * meters_per_degree];
}

// Returns the distance between to objects in meters. Both objects must have
// 'lat' and 'lng' properties.
function geo_distance(a, b) {
  return cluster.euclidean_distance(coord_func(a), coord_func(b));
}

var cluster_options = { 
  linkage_criteria: cluster.average_linkage(geo_distance),
  halting_condition: function(clusters, cluster_distance) { 
    return cluster_distance >= 300000;  // Distance expressed in meters.
  },
  callback: function(clusters) {
    postMessage(clusters);
    //pausecomp(20);
  }
};

cluster(geo_distance, volcanos, cluster_options);

postMessage([]); // Signals that clustering is finished.
