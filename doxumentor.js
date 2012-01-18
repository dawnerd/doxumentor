#!/usr/bin/env node

var dox = require('dox'),
    fs = require('graceful-fs'),
    program = require('commander'),
    jade = require('jade');

//lower the max open as default is too high.
fs.MAX_OPEN = 100;


program
  .version('0.0.0')
  .option('-i, --input <path>', 'Input file or directory')
  .option('-o, --output <path>', 'Output Directory')
  .option('-t, --template [path]', 'Template file')
  .parse(process.argv);

if(!program.input) {
  console.log('Please supply an input');
  process.exit(code=0);
}

if(!program.output) {
  console.log('Please supply an output directory');
  process.exit(code=0);
}

console.log('Using input: ' + program.input);
console.log('Using output dir: ' + program.output);
if(program.template) console.log('Using template: ' + program.template);

fs.stat(program.output, function(err, stat) {
  if(!stat || !stat.isDirectory()) {
    console.log('');
    console.log(program.output + ' is not a directory.')
    process.exit(code=0);
  }
});

var template = program.template || './template.jade';
var templateFile = fs.readFileSync(template, 'utf8');

var walk = function(dir, done) {
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

var parseFile = function(file) {
  fs.readFile(file, 'utf8', function (err, data) {
    if (err || (file.indexOf('.js') === -1 && file.indexOf('.css') === -1)) return;
    console.log('Parsing: ' + file);
    var obj = dox.parseComments(data);

    var outputFile = file.replace(program.input, program.output).replace(/(\.js)|(\.css)/, '.html');
    var fileParts = require('path').normalize(outputFile.replace(program.output, '')).split('/');

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
        console.log('Generated: ' + outputFile);
      });
    });
  });
};

//custom mkdir for mkdir -p
var mkdir = function(path, callback, position) {
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

walk(program.input, function(err, results) {
  if (err) throw err;
  results.forEach(parseFile);
});
