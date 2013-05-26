'use strict';
                       
var deck = [];
var palos = ['PICA', 'CORAZON','DIAMANTE','TREBOL'];
var denominaciones = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
for(var i=0;i < palos.length; i++){
    for(var j=0;j < denominaciones.length; j++)
        //deck.push([palos[i],denominaciones[j]]);
        deck.push({palo: palos[i],denominacion: denominaciones[j]})
}

exports.BARAJA  = deck;