var test = require('tape')
var {findWithPrefix, trie} = require('./src/trie')

test('test trie', (t) => {
  t.ok(true, 'true is ok')
  t.deepEqual(trie([['a', 1], ['b', 2]]), {
    a: [null, 1],
    b: [null, 2]
  }, 'can create flat trie')
  t.deepEqual(trie([['sup', 1], ['sour', 2], ['sal', 3]]), {
    s: [{
      a: [{ l: [null, 3] }],
      o: [{ u: [{ r: [null, 2] }] }],
      u: [{ p: [null, 1] }]
    }]
  }, 'can create nested trie')
  t.deepEqual(findWithPrefix(trie([
      ['mom', 1], ['moma', 7], ['moman', 9],
      ['barry', 34], ['whatever', 234]]), 'mom'),
    [1, 7, 9]
  , 'can search prefixes')
  t.end()
})
