var express         = require('express');
var path            = require('path'); // модуль для парсинга пути
var _               = require('lodash');
var routes          = require('./routes');
var config          = require('./libs/config');
var log             = require('./libs/log')(module);
var Games           = require('./libs/mongoose').Games;

var app = module.exports = express.createServer();
var runGames = [];

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/client'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.use(function(req, res, next){
    res.status(404);
    log.debug('Not found URL: %s',req.url);
    res.send({ error: 'Not found' });
    return;
});

app.use(function(err, req, res, next){
    res.status(err.status || 500);
    log.error('Internal error(%d): %s',res.statusCode,err.message);
    res.send({ error: err.message });
    return;
});

app.get('/users/:name', function(req, res) {
   return Games.find(null,
    function (err, Games) {
        if (!err) {
            var myOldGames = _.compact(Games.map(function(game) {
              if (game.users[1]
                && (game.users[0].name === req.params.name
                ||  game.users[1].name === req.params.name))
              return {
                'id' : game._id,
                'user1' : game.users[0].name,
                'user2' : game.users[1].name
               }
            }));

            var myCreatetGames = _.compact(Games.map(function(game) {
              if (!game.users[1]
                && game.users[0].name === req.params.name)
              return {
                'id' : game._id,
                'user1' : game.users[0].name
               }
            }));

            var freeJoinGames = _.compact(Games.map(function(game) {
              if (!game.users[1]
                && game.users[0].name !== req.params.name)
              return {
                'id' : game._id,
                'user1' : game.users[0].name
               }
            }));
            return res.send({ status: 'OK', Games: {
                myOldGames : myOldGames,
                myCreatetGames : myCreatetGames,
                freeJoinGames : freeJoinGames
            }});
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s',res.statusCode,err.message);
            return res.send({ error: 'Server error' });
        }
    });
 });

app.post('/users/:name', function(req, res) {
    var game = new Games({
        users: {
            name: req.params.name,
            ships: [],
            moves: []
        }
    });

    game.save(function(err) {
           if (!err) {
            log.info("game created");
            return res.send({ status: 'OK', game: {
                'id' : game._id,
                'user1' : game.users[0].name
               }
           });
        } else {
            res.statusCode = 500;
            res.send({ error: 'Server error' });
        }
        log.error('Internal error(%d): %s',res.statusCode,err.message);
    })
});

app.put('/users/:name/game/:game', function(req, res) {
   return Games.findById(req.params.game, function (err, game) {
        if(!game) {
            res.statusCode = 404;
            return res.send({ error: 'Not found' });
        }

        if (!_.find(runGames, {id: game._id})) {
            runGames.push({id: game._id, user1: null, user2: null});
        }
        var curGame = _.find(runGames, {'id': game._id});

        if (game.users[0].name !== req.params.name && !game.users[1]) {
            game.users.push({
                name: req.params.name,
                ships: [],
                moves: []
            })
            curGame.user2 = 'ok';
        } else if (game.users[0].name == req.params.name) {
            curGame.user1 = 'ok';
        } else if (game.users[1].name == req.params.name) {
            curGame.user2 = 'ok';
        }
        game.save(function(err) {
            if (!err) {
                log.info("game updated");
                return res.send({ status: 'OK'});
            } else {
                res.statusCode = 500;
                res.send({ error: 'Server error' });
                log.error('Internal error(%d): %s',res.statusCode,err.message);
            }
        });
    });
});

/*
app.ws('/', function(ws, req) {
  ws.on('message', function(msg) {
    console.log(msg);
  });
  console.log('socket', req.testing);
});
*/
/*app.put('/gameID', function (req, res){
    res.send('This is not implemented now');
});

app.delete('/gameID', function (req, res){
    res.send('This is not implemented now');
});
*/

app.listen(config.get('port'), function(){
    log.info('Express server listening on port ' + config.get('port'));
});