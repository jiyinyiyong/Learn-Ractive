/*global define */

define( [ 'Ractive', 'Divvy', 'rv!templates/main' ], function ( Ractive, Divvy, main ) {
	
	'use strict';

	return Ractive.extend({
		template: main,

		init: function ( options ) {
			this.divvy = new Divvy({
				el: document.getElementById( 'content' ),
				columns: [
					{
						size: 45,
						children: [{ id: 'copy-block', size: 3 }, { id: 'output-block', size: 2 }]
					},
					{
						size: 55,
						children: [{ id: 'template', size: 3 }, { id: 'javascript', size: 5 }, { id: 'console', size: 2 }]
					}
				]
			});
		}
	});

});