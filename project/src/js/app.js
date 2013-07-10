/*global define, window, document */

define([ 'domReady', 'Statesman', 'controllers/main' ], function ( domReady, Statesman, main ) {

	'use strict';
	
	var app, dataPromise;

	app = { state: new Statesman() };

	dataPromise = $.getJSON( 'data.json' );


	domReady( function () {
		app.el = document.getElementById( 'container' );

		dataPromise.then( function ( data ) {
			app.data = data;
			main( app );
		});
	});


	window.app = app; // useful for debugging!

	return app;

});