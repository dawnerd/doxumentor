var dox = require('dox'),
    fs = require('fs'),
    program = require('commander');


program
  .version('0.0.0')
  .option('-i, --input <path>', 'Input file or directory')
  .option('-o, --output <path>', 'Output Directory')
  .option('-t, --template [path]', 'Template file')
  .parse(process.argv);


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
    console.log(obj)
  });
};

walk(program.input, function(err, results) {
  if (err) throw err;
  results.forEach(parseFile);
});
