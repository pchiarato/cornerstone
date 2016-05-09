module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            default: {
                src: [
                    'dist'
                ]
            }
        },
        copy: {
            bower: {
                src: [
                    'bower_components/jquery/dist/jquery.min.js',
                    'bower_components/jquery/dist/jquery.min.map',
                ],
                dest: 'example',
                expand: true,
                flatten: true
            }
        },
        concat: {
            build: {
                src : ['src/header.js','src/**/*.js'],
                dest: 'build/built.js'
            },
            css: {
                options: {
                    stripBanners: true,
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %> ' +
                        '| (c) 2014 Chris Hafey | https://github.com/chafey/cornerstone */\n'
                },
                src: ['src/cornerstone.css'],
                dest: 'dist/cornerstone.css',
            },
            dist: {
                options: {
                    stripBanners: true,
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %> ' +
                        '| (c) 2014 Chris Hafey | https://github.com/chafey/cornerstone */\n'
                },
                src : ['build/built.js'],
                dest: 'dist/cornerstone.js'
            }
        },
        uglify: {
            dist: {
                files: {
                    'dist/cornerstone.min.js': ['dist/cornerstone.js']
                }
            },
            options: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> ' +
                    '| (c) 2014 Chris Hafey | https://github.com/chafey/cornerstone */\n'
            }
        },
        qunit: {
            all: ['test/**/*.html']
        },
        jshint: {
            files: [
                'src/*.js'
            ]
        },
        watch: {
            scripts: {
                files: ['src/**/*.js', 'test/**/*'],
                tasks: ['buildAll']
            }
        },
        cssmin: {
            dist: {
                files: {
                    'dist/cornerstone.min.css': ['dist/cornerstone.css']
                }
            }
        },
        release: {
          options: {
              bump: true,                                               //default: true
              changelog: false,                                         //default: false

              indentation: '\t',                                        //default: '  ' (two spaces)
              tagName: '<%= version %>',                                //default: '<%= version %>'
              commitMessage: 'check out my release <%= version %>',     //default: 'release <%= version %>'
              tagMessage: 'tagging version <%= version %>',             //default: 'Version <%= version %>',
              beforeBump: [],                                           // optional grunt tasks to run before file versions are bumped
              afterBump: [],                                            // optional grunt tasks to run after file versions are bumped
              beforeRelease: [],                                        // optional grunt tasks to run after release version is bumped up but before release is packaged
              afterRelease: [],                                         // optional grunt tasks to run after release is packaged
              updateVars: [],                                           // optional grunt config objects to update (this will update/set the version property on the object specified)
              github: {
                apiRoot: 'https://api.github.com',
                repo: 'ghetolay/cornerstone',                           //put your user/repo here
                accessTokenVar: 'GITHUB_ACCESS_TOKEN',                  //ENVIRONMENT VARIABLE that contains GitHub Access Token
              }
            }
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.loadNpmTasks('grunt-release');

    grunt.registerTask('buildAll', ['copy', 'concat', 'uglify', 'jshint', 'cssmin', 'qunit']);
    grunt.registerTask('default', ['clean', 'buildAll']);
};


// Release process:
//  1) Update version numbers in package.json and bower.json
//  2) do a build (needed to update dist versions with correct build number)
//  3) commit changes
//      git commit -am "Changes...."
//  4) tag the commit
//      git tag -a 0.1.0 -m "Version 0.1.0"
//  5) push to github
//      git push origin master --tags