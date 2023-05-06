function localChange(check){
  local.style.display = check.checked ? 'block' : 'none'
  let list = document.querySelectorAll('#local textarea');
  for (const l of list){
    l.disabled = !check.checked
  }
}

function limitChange(check){
  limit.style.display = check.checked ? 'block' : 'none'
  let list = document.querySelectorAll('#limit input');
  for (const l of list){
    l.disabled = !check.checked
  }
}

$( document ).ready(function() {
  $('#responsavel').change(function () {
    if(this.value){
      $('#addResponsavel').show()
    }else{
      $('#addResponsavel').hide()
    }
  });
  $('#addResponsavel').click(function (){
    $('#responsavel option[value="' + $('#responsavel').val() + '"]').attr('disabled','disabled');
    let resp = $('<div class="card-reposible" id="card-reponsible-'+$("#responsavel option:selected" ).val() +'">'
                    +'<button type="button" aria-hidden="true" class="close remove-reponsible" onclick="removeReponsible(this);" data-reposible="'+ $("#responsavel option:selected" ).val() +'">×</button>'
                    +'<span data-notify="icon" class="pe-7s-user"></span>'
                    +'<p class="text-" data-notify="message">'+$("#responsavel option:selected" ).text()+'</p>'
                    + '<input type="hidden" name="reponsible[]" value="'+$("#responsavel option:selected" ).val() +'">'
                    +'</div>')

    $("#reponsibles").prepend(resp)
    $('#responsavel').val('')
    $('#addResponsavel').hide()
  });
  // on remove $('#responsavel option[value="' + $('#responsavel').val() + '"]').removeAttr('disabled')
});

function removeReponsible(resp){
  let respon = $(resp).data("reposible")
  $('#responsavel option[value="' + respon + '"]').removeAttr('disabled')
  $( "#card-reponsible-"+respon ).remove();
}

function onChangeDate() {
  const date = document.querySelector('input[name=date]');
  const dateEnd = document.querySelector('input[name=dateEnd]');
  if (((new Date(Date.now())).getTime() < (new Date(date.value)).getTime())) {
    date.setCustomValidity('');
  } else {
    date.setCustomValidity('A data de inicio não pode ser menor do que a data atual');
  }

  if (((new Date(date.value)).getTime() < (new Date(dateEnd.value)).getTime())) {
    dateEnd.setCustomValidity('');
  } else {
    dateEnd.setCustomValidity('A data de inicio não pode ser maior do que a data de termino');
  }

  if (((new Date(congressDate)).getTime() <= (new Date(date.value)).getTime())) {
    date.setCustomValidity('');
  } else {
    date.setCustomValidity('A data de inicio não pode ser menor do que o início do Congresso');
  }

  if (((new Date(dateEnd.value)).getTime() <= (new Date(congressDateEnd)).getTime())) {
    dateEnd.setCustomValidity('');
  } else {
    dateEnd.setCustomValidity('A data de termino não pode ser maior do que o termino do Congresso');
  }

}