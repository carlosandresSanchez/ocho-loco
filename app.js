  
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var mongoose = require('mongoose'); 
var juego = require('./package.json');


var app = express();

var expressLayouts = require('express-ejs-layouts');  

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
    app.use(expressLayouts);
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function (req, res) { res.redirect('/ocho_loco/'); });
app.get('/ocho_loco/', routes.index);
app.post('/ocho_loco/crear_juego/', routes.crearJuego);
app.get('/ocho_loco/juegos_existentes/', routes.juegosExistentes);
app.put('/ocho_loco/unir_juego/', routes.unirJuego);
app.get('/ocho_loco/estado/', routes.estado);
app.put('/ocho_loco/tirar/',routes.tirar);
app.put('/ocho_loco/sacar/',routes.sacar);
app.put('/ocho_loco/ocho_loco/',routes.ocho_loco);
app.put('/ocho_loco/pasar',routes.pasar);





app.get('/users', user.list);

http.createServer(app).listen(app.get('port'), function(){
  console.log(juego.description + ", versión " + juego.version);
  console.log(juego.autor);
  console.log('Express server listening on port ' + app.get('port'));
});


mongoose.connect('mongodb://localhost/ocho_loco');
mongoose.connection.on('open', function () {
  console.log('Conectado a MongoDB');
});
mongoose.connection.on('error', function (err) {
  console.log('Error de Mongoose. ' + err);
});