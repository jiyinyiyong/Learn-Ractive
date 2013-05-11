var view = new Ractive({
  el: output,
  template: template,
  data: {
  	greeting: 'Hello',
  	recipient: 'world',
  	color: 'purple',
  	size: 2,
  	font: 'Arial',
  	counter: 0
  }
});

document.getElementById( 'count' ).addEventListener( 'click', function () {
  view.set( 'counter', view.get( 'counter' ) + 1 );
});