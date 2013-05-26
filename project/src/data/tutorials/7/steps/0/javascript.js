var ractive = new Ractive({
  el: output,
  template: template,
  data: {
    // placeholder image data
    image: {
      src: 'files/gifs/css.gif',
      caption: 'Trying to fix someone else\'s CSS'
    }
  }
});