// This file intentionally violates ESLint no-var rule

var badVariable = 'should use const';

var anotherBad = 'var is not allowed';

// Use the variables to avoid no-unused-vars
console.log(badVariable, anotherBad);
