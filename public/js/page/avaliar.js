function starChange(num){
  $('input[name="grade"]').val( num );
  $( ".star" ).find(".fa-star").each(function(idx) {
    if(idx < num){
      $(this).addClass("checked")
    }else{
      $(this).removeClass("checked")
    }
  })
}