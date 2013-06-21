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
      remove: function ( el, event ) {
        var index = el.parentNode.getAttribute( 'data-index' );
        this.removeItem( index );
      },
      newTodo: function ( el, event ) {
        this.addItem( el.value );
        el.value = '';
      },
      edit: function ( el, event ) {
        var li, index, initialValue, descriptionKeypath, input, submit, keydown, removeEventListeners;

        // first, find the index of the todo we're editing
        li = el.parentNode;
        index = li.getAttribute( 'data-index' );
        descriptionKeypath = 'items.' + index + '.description';
        initialValue = this.get( descriptionKeypath );

        // create an input and fill it with the current description
        input = document.createElement( 'input' );
        input.className = 'edit';
        input.value = initialValue;

        // add the input, and select all the text in it
        el.appendChild( input );
        input.select();

        // on submit, update the data and remove the input
        submit = function ( event ) {
          event.preventDefault();

          removeEventListeners();

          el.removeChild( input );
          self.set( descriptionKeypath, input.value );
        };

        keydown = function ( event ) {
          // if user hits enter and no change has occurred, 'change'
          // will not fire. so we force it
          if ( event.which === 13 ) {
            submit( event );
          }

          // escape key - cancel edit
          if ( event.which === 27 ) {
            self.set( descriptionKeypath, initialValue );
            removeEventListeners();
            el.removeChild( input );
          }
        };

        removeEventListeners = function () {
          input.removeEventListener( 'blur', submit );
          input.removeEventListener( 'change', submit );
          input.removeEventListener( 'keydown', keydown );
        };

        input.addEventListener( 'blur', submit );
        input.addEventListener( 'change', submit );
        input.addEventListener( 'keydown', keydown );
      }
    });
  }
});

var ractive = new TodoList({
  el: output,
  items: [
    { done: true,  description: 'Add a todo item' },
    { done: false, description: 'Add some more todo items' },
    { done: false, description: 'Complete all the Ractive tutorials' }
  ]
});