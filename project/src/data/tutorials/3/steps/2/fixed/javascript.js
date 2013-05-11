var view = new Ractive({
  el: output,
  template: template
});

document.getElementById( 'signIn' ).addEventListener( 'click', function () {
  var name = prompt( 'Enter your username to sign in', 'ractive_fan' );
  view.set( 'user.name', name );
});