var view = new Ractive({
  el: output,
  template: template,
  data: {
    item: 'pint of milk',
    price: 0.49,
    qty: 5
  },
  modifiers: {
    formatCurrency: function ( num ) {
      if ( num < 1 ) return ( 100 * num ) + 'p';
      return '£' + num.toFixed( 2 );
    },
    timesQty: function ( num ) {
      return this.get( 'qty' ) * num;
    }
  }
});