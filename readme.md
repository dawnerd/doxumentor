# doxumentor
## Take control of your documentation!

Doxumentor is a documentation generator built on top of dox and uses Jade for templates.

### Requirements

Doxumentor should run on just about any version of Nodejs as long as you have npm installed. (Included with newer versions of Nodejs).

### Installation

From terminal run: ````npm install doxumentor````

### Usage

````doxumentor -i some_directory/toscan/forjs -o some_directory/tooutput -t template.jade````

### Example template

template.jade

    !!!
    html
      head
        title Documentation for #{fileName}
      body
        h1 #{fileName}
        h6 Located in: #{fileParts.join('/')}
        div.description !{data[0].description.full}
        code
          pre !{data[0].code}
        script
          var data = !{JSON.stringify(data)};
          var fileParts = '!{fileParts}'.split(',');
          var fileName = '!{fileName}';

### Other cool stuff

Doxumentor doesn't just support javascript. It can also scan and parse CSS files by using the ````--css```` flag. CSS files must use the same style comments that your Javascript use.

### Further Reading

For more information how to document your code, please checkout [the dox documentation](https://github.com/visionmedia/dox/).
