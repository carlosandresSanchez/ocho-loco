'use strict';

var PAUSA = 1000;  // Número de milisegundos entre cada petición de espera

$(document).ready(function () {
  
  function get_oponentes(oponentes) {
    var s = "";
    for (var i = 0; i < oponentes.length; i++) {
      s += ("<p> Oponente: " + oponentes[i].nombre + "<br/> Cartas: " + JSON.parse(oponentes[i].cartas).length + '</p>');
    }
    return s;
  }
  
  //----------------------------------------------------------------------------
  $('.regresar_al_menu').click(menuPrincipal);
  //----------------------------------------------------------------------------
    
  //Esta funcion solo es para obtener las etiquetas de las imagenes de las cartas de la mano o de
  //la pila...
  function imagen_cartas(carta,clase) {
    
    var palo;
    var denominacion;
    var imagen = '<img src=\"/images/cards/';
    var id="";
    
    if (carta.denominacion === '10') {
      denominacion = 't';
    }else{
      denominacion = carta.denominacion.toLowerCase();
    }
    
    imagen += denominacion;
    
    switch (carta.palo) {
      case 'CORAZON':
        palo = "h"
        break;
        
      case 'DIAMANTE':
        palo = "d"
        break;
      case 'TREBOL':
        palo = "c"
        break
        
      case 'PICA':
        palo = "s"
        break;
    }
    var id= carta.palo + "_" + carta.denominacion;
    
    return imagen + palo + '.gif\" class  =\"' + clase + '\"   id=\"' + id + '\"/>';
  }
  //----------------------------------------------------------------------------
  $('#boton_crear_juego').click(function () {
    $('div').hide();
    $('#nombre_del_juego').val('');
    $('#nombre_del_creador').val('');
    $('#seccion_solicitar_nombres').show();
    //----------------------------------------------------------------------------
  });

  //----------------------------------------------------------------------------
  $('#boton_continuar_crear_juego').click(continuarCrearJuego);

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function continuarCrearJuego() {

    var nombre = $('#nombre_del_juego').val().trim();
    var nombre_creador = $('#nombre_del_creador').val().trim();
    
    if (nombre === "" || nombre_creador === "") {
      menuPrincipal();
    } else{
        
      $.ajax({
        type: "POST",
        url: "/ocho_loco/crear_juego/",
        data: {
          'nombre':nombre,
          'nombre_creador': nombre_creador
        },
        dataType: 'json',
        success: function(resultado){
            if (resultado.creado) {
              var pila  = resultado.pila;
              var cartas = resultado.cartas;
              var cartas_texto = ""
              for (var i = 0; i < cartas.length; i ++ ) {
                cartas_texto +=imagen_cartas(cartas[i],"cartas_mano");
              }
              $('div').hide();
              $('#mensaje_1').html('Esperando a que alguien más se una al ' +
              'juego <strong>' + escaparHtml(nombre) + '</strong>.');
              $('#tus_cartas').html(cartas_texto);
              $('#pila').html(imagen_cartas(pila[pila.length-1],"pila"));
              $('#seccion_mensajes').show();
              $('#seccion_jugador').show();
              $('#seccion_juego_jugador').show();
              esperaTurno();
            }
          
        }
      });
    }
    return false; //Hay que hacer que la funcion regrese false para que no se envie el formulario...
  }
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  // Para evitar inyecciones de HTML.
  function escaparHtml(str) {
    var t = {
      '&': 'amp',
      '<': 'lt',
      '>': 'gt',
      '"': 'quot',
      '\'': '#39'
    };
    return str.replace(/[&<>"']/g, function(x) {
      return '&' + t[x] + ';';
    });
  }

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function mensajeError(mensaje) {
    $('body').css('cursor', 'auto');
    $('div').hide();
    $('#mensaje_error').html(mensaje);
    $('#seccion_error').show();
  }
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function esperaTurno() {
    var bandera=true;
    var compare_pila;
    var segundos = 0;
    var bandera2=true;

    $('body').css('cursor', 'wait');

    function ticToc() {
      $('#mensaje_3').html('Llevas ' + segundos + ' segundo' +
        (segundos === 1 ? '' : 's') + ' esperando.');
      segundos++;
      
      $.ajax({
        type: "GET",
        url: "/ocho_loco/estado/",
        data:{},
        dataType: 'json',
        success: function(resultado){

            var pila  = resultado.pila;
            var cartas = resultado.cartas;
            var cartas_texto = "";
            var oponents = resultado.oponentes;
                
            for (var i = 0; i < cartas.length; i ++ ) {
              cartas_texto += imagen_cartas(cartas[i],"manos_carta");
            }
          
          if (compare_pila) {
            if (compare_pila.denominacion === pila[pila.length-1].denominacion &&
                compare_pila.palo === pila[pila.length-1].palo ) {
              bandera=false;
            }
            else{
              bandera=true;
            }
            }
            compare_pila = pila.slice(pila.length-1);
                     
                     
          switch (resultado.estado){
              
            case 'espera':
              if (bandera) {
                $('div').hide();
                $('#h2_oponentes').html("Oponentes");
                $('#h2_oponentes').html("Oponentes");
                $('#oponentes').html(get_oponentes(oponents));
                $('#seccion_juego_jugador').show();
                $('#nombre_juego_jugador').html("Juego: " + resultado.nombre_juego + "<br/> Jugador: " +    resultado.nombre_jugador);
                //$('#nombre_jugador').html("Jugador: " + resultado.nombre_jugador);
                $('#mensaje_1').html("Esperando a que el juego empiece");
                $('#tus_cartas').html(cartas_texto);
                $('#pila').html("");
                $('#seccion_mensajes').show();
                $('#seccion_jugador').show();
                bandera = false;
              }
              
              setTimeout(ticToc, PAUSA);
              break;
            
            case 'tu_turno':
              tu_turno(resultado);
              break;
        
            case 'ganaste':
              ganaste(resultado);
              break;
        
            case 'perdiste':
              perdiste(resultado);
              break;
            case 'turno de otro jugador':
              if (bandera) {
                $('#h2_oponentes').html("Oponentes");
                $('#oponentes').html(get_oponentes(oponents));
                $('#seccion_juego_jugador').show();
                $('div').hide();
                $('#seccion_juego_jugador').show();
                $('#mensaje_1').html("Turno de otro jugador");
                $('#tus_cartas').html(cartas_texto);
                
                $('#pila').html(imagen_cartas(pila[pila.length-1]));
                $('#seccion_mensajes').show();
                $('#seccion_jugador').show();
                //$('#seccion_juego').show();
                
                bandera = false;
              
              }
              
              setTimeout(ticToc, PAUSA);
              break;
            
          }


        }
      });
    };
    setTimeout(ticToc, 0);
  };
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  $('#boton_unir_juego').click(function() {
    $('div').hide();
    $.ajax({
      url: '/ocho_loco/juegos_existentes/',
      type: 'GET',
      dataType: 'json',
      success: function (resultado) {
        if (resultado.length === 0) {
          $('#seccion_sin_juegos').show();
        } else {
          
          var r = resultado.map(function (x) {
            return '<option value="' + x.id + '">' +
              escaparHtml(x.nombre) + '</option>';
          });
          $('#lista_juego').html(r.join(''));
          $('#seccion_unir_juegos').show();
        }
      }
    });
    
  });
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  $('#boton_continuar_unir_juego').click(continuarUnirJuego);
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function continuarUnirJuego () {
    var nombre_jugador = $('#unir_nombre_jugador').val().trim();
    var id_juego = $('#lista_juego').val();
    if (nombre_jugador === "" || id_juego === "" ) {
       menuPrincipal();
    }else{
      $.ajax({
        type: "PUT",
        url: "/ocho_loco/unir_juego/",
        data: {
          'id_juego':id_juego,
          'nombre': escaparHtml(nombre_jugador)
        },
        dataType: 'json',
        success: function(resultado){
          if (resultado.unido) {
            var pila  = resultado.pila;
            var cartas = resultado.cartas;
            var cartas_texto = ""
            
            for (var i = 0; i < cartas.length; i ++ ) {
              cartas_texto += imagen_cartas(cartas[i]);
            }
            $('#nombre_juego').html(resultado.juego);
            $('#nombre_jugador').html(resultado.nombre_jugador);
            $('div').hide();
            $('#mensaje_1').html('Esperando a que alguien más se una al ' +
            'juego <strong>' + escaparHtml(nombre_jugador) + '</strong>.');
            $(".carta").css('top', '0px');
            $(".carta").css('left', '0px');
            $(".carta").css('position', 'absolute');
            $('#tus_cartas').html(cartas_texto);
            $('#pila').html(imagen_cartas(pila[pila.length-1]));
            $('#numero_cartas').html("Hay " + resultado.baraja.length + " cartas");
            $('#seccion_mensajes').show();
            $('#seccion_jugador').show();
            $('#seccion_juego_jugador').show();
            esperaTurno();
            
          }
        }
      }); 
    }    
  }
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  $('#form_lista_juegos').submit(function () {
    return false; // Se requiere para evitar que la forma haga un "submit".
  });
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function tu_turno(resultado) {
    $('body').css('cursor', 'default');
    var baraja = resultado.baraja[0];
    var pila  = resultado.pila;
    var cartas = resultado.cartas;
    var oponents = resultado.oponentes;
    var cartas_texto = "";
        
    for (var i = 0; i < cartas.length; i ++ ) {
       cartas_texto += imagen_cartas(cartas[i],"carta");
    }
    $('div').hide();
    $('#mensaje_1').html("ES TU TURNO");
    $('#tus_cartas').html(cartas_texto);
    setClick('.carta');
    
    if (pila[pila.length-1].denominacion === "-1") {
      $('#pila').html("<strong>Tienes que tirar " + pila[pila.length-1].palo + "</strong>");
    }else{
      $('#pila').html(imagen_cartas(pila[pila.length-1],"pila"));
    }
    
    $('#mensaje_pila').html('Arrastra una carta de tu mano a la Pila');
    
    if(baraja.length){
      $('#seccion_pasar').hide();
      $('#mensaje_baraja').html('Cartas en la baraja: ' + baraja.length);
      
    }else{
      $('#seccion_pasar').show();
      $('#mensaje_baraja').html('No hay cartas en la baraja');
    }
    $('#mensaje_3').html('');
    $('#seccion_mensajes').show();
    $('#seccion_juego').show();
    $('#img_baraja').show();
    $('#oponentes').html(get_oponentes(oponents));
    $('#seccion_juego_jugador').show();
    $('#seccion_jugador').show();
    
    
    $('#baraja').show();
    setDraggable("carta");
    setDroppableTiro("pila");
    setClick('.carta');
  }
  
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function setDraggable(clase) {
      var drag = "." + clase;
        $(drag).draggable({cursor: "crosshair", addClasses: false,revert:true, revertDuration:200,scope:"tiro"});
  }
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function setDroppableTiro(id) {
        var drag = "#" + id;
        $(drag).droppable({addClasses: false,
                          tolerance: "pointer",
                          scope:"tiro",
                          over: function( event, ui ) {
                            
                          },
                          drop: function( event, ui ) {
                            
                            var carta = ui.draggable.attr("id").split("_");
                            
                            $.ajax({
                              type: "PUT",
                              url: "/ocho_loco/tirar/",
                              data: {
                                'palo': carta[0],
                                'denominacion': carta[1]
                              },
                              dataType: 'json',
                              success: function(resultado_nuevo){
                                if (resultado_nuevo.tiro === 'error') {
                                  
                                  $('#mensaje_pila').html('Tiro inválido');                                  
                                  tu_turno(resultado);
                                  
                                } else if(resultado_nuevo.tiro === 'ocho_loco'){
                                  
                                  $('#mensaje_pila').html('<strong>Has hecho un ocho loco</strong>');
                                  ocho_loco();
                                  
                                } else if(resultado_nuevo.tiro === 'hecho'){
                                  
                                  $('#mensaje_pila').html('<strong>Tiro bien hecho</strong>');
                                  //$('#img_baraja').removeClass("baraja");
                                  esperaTurno();
                                  
                                }
                              }
                            });
                          }
      });
  }
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  function menuPrincipal() {
    $('div').hide();
    $('#seccion_menu').show();
    return false;
  }

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
  $('#img_baraja').click(function () {
    $.ajax({
            type: "PUT",
            url: "/ocho_loco/sacar/",
            data: {},
            dataType: 'json',
            success: function(resultado_nuevo){
              
              if (resultado_nuevo.estado === "error") {
                $('#mensaje_baraja').html('<strong>Ya no hay cartas en la baraja</strong>');
                $('#seccion_pasar').show();
                
              }
              else if(resultado_nuevo.estado === "hecho"){
                
                $('#mensaje_3').html('<strong>Tienes una nueva carta</strong>');
                esperaTurno();
                
              }
            }
    });
  });
  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
    
    function ocho_loco(){
      $('div').hide();
      $('#seccion_jugador').show();
      $('#seccion_juego').hide();
      $('#seccion_ocho_loco').show();
      $('#img_baraja').hide();
      
    }
    //----------------------------------------------------------------------------
    
    $('#boton_enviar_ocho_loco').click(function (){
      var palo = $('#lista_palos').val();
      $.ajax({
        type: "PUT",
        url: "/ocho_loco/ocho_loco/",
        data: {
          palo: palo
        },
        dataType: 'json',
        success: function(resultado){
          if (resultado.estado==='hecho') {
            esperaTurno();
          }
          else if (resultado.estado==='error') {
            ocho_loco();
          }
          
        }
      });
      
    });
    
    //----------------------------------------------------------------------------
    //----------------------------------------------------------------------------
    $('#form_ocho_loco').submit(function () {
      return false; // Se requiere para evitar que la forma haga un "submit".
    });
    
    //----------------------------------------------------------------------------
    //----------------------------------------------------------------------------
    $('#boton_pasar_turno').click(function (){
      $.ajax({
        type: "PUT",
        url: "/ocho_loco/pasar/",
        data: {},
        dataType: 'json',
        success: function(resultado){
              esperaTurno();
            }
      });
    });
    
    //----------------------------------------------------------------------------
    //----------------------------------------------------------------------------
    function perdiste(resultado){
    $('#seccion_juego_jugador').show();
    $('body').css( 'cursor', 'default' );
    $('div').hide();
    $("#perdiste").show();
    
    }
    
    
    function ganaste(resultado){
      $('#seccion_juego_jugador').show();
      $('body').css( 'cursor', 'default' );
      $('div').hide();
      $("#ganaste").show();
    }
    
    //----------------------------------------------------------------------------
    //----------------------------------------------------------------------------

    function setClick(clase) {
      $(clase).click(function (){
        var degree = 60;
        var tam = $(clase).length;
        $(clase).each(function() {
           $(this).css({ '-moz-transform': 'rotate(' + degree + 'deg)'});
           degree -= degree/tam;
        });
  
      }); 
    }

});
