'use strict';

var mongoose = require('mongoose');
var constantes = require('./constantes.js');

var esquemaJuego = mongoose.Schema({
  nombre:   String,
  iniciado: { type: Boolean,
              default: false },
  turno:    { type: String, default:'00000'},
  baraja:  { type: String,
              default: JSON.stringify([constantes.BARAJA])
              },
  orden:    {type: String,
              default: JSON.stringify([])
            },
  pila:  { type: String,
              default: JSON.stringify([])
          },
  ocho_loco : {type: Boolean,
              default: false
              },
  terminado :{type: Boolean,
              default: false
              }
});

//-------------------------------------------------------------------------------
esquemaJuego.methods.getBaraja = function () {
  return JSON.parse(this.baraja);
};

//-------------------------------------------------------------------------------
esquemaJuego.methods.setBaraja = function (baraja) {
  this.baraja = JSON.stringify(baraja);
};

//-------------------------------------------------------------------------------
esquemaJuego.methods.getPila = function () {
  return JSON.parse(this.pila);
};

//-------------------------------------------------------------------------------
esquemaJuego.methods.setPila = function (pila) {
  this.pila = JSON.stringify(pila);
};
//-------------------------------------------------------------------------------
esquemaJuego.methods.getOrden = function () {
  return JSON.parse(this.orden);
};

//-------------------------------------------------------------------------------
esquemaJuego.methods.setOrden = function (orden) {
  this.orden = JSON.stringify(orden);
};

//-------------------------------------------------------------------------------
module.exports = mongoose.model('Juego', esquemaJuego);