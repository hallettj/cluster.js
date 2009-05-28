/*jslint browser:true */
/*globals jQuery Worker map */

(function($) {

 $(document).ready(function() {
   var worker = new Worker('volcano_worker.js');
   worker.onmessage = function(event) {
     cluster.drawClusters(event.data);
   };
 });

})(jQuery);
