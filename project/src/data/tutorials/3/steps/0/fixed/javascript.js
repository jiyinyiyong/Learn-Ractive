var view = new Ractive({
  el: output,
  template: template
});

view.on( 'activate', function ( event, el ) {
  alert( 'Activating!' );
});