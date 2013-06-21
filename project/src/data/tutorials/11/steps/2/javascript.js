var viewBoxes = {
	normal: { x: 0, y: 0, width: 819.18, height: 596.441 },
	neuron: { x: 0, y: 100, width: 560, height: 407.451 },
	axon: { x: 289, y: 195, width: 530, height: 385.623 },
	synapse: { x: 190, y: 0, width: 525, height: 381.985 }
};

var ractive = new Ractive({
  el: output,
  template: template,
  data: {
    viewBox: viewBoxes.normal,
    showLabels: false,
    info: null,
    closeup: null,
    detail: {
      'dendrites': '<strong>Dendrites</strong> conduct electrochemical stimulation from other neurons via synapses. <a href="http://en.wikipedia.org/wiki/Dendrite">Wikipedia article</a>',
      'axon-hillock': 'The <strong>axon hillock</strong> is a specialized part of the cell body of a neuron that connects to the axon. <a href="http://en.wikipedia.org/wiki/Axon_hillock">Wikipedia article</a>',
      'ranvier': '<strong>Nodes of Ranvier</strong> are 1 micrometer gaps in the myelin sheaths that insulate the axon. These nodes act as signal boosters. <a href="http://en.wikipedia.org/wiki/Nodes_of_Ranvier">Wikipedia article</a>',
      'synapse': '<strong>Chemical synapses</strong> transmit signals between cells by releasing neurotransmitter molecules. An adult human brain contains between 100-500 trillion synapses. <a href="http://en.wikipedia.org/wiki/Chemical_synapse">Wikipedia article</a>'
    }
  }
});

// after the view renders, fade in hotspots
setTimeout( function () {
	ractive.set( 'showLabels', true );
}, 1000 );



var info, closeup;

ractive.on({
  reset: function () {
    this.set({
      info: null,
      closeup: null
    });
  },

  moreInfo: function ( el, event ) {
    var hotspotId = el.getAttribute( 'data-hotspot' );

    this.set( 'info', hotspotId );
    this.nodes[ hotspotId + '-label' ].style.opacity = 1;
  },

  showCloseUp: function ( el, event ) {
    this.set( 'closeup', el.getAttribute( 'data-closeup' ) );
  }
});

ractive.observe({
  info: function ( newInfo, oldInfo ) {
    /*if ( oldInfo ) {
      this.nodes[ oldInfo + '-label' ].style.opacity = 0;
    }

    if ( newInfo ) {
      this.nodes[ newInfo + '-label' ].style.opacity = 1;
      this.set( 'showLabels', false );
    } else {
      this.set( 'showLabels', true );
    }*/
  },

  closeup: function ( newCloseup, oldCloseup ) {
    var viewBox;

    // previous
    if ( oldCloseup ) {
      this.set( oldCloseup + 'Visible', false );
      this.set( 'showLabels', false );
    }

    // new
    viewBox = ( newCloseup ? viewBoxes[ newCloseup ] : viewBoxes.normal );

    this.animate( 'viewBox', viewBox, {
      duration: 300,
      easing: 'easeInOut',
      complete: function () {
        if ( newCloseup ) {
          ractive.set( newCloseup + 'Visible', true );
          ractive.set( 'showLabels', false );
        } else {
          ractive.set( 'showLabels', true );
        }
      }
    });
  }
});