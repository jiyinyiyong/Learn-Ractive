var months, fahrenheit;

months = [ 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D' ];
fahrenheit = false;

var view = new Ractive({
  el: output,
  template: template,
  modifiers: {
    into: function ( divisor, dividend ) {
      return dividend / divisor;
    },
    scale: function ( val ) {
      return 2 * Math.abs( val );
    },
    format: function ( val ) {
      if ( fahrenheit ) {
        val = ( val * 1.8 ) + 32;
      }

      return val.toFixed( 1 ) + '°';
    },
    color: function ( val ) {
      var red, green, blue, rgb;

      red = Math.max( 0, Math.min( 255, Math.floor( 2.56 * ( val + 50 ) ) ) );
      green = 100;
      blue = Math.max( 0, Math.min( 255, Math.floor( 2.56 * ( 50 - val ) ) ) );

      rgb = 'rgb(' + red + ',' + green + ',' + blue + ')';

      return rgb;
    },
    arity: function ( val ) {
      return val >= 0 ? 'positive' : 'negative';
    },
    asMonth: function ( i ) {
      return months[i];
    }
  }
});

view.on({
  'set:selectedCity': function ( i ) {
    var city = this.get( 'cities' )[i];
  
    this.animate( 'city', this.get( 'cities[' + i + ']' ), {
      duration: 300,
      easing: 'easeOut'
    });
  },

  'set:degreeType': function ( type ) {
    if ( type === 'fahrenheit' ) {
      fahrenheit = true;
    } else {
      fahrenheit = false;
    }

    view.update( 'city' );
  }
});

// load our data
$.getJSON( 'files/data/temperature.json' ).then( function ( data ) {
  view.set({
    cities: data,
    city: data[0]
  });
});