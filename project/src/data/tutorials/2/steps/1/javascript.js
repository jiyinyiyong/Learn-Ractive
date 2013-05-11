var view = new Ractive({
  el: output,
  template: template,
  data: { num: 0.5 },
  modifiers: {
  	multiply: function ( num ) {
      return num * 100;
  	}
  }
});