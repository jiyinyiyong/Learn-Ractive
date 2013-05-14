var colors = [ 'red', 'green', 'blue' ];

var view = new Ractive({
  el: output,
  template: template,
  data: {
    colors: colors,
    color: colors[0]
  }
});