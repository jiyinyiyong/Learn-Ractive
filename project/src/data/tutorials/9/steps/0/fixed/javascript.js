var item = "<li data-index='{{i}}' class='{{( done ? \"done\" : \"pending\" )}}'>" +
             "<input type='checkbox' checked='{{done}}'>" +
             "<span proxy-tap='edit'>" +
               "{{description}}" +

               "{{#.editing}}" +
                 "<input id='editTodo' class='edit' value='{{description}}' proxy-blur='stop_editing'>" +
               "{{/.editing}}" +
             "</span>" +
             "<a class='button' proxy-tap='remove'>x</a>" +
           "</li>";

var TodoList = Ractive.extend({
  template: template,

  partials: { item: item },

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
      remove: function ( event ) {
        var index = event.node.parentNode.getAttribute( 'data-index' );
        this.removeItem( index );
      },
      newTodo: function ( event ) {
        this.addItem( event.node.value );
        event.node.value = '';
      },
      edit: function ( event ) {
        var node, li, index, input, submit;

        // first, find the index of the todo we're editing
        node = event.node;
        li = node.parentNode;
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

          node.removeChild( input );
          self.set( 'items.' + index + '.description', input.value );
        };

        input.addEventListener( 'blur', submit );
        input.addEventListener( 'change', submit );

        // add the input, and select all the text in it
        node.appendChild( input );
        input.select();
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