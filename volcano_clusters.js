/*jslint browser:true */
/*globals jQuery Worker cluster map */

(function($) {

 function coord_func(e) {
   var x, y;

   x = e.lng;
   y = e.lat;

   // Handle case where coordinates wrap over 0 degrees longitude.
   if (x < 0) {
     x += 360;
   }

   // Scale longitude degrees appropriately for the given latitude.
   x = x * Math.cos((y * 2.0 * Math.PI) / 360);

   return [x, y];
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
