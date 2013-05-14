var view = new Ractive({
  el: output,
  template: template,
  data: {
    signedIn: false,
    notSignedIn: true
  }
});

view.on( 'signIn', function () {
  var name = prompt( 'Enter your username to sign in', 'ractive_fan' );

  view.set({
    username: name,
    signedIn: true,
    notSignedIn: false
  });
});