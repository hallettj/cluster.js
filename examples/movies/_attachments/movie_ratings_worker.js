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
            if (typeof b.ratings[movie] !== 'undefined') {
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
map(function(c) {
    var centroid = { ratings: {} },
        movies, movie;

    // Get a list of all movie names with the number of times that each movie
    // is rated.
    movies = reduce(function(m, e) {
        for (movie in e.ratings) {
            if (e.hasOwnProperty(movie)) {
                m[movie] = m[movie] || 0;
                m[movie] += 1;
            }
        }
        return m;
    }, {}, c);

    // Add up all of the ratings for each movie in the centroid.
    reduce(function(c,e) {
        for (movie in e.ratings) {
            if (e.hasOwnProperty(movie)) {
                c.ratings[movie] = c.ratings[movie] || 0;
                c.ratings[movie] += e.ratings[movie];
            }
        }
        return c;
    }, centroid, c);

    // Divide the ratings total for each movie in the centroid by the number of
    // times that movie was rated to get average ratings for each movie.
    for (movie in centroid.ratings) {
        if (centroid.hasOwnProperty(movie)) {
            centroid.ratings[movie] = centroid.ratings[movie] / movies[movie];
        }
    }


    app_db.save({
        type: 'cluster',
        elements: c,
        centroid: centroid
    });
}, rating_clusters);

postMessage([]); // Signals that clustering is finished.
