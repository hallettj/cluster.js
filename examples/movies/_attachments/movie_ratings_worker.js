/*globals volcanos cluster postMessage importScripts CouchDB map reduce */

importScripts('functional.min.js', 'cluster.js', '/_utils/script/json2.js', '/_utils/script/couch.js');

var app_db = new CouchDB('movie-ratings-dev');
var movie_ratings = map('.value', app_db.view('ratings/users').rows.slice(0, 250));

// Returns a value representing how much the movie-watching tastes of two
// people differ.
function difference_in_taste(a, b) {
    var movie, d = 0;
    for (movie in a.ratings) {
        if (a.ratings.hasOwnProperty(movie)) {
            if (b.ratings[movie]) {
                d += Math.pow(a.ratings[movie] - b.ratings[movie], 2);
            }
        }
    }
    return d;
}

var cluster_options = { 
  linkage_criteria: cluster.average_linkage(difference_in_taste),
  halting_condition: function(clusters, cluster_distance) { 
    return clusters.length <= 15;
  },
  callback: function(clusters) {
    postMessage(clusters.length);
  }
};

var rating_clusters = cluster(difference_in_taste, movie_ratings, cluster_options);

// Upload the results to CouchDB with centroids and bounding boxes.
postMessage("Uploading clusters to CouchDB.")
map(function(cluster) {
    var centroid = { ratings: {} },
        movies, movie, i;

    // Get a list of all movie names with the number of times that each movie
    // is rated.
    movies = {}
    for (i = 0; i < cluster.length; i += 1) {
        for (movie in cluster[i].ratings) {
            if (cluster[i].ratings.hasOwnProperty(movie)) {
                movies[movie] = (movies[movie] || 0) + 1;
            }
        }
    }

    // Add up all of the ratings for each movie in the centroid.
    for (i = 0; i < cluster.length; i += 1) {
        for (movie in cluster[i].ratings) {
            if (cluster[i].ratings.hasOwnProperty(movie)) {
                centroid.ratings[movie] = centroid.ratings[movie] || 0;
                centroid.ratings[movie] += cluster[i].ratings[movie] / movies[movie];
            }
        }
    }

    app_db.save({
        type: 'cluster',
        elements: cluster,
        centroid: centroid
    });
}, rating_clusters);

postMessage([]); // Signals that clustering is finished.
