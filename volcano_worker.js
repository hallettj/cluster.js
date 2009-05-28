/*globals volcanos cluster postMessage importScripts */

importScripts('to-function.js', 'functional.js', 'cluster.js', 'volcanos.json');

function pausecomp(millis) {
  var date = new Date();
  var curDate = null;

  do { curDate = new Date(); }
  while(curDate-date < millis);
} 

// Returns the distance between two objects in meters. Both objects must have
// 'lat' and 'lng' properties.
function geo_distance(a, b) {
  var a_x, a_y, b_x, b_y, meters_per_degree = 111132.09;
  a_x = meters_per_degree * a.lat;
  a_y = meters_per_degree * a.lng * Math.cos((a.lat * 2.0 * Math.PI) / 360.0);
  b_x = meters_per_degree * b.lat;
  b_y = meters_per_degree * b.lng * Math.cos((b.lat * 2.0 * Math.PI) / 360.0);
  return cluster.euclidean_distance([a_x, a_y], [b_x, b_y]);
}

var cluster_options = { 
  linkage_criteria: cluster.average_linkage(geo_distance),
  halting_condition: function(clusters, cluster_distance) { 
    return cluster_distance >= 800000;
  },
  callback: function(clusters) {
    postMessage(clusters);
    pausecomp(100);
  }
};

cluster(geo_distance, volcanos, cluster_options);

postMessage([]); // Signals that clustering is finished.
