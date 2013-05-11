var view = new Ractive({
  el: output,
  template: template,
  data: { greeting: 'Hello', recipient: 'world' }
});