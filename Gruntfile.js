/*global module:false*/
module.exports = function(grunt) {

	'use strict';

	grunt.initConfig({
		
		// Main watch task. Kick this off by entering `grunt watch`. Now, any time you change the files below,
		// the relevant tasks will execute
		watch: {
			sass: {
				files: 'project/src/styles/**/*.scss',
				tasks: 'sass:dev',
				interrupt: true
			},
			data: {
				files: 'project/src/data/**/*',
				tasks: 'dir2json:dev',
				interrupt: true
			},
			files: {
				files: 'project/src/files/**/*',
				tasks: 'copy:filesdev',
				interrupt: true
			},
			root: {
				files: 'project/src/*.*',
				tasks: 'copy:rootdev',
				interrupt: true
			},
			js: {
				files: 'project/src/js/**',
				tasks: 'copy:jsdev',
				interrupt: true
			}
		},


		// Lint .js files in the src/js folder
		jshint: {
			files: ['project/src/js/**/*.js', 
			//exclude these files:
			'!project/src/js/almond.js', '!project/src/js/require.js', '!project/src/js/lib/**/*.js'],
			options: { jshintrc: '.jshintrc' }
		},

		
		// Clean up old cruft
		clean: {
			tmp: [ 'tmp' ],
			build: [ 'build' ],
			generated: [ 'generated' ]
		},


		// Compile .scss files
		sass: {
			dev: {
				files: {
					'generated/styles/min.css': 'project/src/styles/**/*.scss'
				},
				options: { debugInfo: true }
			},
			build: {
				files: {
					'build/styles/min.css': 'project/src/styles/**/*.scss'
				},
				options: { style: 'compressed' }
			}
		},
		
		// Optimize JavaScript by minifying into a single file
		requirejs: {
			compile: {
				options: {
					baseUrl: 'generated/js/',
					out: 'build/js/main.js',
					name: 'almond',
					include: 'main',
					mainConfigFile: 'generated/js/main.js',
					wrap: true,
					optimize: 'uglify'
				}
			}
		},

		// Copy files
		copy: {
			files: {
				files: [{
					expand: true,
					cwd: 'project/src/files',
					src: ['**'],
					dest: 'build/files/'
				}]
			},
			root: {
				files: [{
					expand: true,
					cwd: 'project/src/',
					src: ['*.*'],
					dest: 'build/'
				}]
			},
			js: {
				files: [{
					expand: true,
					cwd: 'project/src/js',
					src: ['**'],
					dest: 'build/js'
				}]
			},
			filesdev: {
				files: [{
					expand: true,
					cwd: 'project/src/files',
					src: ['**'],
					dest: 'generated/files/'
				}]
			},
			rootdev: {
				files: [{
					expand: true,
					cwd: 'project/src/',
					src: ['*.*'],
					dest: 'generated/'
				}]
			},
			jsdev: {
				files: [{
					expand: true,
					cwd: 'project/src/js',
					src: ['**'],
					dest: 'generated/js'
				}]
			},
			bundle: {
				src: 'tmp/bundle.js',
				dest: 'build/js/bundle.js'
			}
		},

		// Compress any CSS in the root folder
		cssmin: {
			build: {
				files: [{
					expand: true,
					cwd: 'tmp/build/',
					src: '*.css',
					dest: 'build/'
				}]
			}
		},

		// Minify any JS in the root folder
		uglify: {
			build: {
				files: [{
				expand: true,
				cwd: 'build/',
				src: '*.js',
				dest: 'build/'}]
			},
			buildBundle: {
				src: 'tmp/bundle.js',
				dest: 'tmp/bundle.js'
			}
		},
		
		// Combine contents of `project/src/data` into a single `data.json` file
		dir2json: {
			dev: {
				root: 'project/src/data/',
				dest: 'generated/data.json',
				options: { space: '\t' }
			},
			build: {
				root: 'project/src/data/',
				dest: 'build/data.json'
			}
		},


		concat: {
			devBundle: {
				src: [ 'project/src/js/bundle/**/*.js', 'project/src/js/require.js' ],
				dest: 'generated/js/bundle.js'
			},
			buildBundle: {
				src: [ 'project/src/js/bundle/**/*.js' ],
				dest: 'tmp/bundle.js'
			}
		}

	});


	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');

	grunt.loadNpmTasks('grunt-dir2json');
	

	
	// generate a runnable build for developing
	grunt.registerTask( 'generate', [
		'copy:rootdev',
		'copy:jsdev',
		'copy:filesdev',
		'sass:dev',
		'dir2json:dev',
		'concat:devBundle'
	]);

	// default task - generate dev build and watch for changes
	grunt.registerTask( 'default', [
		'generate',
		'watch'
	]);

	grunt.registerTask( 'bundle', [
		'concat:buildBundle',
		'uglify:buildBundle'
	]);

	// build task - link, compile, flatten, optimise, copy
	grunt.registerTask( 'build', [
		// clear out previous build
		'clean:generated',
		'clean:build',

		// generate files which we need to minify in a moment
		'generate',

		//Lint js files! TODO
		//'jshint',

		// copy files from project/files to build/files and from project root to build root
		'copy:root',
		//'copy:js',
		'copy:files',
		'copy:bundle',

		// build our min.css, without debugging info
		'sass:build',
		'dir2json:build',

		// optimise JS
		'requirejs',

		// optimise JS and CSS from the root folder
		'cssmin:build',
		'uglify:build',

	]);

};
