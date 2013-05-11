// Sensor v0.1.0
// Copyright (2013) Rich Harris
// Released under the MIT License

// https://github.com/Rich-Harris/sensor

;(function ( global ) {

'use strict';

var Sensor, helpers, _private = {};

(function () {

	'use strict';

	var proto, definitions, compoundDefinitions, patched, matches, classPattern, cachedPatterns, proxy, getElFromString;

	Sensor = function ( el ) {
		var sensor;

		if ( this instanceof Sensor ) {
			if ( el.__sensor ) {
				throw new Error( 'Each element can only have one Sensor instance. Use `Sensor( el )` rather than `new Sensor( el )`' );
			}

			this.el = el;
			this.listeners = {};
			this.boundEvents = {};

			el.__sensor = this;

			return;
		}

		if ( !el ) {
			el = window;
		}

		if ( typeof el === 'string' ) {
			el = getElFromString( el );

			if ( !el ) {
				throw new Error( 'Could not find specified element' );
			}
		}

		if ( el.__sensor ) {
			return el.__sensor;
		}

		if ( !el.nodeType || ( el.nodeType !== 1 && el.nodeType !== 9 ) ) {
			if ( !( el instanceof Window ) ) {
				throw new Error( 'Object must be an element node, document node or the window object' );
			}
		}

		sensor = new Sensor( el );

		el.__sensor = sensor;

		return sensor;
	};

	Sensor.prototype = {
		on: function ( eventName, delegate, handler ) {

			var self = this, listeners, listener, cancelled, events, key, index, i, len;

			// allow multiple listeners to be attached in one go
			if ( typeof eventName === 'string' && eventName.indexOf( ' ' ) !== -1 ) {
				eventName = eventName.split( ' ' );
			}

			if ( typeof eventName === 'object' ) {
				events = eventName;
				listeners = [];

				// array of event names (['keyup', 'keydown'] or 'keyup keydown')
				if ( Object.prototype.toString.call( events ) === '[object Array]' ) {
					if ( !handler ) {
						handler = delegate;
						delegate = null;
					}

					for ( i=0, len=events.length; i<len; i+=1 ) {
						listener = {
							eventName: events[i],
							delegate: delegate,
							handler: handler
						};

						listeners[ listeners.length ] = listener;
						this._addListener( listener );
					}
				}

				else {
					for ( key in events ) {
						if ( events.hasOwnProperty( key ) ) {
							if ( typeof events[ key ] === 'function' ) {
								handler = events[ key ];

								if ( ( index = key.indexOf( ' ' ) ) !== -1 ) {
									eventName = key.substr( 0, index );
									delegate = key.substring( index + 1 );
								}

								else {
									eventName = key;
									delegate = null;
								}
							}


							else if ( typeof events[ key ] === 'object' ) {
								eventName = key;
								delegate = events[ key ].delegate;
								handler = events[ key ].handler;
							}

							listener = {
								eventName: eventName,
								delegate: delegate,
								handler: handler
							};

							listeners[ listeners.length ] = listener;
							this._addListener( listener );
						}
					}
				}

				return {
					cancel: function () {
						if ( !cancelled ) {
							while ( listeners.length ) {
								self.off( listeners.pop() );
							}
							cancelled = true;
						}
					}
				};
			}

			// there may not be a child selector involved
			if ( !handler ) {
				handler = delegate;
				delegate = null;
			}

			listener = {
				eventName: eventName,
				delegate: delegate,
				handler: handler
			};

			this._addListener( listener );

			return {
				cancel: function () {
					if ( !cancelled ) {
						self.off( listener );
						cancelled = true;
					}
				}
			};
		},

		off: function ( eventName, delegate, handler ) {
			var self = this, listeners, listener, index, teardown, name;

			teardown = function ( eventName ) {
				delete self.listeners[ eventName ];

				self.boundEvents[ eventName ].teardown();
				delete self.boundEvents[ eventName ];
			};

			// no arguments supplied - remove all listeners for all event types
			if ( !arguments.length ) {
				for ( name in this.boundEvents ) {
					if ( this.boundEvents.hasOwnProperty( name ) ) {
						teardown( name );
					}
				}

				return;
			}

			// one argument supplied - could be a listener (via listener.cancel) or
			// an event name
			if ( arguments.length === 1 ) {
				if ( typeof eventName === 'object' ) {
					listener = eventName;
					eventName = listener.eventName;

					listeners = this.listeners[ eventName ];

					if ( !listeners ) {
						return;
					}

					index = listeners.indexOf( listener );

					if ( index === -1 ) {
						return;
					}

					listeners.splice( index, 1 );

					if ( !listeners.length ) {
						teardown( eventName );
					}

					return;
				}

				// otherwise it's a string, i.e. an event name
				teardown( eventName );
				return;
			}

			// two arguments supplied
			if ( arguments.length === 2 ) {
				// no child selector supplied
				if ( typeof delegate === 'function' ) {
					handler = delegate;
					delegate = null;
				}

				// no handler supplied, which means we're removing all listeners applying
				// to this event name and child selector
				else {
					listeners = this.listeners[ eventName ];

					if ( listeners ) {
						this.listeners[ eventName ] = listeners.filter( function ( listener ) {
							return listener.delegate !== delegate;
						});

						if ( !this.listeners[ eventName ].length ) {
							teardown( eventName );
						}
					}

					return;
				}
			}

			// we have an event name, a child selector (possibly null), and a handler
			if ( this.listeners[ eventName ] ) {

				if ( delegate ) {
					this.listeners[ eventName ] = this.listeners[ eventName ].filter( function ( listener ) {
						return listener.delegate !== delegate || listener.handler !== handler;
					});
				}

				else {
					this.listeners[ eventName ] = this.listeners[ eventName ].filter( function ( listener ) {
						return listener.delegate  || listener.handler !== handler;
					});
				}

				if ( !this.listeners[ eventName ].length ) {
					teardown( eventName );
				}

				return;
			}
		},

		once: function ( eventName, delegate, handler ) {
			var suicidalListener;

			if ( arguments.length === 2 ) {
				handler = delegate;
				delegate = null;
			}

			suicidalListener = this.on( eventName, delegate, function () {
				handler.apply( this, arguments );
				suicidalListener.cancel();
			});

			return suicidalListener;
		},

		fire: function ( eventName, target ) {
			var args, defined, listeners, listener, i, el, match;

			args = Array.prototype.slice.call( arguments, 2 );
			defined = this.boundEvents[ eventName ] || this.boundEvents[ compoundDefinitions[ eventName ] ];

			if ( !this.listeners[ eventName ] ) {
				return;
			}

			// clone listeners, so any listeners bound by the handler don't
			// get called until it's their turn (e.g. doubletap)
			listeners = this.listeners[ eventName ].slice();

			for ( i=0; i<listeners.length; i+=1 ) {
				listener = listeners[i];

				if ( listener.delegate ) {
					el = target;

					if ( el === this.el ) {
						continue; // not a child of this.el
					}

					while ( !match && el !== this.el ) {
						if ( matches( el, listener.delegate ) ) {
							match = el;
						}

						el = el.parentNode;
					}

					if ( match ) {
						if ( !defined.filter || defined.filter.apply( match, args ) ) {
							listener.handler.apply( match, args );
						}
					}

				} else {
					if ( !defined.filter || defined.filter.apply( this.el, args ) ) {
						listener.handler.apply( this.el, args );
					}
				}
			}
		},

		_addListener: function ( listener ) {
			var eventName = listener.eventName;

			if ( !this.listeners[ eventName ] ) {
				this.listeners[ eventName ] = [];
			}

			this.listeners[ eventName ].push( listener );
			this._bindEvent( eventName );
		},

		_bindEvent: function ( eventName ) {
			var self = this, definition, defined, fire;

			definition = definitions[ eventName ];

			if ( !definition ) {
				// is this part of a compound event?
				if ( compoundDefinitions[ eventName ] ) {
					this._bindEvent( compoundDefinitions[ eventName ] );
					return;
				}

				// assume this is a standard event - we need to proxy it
				definition = proxy( eventName );
			}

			if ( !this.boundEvents[ eventName ] ) {

				// block any children from binding before we've finished
				this.boundEvents[ eventName ] = true;

				// apply definition
				defined = this.boundEvents[ eventName ] = definition.call( this, this, this.el );
			}
		}
	};

	definitions = {};
	compoundDefinitions = {};

	// define custom events
	Sensor.define = function ( name, definition ) {
		var i, joined;

		// compound event definitions
		if ( typeof name === 'object' ) {
			joined = name.join( ' ' );
			definitions[ name.join( ' ' ) ] = definition;

			i = name.length;
			while ( i-- ) {
				compoundDefinitions[ name[i] ] = joined;
			}
		}

		else {
			definitions[ name ] = definition;
		}
	};

	// matching
	(function ( ElementPrototype ) {
		ElementPrototype.matches = ElementPrototype.matches || ElementPrototype.matchesSelector || 
		ElementPrototype.mozMatches    || ElementPrototype.mozMatchesSelector ||
		ElementPrototype.msMatches     || ElementPrototype.msMatchesSelector  ||
		ElementPrototype.oMatches      || ElementPrototype.oMatchesSelector   ||
		ElementPrototype.webkitMatches || ElementPrototype.webkitMatchesSelector;
	}( Element.prototype ));

	Sensor.patch = function () {
		var prototypes, i, on, off;

		if ( patched ) {
			return;
		}

		// Fuck you, Internet Exploder
		prototypes = ( typeof window.Node !== 'undefined' ? [ Node.prototype, Window.prototype ] : [ Element.prototype, HTMLDocument.prototype, Window.prototype ] );

		on = function () {
			var sensor = Sensor( this );
			sensor.on.apply( sensor, arguments );
		};

		off = function () {
			var sensor = Sensor( this );
			sensor.off.apply( sensor, arguments );
		};

		i = prototypes.length;
		while ( i-- ) {
			proto = prototypes[i];

			proto.on = on;
			proto.off = off;
		}

		patched = true;
	};

	classPattern = /^\.([^ ]+)$/;

	matches = function ( el, delegate ) {

		var classMatch, pattern;

		// CSS selectors - use el.matches if available
		if ( typeof delegate === 'string' ) {
			if ( el.matches ) {
				return el.matches( delegate );
			}

			// you need to bring your own el.matches polyfill - but we'll make
			// an exception for tag names...
			else if ( el.tagName.toLowerCase() === delegate.toLowerCase() ) {
				return true;
			}

			// ...and class names
			else if ( classMatch = classPattern.exec( delegate ) ) {
				pattern = cachedPatterns[ delegate ] || (function () {
					return ( cachedPatterns[ delegate ] = new RegExp( '\\s*' + delegate + '\\s*' ) );
				}());

				return el.className.test( pattern );
			}

			throw ( 'This browser does not support matches (aka matchesSelector) - either polyfill it (see e.g. https://github.com/termi/CSS_selector_engine) or only use class names, element arrays, or functions as child selectors' );
		}

		if ( typeof delegate === 'function' ) {
			return delegate( el );
		}

		if ( delegate.length ) {
			i = delegate.length;
			while ( i-- ) {
				if ( delegate[i] === el ) {
					return true;
				}
			}

			return false;
		}

		throw 'Illegal child selector';
	};


	getElFromString = function ( str ) {
		var el;

		if ( document.querySelector ) {
			if ( el = document.querySelector( str ) ) {
				return el;
			}
		}

		if ( str.charAt( 0 ) === '#' ) {
			if ( el = document.getElementById( str.substring( 1 ) ) ) {
				return el;
			}
		}

		return document.getElementById( str );
	};


	proxy = function ( eventName ) {
		var definition = function ( sensor, el ) {
			var handler = function ( event ) {
				sensor.fire( eventName, event.target, event );
			};

			el.addEventListener( eventName, handler );

			return {
				teardown: function () {
					el.removeEventListener( eventName, handler );
				}
			};
		};

		Sensor.define( eventName, definition );

		return definition;
	};

}());


/*global window */

(function ( Sensor ) {

	'use strict';

	Sensor.define( [ 'swipestart', 'swipe', 'swipeend' ], function ( sensor, el ) {

		var window_sensor, wheelActive, timeout, currentTarget, wheelWaitTime, wheelThreshold, declareSwipeEnd, cx, cy, vx, vy, elapsed, timeNow, lastEventTime, decayFactor, threshold;

		window_sensor = Sensor( window );

		wheelWaitTime = 150; // time between last wheel event, and firing 'swipeend'

		decayFactor = 0.996; // scalar deceleration per millisecond
		threshold = 0.005;   // minimum touchswipe velocity before firing 'swipeend'

		declareSwipeEnd = function () {
			clearTimeout( timeout ); // in case we didn't come here from the timeout

			sensor.fire( 'swipeend', currentTarget, null, { dx_total: cx, dy_total: cy, vx: vx, vy: vy });
			wheelActive = false;
		};

		sensor.on( 'wheel', function ( wheelEvent ) {
			var dx, dy;

			dx = -wheelEvent.deltaX / 5;
			dy = -wheelEvent.deltaY / 5;

			if ( !wheelActive ) {
				currentTarget = wheelEvent.target;
				cx = cy = 0;
				lastEventTime = Date.now();

				sensor.fire( 'swipestart', currentTarget, wheelEvent );

				wheelActive = true;
			}

			clearTimeout( timeout );

			cx += dx;
			cy += dy;

			timeNow = Date.now();
			elapsed = lastEventTime - timeNow;

			vx = -dx / elapsed;
			vy = -dy / elapsed;

			sensor.fire( 'swipe', currentTarget, wheelEvent, {
				dx: dx,
				dy: dy,
				dx_total: cx,
				dy_total: cy
			});

			timeout = setTimeout( declareSwipeEnd, wheelWaitTime );
		});




		sensor.on( 'touchstart', function ( startEvent ) {
			var startX, startY, lastX, lastY, vx, vy, lastEventTime, target, finger, move, up, cancel, fireInertiaEvent, touch;

			if ( startEvent.touches.length !== 1 ) {
				return;
			}

			touch = event.touches[0];

			fireInertiaEvent = function () {
				var timeNow, elapsed, decay, dx, dy;

				timeNow = Date.now();
				elapsed = timeNow - lastEventTime;

				decay = Math.pow( decayFactor, elapsed );

				vx *= decay;
				vy *= decay;

				dx = vx * elapsed;
				dy = vy * elapsed;

				if ( Math.abs( vx ) < threshold && Math.abs( vy ) < threshold ) {
					sensor.fire( 'swipeend', target, null, {
						vx: vx,
						vy: vy
					});
				}

				else {
					lastX += dx;
					lastY += dy;

					sensor.fire( 'swipe', target, null, {
						dx: dx,
						dy: dy,
						dx_total: lastX - startX,
						dy_total: lastY - startY
					});

					requestAnimationFrame( fireInertiaEvent );
				}
			};

			startX = lastX = touch.clientX;
			startY = lastY = touch.clientY;
			vx = vy = 0; // swipe velocity
			lastEventTime = Date.now();

			target = touch.target;
			finger = touch.identifier;

			sensor.fire( 'swipestart', target, startEvent );

			move = window_sensor.on( 'touchmove', function ( event ) {
				var eventInfo, dx, dy, timeNow, elapsed, touch;

				if ( event.touches.length !== 1 || event.touches[0].identifier !== finger ) {
					return;
				}

				touch = event.touches[0];

				dx = touch.clientX - lastX;
				dy = touch.clientY - lastY;

				timeNow = Date.now();
				elapsed = timeNow - lastEventTime;

				vx = dx / elapsed;
				vy = dy / elapsed;

				lastEventTime = timeNow;

				sensor.fire( 'swipe', target, event, {
					dx: touch.clientX - lastX,
					dy: touch.clientY - lastY,
					dx_total: touch.clientX - startX,
					dy_total: touch.clientY - startY
				});

				lastX = touch.clientX;
				lastY = touch.clientY;
			});

			up = window_sensor.on( 'touchend', function ( event ) {
				var eventInfo, touch;

				if ( event.changedTouches.length !== 1 || event.changedTouches[0].identifier !== finger ) {
					return;
				}

				touch = event.changedTouches[0];

				sensor.fire( 'swipeinertiastart', target, event, {
					dx: touch.clientX - lastX,
					dy: touch.clientY - lastY,
					dx_total: touch.clientX - startX,
					dy_total: touch.clientY - startY
				});

				// start firing fake events
				requestAnimationFrame( fireInertiaEvent );

				move.cancel();
				up.cancel();
				cancel.cancel();
			});

			cancel = window_sensor.on( 'touchcancel', function ( event ) {
				var eventInfo, touch;

				if ( event.changedTouches.length !== 1 || event.changedTouches[0].identifier !== finger ) {
					return;
				}

				touch = event.changedTouches[0];

				sensor.fire( 'swipeend', target, event, {
					dx: touch.clientX - lastX,
					dy: touch.clientY - lastY,
					dx_total: touch.clientX - startX,
					dy_total: touch.clientY - startY
				});

				move.cancel();
				up.cancel();
				cancel.cancel();
			});
		});

		return {
			teardown: function () {
				// TODO...
			}
		};
	});

}( Sensor ));
(function ( Sensor ) {

	'use strict';

	Sensor.define( 'tap', function ( sensor ) {
		var threshold, interval, mousedown, touchstart, window_sensor;

		window_sensor = Sensor( window );

		threshold = 5; // px
		interval = 200; // ms

		mousedown = sensor.on( 'mousedown', function ( downEvent ) {
			var move, up, teardown, cancelled, startX, startY;

			startX = downEvent.clientX;
			startY = downEvent.clientY;

			teardown = function () {
				if ( cancelled ) {
					return;
				}

				up.cancel();
				move.cancel();

				cancelled = true;
			};

			up = window_sensor.on( 'mouseup', function ( upEvent ) {
				sensor.fire( 'tap', downEvent.target, upEvent );
				teardown();
			});

			move = window_sensor.on( 'mousemove', function ( event ) {
				if ( Math.abs( event.clientX - startX ) > threshold || Math.abs( event.clientY - startY ) > threshold ) {
					teardown();
				}
			});

			setTimeout( teardown, interval );
		});


		touchstart = function ( event ) {
			var move, up, teardown, cancelled, startX, startY;

			if ( event.touches.length !== 1 ) {
				return;
			}

			touch = event.touches[0];
			finger = touch.identifier;

			startX = touch.clientX;
			startY = touch.clientY;

			teardown = function () {
				if ( cancelled ) {
					return;
				}

				up.cancel();
				move.cancel();

				cancelled = true;
			};

			up = window_sensor.on( 'touchend', function ( upEvent ) {
				if ( event.touches.length !== -1 || event.touches[0].identifier !== finger ) {
					return;
				}

				sensor.fire( 'tap', downEvent.target, upEvent );
				teardown();
			});

			move = window_sensor.on( 'touchmove', function ( event ) {
				var touch;

				if ( event.touches.length !== -1 || event.touches[0].identifier !== finger ) {
					return;
				}

				touch = event.touches[0];

				if ( Math.abs( touch.clientX - startX ) > threshold || Math.abs( touch.clientY - startY ) > threshold ) {
					teardown();
				}
			});

			setTimeout( teardown, interval );
		};

		return {
			teardown: function () {
				mousedown.cancel();
				touchstart.cancel();
			}
		};
	});

}( Sensor ));
// Normalize mousewheel events. We use the W3C standard 'wheel' event as documented at
// https://developer.mozilla.org/en-US/docs/DOM/Mozilla_event_reference/wheel, rather than
// the more common but non-standard 'mousewheel' event.
//
// Tip of the hat to Brandon Aaron -
// https://github.com/brandonaaron/jquery-mousewheel/blob/master/jquery.mousewheel.js

(function ( Sensor ) {

	'use strict';

	if ( document.onwheel !== undefined || document.documentMode >= 9 ) {
		return; // nothing to do - wheel event is already supported
	}

	Sensor.define( 'wheel', function ( sensor, el ) {

		var handler;

		el.addEventListener( 'mousewheel', handler = function ( originalEvent ) {

			var event = {}, prop;

			for ( prop in originalEvent ) {
				if ( originalEvent.hasOwnProperty( prop ) ) {
					event[ prop ] = originalEvent[ prop ];
				}
			}

			event.originalEvent = originalEvent;

			event.type = 'wheel';
			event.deltaMode = 1;

			// calculate deltaY (and deltaX) according to the event
			event.deltaY = -originalEvent.wheelDelta;

			// Webkit also support wheelDeltaX
			if ( originalEvent.wheelDeltaX !== undefined ) {
				event.deltaX = -originalEvent.wheelDeltaX;
			} else {
				event.deltaX = 0;
			}

			event.deltaZ = 0;

			event.preventDefault = function () {
				originalEvent.preventDefault();
			};

			event.stopPropagation = function () {
				originalEvent.stopPropagation();
			};

			sensor.fire( 'wheel', event.target, event );
		});

		return {
			teardown: function () {
				el.removeEventListener( 'mousewheel', handler );
			}
		};
	});

}( Sensor ));

if ( typeof module !== "undefined" && module.exports ) { module.exports = Sensor; }
else if ( typeof define !== "undefined" && define.amd ) { define( function () { return Sensor; }); }
else { global.Sensor = Sensor; }

}( this ));