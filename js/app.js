/*global define, window, document */

define([ 'domReady', 'Statesman', 'data', 'controllers/main' ], function ( domReady, Statesman, data, main ) {

	'use strict';
	
	var app;

	app = {
		data: data,
		state: new Statesman()
	};

	domReady( function () {
		app.el = document.getElementById( 'container' );

		main( app );
	});


	window.app = app; // useful for debugging!

	return app;

});