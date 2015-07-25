var mongoose    = require('mongoose');
var config      = require('./config');
var log         = require('./log')(module);

mongoose.connect(config.get('mongoose:uri'));

var db = mongoose.connection;

db.on('error', function (err) {
    log.error('connection error:', err.message);
});
db.once('open', function callback () {
    log.info("Connected to DB!");
});

var Schema = mongoose.Schema;

// Schemas
var gameSchema = new Schema({
    users: [{
        name: String,
        ships: [String],
        moves: [String]
    }]
});

var Games = mongoose.model('Games', gameSchema);

module.exports.Games = Games;