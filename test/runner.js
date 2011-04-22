// Example usage:
// node runner.js AdvancedTest.js
// Compares the json created by AutoMate with the desired one stored in AdvancedTest.js.template

var lib = require('../src/automate.js'),
    assert = require('assert'),
    fs = require('fs'),
    sys = require("sys");


// Load the argument file
var fileName = process.argv[2];
var amScript = fs.readFileSync(fileName, 'utf8');


try { 
  // Execute AutoMate    
  eval("var t = lib."+ amScript);

  var json = lib.AutoMate.EC2.build(t);

  // Check for differences
  var am_template = JSON.parse(json);
  var template = JSON.parse(fs.readFileSync(fileName+".template", 'utf8'));

  try {
    assert.deepEqual(template, am_template, "The generated template is different than the expected one.");
  } catch(e) {
    fs.writeFileSync("./test.log", json, 'utf-8');
    throw e;
  }
} catch(e) {
  sys.puts(e.stack);
  throw e;
}
