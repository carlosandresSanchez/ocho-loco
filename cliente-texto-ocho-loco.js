'use strict';

//------------------------------------------------------------------------------
var querystring = require('querystring');
var http        = require('http');

//------------------------------------------------------------------------------
var stdin         = process.stdin;
var stdout        = process.stdout;
var PAUSA         = 1000;          // Milisegundos entre cada petición de espera
var NOMBRE_COOKIE = 'connect.sid'; // Nombre de cookie usado por Express

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function imprimir(mens) {
  if (mens !== undefined) {
    stdout.write(mens);
  }
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
// Creador de objetos para invocar servicios web.

function invocadorServicioWeb(nombreHost, puerto) {

  var cookieSesion = null;
  var opciones = {
    hostname: nombreHost,
    port: puerto
  };

  //------------------------------------------------------------------------------
  function obtenerCookie(res, nombre) {

    var valorSetCookie = res.headers['set-cookie'];

    if (valorSetCookie) {
      var re = RegExp(nombre + "=([^;]+);");
      //console.log(valorSetCookie[0]);
      return re.exec(valorSetCookie[0])[1];
    } else {
      return null;
    }
  }

  //----------------------------------------------------------------------------
  function agregarEncabezados(metodo) {
    opciones.headers  = {};
    if (metodo !== 'GET') {
      opciones.headers['Content-type'] = 'application/x-www-form-urlencoded';
    }
    if (cookieSesion) {
      opciones.headers['Cookie'] = NOMBRE_COOKIE + '=' + cookieSesion;
    }
  }

  return {

    //--------------------------------------------------------------------------
    invocar: function (metodo, ruta, params, callback) {

      opciones.path = ruta;
      if (metodo === 'GET') {
        opciones.path += '?' + querystring.stringify(params);
      }
      opciones.method = metodo;
      agregarEncabezados(metodo);

      var req = http.request(opciones, function (res) {

        if (res.statusCode !== 200) {
          errorFatal('Not OK status code (' + res.statusCode + ')');
        }

        var cookie = obtenerCookie(res, NOMBRE_COOKIE);
        if (cookie) {
          cookieSesion = cookie;
        }
        res.setEncoding('utf8');
        var data = [];

        res.on('data', function (chunk) {
          data.push(chunk);
        });

        res.on('end', function () {
          callback(JSON.parse(data.join('')));
        });
      });

      req.on('error', function (err) {
        errorFatal('Problemas con la petición (' + err.message + ')');
      });

      if (metodo !== 'GET') {
        req.write(querystring.stringify(params));
      }
      req.end();
    }
  };
}
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
function imprimirNl(mens) {
  if (mens !== undefined) {
    stdout.write(mens);
  } 
  stdout.write('\n');
}

//------------------------------------------------------------------------------
function errorFatal(mensaje) {
  imprimirNl('ERROR FATAL: ' + mensaje);
  process.exit(1);
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function imprimirMenu() {
  imprimirNl();
  imprimirNl('================');
  imprimirNl(' MENÚ PRINCIPAL');
  imprimirNl('================');
  imprimirNl('(1) Crear un nuevo juego');
  imprimirNl('(2) Unirse a un juego existente');
  imprimirNl('(3) Salir');
  imprimirNl();
}

//-------------------------------------------------------------------------------
function titulo() {
  imprimirNl('Juego de Ocho Loco distribuido');
  imprimirNl('© 2013 por Luis Ivan Campos, Carlos Andres Sanchez, Moises Olmedo; ITESM CEM.');
}

//------------------------------------------------------------------------------
function leerNumero(inicio, fin, callback) {

  imprimir('Selecciona una opción del ' + inicio + ' al ' + fin + ': ');

  stdin.once('data', function (data) {

    var numeroValido = false;

    data = data.toString().trim();

    if (/^\d+$/.test(data)) {
      var num = parseInt(data);
      if (inicio <= num && num <= fin) {
        numeroValido = true;
      }
    }
    if (numeroValido) {
      callback(num);
    } else {
      leerNumero(inicio, fin, callback);
    }
  });
}

///------------------------------------------------------------------------------
function crearJuego() {

  imprimirNl();
  imprimir('Indica el nombre del juego: ');

  stdin.once('data', function (data1) {
    imprimir('Indica tu nombre de jugador: ');
    process.stdin.once('data', function (data2) {
      imprimirNl();
      var nombre_juego = data1.toString().trim();;    
        var nombre_creador = data2.toString().trim();
        if (nombre_juego=== '' || nombre_creador === '') {
          menu();
    
        } else {
          servicioWeb.invocar(
            'POST',
            '/ocho_loco/crear_juego/',
            {'nombre': nombre_juego, 'nombre_creador': nombre_creador},
            function (resultado) {
              if (resultado.creado) {
                juego(resultado);
                return;    
              } else if (resultado.codigo === 'duplicado') {
                imprimirNl();
                imprimirNl('Error: Alguien más ya creó un juego con este ' +
                          'nombre: ' + nombre_juego);
    
              } else {
                imprimirNl();
                imprimirNl('No se proporcionó un nombre de juego válido.');
              }
    
              menu();
            }
          );
        }
    });
  });
}

//------------------------------------------------------------------------------
function seleccionarJuegosDisponibles(juegos, callback) {

  var total = juegos.length + 1;

  imprimirNl();
  imprimirNl('¿A qué juego deseas unirte?');
  for (var i = 1; i < total; i++) {
    imprimirNl('    (' + i + ') «' + juegos[i - 1].nombre + '»');
  }
  imprimirNl('    (' + total + ') Regresar al menú principal');
  leerNumero(1, total, function (opcion) {
    callback(opcion === total ? -1 : opcion - 1);
  });
}

//------------------------------------------------------------------------------
function unirJuego() {

  //----------------------------------------------------------------------------
  function verificarUnion(resultado) {
    if (resultado.unido) {
      juego();
    } else {
      imprimirNl();
      imprimirNl('No es posible unirse a ese juego.');
      menu();
    }
  }
  //----------------------------------------------------------------------------
  servicioWeb.invocar(
    'GET',
    '/ocho_loco/juegos_existentes/',
    {},
    function (juegos) {
      if (juegos.length === 0) {
        imprimirNl();
        imprimirNl('No hay juegos disponibles.');
        menu();
      } else {
        seleccionarJuegosDisponibles(juegos, function (opcion) {
          if (opcion === -1) {
            menu();
          } else {
            imprimir('Indica tu nombre de jugador: ');
            process.stdin.once('data', function (data1) {
              var nombre_jugador = data1.toString().trim();
              if (nombre_jugador === '') {
                imprimirNl();
                imprimirNl('====================================================');
                imprimirNl('No pusiste un nombre, selecciona un juego de nuevo.');
                imprimirNl('====================================================');
                unirJuego();
              }else{
                servicioWeb.invocar(
                  'PUT',
                  '/ocho_loco/unir_juego/',
                  { id_juego: juegos[opcion].id, nombre: nombre_jugador },
                  verificarUnion
                );
              }
            });
          }
        });
      }
    }
  );
}

//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
function menu() {
  imprimirMenu();
  leerNumero(1, 3, function (opcion) {
    switch (opcion) {

    case 1:
      crearJuego();
      break;

    case 2:
      unirJuego();
      break;
haz 
    case 3:
      process.exit(0);
    }});
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
var flag =1;

function esperarTurno(callback) {
  servicioWeb.invocar(
    'GET',
    '/ocho_loco/estado/',
    {}, 
    function (resultado) {
      //console.log(resultado);
      if (resultado.estado === 'espera' || resultado.estado === 'turno de otro jugador') {
        
        if (resultado.estado === 'turno de otro jugador' && flag === 1) {
          console.log('Turno del otro jugador');
          flag=0;
        }
        setTimeout(
          function () {
            esperarTurno(callback);
          },
          PAUSA
        );
      } else {
        imprimirNl();
        callback(resultado);
      }
    }
  );
}

//------------------------------------------------------------------------------
function imprimirJuego(resultado) {
  
  //----------------------------------------------------------------------------
  function get_oponentes(oponentes) {
    var s = "";
    for (var i = 0; i < oponentes.length; i++) {
      s += ("Oponente: " + oponentes[i].nombre + "   Cartas: " + JSON.parse(oponentes[i].cartas).length + '\n');
    }
    return s;
  }
  //----------------------------------------------------------------------------
  imprimirNl();
  imprimirNl('=============Oponentes=============');
  imprimirNl(get_oponentes(resultado.oponentes));
  imprimirNl('==============================');
  
  imprimirNl('==========Baraja==========');
  var tamanoBaraja = resultado.baraja[0].length;
  imprimirNl(tamanoBaraja + " cartas");
  imprimirNl('==========================');
  imprimirNl();
  imprimirNl('==========Tus cartas==========');
  for (var i = 0;i < resultado.cartas.length; i++){
    var i2 = i+1;
    console.log("(" + i2 + ") <<" + resultado.cartas[i].palo + " " + resultado.cartas[i].denominacion + " >>");
  }
  imprimirNl('==============================');
  imprimirNl();
  imprimirNl('=============Pila=============');
  
  var tope = resultado.pila[resultado.pila.length-1];
  if (tope.denominacion === "-1") {
   imprimirNl("OCHO LOCO!! TIRA UNA CARTA CON:");
    imprimirNl("" + tope.palo);
  }else{
    imprimirNl(" " + '<<' + tope.palo + " " + tope.denominacion + ">>");
  }
  imprimirNl('==============================');
  imprimirNl();
}
//------------------------------------------------------------------------------
function imprimirOpcionesJuego(resultado) {
  imprimirNl();
  imprimirNl('====================');
  imprimirNl(' OPCIONES DE JUEGO');
  imprimirNl('====================');
  imprimirNl('(1) Sacar carta de la baraja');
  imprimirNl('(2) Jugar una carta');
  var num = 3;
  if (resultado.baraja[0].length === 0) {
    imprimirNl('('+ num +') Pasar turno');
    num=num+1;
  }
  imprimirNl('('+ num +') Regresar al menu anterior');
  imprimirNl();
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
function hacer_tiro(resultado) {
  var numero_cartas = resultado.cartas.length;
  imprimirNl('==========Escoje una carta o regresa al menu anterior==========');
  for (var i=0; i <numero_cartas;i++) {
    var index = i+1;
    console.log("(" + index + ") " + resultado.cartas[i].palo + " " + resultado.cartas[i].denominacion);
  }
  var num = numero_cartas+1;
  imprimirNl( "(" + num + ")" + 'Regresar al menu anterior');
  imprimirNl( "===============================================================");
             
  leerNumero(1, numero_cartas+1, function (opcion) {
    if((numero_cartas+1) === opcion){
        tu_turno(resultado);
    } else{
        
        var tiro = resultado.cartas[opcion -1];
        console.log(tiro);
        servicioWeb.invocar(
          'PUT',
          '/ocho_loco/tirar/',
          {'palo':tiro.palo, 'denominacion':tiro.denominacion},
          function (resultado_nuevo) {
            if (resultado_nuevo.tiro === 'error') {
              imprimirNl('=====================================');
              imprimirNl(' Tu carta no es valida para el tope')
              imprimirNl('=====================================');
              juego();
            } else if(resultado_nuevo.tiro === 'ocho_loco'){
              imprimirNl('=========================');
              imprimirNl(' Has echo un ocho loco');
              imprimirNl('=========================');
              ocho_loco();
            } else if(resultado_nuevo.tiro === 'hecho'){
              imprimirNl('==================');
              imprimirNl(' Tiro correcto');
              imprimirNl('==================');
              juego();
            }
            
          }
        );
    }
  });
}
//------------------------------------------------------------------------------

function sacar_carta(resultado) {
  servicioWeb.invocar(
          'PUT',
          '/ocho_loco/sacar/',
          {},
          function (resultado_nuevo) {
              
            if (resultado_nuevo.estado === 'error') {
              imprimirNl('=====================================');
              imprimirNl(' Ya no hay cartas en la baraja')
              imprimirNl('=====================================');
            }
            else if(resultado_nuevo.estado === 'hecho'){
              imprimirNl('===================================================');
              imprimirNl(' Haz sacado la carta: ' + resultado_nuevo.carta.palo + ' ' + resultado_nuevo.carta.denominacion);
              imprimirNl('===================================================');
            }
            juego();
          });

};



function ocho_loco(resultado) {
  imprimirNl('============================================');
  imprimirNl('Selecciona el palo para continuar el juego');
  imprimirNl('============================================');
  imprimirNl('(1) PICA');
  imprimirNl('(2) CORAZON');
  imprimirNl('(3) DIAMANTE');
  imprimirNl('(4) TREBOL');
  var dato ;
  
  
  leerNumero(1, 4, function (opcion) {
    switch (opcion) {

    case 1:
      dato = 'PICA';
      break;

    case 2:
      dato = 'CORAZON';
      break;

    case 3:
      dato = 'DIAMANTE';
      break;
      
    case 4:
      dato = 'TREBOL'
      break;
    }
  
  servicioWeb.invocar(
          'PUT',
          '/ocho_loco/ocho_loco/',
          {palo: dato},
          function (resultado_nuevo) {
            
            if (resultado_nuevo.estado === 'hecho') {
              imprimirNl('=====================================');
              imprimirNl(' Ocho loco es ahora: '  + resultado_nuevo.codigo);
              imprimirNl('=====================================');
              juego();
            }
            else {
              imprimirNl('=====================================');
              imprimirNl('Error');
              imprimirNl('=====================================');
              ocho_loco(resultado)
            }
              
            
          });
  
  });

};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function ganaste(resultado) {
  imprimirNl('==================');
  imprimirNl(' FELICIDADES!!!!!');
  imprimirNl(' ERES EL GANADOR');
  imprimirNl('==================');
  process.exit(0);
}
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function perdiste(resultado) {
  imprimirNl('==================');
  imprimirNl(' FELICIDADES!!!!!');
  imprimirNl(' PERDISTE');
  imprimirNl('==================');
  process.exit(0);
}

//------------------------------------------------------------------------------

function pasar(){
  servicioWeb.invocar(
            'PUT',
            '/ocho_loco/pasar/',
            {},
            function (resultado) {
              if (resultado.estado === 'hecho') {
                imprimirNl('');
                imprimirNl('==================');
                imprimirNl(' PASASTE EL TURNO');
                imprimirNl('=================='); 
              }
              else{
                imprimirNl('==================');
                imprimirNl(' ERROR');
                imprimirNl('==================');     
                
              }
              juego();
            }
  );
}
//------------------------------------------------------------------------------
function tu_turno(resultado) {
  imprimirJuego(resultado);
  imprimirOpcionesJuego(resultado);
  if (resultado.baraja[0].length === 0) {
    leerNumero(1, 4, function (opcion) {
      switch (opcion) {
  
      case 1:
        sacar_carta(resultado);
        break;
  
      case 2:
        hacer_tiro(resultado);
        break;
  
      case 3:
        pasar();
        break;
      case 4:
        juego();
        break;
      }});
    
    }
    else {
      leerNumero(1, 3, function (opcion) {
      switch (opcion) {
  
      case 1:
        sacar_carta(resultado);
        break;
  
      case 2:
        hacer_tiro(resultado);
        break;
  
      case 3:
        juego();
        break;
      }});  
      
    }

  
}

//------------------------------------------------------------------------------
function juego() {
  imprimirNl();
  imprimirNl('Un momento');
  esperarTurno(function (resultado) {
    //console.log(resultado.estado);
    switch (resultado.estado){

    case 'tu_turno':
      tu_turno(resultado);
      break;

    case 'ganaste':
      ganaste(resultado);
      break;

    case 'perdiste':
      perdiste(resultado);
      break;
    }});
  
}
//------------------------------------------------------------------------------


titulo();

if (process.argv.length !== 4) {
  imprimirNl();
  imprimirNl('Se debe indicar: <nombre de host> y <puerto>');
  process.exit(0);

} else {
  var servicioWeb = invocadorServicioWeb(process.argv[2], process.argv[3]);
  stdin.resume();
  menu();
}