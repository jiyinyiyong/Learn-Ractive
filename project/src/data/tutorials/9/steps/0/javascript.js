var TodoList = Ractive.extend({
  template: template,

  partials: {}, // add the 'item' partial

  addItem: function ( description ) {
    this.items.push({
      description: description,
      done: false
    });
  },

  removeItem: function ( index ) {
  	this.items.splice( index, 1 );
  },

  init: function ( options ) {
    var self = this;

    this.items = options.items;

    // initialise
    this.set( 'items', this.items );

    // proxy event handlers
    this.on({
      remove: function ( event, el ) {
        var index = el.parentNode.getAttribute( 'data-index' );
        this.removeItem( index );
      },
      newTodo: function ( event, el ) {
        this.addItem( el.value );
        el.value = '';
      },
      edit: function ( event, el ) {
        var li, index, input, submit;

        // first, find the index of the todo we're editing
        li = el.parentNode;
        index = li.getAttribute( 'data-index' );

        // create an input and fill it with the current description
        input = document.createElement( 'input' );
        input.className = 'edit';
        input.value = this.get( 'items.' + index + '.description' );

        // on submit, update the data and remove the input
        submit = function ( event ) {
          event.preventDefault();

          input.removeEventListener( 'blur', submit );
          input.removeEventListener( 'change', submit );

          el.removeChild( input );
          self.set( 'items.' + index + '.description', input.value );
        };

        input.addEventListener( 'blur', submit );
        input.addEventListener( 'change', submit );

        // add the input, and select all the text in it
        el.appendChild( input );
        input.select();
      }
    });
  }
});

var view = new TodoList({
  el: output,
  items: [
    { done: true,  description: 'Add a todo item' },
    { done: false, description: 'Add some more todo items' },
    { done: false, description: 'Complete all the Ractive tutorials' }
  ]
});