$(document).ready(function(){
  changeCongresso();
  select = false;
  $('[name="congress"]').change( function() { changeCongresso() })
  $('#buscar').click( function() { buscar() })
});

function changeCongresso(){
  let congresso = $('[name="congress"]').val();
  $('[name="event"]').empty().append('<option value="">Selecione</option>')
  let eventosCongresso = eventos.filter((e) =>  e.congresso == congresso)
  eventosCongresso.forEach(e => {
    $('[name="event"]').append('<option ' + (select == e.cod ? 'selected' : '') + ' value="'+e.cod+'">'+e.nome+'</option>')
  })
}

function buscar(){
  let url = window.location.origin+'/relatorios';    
  url += '?e=' + $('[name="event"]').val() + '&c=' + $('[name="congress"]').val()
  window.location.href = url;
}