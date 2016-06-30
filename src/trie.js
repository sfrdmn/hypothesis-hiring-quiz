module.exports = {
  trie,
  findWithPrefix,
}

/**
 * Key val pairs are edited in place
 */
function trie (keyValPairs) {
  return keyValPairs
    .map(([k, v]) => [k.toLowerCase(), v])
    .reduce((trie, [k, v]) => add(trie, k, v), {})
}

function lower (string) {
  return string.toLowerCase()
}

function add (root, key, val) {
  // Iteratively encode keys as nested paths to values
  return key.split('').reduce(([node], ch, i) => {
    if (i === key.length - 1) {
      node[ch] = [(node[ch] && node[ch][0]) || null, val]
      return root
    } else {
      if (!node[ch]) node[ch] = [{}]
      else if (!node[ch][0]) node[ch] = [{}, node[ch][1]]
      return node[ch]
    }
  }, [root])
}

function findWithPrefix (root, prefix) {
  if (!prefix) return []
  // Find branch node for prefix by traversing down tree
  const branch = prefix.split('').reduce((root, ch) => {
    return root && root[0][ch]
  }, [root])
  if (branch) return leaves(branch)
  else return []
}

/**
 * Yield list of leaves for trie branch where leaves are
 * defined to be all values in the branch
 */
function leaves (branch) {
  const root = branch[0]
  return Object.keys(root).reduce((list, key) => {
    // Check if we have to recurse
    if (root[key][0]) {
      return list.concat(leaves(root[key]))
    // Otherwise just return list
    } else {
      // Must be at bottom now
      list.push(root[key][1])
      return list
    }
  }, branch[1] ? [branch[1]] : [])
}
