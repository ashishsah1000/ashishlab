const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('Ashish resume 26-05.pdf');

const parse = pdf.default || pdf;
parse(dataBuffer).then(function(data) {
    console.log(data.text);
}).catch(console.error);
