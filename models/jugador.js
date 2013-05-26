'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

//-------------------------------------------------------------------------------
var esquemaJugador = mongoose.Schema({
  juego:    ObjectId,
  nombre: String,
  cartas: {type: String,
          default: JSON.stringify([])}
});
//-------------------------------------------------------------------------------
esquemaJugador.methods.getCartas = function () {
  return JSON.parse(this.cartas);
};

//-------------------------------------------------------------------------------
esquemaJugador.methods.setCartas = function (cartas) {
  this.cartas= JSON.stringify(cartas);
};

//-------------------------------------------------------------------------------

module.exports = mongoose.model('Jugador', esquemaJugador);