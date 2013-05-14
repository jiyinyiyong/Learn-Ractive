/*global require */
(function () {

	'use strict';

	require.config({
		baseUrl: 'js',
		paths: {
			Ractive: 'lib/Ractive',
			Statesman: 'lib/Statesman',
			Divvy: 'lib/Divvy'
		},
		urlArgs: 'bust=' + Date.now()
	});

	require([ 'app' ]);

}());