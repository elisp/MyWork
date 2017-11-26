'use strict';

const fs = require('fs');

let root = createNode('');

function readFromFile(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(data.split('\n'));
      }
    });
  });
}

function compareStrings(a, b) {
  let aLen = a.length,
    bLen = b.length;

  if (aLen < bLen)
    return 1;
  if (aLen > bLen)
    return -1;

  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a < b)
    return 1;
  if (a > b)
    return -1;

  return 0;
}

function createNode(shortest, children = {}) {
  return {
    shortest,
    children
  };
}

function processWord(parent, word, index) {
  if (index >= word.length)
    return;
  let char = word[index].toLowerCase();
  let childNode = parent.children[char];
  if (!childNode) {
    childNode = createNode(word);
    parent.children[char] = childNode;
  }
  let compare = compareStrings(childNode.shortest, word);
  if (compare === -1) {
    childNode.shortest = word;
  }
  processWord(childNode, word, ++index);
}

function processData(lines) {
  lines.forEach(line => {
    processWord(root, line.trim(), 0);
  });
}

function load(filename) {
  return readFromFile(filename)
    .then((lines) => {
      processData(lines);
    });
}

function searchRecursive(parent, word, index) {
  if (compareStrings(parent.shortest, word) === 0)
    return word;
  if (index === word.length)
    return parent.shortest;
  let node = parent.children[word[index]];
  if (node) {
    return searchRecursive(node, word, ++index);
  }
  return null;
}

function search(word) {
  return searchRecursive(root, word, 0);
}

module.exports = {
  load,
  search
};
