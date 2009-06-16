/*jslint browser:true */
/*globals jQuery Worker cluster map */

(function($) {

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

 $(document).ready(function() {
   var worker = new Worker('volcano_worker.js');
   worker.onmessage = function(evnt) {
     if (evnt.data.length && evnt.data.length > 0) {
       cluster.drawClusters(coord_func, evnt.data);
     } else {
       $('#spinner').hide();
     }

   };
 });

})(jQuery);
