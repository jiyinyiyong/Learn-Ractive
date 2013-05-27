/*global define */

define( [ 'views/Layout', 'data' ], function ( Layout, data ) {
	
	'use strict';

	return function ( app ) {
		var view;

		view = new Layout({
			el: 'layout',
			data: { blocks: data.blocks, columns: true }
		});
	};

});