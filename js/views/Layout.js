/*global window, define, document */

define( [ 'Ractive', 'rv!templates/row', 'rv!templates/column' ], function ( Ractive, row, column ) {
	
	'use strict';

	var Block, Separator, ROW, COLUMN, LEFT, TOP, WIDTH, HEIGHT, VERTICAL, HORIZONTAL, CLIENTX, CLIENTY, randomColor;

	randomColor = function () {
		var red, green, blue;

		red = Math.floor( Math.random() * 256 );
		green = Math.floor( Math.random() * 256 );
		blue = Math.floor( Math.random() * 256 );

		return 'rgb(' + [ red, green, blue ].join( ',' ) + ')';
	};

	ROW = 'row';
	COLUMN = 'column';
	LEFT = 'left';
	TOP = 'top';
	WIDTH = 'width';
	HEIGHT = 'height';
	VERTICAL = 'vertical';
	HORIZONTAL = 'horizontal';
	CLIENTX = 'clientX';
	CLIENTY = 'clientY';

	Block = function ( parentNode, data, start, size, type ) {
		var totalSize, i, total, childData, childSize, before, after;

		this.start = start;
		this.size = size;
		this.type = type;

		console.group( 'creating block ("%s") - %s, %s', data.id, start, size );

		this.node = document.createElement( 'div' );
		this.node.classList.add( type );
		this.node.style.backgroundColor = randomColor();

		this.node.style[ type === COLUMN ? LEFT : TOP ] = start + '%';
		this.node.style[ type === COLUMN ? WIDTH : HEIGHT ] = size + '%';

		if ( data.id ) {
			this.node.id = data.id;
		}

		if ( data.children ) {
			// find total size of children
			totalSize = data.children.reduce( function ( prev, curr ) {
				return prev + ( curr.size || 1 );
			}, 0 );

			this.breaks = [];

			this.children = [];
			this.separators = [];

			total = 0;
			for ( i=0; i<data.children.length; i+=1 ) {
				childData = data.children[i];
				childSize = 100 * ( ( childData.size || 1 ) / totalSize );

				this.children[i] = new Block( this.node, childData, total, childSize, type === 'column' ? 'row' : 'column' );

				total += childSize;
			}

			for ( i=0; i<data.children.length - 1; i+=1 ) {
				before = this.children[i];
				after = this.children[ i + 1 ];
				this.separators = new Separator( this.node, before, after, type === ROW ? VERTICAL : HORIZONTAL );
			}
		}

		parentNode.appendChild( this.node );

		console.groupEnd();
	};

	Block.prototype = {
		setStart: function ( start ) {
			this.node.style[ this.type === COLUMN ? LEFT : TOP ] = start + '%';
		},

		setSize: function ( size ) {
			console.log( 'setting %s to %s', ( this.type === COLUMN ? WIDTH : HEIGHT ), size + '%' );
			this.node.style[ this.type === COLUMN ? WIDTH : HEIGHT ] = size + '%';
		}
	};


	Separator = function ( parentNode, before, after, type ) {
		var self = this;

		this.before = before;
		this.after = after;
		this.type = type;

		this.parentNode = parentNode;

		this.node = document.createElement( 'div' );
		this.node.classList.add( 'separator' );
		this.node.classList.add( type );

		this.setPosition( after.start );

		this.node.addEventListener( 'pointerdown', function ( event ) {
			var start, min, max, afterEnd, move, up, cancel;

			console.log( before, after );

			self.setActive();

			start = self.position;
			min = before.start + ( before.minSize || 0 );
			afterEnd = ( after.start + after.size );
			max = afterEnd - ( after.minSize || 0 );


			move = function ( event ) {
				var position;

				position = self.getPosition( event[ type === VERTICAL ? CLIENTX : CLIENTY ] );
				position = Math.max( min, Math.min( max, position ) );

				before.setSize( position - before.start );
				after.setStart( position );
				after.setSize( afterEnd - position );

				self.setPosition( position );
			};

			up = function ( event ) {
				self.setInactive();
				cancel();
			};

			window.addEventListener( 'pointermove', move );
			window.addEventListener( 'pointerup', up );

			cancel = function () {
				window.removeEventListener( 'pointermove', move );
				window.removeEventListener( 'pointerup', up );
			};
		});

		parentNode.appendChild( this.node );
	};

	Separator.prototype = {
		setActive: function () {
			this.node.classList.add( 'active' );
		},

		setInactive: function () {
			this.node.classList.remove( 'active' );
		},

		getPosition: function ( px ) {
			var boundingClientRect, bcrStart, bcrSize, position;

			boundingClientRect = this.parentNode.getBoundingClientRect();
			bcrStart = boundingClientRect[ this.type === VERTICAL ? LEFT : TOP ];
			bcrSize = boundingClientRect[ this.type === VERTICAL ? WIDTH : HEIGHT ];

			position = 100 * ( px - bcrStart ) / bcrSize;

			return position;
		},

		setPosition: function ( pos ) {
			this.node.style[ this.type === VERTICAL ? LEFT : TOP ] = pos + '%';
		}
	};



	return Ractive.extend({
		//template: '',

		partials: {
			row: row,
			column: column
		},

		init: function ( options ) {
			var fragment, i;

			if ( this.data.columns && this.data.rows ) {
				throw new Error( 'You can\'t specify top level columns and rows - you have to choose one or the other' );
			}

			if ( !this.data.columns && !this.data.rows ) {
				throw new Error( 'You must specify some rows or columns' );
			}

			fragment = document.createDocumentFragment();

			this.block = new Block( fragment, { children: this.data.blocks }, 0, 100, this.data.columns ? 'row' : 'column' );
			this.el.appendChild( fragment );
		}
	});

});