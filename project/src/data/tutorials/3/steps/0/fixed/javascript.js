var ractive = new Ractive({
  el: output,
  template: template
});

ractive.on( 'activate', function ( event, el ) {
  alert( 'Activating!' );
});