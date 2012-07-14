#!/usr/bin/env node

/**
 * Doxumentor
 * Copyright Troy Whiteley
 *
 * Take control of your documentation!
 *
 * Doxumentor is a documentation page generator
 * using dox as the backend of parsing code.
 */

var dox = require('dox'),
  fs = require('graceful-fs'),
  program = require('commander'),
  jade = require('jade'),
  colors = require('colors');

// Lower the max open as default is too high.
fs.MAX_OPEN = 100;

// Setup program options.
program
  .version('0.1.1')
  .option('-i, --input <path>', 'Input file or directory')
  .option('-o, --output <path>', 'Output Directory')
  .option('-t, --template [path]', 'Template file')
  .parse(process.argv);

// Check input.
if(!program.input) {
  console.log('Please supply an input directory'.red);
  process.exit(code=0);
}

// Check output.
if(!program.output) {
  console.log('Please supply an output directory'.red);
  process.exit(code=0);
}


console.log('Using input: '.green + program.input);
console.log('Using output dir: '.green + program.output);

// Check template
if(program.template) {
  console.log('Using template: '.green + program.template);
}

// Check if input is a real directory.
fs.stat(program.input, function(err, stat) {
  if(!stat || !stat.isDirectory()) {
    console.log('');
    console.log(program.input.red + ' is not a directory.'.red);
    process.exit(code=0);
  }
});


// Check if output is a real directory.
fs.stat(program.output, function(err, stat) {
  if(!stat || !stat.isDirectory()) {
    console.log('');
    console.log(program.output.red + ' is not a directory.'.red);
    process.exit(code=0);
  }
});

var template = program.template || './template.jade',
  templateFile = fs.readFileSync(template, 'utf8'),
  totalFiles = 0,
  processedFiles = 0,
  start_time = +new Date();

/**
 * Recursively reads files in a directory.
 * 
 * @param  {String}   dir  Directory to read.
 * @param  {Function} done Callback when a directory is finished.
 */
var walk = function walk(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if(err) return done(err);
    var pending = list.length;
    if(!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if(stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if(!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

/**
 * Reads a file and runs it through dox and generates HTML
 * by using Jade.
 * 
 * @param  {String} file Filename.
 * @todo  Could use some cleanup.
 */
var parseFile = function parseFile(file) {
  fs.readFile(file, 'utf8', function (err, data) {
    if(err || (file.indexOf('.js') === -1 && file.indexOf('.css') === -1)) {
      totalFiles--;
      return;
    }
    console.log('Parsing: '.green + file);

    var obj = dox.parseComments(data),
      outputFile = file.replace(program.input, program.output).replace(/(\.js)|(\.css)/, '.html'),
      fileParts = require('path').normalize(outputFile.replace(program.output, '')).split('/');

    var fn = jade.compile(templateFile, {
      filename: template
    });

    var outputHTML = fn({
      fileParts: fileParts,
      fileName: fileParts[fileParts.length-1],
      data: obj
    });

    mkdir(outputFile, function(){
      fs.writeFile(outputFile, outputHTML, 'utf8', function(err) {
        if (err) throw err;
        console.log('Generated: '.green + outputFile);
        processedFiles++;

        if(totalFiles === processedFiles) {
          var end_time = +new Date();
          console.log(('Finished parsing ' + totalFiles + ' '+ (totalFiles===1?'file':'files') +' in ' + ((end_time-start_time)/1000) + ' seconds').blue);
        }
      });
    });
  });
};

/**
 * Custom mkdir that mimicks mkdir -p
 *
 * @param  {String}   path     Path to create.
 * @param  {Function} callback Callback when directory created.
 * @param  {[type]}   position Position is mkdir -p chain
 */
var mkdir = function mkdir(path, callback, position) {
  var parts = require('path').normalize(path).split('/');

  position = position || 0;

  if (position >= parts.length-1) {
    return callback();
  }

  var directory = parts.slice(0, position + 1).join('/') || '/';
  fs.stat(directory, function(err, stat) {    
    if (stat && (stat.isFile() || stat.isDirectory())) {
      mkdir(path, callback, position+1);
    } else {
      fs.mkdir(directory, function (err) {
        if (err && err.errno !== 17) {
          return callback(err);
        } else {
          mkdir(path, callback, position+1);
        }
      });
    }
  });
};

// Run the app!
walk(program.input, function(err, results) {
  if (err) throw err;
  totalFiles = results.length;
  results.forEach(parseFile);
});
