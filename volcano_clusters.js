/*jslint browser:true */
/*globals jQuery Worker map */

(function($) {

  var min_x, min_y, max_x, max_y, width, height;

  function setBounds(clusters) {
    var i, j, x, y;

    if (typeof min_x === 'undefined') {
      
      min_x = Infinity;
      min_y = Infinity;
      max_x = -Infinity;
      max_y = -Infinity;

      for (i = 0; i < clusters.length; i += 1) {
        for (j = 0; j < clusters[i].length; j += 1) {
          x = clusters[i][j].lng;
          y = clusters[i][j].lat;

          // Adjust for coordinates crossing 180 degree line.
          if (x < 0.0) {
            x = x + 360;
          }
          
          // Unwrap longitude coordinates.
          x = x * Math.cos((clusters[i][j].lat * 2.0 * Math.PI) / 360);
          
          if (x < min_x) {
            min_x = x;
          }

          if (y < min_y) {
            min_y = y;
          }

          if (x > max_x) {
            max_x = x;
          }

          if (y > max_y) {
            max_y = y;
          }

        }
      }
    }
  }

  function drawClusters(clusters) {
    var canvas, ctx;
    canvas = $('#main_canvas');
    if (canvas.getContext) {

      setBounds(clusters);
      width  = width  || canvas.attr('width');
      height = height || canvas.attr('height');
  
      ctx = canvas.getContext('2d');
      ctx.fillStyle = "rgb(200, 0, 0)";
  
      map(function(cluster) {
        map(function(volcano) {
          var x, y, size, scale;
        
          x = volcano.lng;
          y = volcano.lat;
          
          // Adjust for coordinates crossing 180 degree line.
          if (x < 0.0) {
            x = x + 360;
          }
          
          // Unwrap longitude coordinates.
          x = x * Math.cos((volcano.lat * 2.0 * Math.PI) / 360);
 
          // Scale coordinates to fit the canvas.
          scale = Math.min(width / (max_x - min_x), height / (max_y - min_y));
          x = (x - min_x) * scale;
          y = (y - min_y) * scale;
          
          ctx.fillRect(x, y, 3, 3);
  
        }, cluster);
      }, clusters);
  
    } else {
      // TODO: canvas not supported.
    }
  }
  
  var worker = new Worker('volcano_worker.js');
  worker.onmessage = function(event) {
    drawClusters(event.data);
  };

})(jQuery);
