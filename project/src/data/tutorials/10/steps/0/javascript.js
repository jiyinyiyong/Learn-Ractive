var viewBoxes = {
	normal: { x: 0, y: 0, width: 819.18, height: 596.441 },
	neuron: { x: 0, y: 100, width: 560, height: 407.451 },
	axon: { x: 289, y: 195, width: 530, height: 385.623 },
	synapse: { x: 190, y: 0, width: 525, height: 381.985 }
};

var view = new Ractive({
  el: output,
  template: template,
  data: { viewBox: viewBoxes.normal }
});

setTimeout( function () {
	view.set( 'hotspotsVisible', true );
}, 1500 );


var info, closeup;

view.on({
  reset: function () {
    this.set({
      info: null,
      closeup: null
    });
  },

  moreInfo: function ( event, el ) {
    var hotspotId = el.getAttribute( 'data-hotspot' );

    this.set( 'info', hotspotId );
    this.nodes[ hotspotId + '-label' ].style.opacity = 1;
  },

  showCloseUp: function ( event, el ) {
    this.set( 'closeup', el.getAttribute( 'data-closeup' ) );
  },

  'set:info': function ( newInfo ) {
    if ( newInfo !== info ) {
      if ( info ) {
        this.nodes[ info + '-label' ].style.opacity = 0;
      }

      info = newInfo;
    }

    if ( info ) {
      this.nodes[ info + '-label' ].style.opacity = 1;
      this.set( 'hotspotsVisible', false );
    } else {
      this.set( 'hotspotsVisible', true );
    }
  },

  'set:closeup': function ( newCloseup ) {
    var viewBox;

    if ( closeup === newCloseup ) {
      return;
    }

    // previous
    if ( closeup ) {
      this.set( closeup + 'Visible', false );
      this.set( 'hotspotsVisible', false );
    }

    // new
    viewBox = ( newCloseup ? viewBoxes[ newCloseup ] : viewBoxes.normal );

    this.animate( 'viewBox', viewBox, {
      duration: 300,
      easing: 'easeInOut',
      complete: function () {
        if ( newCloseup ) {
          view.set( newCloseup + 'Visible', true );
          view.set( 'hotspotsVisible', false );
        } else {
          view.set( 'hotspotsVisible', true );
        }
      }
    });

    closeup = newCloseup;
  }
});



/*var hotspots = [], hotspotNodes, hotspotOver, i;

hotspotNodes = view.el.getElementsByClassName( 'hotspot' );
i = hotspotNodes.length;

hotspotOver = function ( event ) {
  var hotspotId, label;

  hotspotId = this.getAttribute( 'data-hotspot' );
  label = document.getElementById( hotspotId + '-label' );

  if ( !label ) {
  	console.log( 'no label: %s', hotspotId );
  } else {
  	console.log( label );
  	label.style.opacity = 1;
  }
};

hotspotOut = function ( event ) {
  var hotspotId, label;

  hotspotId = this.getAttribute( 'data-hotspot' );
  label = document.getElementById( hotspotId + '-label' );

  if ( !label ) {
  	console.log( 'no label: %s', hotspotId );
  } else {
  	console.log( label );
  	label.style.opacity = 0;
  }
}

while ( i-- ) {
	hotspots[i] = hotspotNodes[i];
	hotspots[i].addEventListener( 'mouseover', hotspotOver );
	hotspots[i].addEventListener( 'mouseout', hotspotOut );
}*/