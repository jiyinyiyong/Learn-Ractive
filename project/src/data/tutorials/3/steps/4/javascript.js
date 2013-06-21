var ractive = new Ractive({
  el: output,
  template: template
});

var selected;

ractive.on( 'select', function ( el, event ) {
  var gif, caption;

  gif = el.src.replace( 'jpg', 'gif' );
  caption = el.getAttribute( 'data-caption' );

  this.set({
    gif: gif,
    caption: caption
  });

  // deselect previous selection
  if ( el !== selected && selected && selected.classList ) {
  	selected.classList.remove( 'selected' );
  }

  // select new selection (unless you're in IE
  // in which case no classList for you. Sucka)
  if ( el.classList ) {
    el.classList.add( 'selected' );
    selected = el;
  }
});