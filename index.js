'use strict';
/* eslint-disable no-console */

const dictionary = require('./dictionary');
const args = process.argv.slice(2);

dictionary.load(args[0])
  .then(() => {
    let result = dictionary.search(args[1]);
    if (result)
      console.log(result);
    else
      console.log('Not found.');
  })
  .catch((err)=>{
    console.error(err);
  });
