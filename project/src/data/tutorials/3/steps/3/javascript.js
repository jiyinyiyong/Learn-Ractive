var view = new Ractive({
  el: output,
  template: template
});

listener = view.on({
  activate: function () {
    alert( 'Activating!' );
  },
  deactivate: function () {
    alert( 'Deactivating!' );
  },
  silence: function () {
  	alert( 'No more alerts!' );
  	listener.cancel();
  }
});