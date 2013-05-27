/*! Statesman - v0.1.6 - 2013-05-13
* State management made straightforward

* 
* Copyright (c) 2013 Rich Harris; Licensed MIT */

/*jslint eqeq: true, plusplus: true */
/*global document, HTMLElement */


(function ( global ) {

'use strict';

var _internal = (function () {

	'use strict';

	var normalisedKeypathCache = {};

	return {
		isEqual: function ( a, b ) {
			// workaround for null, because typeof null = 'object'...
			if ( a === null && b === null ) {
				return true;
			}

			// If a or b is an object, return false. Otherwise `set( key, value )` will fail to notify
			// observers of `key` if `value` is the same object or array as it was before, even though
			// the contents of changed
			if ( typeof a === 'object' || typeof b === 'object' ) {
				return false;
			}

			// we're left with a primitive
			return a === b;
		},

		normalise: function ( keypath ) {
			if ( !keypath ) {
				return ''; 
			}

			return normalisedKeypathCache[ keypath ] || ( normalisedKeypathCache[ keypath ] = keypath.replace( /\[\s*([0-9]+)\s*\]/g, '.$1' ) );
		},

		getObservers: function ( model, keypath ) {
			var result, observers, upstream, observer, keys, i;

			// downstream observers
			result = model._downstreamObservers[ keypath ] || [];

			// direct observers
			if ( model._directObservers[ keypath ] ) {
				result = ( result || [] ).concat( model._directObservers[ keypath ] );
			}

			// upstream observers
			keys = keypath.split( '.' );

			while ( keys.length ) {
				keys.pop();
				keypath = keys.join( '.' );
				upstream = model._directObservers[ keypath ];

				if ( upstream ) {
					result = ( result || [] ).concat( upstream );
				}
			}

			return result;
		},

		notifyObservers: function ( model ) {
			var queue, observer, i, value;

			// TODO consolidate any set operations that arise from observer callbacks

			queue = model._observerQueue;

			while ( queue.length ) {
				observer = queue.pop();

				value = model.get( observer.orig );

				if ( !_internal.isEqual( value, observer.currentValue ) ) {
					observer.fn.call( observer.ctx, value, observer.currentValue );
					observer.currentValue = value;
				}
			}	

			// model._consolidateSetOperations
		},

		getDependants: function ( model, keypath ) {
			var result, dependants, upstream, dependant, keys, i;

			// downstream dependants
			result = model._downstreamDependants[ keypath ] || [];

			// direct dependants
			if ( model._directDependants[ keypath ] ) {
				result = ( result || [] ).concat( model._directDependants[ keypath ] );
			}

			// upstream dependants
			keys = keypath.split( '.' );

			while ( keys.length ) {
				keys.pop();
				keypath = keys.join( '.' );
				upstream = model._directDependants[ keypath ];

				if ( upstream ) {
					result = ( result || [] ).concat( upstream );
				}
			}

			return result;
		},

		notifyDependants: function ( model, dependants ) {
			var i;

			if ( !dependants ) {
				return;
			}

			i = dependants.length;

			while ( i-- ) {
				dependants[i].setter();
			}
		},

		dispatchComputeQueue: function ( model, options ) {
			var map, keypath, deps;

			map = {};

			// TODO consolidate set operations
			model._consolidateChanges = true;

			for ( keypath in model._toBeComputed ) {
				if ( model._toBeComputed.hasOwnProperty( keypath ) ) {
					deps = true;
					model._toBeComputed[ keypath ].setter();
				}
			}
			
			if ( deps ) {
				model._computing = true;
				model._referToCache = true;
				_internal.dispatchChanges( model );
				model._referToCache = false;
				model._computing = false;
			} else {
				model._consolidateChanges = false;
			}
		},

		dispatchChanges: function ( model ) {
			var changes, silentChanges;

			changes = model._changes;
			silentChanges = model._silentChanges;

			model._consolidateChanges = false;
			delete model._changes;
			delete model._silentChanges;

			if ( silentChanges ) {
				model.set( silentChanges, { silent: true, override: true });
			}

			if ( changes ) {
				model.set( changes, { override: true });
			}
		},

		clearCache: function ( model, keypath ) {
			var children = model._cacheMap[ keypath ];

			delete model._cache[ keypath ];

			if ( !children ) {
				return;
			}

			while ( children.length ) {
				_internal.clearCache( model, children.pop() );
			}
		}
	};

}());
(function ( _internal ) {

	'use strict';

	var on, off, once, fire;

	on = function ( eventName, callback ) {
		var self = this, listeners, n, list;

		if ( typeof eventName === 'object' ) {
			list = [];
			for ( n in eventName ) {
				if ( eventName.hasOwnProperty( n ) ) {
					list[ list.length ] = this.on( n, eventName[n] );
				}
			}

			return {
				cancel: function () {
					while ( list.length ) {
						list.pop().cancel();
					}
				}
			};
		}

		if ( !this.subs[ eventName ] ) {
			this.subs[ eventName ] = [];
		}

		listeners = this.subs[ eventName ];
		listeners[ listeners.length ] = callback;

		return {
			cancel: function () {
				self.off( eventName, callback );
			}
		};
	};

	once = function ( eventName, callback ) {
		var self = this, listeners, n, list, suicidalCallback;

		if ( typeof eventName === 'object' ) {
			list = [];
			for ( n in eventName ) {
				if ( eventName.hasOwnProperty( n ) ) {
					list[ list.length ] = this.once( n, eventName[n] );
				}
			}

			return {
				cancel: function () {
					while ( list.length ) {
						list.pop().cancel();
					}
				}
			};
		}

		if ( !this.subs[ eventName ] ) {
			this.subs[ eventName ] = [];
		}

		listeners = this.subs[ eventName ];

		suicidalCallback = function () {
			callback.apply( self, arguments );
			self.off( eventName, suicidalCallback );
		};

		listeners[ listeners.length ] = suicidalCallback;

		return {
			cancel: function () {
				self.off( eventName, suicidalCallback );
			}
		};
	};

	off = function ( eventName, callback ) {
		var subscribers, index;

		if ( !eventName ) {
			this.subs = {};
			return this;
		}

		if ( !callback ) {
			delete this.subs[ eventName ];
			return this;
		}

		subscribers = this.subs[ eventName ];
		if ( subscribers ) {
			index = subscribers.indexOf( callback );

			if ( index !== -1 ) {
				subscribers.splice( index, 1 );
			}

			if ( !subscribers.length ) {
				delete this.subs[ eventName ];
			}
		}

		return this;
	};

	fire = function ( eventName ) {
		var subscribers, args, len, i;

		subscribers = this.subs[ eventName ];

		if ( !subscribers ) {
			return this;
		}

		len = subscribers.length;
		args = Array.prototype.slice.call( arguments, 1 );

		for ( i=0; i<len; i+=1 ) {
			subscribers[i].apply( this, args );
		}
	};

	_internal.on = on;
	_internal.off = off;
	_internal.once = once;
	_internal.fire = fire;

}( _internal ));
var Statesman;

(function ( _internal ) {

	'use strict';

	var Subset,

	// Helper functions
	varPattern,
	compile,

	// Cached regexes
	integerPattern = /^\s*[0-9]+\s*$/;



	Statesman = function ( data ) {
		this._data = data || {};
		//this._observers = {};
		this._computed = {};
		this._subsets = {};

		this._consolidating = 0;
		
		this._directDependants = {};
		this._downstreamDependants = {};

		this._directObservers = {};
		this._downstreamObservers = {};
		
		this._observerQueue = [];

		// events
		this.subs = {};

		this._cache = {};
		this._cacheMap = {};
	};


	Statesman.prototype = {
		
		/*reset: _internal.reset,
		set: _internal.set,
		get: _internal.get,
		observe: _internal.observe,

		observeOnce: _internal.observeOnce,

		unobserve: _internal.unobserve,

		compute: _internal.compute,
		removeComputedValue: _internal.removeComputedValue,*/

		// Events
		on: _internal.on,
		off: _internal.off,
		once: _internal.once,
		fire: _internal.fire
	};


	// Helper functions
	// ----------------
	_internal.utils = Statesman.utils = {
		total: function ( arr ) {
			return arr.reduce( function ( prev, curr ) {
				return prev + curr;
			});
		}
	};

	return Statesman;

}( _internal ));
(function ( Statesman, _internal ) {

	'use strict';

	var Subset;

	Statesman.prototype.subset = function ( path ) {
		if ( !path ) {
			throw 'No subset path specified';
		}

		if ( !this._subsets[ path ] ) {
			this._subsets[ path ] = new Subset( path, this );
		}

		return this._subsets[ path ];
	};


	Subset = function( path, state ) {
		var self = this, keypathPattern, pathDotLength;

		this._path = path;
		this._pathDot = path + '.';
		this._root = state;

		// events stuff
		this.subs = {};
		keypathPattern = new RegExp( '^' + this._pathDot.replace( '.', '\\.' ) );
		pathDotLength = this._pathDot.length;

		this._root.on( 'set', function ( keypath, value, options ) {
			var localKeypath;

			if ( keypath === this._path ) {
				self.fire( 'reset' );
				return;
			}

			if ( keypathPattern.test( keypath ) ) {
				localKeypath = keypath.substring( pathDotLength );
				self.fire( 'set', localKeypath, value, options );
				self.fire( 'set:' + localKeypath, value, options );
			}
		});
	};

	Subset.prototype = {
		reset: function ( data ) {
			this._root.set( this._path, data );
			return this;
		},

		set: function ( keypath, value, options ) {
			var k, map;

			if ( typeof keypath === 'object' ) {
				options = value;
				map = {};

				for ( k in keypath ) {
					if ( keypath.hasOwnProperty( k ) ) {
						map[ this._pathDot + k ] = keypath[ k ];
					}
				}
				
				this._root.set( map, options );
				return this;
			}

			this._root.set( this._pathDot + keypath, value, options );
			return this;
		},

		get: function ( keypath ) {
			if ( !keypath ) {
				return this._root.get( this._path );
			}

			return this._root.get( this._pathDot + keypath );
		},

		observe: function ( keypath, callback, options ) {
			var args, k, map;

			args = Array.prototype.slice.call( arguments );

			// overload - observe multiple keypaths
			if ( typeof keypath === 'object' ) {
				options = callback;

				map = {};
				for ( k in keypath ) {
					map[ this._pathDot + k ] = keypath[ k ];
				}

				if ( options ) {
					options.context = options.context || this;
				} else {
					options = { context: this };
				}

				return this._root.observe( map, options );
			}

			// overload - omit keypath to observe root
			if ( typeof keypath === 'function' ) {
				options = callback;
				callback = keypath;
				keypath = this._path;
			}

			else if ( keypath === '' ) {
				keypath = this._path;
			}

			else {
				keypath = ( this._pathDot + keypath );
			}

			if ( options ) {
				options.context = options.context || this;
			} else {
				options = { context: this };
			}

			return this._root.observe( keypath, callback, options );
		},

		observeOnce: function ( keypath, callback, options ) {
			if ( options ) {
				options.context = options.context || this;
			} else {
				options = { context: this };
			}

			var observers = this._root.observeOnce( this._pathDot + keypath, callback, options );
			return observers;
		},

		unobserve: function ( observerToCancel ) {
			this._root.unobserve( observerToCancel );

			return this;
		},

		compute: function ( keypath, options ) {
			var self = this, k, map, processOptions, context, path;

			path = this._pathDot;

			options.context = options.context || this;

			processOptions = function ( options ) {
				var deps, i, compiled;

				if ( typeof options === 'string' ) {
					return {
						fn: options,
						context: self,
						prefix: path
					};
				}

				deps = options.dependsOn;

				if ( typeof deps === 'string' ) {
					deps = [ deps ];
				}

				i = deps.length;
				while ( i-- ) {
					deps[i] = path + deps[i];
				}

				options.dependsOn = deps;

				if ( !options.context ) {
					options.context = self;
				}
				return options;
			};

			// Multiple computed values
			if ( typeof keypath === 'object' ) {
				map = {};
				for ( k in keypath ) {
					map[ this._pathDot + k ] = processOptions( keypath[ k ] );
				}

				return this._root.compute( map );
			}

			// Single computed value
			return this._root.compute( this._pathDot + keypath, processOptions( options ) );
		},

		removeComputedValue: function ( keypath ) {
			this._root.removeComputedValue( this._pathDot + keypath );
			return this;
		},

		subset: function ( keypath ) {
			return this._root.subset( this._pathDot + keypath );
		},

		on: _internal.on,
		off: _internal.off,
		once: _internal.once,
		fire: _internal.fire
	};

}( Statesman, _internal ));
(function ( proto, _internal ) {

	'use strict';

	var varPattern,
		compile,
		computeOne,
		computeMany,
		registerDependant,
		removeDependant;

	proto.compute = function ( keypath, options ) {
		return ( typeof keypath === 'object' ? computeMany( this, keypath ) : computeOne( this, keypath, options ) );
	};

	proto.removeComputedValue = function ( keypath ) {
		var computed, i;

		computed = this._computed[ keypath ];

		i = computed.deps.length;
		while ( i-- ) {
			removeDependant( this, computed, computed.deps[i] );
		}

		delete this._computed[ keypath ];
	};

	


	varPattern = /\$\{\s*([a-zA-Z0-9_$\[\]\.]+)\s*\}/g;

	compile = function ( str, context, prefix ) {
		var deps, expanded, fn, getter;

		prefix = prefix || '';
		deps = [];

		expanded = str.replace( varPattern, function ( match, keypath ) {
			// make a note of which dependencies are referenced, but de-dupe first
			if ( deps.indexOf( keypath ) === -1 ) {
				deps[ deps.length ] = prefix + keypath;
			}

			return 'm.get("' + keypath + '")';
		});

		fn = new Function( 'utils', 'var m=this;try{return ' + expanded + '}catch(e){return undefined}' );

		if ( fn.bind ) {
			getter = fn.bind( context, _internal.utils );
		} else {
			getter = function () {
				return fn.call( context, _internal.utils );
			};
		}

		return {
			getter: getter,
			deps: deps
		};
	};

	registerDependant = function ( model, keypath, computed ) {
		var keys, direct, downstream;

		// direct dependants
		if ( !( direct = model._directDependants[ keypath ] ) ) {
			model._directDependants[ keypath ] = [ computed ];
		} else {
			direct.push( computed );
		}

		// downstream dependants
		keys = keypath.split( '.' );
		while ( keys.length ) {
			keys.pop();
			keypath = keys.join( '.' );

			if ( !( downstream = model._downstreamDependants[ keypath ] ) ) {
				model._downstreamDependants[ keypath ] = [ computed ];
			} else {
				downstream.push( computed );
			}
		}
	};

	computeOne = function ( model, keypath, options ) {
		var computed, compiled, setter, getter, i, deps, numDeps, fn, context, noCache, readonly;

		keypath = _internal.normalise( keypath );

		if ( model._computed[ keypath ] ) {
			model.removeComputedValue( keypath );
		}

		if ( typeof options === 'string' ) {
			compiled = compile( options, model );

			getter = compiled.getter;
			deps = compiled.deps;
		}

		else if ( typeof options.fn === 'string' ) {
			compiled = compile( options.fn, options.context || model, options.prefix );

			getter = compiled.getter;
			deps = compiled.deps;
		}

		else {
			deps = options.dependsOn;
			if ( typeof deps === 'string' ) {
				deps = [ deps ];
			}

			numDeps = ( deps ? deps.length : 0 );
			fn = options.fn;
			context = options.context || model;

			getter = function () {
				var i, args = [];

				for ( i=0; i<numDeps; i+=1 ) {
					args[i] = model.get( deps[i] );
				}

				return fn.apply( context, args );
			};
		}

		// Make sure the computed value doesn't have itself listed as a dependency
		if ( deps && deps.indexOf( keypath ) !== -1 ) {
			throw new Error( 'A computed value cannot be its own trigger' );
		}


		setter = function () {
			var value, noCache;

			if ( computed.setting ) {
				return; // avoid infinite loops!
			}

			computed.setting = true;
			
			value = getter();
			if ( !_internal.isEqual( value, computed.value ) ) {
				
				// we need to enforce use of the cache, as the `set` call causes a `get`
				noCache = computed.noCache; // store the current value temporarily
				
				computed.noCache = false;

				model._computing = true;
				model.set( keypath, value );
				model._computing = false;
				
				computed.noCache = noCache; // restore previous value

				computed.value = value;
			}
			
			computed.setting = false;
		};

		// cache values?
		if ( !deps || !deps.length ) {
			// never cache values with no dependencies
			noCache = true;
		} else {
			// otherwise cache by default, unless otherwise specified
			noCache = ( options && options.noCache ? true : false );
		}

		// readonly property?
		if ( options && options.readonly === false ) {
			readonly = false;
		} else {
			readonly = true; // default
		}


		computed = {
			keypath: keypath,
			deps: deps,
			setter: setter,
			getter: getter,
			noCache: noCache,
			readonly: readonly
		};


		// register computed value as a dependant of each of its dependencies
		if ( deps ) {
			i = deps.length;
			while ( i-- ) {
				registerDependant( model, deps[i], computed );
			}
		}


		// register keypath as a computed
		model._computed[ keypath ] = computed;
		

		// initialise - this will update the model, and set the initial value
		setter();
		return computed.value;
	};

	computeMany = function ( model, map ) {
		var keypath, valueMap;

		valueMap = {};

		for ( keypath in map ) {
			if ( map.hasOwnProperty( keypath ) ) {
				valueMap[ keypath ] = computeOne( model, keypath, map[ keypath ] );
			}
		}

		return valueMap;
	};

	removeDependant = function ( model, dependant, keypath ) {
		var index, direct, downstream, keys;

		// remove computed as direct dependant
		direct = model._directDependants[ keypath ];

		index = direct.indexOf( dependant );
		if ( index !== -1 ) {
			direct.splice( index, 1 );
		}

		if ( !direct.length ) {
			delete model._directDependants[ keypath ];
		}


		// remove computed as downstream dependant of its dependency's upstream keypaths
		keys = keypath.split( '.' );
		while ( keys.length ) {
			keys.pop();
			keypath = keys.join( '.' );

			downstream = model._downstreamDependants[ keypath ];
			
			index = downstream.indexOf( dependant );
			if ( index !== -1 ) {
				downstream.splice( index, 1 );
			}

			if ( !downstream.length ) {
				delete model._downstreamDependants[ keypath ];
			}
		}
	};

}( Statesman.prototype, _internal ));
(function ( proto, _internal ) {

	'use strict';

	proto.get = function ( keypath ) {
		var computed, keys, key, parentKeypath, parentValue, value;

		// no keypath, or the empty string? return all data
		if ( !keypath ) {
			return this._data;
		}

		keypath = _internal.normalise( keypath );

		// is this a computed value?
		if ( computed = this._computed[ keypath ] ) {
			if ( computed.noCache && !computed.override ) {
				value = computed.getter();
				return value;
			}
		}


		if ( this._cache.hasOwnProperty( keypath ) ) {
			return this._cache[ keypath ];
		}

		keys = keypath.split( '.' );
		key = keys.pop();

		parentKeypath = keys.join( '.' );
		parentValue = this.get( parentKeypath );

		// no such value? return undefined
		if ( typeof parentValue !== 'object' ) {
			return undefined;
		}

		// update cache map
		if ( !this._cacheMap[ parentKeypath ] ) {
			this._cacheMap[ parentKeypath ] = [];
		}

		this._cacheMap[ parentKeypath ].push( keypath );

		// no such property on parentValue? return undefined
		if ( !parentValue.hasOwnProperty( key ) ) {
			return undefined;
		}

		// update cache
		value = parentValue[ key ];
		this._cache[ keypath ] = value;

		return value;
	};

}( Statesman.prototype, _internal ));
(function ( proto, _internal ) {

	'use strict';

	var observeOne, observeMany;

	proto.observe = function ( keypath, callback, options ) {
		if ( typeof keypath === 'function' ) {
			// No keypath given - observe root
			return observeOne( this, '', keypath, callback );
		}

		return ( typeof keypath === 'object' ? observeMany( this, keypath, callback ) : observeOne( this, keypath, callback, options ) );
	};

	proto.observeOnce = function ( keypath, callback, options ) {
		var self = this, suicidalObservers;

		if ( !options ) {
			options = {};
		}

		options.init = false;

		suicidalObservers = this.observe( keypath, function ( value, previousValue ) {
			callback.call( this, value, previousValue );
			self.unobserve( suicidalObservers );
		}, options );

		return suicidalObservers;
	};




	observeOne = function ( model, keypath, callback, options ) {
		var group, originalKeypath, makeObserver, keys, value, direct, downstream;

		group = [];

		keypath = _internal.normalise( keypath );
		originalKeypath = keypath;

		value = model.get( keypath );

		makeObserver = function ( observedKeypath ) {
			var observer = {
				orig: originalKeypath,
				observed: observedKeypath,
				fn: callback,
				group: group,
				//direct: ( observedKeypath === keypath ),
				ctx: options ? options.context || model : model,
				currentValue: value
			};

			group[ group.length ] = observer;
			return observer;
		};

		// direct observer
		if ( !( direct = model._directObservers[ keypath ] ) ) {
			model._directObservers[ keypath ] = [ makeObserver( keypath ) ];
		} else {
			direct.push( makeObserver( keypath ) );
		}

		// downstream observers
		keys = keypath.split( '.' );

		while ( keys.length ) {
			keys.pop();
			keypath = ( keys.join( '.' ) );

			if ( !( downstream = model._downstreamObservers[ keypath ] ) ) {
				model._downstreamObservers[ keypath ] = [ makeObserver( keypath ) ];
			} else {
				downstream.push( makeObserver( keypath ) );
			}
		}

		// initialise by default
		if ( !options || options.init !== false ) {
			callback.call( model, value, undefined );
		}

		return group;
	};

	observeMany = function ( model, map, options ) {
		var keypath, observers;

		observers = [];

		for ( keypath in map ) {
			if ( map.hasOwnProperty( keypath ) ) {
				observers[ observers.length ] = observeOne( model, keypath, map[ keypath ], options );
			}
		}

		return observers;
	};

}( Statesman.prototype, _internal ));
(function ( proto, _internal ) {

	'use strict';

	proto.reset = function ( data ) {
		this._data = {};
		
		this.set( data, { silent: true });
		this.fire( 'reset' );

		// notify ALL observers of the change
		_internal.notifyObservers( this, '' );

		return this;
	};
	
}( Statesman.prototype, _internal ));
(function ( proto, _internal ) {

	'use strict';

	var setOne, setMany, updateObject, digit;

	proto.set = function ( keypath, value, options ) {

		var changes, k;

		this.fire( 'set', keypath, value, options );

		// If we are computing values, as a result of a previous `set` call, we may
		// need to consolidate changes to be applied later
		if ( this._consolidateChanges ) {
			if ( options && options.silent ) {
				if ( !this._silentChanges ) {
					this._silentChanges = {};
				}
				changes = this._silentChanges;
			} else {
				if ( !this._changes ) {
					this._changes = {};
				}
				changes = this._changes;
			}

			if ( typeof keypath === 'object' ) {
				for ( k in keypath ) {
					if ( keypath.hasOwnProperty( k ) ) {
						changes[k] = keypath[k];
					}
				}
			} else {
				changes[ keypath ] = value;
			}
			
			return;
		}

		
		

		// keep track of how many times we've called `set` within itself
		// as a result of cascading changes
		this._consolidating += 1;

		this._toBeComputed = {};

		if ( typeof keypath === 'object' ) {
			setMany( this, keypath, value || {});
		} else {
			setOne( this, keypath, value, options || {});
		}

		// cascade changes
		_internal.dispatchComputeQueue( this, options );
		
		this._consolidating -= 1;

		// if this was a top-level `set` call, it's time to notify
		// our observers of the current state

		// notify observers
		if ( !options || !options.silent ) {
			_internal.notifyObservers( this );
		}
	};


	digit = /[0-9]+/;

	updateObject = function ( obj, keypath, value ) {
		var keys, key;

		keys = keypath.split( '.' );

		while ( keys.length > 1 ) {
			key = keys.shift();
			
			if ( typeof obj[ key ] !== 'object' ) {
				obj[ key ] = ( digit.test( keys[0] ) ? [] : {} );
			}

			obj = obj[ key ];
		}

		key = keys[0];
		obj[ key ] = value;
	};

	setOne = function ( model, keypath, value, options ) {

		var computed, previousValue, dependants, dependant, i, observers;

		// normalise keypath
		keypath = _internal.normalise( keypath );

		model.fire( 'set:' + keypath, value, options ); // TODO normalise keypaths when user subscribes to set:keypath

		previousValue = model._referToCache ? model._cache[ keypath ] : model.get( keypath );
		
		// if nothing has changed, we don't need to update the model...
		if ( value === previousValue ) {
			// ...though we may need to notify downstream observers if it's not a primitive
			if ( !_internal.isEqual( previousValue, value ) && !options.silent ) {
				return _internal.getObservers( model, keypath );
			}

			return false;
		}

		// if this is a computed value, we need to either reject the change, or 
		// flag the computed value as overridden
		if ( computed = model._computed[ keypath ] ) {
			if ( computed.readonly ) {
				if ( !model._computing ) {
					throw new Error( 'The computed value "' + keypath + '" has readonly set true and cannot be changed manually' );
				}
			}

			else {
				if ( !model._computing ) {
					computed.override = true; // we've manually overridden the value
				} else {
					computed.override = false; // reset
				}
			}
		}

		_internal.clearCache( model, keypath );
		updateObject( model._data, keypath, value );

		// which computed properties depend on this keypath?
		dependants = _internal.getDependants( model, keypath );
		if ( dependants ) {
			i = dependants.length;
			while ( i-- ) {
				dependant = dependants[i];
				model._toBeComputed[ dependant.keypath ] = dependant;
			}
		}

		// which observers are triggered by this keypath?
		observers = _internal.getObservers( model, keypath );
		if ( observers ) {
			model._observerQueue = model._observerQueue.concat( observers );
		}
		
	};

	setMany = function ( model, map, options ) {
		var keypath;

		for ( keypath in map ) {
			if ( map.hasOwnProperty( keypath ) ) {
				setOne( model, keypath, map[ keypath ], options );
			}
		}
	};

}( Statesman.prototype, _internal ));
(function ( proto ) {

	'use strict';

	proto.unobserve = function ( observer ) {
		var i, unobserveFrom, index;

		if ( Object.prototype.toString.call( observer ) === '[object Array]' ) {
			i = observer.length;
			while ( i-- ) {
				this.unobserve( observer[i] );
			}
			return;
		}

		unobserveFrom = function ( set ) {
			var observers = set[ observer.observed ];

			if ( !observers ) {
				return;
			}

			index = observers.indexOf( observer );

			if ( index !== -1 ) {
				observers.splice( index, 1 );
			}

			if ( !observers.length ) {
				delete set[ observer.observed ];
			}
		};

		unobserveFrom( this._directObservers );
		unobserveFrom( this._downstreamObservers );
		
	};

}( Statesman.prototype ));

// export
if ( typeof module !== "undefined" && module.exports ) module.exports = Statesman // Common JS
else if ( typeof define === "function" && define.amd ) define( function () { return Statesman } ) // AMD
else { global.Statesman = Statesman }

}( this ));