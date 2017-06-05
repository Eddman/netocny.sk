module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        ts: {
            compile: {
                options: {
                    fast: 'never'
                },
                tsconfig: true
            }
        },
        exec: {
            node: {
                args: [
                    './app.js'
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-run');
    grunt.loadNpmTasks('grunt-ts');
    grunt.renameTask('run', 'exec');

    grunt.registerTask('build', ['ts:compile']);
    grunt.registerTask('test', ['ts:compile', 'exec']);
};