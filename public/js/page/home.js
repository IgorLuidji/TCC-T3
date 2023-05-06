function changePicker(e) { 
  const date = new Date(e.date);
  let url = window.location.origin;    
  url += '?date=' + date.toJSON()
  window.location.href = url;
}