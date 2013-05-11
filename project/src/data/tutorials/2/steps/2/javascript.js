var view = new Ractive({
  el: output,
  template: template,
  data: {
    red: 0.45,
    green: 0.61,
    blue: 0.2
  },
  modifiers: {
    multiply: function ( num, multiplier ) {
      return num * multiplier;
    }
  }
});