module.exports = function(grunt){
    grunt.initConfig({

        browserify:
        {
            "index": {
                src: ['js/components/*.js', "js/*.js"],
                dest: "build/index.js",
                options : {
                    transform: ['reactify']
                }
            }
        },
        react : {
          components : {
            files : {
              'uploader/build/components.js' : [
                'uploader/jsx/PortfolioImage.js',
                'uploader/jsx/PortfolioImageList.js'
                ],
              'uploader/build/uploader.js' : 'uploader/uploader.js'
            }
          }
        },
        sass : {
          options: {
            sourceMap : true
          },
          compile : {
            files : {
              'static/layout.css' : 'scss/layout.scss'
            }
          }
        },
        uglify : {
         "index": {
          files:{
           "build/index-min.js": ["build/index.js"]
          }
         }
        }
    });
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-react');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['browserify','react', 'sass', 'uglify']);
};
