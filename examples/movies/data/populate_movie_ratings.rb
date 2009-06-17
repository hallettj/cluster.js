#!/usr/bin/env ruby
#
# Populates a CouchDB database with movie ratings.

require 'fastercsv'
require 'couchrest'
require 'json'
require 'uri'

MOVIES = {
  134 => "Citizen Kane",
  135 => "2001: A Space Odyssey",
  161 => "Top Gun",
  168 => "Monty Python and the Holy Grail",
  204 => "Back to the Future",
  215 => "Field of Dreams",
  216 => "When Harry Met Sally"
}

# Establish connection to CouchDB.

settings = File.open(File.join(File.dirname(__FILE__), "/../.couchapprc")) do |f|
  JSON.parse(f.read)
end

couchdb_url = URI(ENV['COUCHDB_URL'] || settings["env"]["default"]["db"])
couch_db = couchdb_url.path.sub(/^\//, '')
couch_server = "%s://%s:%s/" % [couchdb_url.scheme, couchdb_url.host, couchdb_url.port]

couch = CouchRest.new(couch_server)
db = couch.database(couch_db)
db.delete! rescue nil
db = couch.create_db(couch_db)

## Create views.

users_view = {
  :map => 'function(doc) {
    if (doc.type === "ratings") {
      emit(doc.user_id, doc);
    }
  }'
}

db.delete db.get("_design/ratings") rescue nil

db.save_doc({
  "_id" => "_design/ratings",
  :views => { :users => users_view }
})
    

## Import movie rating records.

count = 0
FasterCSV.foreach(File.join(File.dirname(__FILE__), "ml-data/u.data"), :col_sep => "\t") do |row|
  if MOVIES[row[1].to_i] and count < 100
    user = db.view('ratings/users', :key => row[0].to_i)["rows"].first
    if user
      user = user['value']
      user['ratings'] = user['ratings'].merge(MOVIES[row[1].to_i] => row[2].to_i)
      db.save_doc(user)
    else
      db.save_doc({
        :type    => 'ratings',
        :user_id => row[0].to_i,
        :ratings => { MOVIES[row[1].to_i] => row[2].to_i }
      })
      count += 1
    end
  end
end
