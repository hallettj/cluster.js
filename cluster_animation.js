/*jslint browser:true */
/*globals cluster $ Worker map reduce */

//cluster.colors = (function() {
//  var i, colors = [];
//  function randCol() {
//    return Math.floor(Math.random() * 255);
//  }
//  for (i = 0; i < 200; i += 1) {
//    colors.push('rgb('+ randCol() + ',' + randCol() + ',' + randCol() + ')');
//  }
//  return colors;
//})();

cluster.colors = {};

cluster.random_color = function() {
  function randCmp() {
    return Math.floor(Math.random() * 255);
  }
  return ('rgb('+ randCmp() + ',' + randCmp() + ',' + randCmp() + ')');
};

cluster.setDrawingBounds = function(coord_func, clusters) {
  var i, j, x, y;

  if (typeof this.min_x === 'undefined') {

    this.min_x = Infinity;
    this.min_y = Infinity;
    this.max_x = -Infinity;
    this.max_y = -Infinity;

    for (i = 0; i < clusters.length; i += 1) {
      for (j = 0; j < clusters[i].length; j += 1) {
        x = coord_func(clusters[i][j])[0];
        y = coord_func(clusters[i][j])[1];

        if (x < this.min_x) {
          this.min_x = x;
        }

        if (y < this.min_y) {
          this.min_y = y;
        }

        if (x > this.max_x) {
          this.max_x = x;
        }

        if (y > this.max_y) {
          this.max_y = y;
        }

      }
    }
  }
};

cluster.drawClusters = function(coord_func, clusters) {
  var canvas, ctx, max_size, that = this;
  canvas = $('#main_canvas')[0];
  if (canvas.getContext) {

    cluster.setDrawingBounds(coord_func, clusters);
    this.width  = this.width  || $(canvas).attr('width');
    max_size = this.width / (reduce('x+y.length', 0, clusters) + 1);
    this.height = this.height || $(canvas).attr('height') - max_size;

    ctx = canvas.getContext('2d');

    map(function(cluster, index) {
      var key, color;

      key = JSON.stringify(cluster[0]);
      color = that.colors[key];
      if (typeof color === 'undefined') {
        color = that.random_color();
        that.colors[key] = color;
      }

      ctx.fillStyle = color;

      map(function(element) {
        var coord, size = max_size, scale;

        coord = coord_func(element);

        // Scale coordinates to fit the canvas.
        scale = Math.min(that.width / (that.max_x - that.min_x), that.height / (that.max_y - that.min_y));
        coord[0] = (coord[0] - that.min_x) * scale;
        coord[1] = (coord[1] - that.min_y) * scale;

        ctx.fillRect(coord[0], coord[1], size, size);

      }, cluster);
    }, clusters);

  } else {
    // TODO: canvas not supported.
  }
};
