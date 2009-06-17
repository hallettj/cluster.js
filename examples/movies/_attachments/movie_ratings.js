/*jslint browser:true */
/*globals jQuery Worker cluster map */

(function($) {

    $(document).ready(function() {
        var worker = new Worker('movie_ratings_worker.js');
        worker.onmessage = function(evnt) {
            if (evnt.data.length && evnt.data.length > 0) {
                console.log(evnt.data);
            } else {
                $('#spinner').hide();
            }
        };
    });

})(jQuery);
