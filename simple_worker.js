/*globals cluster onmessage postMessage importScripts */

importScripts('to-function.js', 'functional.js', 'cluster.js');

function pausecomp(millis) {
  var date = new Date();
  var curDate = null;

  do { curDate = new Date(); }
  while(curDate-date < millis);
} 

onmessage = function(e) {
  var dist, elements, cluster_options;

  dist = cluster.euclidean_distance;
  elements = e.data;

  cluster_options = {
    linkage_criteria: cluster.average_linkage(dist),
    halting_condition: function(clusters, cluster_distance) {
      return clusters.length <= elements.length / 2;
    },
    callback: function(clusters) {
      postMessage(clusters);
      pausecomp(3000);
    }
  };

  cluster(dist, elements, cluster_options);
};
