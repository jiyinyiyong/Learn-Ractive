var view = new Ractive({
  el: output,
  template: template
});

view.on({
  activate: function () {
    alert( 'Activating!' );
  },
  deactivate: function () {
    alert( 'Deactivating!' );
  }
});