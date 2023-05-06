function alterLimit(name){
  document.getElementsByName(name)[0].disabled = false;
  document.getElementsByName(name)[0].value = '';
}