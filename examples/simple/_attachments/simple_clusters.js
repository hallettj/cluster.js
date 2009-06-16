/*jslint browser:true */
/*globals jQuery Worker map cluster */

(function($) {
 var elements, coord_func;

 elements = [[1,0], [0,1], [3,2], [2,3]];

 coord_func = function(e) {
  return [e[0], e[1]];
 };

 $(document).ready(function() {
   var worker = new Worker('simple_worker.js');
   worker.onmessage = function(evnt) {
     if (evnt.data.length && evnt.data.length > 0) {
       cluster.drawClusters(coord_func, evnt.data);
     } else {
       $('#spinner').hide();
     }
   };
   worker.onerror = function(evnt) {
     console.log(evnt);
   };
   worker.postMessage(elements);
 });

})(jQuery);

