var view = new Ractive({
  el: output,
  template: template
});

var hotspots = [], hotspotNodes, hotspotOver, i;

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
}