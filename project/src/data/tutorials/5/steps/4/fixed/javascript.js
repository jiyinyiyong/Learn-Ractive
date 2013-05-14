// define our superheroes
var xmen = [
  { name: 'Nightcrawler', realname: 'Wagner, Kurt',     power: 'Teleportation', info: 'http://www.superherodb.com/Nightcrawler/10-107/' },
  { name: 'Cyclops',      realname: 'Summers, Scott',   power: 'Optic blast',   info: 'http://www.superherodb.com/Cyclops/10-50/' },
  { name: 'Rogue',        realname: 'Marie, Anna',      power: 'Absorbing powers', info: 'http://www.superherodb.com/Rogue/10-831/' },
  { name: 'Wolverine',    realname: 'Howlett, James',   power: 'Regeneration',  info: 'http://www.superherodb.com/Wolverine/10-161/' }
];

var view = new Ractive({
  el: output,
  template: template,
  data: { superheroes: xmen },
  modifiers: {
    plus: function ( a, b ) {
      return a + b;
    },
    sort: function ( array ) {
      array = array.slice(); // clone, so we don't modify the underlying data
      
      return array.sort( function ( a, b ) {
        return a[ sortColumn ] < b[ sortColumn ] ? -1 : 1;
      });
    }
  }
});

var sort, sortColumn;

sort = function () {
  view.update( 'superheroes' );

  $( 'th.sorted' ).removeClass( 'sorted' );
  $( 'th[data-column="' + sortColumn + '"]' ).addClass( 'sorted' ); 
};

// sort by name initially
sortColumn = 'name';
sort();

view.on( 'sort', function ( event, el ) {
  sortColumn = el.getAttribute( 'data-column' );
  sort();
});