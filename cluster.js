// = cluster.js =
//
// Cluster analysis software implemented with JavaScript.

/*globals cluster load Functional _ map reduce select compose zip K */

Functional.install();

if (typeof Array.max === 'undefined') {

    // === {{{Array.max()}}} ===
    //
    // Returns the largest value in an array.

    Array.max = function(array) {
        return Math.max.apply(Math, array);
    };

}
if (typeof Array.min === 'undefined') {

    // === {{{Array.min()}}} ===
    //
    // Returns the smallest value in an arry.

    Array.min = function(array) {
        return Math.min.apply(Math, array);
    };
}
if (typeof Array.sum === 'undefined') {

    // === {{{Array.sum()}}} ===
    //
    // Returns the sum of all values in an array.

    Array.sum = function(array) {
        return reduce('x+y', 0, array);
    };
}

// === {{{cluster()}}} ===
//
// Given an array of elements, returns a new array with the original elements
// grouped into clusters based on a given distance function.
//
// Mandatary arguments are:
// * +distance+: A function that takes two elements as arguments and returns
// the distance between them.
// * +elements+: A list of elements to group into clusters.
//
// Additionally you may pass an object as a third argument to express
// additional parameters:
// * +linkage_criteria+: Function that is used to calculate distance between
// two clusters. The default is average linkage.
// * +halting_condition+: Function that is called before each iteration of the
// cluster merge algorithm. Cluster merging will continue until the return
// value of this function is true.
// * +callback+: Function that is called before each iteration of the
// algorithm. Use this for interactive analysis. For example, +callback+ can be
// used to draw a graphic representation of the clustering process at each
// step.

cluster = function(distance, elements, options) {
    var halting_condition, linkage_criteria, callback;

    distance = distance.toFunction();

    options = options || {};
    linkage_criteria = (options.linkage_criteria || cluster.average_linkage(distance)).toFunction();
    halting_condition = options.halting_condition.toFunction();  // TODO: Default halting condition?
    if (options.callback) {
        callback = options.callback.toFunction();
    }

    function merge_clusters(clusters) {
        var x, y, dist, nearest_dist, A, B, AB, merged;

        if (typeof callback === 'function') {
            callback(clusters);
        }

        // Find the two nearest clusters.
        nearest_dist = Infinity;
        for (x = 0; x < clusters.length; x += 1) {
            for (y = 0; y < clusters.length; y += 1) {
                if (x !== y) {
                    dist = linkage_criteria(clusters[x], clusters[y]);
                    if (dist < nearest_dist) {
                        A = clusters[x];
                        B = clusters[y];
                        nearest_dist = dist;
                    }
                }
            }
        }

        if (!halting_condition(clusters, nearest_dist)) {
            // Since clusters are just arrays, we can merge them by simple
            // concatenation.
            AB = A.concat(B);

            // Make the recursive call after substituting the clusters A and B with
            // the new merged AB cluster.
            merged = select(function(X) { return X !== A && X !== B; }, clusters);
            merged.push(AB);

            return merge_clusters(merged);

        } else {
            // Base case: if no two clusters were found within the given distance
            // threshold, then return the list of clusters as it was given.
            return clusters;
        }
    }

    // Convert each element into a cluster of one element by putting it in an
    // array. Then call the merge_clusters function.
    return merge_clusters(map('e -> [e]', elements));
};

// Setup CouchDB connection. The default URL is 'http://localhost:5984'. Set
// the cluster.couchdb_url property to use a URL other than the default.
if (typeof cluster.couchdb_url !== "undefined") {
    cluster.couchdb_url = "http://localhost:5984/";
}


/* *** Distance Functions *** */

cluster.euclidean_distance = function(a, b) {
  var i, s = 0;
  for (i = 0; i < a.length; i += 1) {
    s += Math.pow(a[i] - b[i], 2);
  }
  return Math.sqrt(s);
};

cluster.squared_euclidean_distance = function(a, b) {
  return reduce('x+y', 0, map(function(p) { return Math.pow(p[0] - p[1], 2); }, zip(a, b)));
};

cluster.manhattan_distance = function(a, b) {
  return reduce('x+y', 0, map(function(p) { return Math.abs(p[0] - p[1]); }, zip(a, b)));
};

cluster.maximum_distance = function(a, b) {
  return Array.max(map(function(p) { return Math.abs(p[0] - p[1]); }, zip(a, b)));
};

/* *** Linkage Criteria *** */

cluster.complete_linkage = function(d) {
  return function(A, B) {
    var i, j, max, dist;
    max = 0;
    for (i = 0; i < A.length; i += 1) {
      for (j = 0; j < B.length; j += 1) {
        dist = d(A[i], B[j]);
        if (dist > max) {
          max = dist;
        }
      }
    }
    return max;
  };
};

cluster.single_linkage = function(d) {
  return function(A, B) {
    var i, j, min, dist;
    min = Infinity;
    for (i = 0; i < A.length; i += 1) {
      for (j = 0; j < B.length; j += 1) {
        dist = d(A[i], B[j]);
        if (dist < min) {
          min = dist;
        }
      }
    }
    return min;
  };
};

// Given a distance function, returns a function that computes the distance
// between two clusters based on the mean distance of elements in each cluster.
//
// The formula for mean distance is:
//     
//     (1 / |A| * |B|)sum_x_in_A(sum_y_in_B( d(x,y) )
//
cluster.average_linkage = function(d) {
  return function(A, B) {
    var i, j, sum;
    sum = 0;
    for (i = 0; i < A.length; i += 1) {
      for (j = 0; j < B.length; j += 1) {
        sum += d(A[i], B[j]);
      }
    }
    return (1 / (A.length * B.length)) * sum;
  };
};

/*
function cluster(distance, elements) {
  var matrix, min_dist;
  var x,y;

  // The distance between an element and itself should be arbitrarily high.
  distance = distance.guard('x,y -> x !== y', K(Infinity));
  
  // Build a matrix expressing distance between each pair of elements.
  matrix = map(function(e) { return map(distance.curry(e), elements); }, elements);

  // Let's inspect the matrix.
  //map(compose(print, JSON.stringify.aritize(1)), matrix);

  // Find the two closest clusters. Here is the conceptual algorithm:
  //
  min_dist = reduce(Math.min, Infinity, map(Array.min, matrix));
  //
  // The actual implementation is more complicated, since we also need to get
  // the matrix column and row indexes of the resulting distance.
  //min_dist = reduce(function() { return Math.min }, [Infinity, -1],
  //    map(function(r,i) { return [Array.min(r),i]; }, matrix));

  var a,b;
  for (x = 0; x < elements.length; x += 1) {
    for (y = 0; y < elements.length; y += 1) {
      if (matrix[x][y] === min_dist) { 
        a = elements[x];
        b = elements[y];
        break;
      }
    }
  }

  return elements;
}
*/
