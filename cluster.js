/*globals load Functional _ map reduce select compose K */

load('to-function.js');
load('functional.js');

Functional.install();

if (typeof Array.max === 'undefined') {
  Array.max = function(array) {
    return Math.max.apply(Math, array);
  };
}
if (typeof Array.min === 'undefined') {
  Array.min = function(array) {
    return Math.min.apply(Math, array);
  };
}
if (typeof Array.sum === 'undefined') {
  Array.sum = function(array) {
    return reduce('x+y', 0, array);
  };
}

function cluster(distance, elements) {
  var distance_threshold;

  // Computes the distance between two clusters based on the mean distance of
  // elements in each cluster.
  //
  // The formula for mean distance is:
  //     
  //     (1 / |A| * |B|)sum_x_in_A(sum_y_in_B( d(x,y) )
  //
  function cluster_distance(A, B) {
    var x, y, sum;
    sum = 0;
    for (x = 0; x < A.length; x += 1) {
      for (y = 0; y < B.length; y += 1) {
        sum += distance(A[x], B[y]);
      }
    }
    return (1 / (A.length * B.length)) * sum;
  }

  function merge_clusters(clusters) {
    var x, y, dist, min_dist, A, B, AB, merged;

    // Find the two nearest clusters.
    min_dist = Infinity;
    for (x = 0; x < clusters.length; x += 1) {
      for (y = 0; y < clusters.length; y += 1) {
        if (x !== y) {
          dist = cluster_distance(clusters[x], clusters[y]);
          if (dist < min_dist) {
            A = clusters[x];
            B = clusters[y];
            min_dist = dist;
          }
        }
      }
    }

    if (min_dist < distance_threshold) {
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

  // Calculate a distance threshold.
  distance_threshold = 300000;

  // Convert each element into a cluster of one element by putting it in an
  // array. Then call the merge_clusters function.
  return merge_clusters(map('e -> [e]', elements));
}

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
