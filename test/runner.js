// Example usage:
// node runner.js AdvancedTest.js
// Compares the json created by AutoMate with the desired one stored in AdvancedTest.js.template

var lib = require('../src/automate.js'),
    assert = require('assert'),
    fs = require('fs');


// Load the argument file
var fileName = process.argv[2];
var amScript = fs.readFileSync(fileName, 'utf8');
                       
// Execute AutoMate    
eval("var json = lib."+ amScript);

// Check for differences
var am_template = JSON.parse(json);
var template = JSON.parse(fs.readFileSync(fileName+".template", 'utf8'));

assert.deepEqual(template, am_template, "The generated template is different than the expected one.");
