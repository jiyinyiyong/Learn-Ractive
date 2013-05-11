var view = new Ractive({
  el: output,
  template: template,
  data: {
    item: 'pint of milk',
    price: 0.49,
    qty: 5
  },
  modifiers: {
    
  }
});