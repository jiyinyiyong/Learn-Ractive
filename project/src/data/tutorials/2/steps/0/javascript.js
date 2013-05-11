var view = new Ractive({
  el: output,
  template: template,
  data: { country: 'the UK', population: 62641000 },
  modifiers: {
  	// add a modifier here
  }
});