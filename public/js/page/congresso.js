function addressChange(check){
  console.log(check.checked)
  address.style.display = check.checked ? 'block' : 'none'
  let list = document.querySelectorAll('#address input');
  for (const l of list){
    l.disabled = !check.checked
  }
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
}