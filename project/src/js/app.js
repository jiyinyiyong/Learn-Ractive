/*global define, window, document */

define([ 'domReady', 'Statesman', 'controllers/main' ], function ( domReady, Statesman, main ) {

	'use strict';
	
	var app, dataPromise;

	app = { state: new Statesman() };

	// TEMP
	app.state.debug = true;

	dataPromise = $.getJSON( 'data.json' );


	domReady( function () {
		var eval2, result, warning;

		app.el = document.getElementById( 'container' );

		// test that eval2 will work (it won't in IE8)
		eval2 = eval;

		(function () {
			eval2( 'var test = "test"' );
		}());

		(function () {
			try {
				result = eval2( 'test' );
			} catch ( err ) {
				// we must be in IE
			}
		}());

		if ( result !== 'test' ) {
			warning = document.createElement( 'div' );
			warning.innerHTML = '<p>This app will not work in some older browsers that implement <code>eval</code> incorrectly, including this one. Please try again using Chrome or Firefox.</p><p>Note that <span class="logo">Ractive.js</span> itself works in all modern browsers and Internet Explorer 8 and above.</p>'
			app.el.appendChild( warning ); 
		}

		else {
			dataPromise.then( function ( data ) {
				app.data = data;
				main( app );
			});
		}
	});


	window.app = app; // useful for debugging!

	return app;

});