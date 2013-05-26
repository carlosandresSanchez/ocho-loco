
/*
 * GET home page.
 */


//------------------------------------------------------------------------------

var async      = require('async');
var mongoose   = require('mongoose');
var constantes = require('../models/constantes.js');
var Juego      = require('../models/juego.js');
var Jugador    = require('../models/jugador.js');

//------------------------------------------------------------------------------

var ObjectId   = mongoose.Schema.Types.ObjectId;
var ABORTAR    = true;
var JUGADORES = 3; // Numero de jugadores, minimo 2, maximo 3

//------------------------------------------------------------------------------
exports.index = function(req, res){
  res.render('index', { titulo: 'OCHO LOCO' });
};




//------------------------------------------------------------------------------
exports.juegosExistentes = function (req, res) {
  Juego
    .find({ iniciado: false })
    .sort('nombre')
    .exec(function (err, juegos) {
      if (err) {
        console.log(err);
      }
      res.json(juegos.map(function (x) {
        return { id: x._id, nombre: x.nombre };
      }));
    });
}

//------------------------------------------------------------------------------
exports.pasar = function (req, res) {
  obtenerJuegoJugador(req, function (err, juego, jugador) {
    var resultado ={estado:'error'}
    if (juego.turno === jugador.id) {

      var orden = juego.getOrden();
      
      for (var i =0; i < orden.length;i++) {
        
        if (orden[i] == juego.turno) {
          
            if (i === orden.length-1) {
                juego.turno =  orden[0];
                juego.save();
                    
            }
            
            else{
              juego.turno =  orden[i+1];
              juego.save();
            }
            resultado.estado ="hecho"
            break;
            
                
        }
        
      } 
    }
    res.json(resultado);
    
  });
  
}

//------------------------------------------------------------------------------

exports.crearJuego = function (req, res) {
  
  var resultado = { creado: false, codigo: 'invalido' };
  var nombre = req.body.nombre;
  var nombre_creador = req.body.nombre_creador;
  var juego;
  var jugador;
  
  if (nombre_creador && nombre) {
    async.waterfall([
      //------------------------------------------------------------------------
      function (callback) {
        Juego.find({ nombre: nombre, iniciado: false }, callback);
      },
      //------------------------------------------------------------------------
      function (juegos, callback) {
        if (juegos.length === 0) {
          juego = new Juego({nombre: nombre,              
                            });
          console.log("Creado Juego: " + nombre);          
          var maso = juego.getBaraja();
          maso[0].sort(function() { return 0.5 - Math.random();})
          juego.setBaraja(maso);
          juego.save();
          maso = juego.getBaraja();
          
          while (true) {
            
            var pila = juego.getPila();
            var carta = maso[0].splice(0,1)[0];
            pila.push(carta);
            juego.setPila(pila);
            juego.save();
            
            if (carta.denominacion !== '8') {
              break;  
            }
            
          }
          juego.setBaraja(maso);
          juego.save();
          juego.save(callback);
          
        } else {
          resultado.codigo = 'duplicado';
          callback(ABORTAR);
        }
      },
      //------------------------------------------------------------------------
      function (_juego, _n, callback) {
        //var cartas = sacar_cartas(5,juego).cartas;
        var baraja = juego.getBaraja();
        var cartas = baraja[0].splice(0,5);
        juego.setBaraja(baraja);
        juego.save();
        jugador = new Jugador(
          { juego: juego._id,
            nombre: nombre_creador,
            cartas:JSON.stringify(cartas)
          }
        );
        console.log("Agregado jugador: " + nombre_creador);       
        _juego.turno = jugador._id;
        _juego.save();
        jugador.save(callback);
      },
      //------------------------------------------------------------------------
      function (_jugador, _n, callback) {
        
        juego.turno = jugador.id;
        var orden = juego.getOrden();
        orden.push(_jugador.id);
        juego.setOrden(orden);
        juego.save();
        req.session.id_jugador = jugador._id;
        req.session.nombre_jugador = jugador._nombre;
        req.session.cartas = jugador.getCartas();
        req.session.baraja = juego.getBaraja();
        resultado.creado = true;
        resultado.codigo = 'bien';
        resultado.nombre_jugador = jugador._nombre;
        resultado.cartas = jugador.getCartas();
        resultado.juego = juego.nombre;
        resultado.turno = juego.turno;
        resultado.baraja = juego.getBaraja();
        resultado.pila = juego.getPila();
        resultado.orden = juego.getOrden();
        callback(null);
      }
    ],
      function (err) {
      if (err && err !== ABORTAR) {
        console.log(err);
      }
      res.json(resultado);
    });
  }
}

//------------------------------------------------------------------------------
exports.tirar = function (req, res) {

  var resultado = { tiro: 'error'};

  obtenerJuegoJugador(req, function (err, juego, jugador) {        
    if (err) {
      console.log(err);
      res.json(resultado);
    } else{
      
      var tiro = {palo: req.body.palo, denominacion: req.body.denominacion};
      var pila = juego.getPila();
      
      var match = pila[pila.length - 1];

      var ocho_loco = juego.ocho_loco;
      
      if ((match.palo === tiro.palo || match.denominacion === tiro.denominacion || tiro.denominacion ==='8' )) {
        resultado.tiro= 'hecho';
                
        if (ocho_loco) {
         juego.ocho_loco = false;
        }
        
        if (tiro.denominacion === '8') {
          resultado.tiro = "ocho_loco";
          juego.ocho_loco = true;
        }
              
        var cartas = jugador.getCartas();
        for (var i=0; i < cartas.length; i++) {
          if (cartas[i].palo === tiro.palo &&  cartas[i].denominacion === tiro.denominacion) {
          var sacada = cartas.splice(i,1);
          jugador.setCartas(cartas);
          jugador.save();
          break;
          }
        }
        jugador.save();
        juego.save();
        
        
        if (tiro.denominacion !== '8') {
          var orden = juego.getOrden();
          
          for (var i =0; i < orden.length;i++) {
            if (orden[i] == juego.turno) {
                if (i === orden.length-1) {
                    juego.turno =  orden[0];
                    
                }else{
                  juego.turno =  orden[i+1];
                }
                break;
                
            }
          }
        }
        
        pila.push(tiro);
        juego.setPila(pila);
        
        jugador.save();
        juego.save();
      }
      res.json(resultado);
    }
  });
}
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
exports.unirJuego = function (req, res) {

  var resultado = { unido: false, codigo: 'id_malo' };
  var idJuego = req.body.id_juego;
  var nombre_jugador = req.body.nombre;
  var juego;
  var jugador;

  if (idJuego && nombre_jugador) {
    async.waterfall([
      //------------------------------------------------------------------------
      function (callback) {
        Juego.findOne({_id: idJuego}, callback);
      },
      //------------------------------------------------------------------------
      function (_juego, callback) {
        juego = _juego;
        if (juego.iniciado) {
          callback(ABORTAR);
        } else{
            if(juego.getOrden().length >= 2){
              juego.iniciado = true;
            }
            juego.save(callback);
        }
      },
      //------------------------------------------------------------------------
      function (_juego, _n, callback) {
        var baraja = juego.getBaraja();
        var cartas = baraja[0].splice(0,5);
        juego.setBaraja(baraja);
        juego.save();
        jugador = new Jugador(
          { juego: juego._id,
            nombre: nombre_jugador,
            cartas:JSON.stringify(cartas)
          }
        );
        var orden = juego.getOrden();
        orden.push(jugador._id);
        juego.setOrden(orden);
        juego.save();
        console.log("Agregado jugador: " + nombre_jugador);
        jugador.save(callback);
      },
      //------------------------------------------------------------------------
      function (_jugador, _n, callback) {
        req.session.id_jugador = jugador._id;
        req.session.nombre_jugador = jugador._nombre;
        req.session.cartas = jugador.getCartas();
        req.session.baraja = juego.getBaraja(); 
        resultado.unido = true;
        resultado.codigo = 'bien';
        resultado.nombre_jugador = jugador._nombre;
        resultado.cartas = jugador.getCartas();
        resultado.juego = juego.nombre;
        resultado.turno = juego.turno;
        resultado.baraja = juego.getBaraja();
        resultado.pila = juego.getPila();
        resultado.iniciado = juego.iniciado;
        resultado.orden = juego.getOrden();
        callback(null);
      }
    ],
    //--------------------------------------------------------------------------
    function (err) {
      if (err && err !== ABORTAR) {
        console.log(err);
      }
      res.json(resultado);
    });
  } else {
    res.json(resultado);
  }
}

//------------------------------------------------------------------------------

exports.ocho_loco = function (req, res) {
   var resultado = { estado: "error" ,codigo:"mal" };
  obtenerJuegoJugador(req, function (err, juego, jugador) {
    var palo = req.body.palo;
    
    if (err) {
      console.log(err);
    }else{
    var pila = juego.getPila();
    pila.push({palo:palo,denominacion:'-1'});
    juego.setPila(pila);
    resultado.estado = "hecho";
    resultado.codigo = palo;
    
    var orden = juego.getOrden();
          
    for (var i =0; i < orden.length;i++) {
      if (orden[i] == juego.turno) {
        if (i === orden.length-1) {
          juego.turno =  orden[0];
                    
        }else{
          juego.turno =  orden[i+1];
          }

        break;
                
        }
       }
    }
    juego.save();
    
    res.json(resultado);
  });
}
  

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------

exports.sacar = function (req, res) {
   var resultado = { estado: "error", codigo:"Baraja vacia" };
  obtenerJuegoJugador(req, function (err, juego, jugador) {    
    if (err) {
      console.log(err);
    }else{
      var baraja = juego.getBaraja();
      if (baraja[0].length > 0) {
        
        var carta = baraja[0].splice(0,1)[0];
        resultado.carta;
        juego.setBaraja(baraja);
        juego.save();
        
        var cartas = jugador.getCartas();
        
        cartas.push(carta); 
        jugador.setCartas(cartas);
        jugador.save();
        
        resultado.carta = carta;
        resultado.estado = "hecho";
        resultado.codigo = "bien"
        
      }
      res.json(resultado);
    }
  });
}
  

//------------------------------------------------------------------------------
exports.estado = function (req, res) {

  var resultado = { estado: 'error'};
  var oponentes;

  obtenerJuegoJugador(req, function (err, juego, jugador) {

    //--------------------------------------------------------------------------
    function eliminarJuegoJugadores () {
      async.waterfall([
        //----------------------------------------------------------------------
        function (callback) {
          delete req.session.id_jugador;
          jugador.remove(callback);
        },
        //----------------------------------------------------------------------
        function (callback) {
          Jugador.find({ juego: juego._id }, callback);
        },
        //----------------------------------------------------------------------
        function (jugadores, callback) {
          if (jugadores.length === 0) {
            juego.remove(callback);
          } else {
            callback(null);
          }
        }
      ],
      //------------------------------------------------------------------------
      function (err) {
        if (err) {
          console.log(err);
        }
      });
    };
    
    Jugador.find({'juego': juego.id, "_id" :{ $ne: jugador.id} },
        function (err, oponentes){
          
          //--------------------------------------------------------------------------
          function ganado(mano) {
            return mano.length === 0;
          }
          
          //--------------------------------------------------------------------------
          function perdido(mano) {
            return (mano.length !== 0 && juego.terminado);
          }
          //--------------------------------------------------------------------------

          if (err || !oponentes) {
            console.log(err);
            resultado.oponentes = [];
            res.json(resultado);
          } else {
            
            
      
            var baraja = juego.getBaraja();
            var pila = juego.getPila();
            var orden = juego.getOrden(); 
      
            resultado.pila = juego.getPila();
            resultado.cartas = jugador.getCartas();
            resultado.nombre_jugador=jugador.nombre;
            resultado.nombre_juego = juego.nombre;
            resultado.iniciado = juego.iniciado;
            resultado.orden = juego.getOrden();
            resultado.turno = juego.turno;
            resultado.baraja = baraja;
            resultado.oponentes = oponentes;
            if (!juego.iniciado) {
              resultado.estado = 'espera';
              res.json(resultado);
      
            } else if (ganado(resultado.cartas)){
              juego.terminado = true;
              juego.save();
              resultado.estado = 'ganaste';
              eliminarJuegoJugadores();
              res.json(resultado);
      
            } else if (perdido(resultado.cartas)) {
              resultado.estado = 'perdiste';
              eliminarJuegoJugadores();
              res.json(resultado);
      
            } else if (juego.turno === jugador.id) {
              resultado.estado = 'tu_turno';
              res.json(resultado);
      
            } else if(juego.turno !== jugador.id){
              resultado.estado = 'turno de otro jugador';
              res.json(resultado);
            }
          }
        });
  });
}

//------------------------------------------------------------------------------
function obtenerJuegoJugador(req, callback) {

  var idJugador = req.session.id_jugador;
  var juego;
  var jugador;

  if (idJugador) {
    async.waterfall([
      //------------------------------------------------------------------------
      function (callback) {
        Jugador.findOne({ _id: idJugador }, callback);
      },
      //------------------------------------------------------------------------
      function (_jugador, callback) {
        jugador = _jugador;
        Juego.findOne({ _id: jugador.juego }, callback);
      },
      //------------------------------------------------------------------------
      function (_juego, callback) {
        juego = _juego;
        callback(null);
      }
    ],
    //--------------------------------------------------------------------------
    function (err) {
      if (err) {
        console.log(err);
      }
      callback(null, juego, jugador);
    });
  } else {
    callback(Error('La sesión no contiene el ID del jugador'));
  }
}
