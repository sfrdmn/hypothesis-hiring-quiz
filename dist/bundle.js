(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var document = require('global/document')
var hyperx = require('hyperx')
var onload = require('on-load')

var SVGNS = 'http://www.w3.org/2000/svg'
var BOOL_PROPS = {
  autofocus: 1,
  checked: 1,
  defaultchecked: 1,
  disabled: 1,
  formnovalidate: 1,
  indeterminate: 1,
  readonly: 1,
  required: 1,
  willvalidate: 1
}
var SVG_TAGS = [
  'svg',
  'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting',
  'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB',
  'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode',
  'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting',
  'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font', 'font-face',
  'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri',
  'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line',
  'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath',
  'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else {
    el = document.createElement(tag)
  }

  // If adding onload events
  if (props.onload || props.onunload) {
    var load = props.onload
    var unload = props.onunload
    onload(el, function bel_onload () {
      load(el)
    }, function bel_onunload () {
      unload(el)
    })
    delete props.onload
    delete props.onunload
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS[key]) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          el.setAttributeNS(null, p, val)
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  function appendChild (childs) {
    if (!Array.isArray(childs)) return
    for (var i = 0; i < childs.length; i++) {
      var node = childs[i]
      if (Array.isArray(node)) {
        appendChild(node)
        continue
      }

      if (typeof node === 'number' ||
        typeof node === 'boolean' ||
        node instanceof Date ||
        node instanceof RegExp) {
        node = node.toString()
      }

      if (typeof node === 'string') {
        if (el.lastChild && el.lastChild.nodeName === '#text') {
          el.lastChild.nodeValue += node
          continue
        }
        node = document.createTextNode(node)
      }

      if (node && node.nodeType) {
        el.appendChild(node)
      }
    }
  }
  appendChild(children)

  return el
}

module.exports = hyperx(belCreateElement)
module.exports.createElement = belCreateElement

},{"global/document":7,"hyperx":10,"on-load":2}],2:[function(require,module,exports){
/* global MutationObserver */
var document = require('global/document')
var window = require('global/window')
var watch = Object.create(null)
var KEY_ID = 'onloadid' + (new Date() % 9e6).toString(36)
var KEY_ATTR = 'data-' + KEY_ID
var INDEX = 0

if (window && window.MutationObserver) {
  var observer = new MutationObserver(function (mutations) {
    if (watch.length < 1) return
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === KEY_ATTR) {
        eachAttr(mutations[i], turnon, turnoff)
        continue
      }
      eachMutation(mutations[i].removedNodes, turnoff)
      eachMutation(mutations[i].addedNodes, turnon)
    }
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: [KEY_ATTR]
  })
}

module.exports = function onload (el, on, off) {
  on = on || function () {}
  off = off || function () {}
  el.setAttribute(KEY_ATTR, 'o' + INDEX)
  watch['o' + INDEX] = [on, off, 0, onload.caller]
  INDEX += 1
  return el
}

function turnon (index) {
  if (watch[index][0] && watch[index][2] === 0) {
    watch[index][0]()
    watch[index][2] = 1
  }
}

function turnoff (index) {
  if (watch[index][1] && watch[index][2] === 1) {
    watch[index][1]()
    watch[index][2] = 0
  }
}

function eachAttr (mutation, on, off) {
  if (!watch[mutation.oldValue]) {
    return
  }
  var newValue = mutation.target.getAttribute(KEY_ATTR)
  if (sameOrigin(mutation.oldValue, newValue)) {
    watch[newValue] = watch[mutation.oldValue]
    return
  }
  Object.keys(watch).forEach(function (k) {
    if (mutation.oldValue === k) {
      off(k)
    }
    if (newValue === k) {
      on(k)
    }
  })
}

function sameOrigin (oldValue, newValue) {
  return watch[oldValue][3] === watch[newValue][3]
}

function eachMutation (nodes, fn) {
  var keys = Object.keys(watch)
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] && nodes[i].getAttribute && nodes[i].getAttribute(KEY_ATTR)) {
      var onloadid = nodes[i].getAttribute(KEY_ATTR)
      keys.forEach(function (k) {
        if (onloadid === k) {
          fn(k)
        }
      })
    }
    if (nodes[i].childNodes.length > 0) {
      eachMutation(nodes[i].childNodes, fn)
    }
  }
}

},{"global/document":7,"global/window":8}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
/**
 * Global Names
 */

var globals = /\b(Array|Date|Object|Math|JSON)\b/g;

/**
 * Return immediate identifiers parsed from `str`.
 *
 * @param {String} str
 * @param {String|Function} map function or prefix
 * @return {Array}
 * @api public
 */

module.exports = function(str, fn){
  var p = unique(props(str));
  if (fn && 'string' == typeof fn) fn = prefixed(fn);
  if (fn) return map(str, p, fn);
  return p;
};

/**
 * Return immediate identifiers in `str`.
 *
 * @param {String} str
 * @return {Array}
 * @api private
 */

function props(str) {
  return str
    .replace(/\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\//g, '')
    .replace(globals, '')
    .match(/[a-zA-Z_]\w*/g)
    || [];
}

/**
 * Return `str` with `props` mapped with `fn`.
 *
 * @param {String} str
 * @param {Array} props
 * @param {Function} fn
 * @return {String}
 * @api private
 */

function map(str, props, fn) {
  var re = /\.\w+|\w+ *\(|"[^"]*"|'[^']*'|\/([^/]+)\/|[a-zA-Z_]\w*/g;
  return str.replace(re, function(_){
    if ('(' == _[_.length - 1]) return fn(_);
    if (!~props.indexOf(_)) return _;
    return fn(_);
  });
}

/**
 * Return unique array.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

function unique(arr) {
  var ret = [];

  for (var i = 0; i < arr.length; i++) {
    if (~ret.indexOf(arr[i])) continue;
    ret.push(arr[i]);
  }

  return ret;
}

/**
 * Map with prefix `str`.
 */

function prefixed(str) {
  return function(_){
    return str + _;
  };
}

},{}],5:[function(require,module,exports){
/**
 * Expose `xor`
 */

module.exports = xor;

/**
 * XOR utility
 *
 * T T F
 * T F T
 * F T T
 * F F F
 *
 * @param {Boolean} a
 * @param {Boolean} b
 * @return {Boolean}
 */

function xor(a, b) {
  return !a != !b;
}

},{}],6:[function(require,module,exports){
/**
 * Module Dependencies
 */

var xor, props;

try {
  xor = require('component-xor');
} catch (e) {
  xor = require('xor');
}

try {
  props = require('component-props');
} catch (e) {
  props = require('props');
}

/**
 * Export `Iterator`
 */

module.exports = Iterator;

/**
 * Initialize `Iterator`
 *
 * @param {Node} node
 * @param {Node} root
 * @return {Iterator} self
 * @api public
 */

function Iterator(node, root) {
  if (!(this instanceof Iterator)) return new Iterator(node, root);
  this.node = this.start = this.peeked = node;
  this.root = root;
  this.closingTag = false;
  this._revisit = true;
  this._selects = [];
  this._rejects = [];

  if (node && this.higher(node)) {
    throw new Error('root must be a parent or ancestor to node');
  }
}

/**
 * Reset the Iterator
 *
 * @param {Node} node (optional)
 * @return {Iterator} self
 * @api public
 */

Iterator.prototype.reset = function(node) {
  this.node = node || this.start;
  return this;
};

/**
 * Revisit element nodes. Defaults to `true`
 */

Iterator.prototype.revisit = function(revisit) {
  this._revisit = undefined == revisit ? true : revisit;
  return this;
};

/**
 * Jump to the opening tag
 */

Iterator.prototype.opening = function() {
  if (1 == this.node.nodeType) this.closingTag = false;
  return this;
};

/**
 * Jump to the closing tag
 */

Iterator.prototype.atOpening = function() {
  return !this.closingTag;
};


/**
 * Jump to the closing tag
 */

Iterator.prototype.closing = function() {
  if (1 == this.node.nodeType) this.closingTag = true;
  return this;
};

/**
 * Jump to the closing tag
 */

Iterator.prototype.atClosing = function() {
  return this.closingTag;
};

/**
 * Next node
 *
 * @param {Number} type
 * @return {Node|null}
 * @api public
 */

Iterator.prototype.next = traverse('nextSibling', 'firstChild');

/**
 * Previous node
 *
 * @param {Number} type
 * @return {Node|null}
 * @api public
 */

Iterator.prototype.previous =
Iterator.prototype.prev = traverse('previousSibling', 'lastChild');

/**
 * Make traverse function
 *
 * @param {String} dir
 * @param {String} child
 * @return {Function}
 * @api private
 */

function traverse(dir, child) {
  var next = dir == 'nextSibling';
  return function walk(expr, n, peek) {
    expr = this.compile(expr);
    n = n && n > 0 ? n : 1;
    var node = this.node;
    var closing = this.closingTag;
    var revisit = this._revisit;

    while (node) {
      if (xor(next, closing) && node[child]) {
        // element with children: <em>...</em>
        node = node[child];
        closing = !next;
      } else if (1 == node.nodeType && !node[child] && xor(next, closing)) {
        // empty element tag: <em></em>
        closing = next;
        if (!revisit) continue;
      } else if (node[dir]) {
        // element has a neighbor: ...<em></em>...
        node = node[dir];
        closing = !next;
      } else {
        // done with current layer, move up.
        node = node.parentNode;
        closing = next;
        if (!revisit) continue;
      }

      if (!node || this.higher(node, this.root)) break;

      if (expr(node) && this.selects(node, peek) && this.rejects(node, peek)) {
        if (--n) continue;
        if (!peek) this.node = node;
        this.closingTag = closing;
        return node;
      }
    }

    return null;
  };
}

/**
 * Select nodes that cause `expr(node)`
 * to be truthy
 *
 * @param {Number|String|Function} expr
 * @return {Iterator} self
 * @api public
 */

Iterator.prototype.select = function(expr) {
  expr = this.compile(expr);
  this._selects.push(expr);
  return this;
};

/**
 * Run through the selects ORing each
 *
 * @param {Node} node
 * @param {Boolean} peek
 * @return {Boolean}
 * @api private
 */

Iterator.prototype.selects = function(node, peek) {
  var exprs = this._selects;
  var len = exprs.length;
  if (!len) return true;

  for (var i = 0; i < len; i++) {
    if (exprs[i].call(this, node, peek)) return true;
  };

  return false;
};

/**
 * Select nodes that cause `expr(node)`
 * to be falsy
 *
 * @param {Number|String|Function} expr
 * @return {Iterator} self
 * @api public
 */

Iterator.prototype.reject = function(expr) {
  expr = this.compile(expr);
  this._rejects.push(expr);
  return this;
};

/**
 * Run through the reject expressions ANDing each
 *
 * @param {Node} node
 * @param {Boolean} peek
 * @return {Boolean}
 * @api private
 */

Iterator.prototype.rejects = function(node, peek) {
  var exprs = this._rejects;
  var len = exprs.length;
  if (!len) return true;

  for (var i = 0; i < len; i++) {
    if (exprs[i].call(this, node, peek)) return false;
  };

  return true;
};

/**
 * Check if node is higher
 * than root.
 *
 * @param {Node} node
 * @param {Node} root
 * @return {Boolean}
 * @api private
 */

Iterator.prototype.higher = function(node) {
  var root = this.root;
  if (!root) return false;
  node = node.parentNode;
  while (node && node != root) node = node.parentNode;
  return node != root;
};

/**
 * Compile an expression
 *
 * @param {String|Function|Number} expr
 * @return {Function}
 */

Iterator.prototype.compile = function(expr) {
  switch (typeof expr) {
    case 'number':
      return function(node) { return expr == node.nodeType; };
    case 'string':
      return new Function('node', 'return ' + props(expr, 'node.'));
    case 'function':
      return expr;
    default:
      return function() { return true; };
  }
};

/**
 * Peek in either direction
 * `n` nodes. Peek backwards
 * using negative numbers.
 *
 * @param {Number} n (optional)
 * @return {Node|null}
 * @api public
 */

Iterator.prototype.peak =
Iterator.prototype.peek = function(expr, n) {
  if (arguments.length == 1) n = expr, expr = true;
  n = undefined == n ? 1 : n;
  if (!n) return this.node;
  else if (n > 0) return this.next(expr, n, true);
  else return this.prev(expr, Math.abs(n), true);
};

/**
 * Add a plugin
 *
 * @param {Function} fn
 * @return {Iterator}
 * @api public
 */

Iterator.prototype.use = function(fn) {
  fn(this);
  return this;
};

},{"component-props":4,"component-xor":5,"props":4,"xor":5}],7:[function(require,module,exports){
(function (global){
var topLevel = typeof global !== 'undefined' ? global :
    typeof window !== 'undefined' ? window : {}
var minDoc = require('min-document');

if (typeof document !== 'undefined') {
    module.exports = document;
} else {
    var doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }

    module.exports = doccy;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"min-document":3}],8:[function(require,module,exports){
(function (global){
if (typeof window !== "undefined") {
    module.exports = window;
} else if (typeof global !== "undefined") {
    module.exports = global;
} else if (typeof self !== "undefined"){
    module.exports = self;
} else {
    module.exports = {};
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],10:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12

module.exports = function (h, opts) {
  h = attrToProp(h)
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        p.push([ VAR, xstate, arg ])
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else cur[1][key] = concat(cur[1][key], parts[i][1])
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else cur[1][key] = concat(cur[1][key], parts[i][2])
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state)) {
          if (state === OPEN) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === TEXT) {
          reg += c
        } else if (state === OPEN && /\s/.test(c)) {
          res.push([OPEN, reg])
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[\w-]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var hasOwn = Object.prototype.hasOwnProperty
function has (obj, key) { return hasOwn.call(obj, key) }

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":9}],11:[function(require,module,exports){
// Create a range object for efficently rendering strings to elements.
var range;

var testEl = (typeof document !== 'undefined') ?
    document.body || document.createElement('div') :
    {};

var XHTML = 'http://www.w3.org/1999/xhtml';
var ELEMENT_NODE = 1;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;

// Fixes <https://github.com/patrick-steele-idem/morphdom/issues/32>
// (IE7+ support) <=IE7 does not support el.hasAttribute(name)
var hasAttributeNS;

if (testEl.hasAttributeNS) {
    hasAttributeNS = function(el, namespaceURI, name) {
        return el.hasAttributeNS(namespaceURI, name);
    };
} else if (testEl.hasAttribute) {
    hasAttributeNS = function(el, namespaceURI, name) {
        return el.hasAttribute(name);
    };
} else {
    hasAttributeNS = function(el, namespaceURI, name) {
        return !!el.getAttributeNode(name);
    };
}

function empty(o) {
    for (var k in o) {
        if (o.hasOwnProperty(k)) {
            return false;
        }
    }
    return true;
}

function toElement(str) {
    if (!range && document.createRange) {
        range = document.createRange();
        range.selectNode(document.body);
    }

    var fragment;
    if (range && range.createContextualFragment) {
        fragment = range.createContextualFragment(str);
    } else {
        fragment = document.createElement('body');
        fragment.innerHTML = str;
    }
    return fragment.childNodes[0];
}

var specialElHandlers = {
    /**
     * Needed for IE. Apparently IE doesn't think that "selected" is an
     * attribute when reading over the attributes using selectEl.attributes
     */
    OPTION: function(fromEl, toEl) {
        fromEl.selected = toEl.selected;
        if (fromEl.selected) {
            fromEl.setAttribute('selected', '');
        } else {
            fromEl.removeAttribute('selected', '');
        }
    },
    /**
     * The "value" attribute is special for the <input> element since it sets
     * the initial value. Changing the "value" attribute without changing the
     * "value" property will have no effect since it is only used to the set the
     * initial value.  Similar for the "checked" attribute, and "disabled".
     */
    INPUT: function(fromEl, toEl) {
        fromEl.checked = toEl.checked;
        if (fromEl.checked) {
            fromEl.setAttribute('checked', '');
        } else {
            fromEl.removeAttribute('checked');
        }

        if (fromEl.value !== toEl.value) {
            fromEl.value = toEl.value;
        }

        if (!hasAttributeNS(toEl, null, 'value')) {
            fromEl.removeAttribute('value');
        }

        fromEl.disabled = toEl.disabled;
        if (fromEl.disabled) {
            fromEl.setAttribute('disabled', '');
        } else {
            fromEl.removeAttribute('disabled');
        }
    },

    TEXTAREA: function(fromEl, toEl) {
        var newValue = toEl.value;
        if (fromEl.value !== newValue) {
            fromEl.value = newValue;
        }

        if (fromEl.firstChild) {
            fromEl.firstChild.nodeValue = newValue;
        }
    }
};

function noop() {}

/**
 * Returns true if two node's names and namespace URIs are the same.
 *
 * @param {Element} a
 * @param {Element} b
 * @return {boolean}
 */
var compareNodeNames = function(a, b) {
    return a.nodeName === b.nodeName &&
           a.namespaceURI === b.namespaceURI;
};

/**
 * Create an element, optionally with a known namespace URI.
 *
 * @param {string} name the element name, e.g. 'div' or 'svg'
 * @param {string} [namespaceURI] the element's namespace URI, i.e. the value of
 * its `xmlns` attribute or its inferred namespace.
 *
 * @return {Element}
 */
function createElementNS(name, namespaceURI) {
    return !namespaceURI || namespaceURI === XHTML ?
        document.createElement(name) :
        document.createElementNS(namespaceURI, name);
}

/**
 * Loop over all of the attributes on the target node and make sure the original
 * DOM node has the same attributes. If an attribute found on the original node
 * is not on the new node then remove it from the original node.
 *
 * @param  {Element} fromNode
 * @param  {Element} toNode
 */
function morphAttrs(fromNode, toNode) {
    var attrs = toNode.attributes;
    var i;
    var attr;
    var attrName;
    var attrNamespaceURI;
    var attrValue;
    var fromValue;

    for (i = attrs.length - 1; i >= 0; i--) {
        attr = attrs[i];
        attrName = attr.name;
        attrValue = attr.value;
        attrNamespaceURI = attr.namespaceURI;

        if (attrNamespaceURI) {
            attrName = attr.localName || attrName;
            fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);
        } else {
            fromValue = fromNode.getAttribute(attrName);
        }

        if (fromValue !== attrValue) {
            if (attrNamespaceURI) {
                fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
            } else {
                fromNode.setAttribute(attrName, attrValue);
            }
        }
    }

    // Remove any extra attributes found on the original DOM element that
    // weren't found on the target element.
    attrs = fromNode.attributes;

    for (i = attrs.length - 1; i >= 0; i--) {
        attr = attrs[i];
        if (attr.specified !== false) {
            attrName = attr.name;
            attrNamespaceURI = attr.namespaceURI;

            if (!hasAttributeNS(toNode, attrNamespaceURI, attrNamespaceURI ? attrName = attr.localName || attrName : attrName)) {
                fromNode.removeAttributeNode(attr);
            }
        }
    }
}

/**
 * Copies the children of one DOM element to another DOM element
 */
function moveChildren(fromEl, toEl) {
    var curChild = fromEl.firstChild;
    while (curChild) {
        var nextChild = curChild.nextSibling;
        toEl.appendChild(curChild);
        curChild = nextChild;
    }
    return toEl;
}

function defaultGetNodeKey(node) {
    return node.id;
}

function morphdom(fromNode, toNode, options) {
    if (!options) {
        options = {};
    }

    if (typeof toNode === 'string') {
        if (fromNode.nodeName === '#document' || fromNode.nodeName === 'HTML') {
            var toNodeHtml = toNode;
            toNode = document.createElement('html');
            toNode.innerHTML = toNodeHtml;
        } else {
            toNode = toElement(toNode);
        }
    }

    // XXX optimization: if the nodes are equal, don't morph them
    /*
    if (fromNode.isEqualNode(toNode)) {
      return fromNode;
    }
    */

    var savedEls = {}; // Used to save off DOM elements with IDs
    var unmatchedEls = {};
    var getNodeKey = options.getNodeKey || defaultGetNodeKey;
    var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
    var onNodeAdded = options.onNodeAdded || noop;
    var onBeforeElUpdated = options.onBeforeElUpdated || options.onBeforeMorphEl || noop;
    var onElUpdated = options.onElUpdated || noop;
    var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
    var onNodeDiscarded = options.onNodeDiscarded || noop;
    var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || options.onBeforeMorphElChildren || noop;
    var childrenOnly = options.childrenOnly === true;
    var movedEls = [];

    function removeNodeHelper(node, nestedInSavedEl) {
        var id = getNodeKey(node);
        // If the node has an ID then save it off since we will want
        // to reuse it in case the target DOM tree has a DOM element
        // with the same ID
        if (id) {
            savedEls[id] = node;
        } else if (!nestedInSavedEl) {
            // If we are not nested in a saved element then we know that this node has been
            // completely discarded and will not exist in the final DOM.
            onNodeDiscarded(node);
        }

        if (node.nodeType === ELEMENT_NODE) {
            var curChild = node.firstChild;
            while (curChild) {
                removeNodeHelper(curChild, nestedInSavedEl || id);
                curChild = curChild.nextSibling;
            }
        }
    }

    function walkDiscardedChildNodes(node) {
        if (node.nodeType === ELEMENT_NODE) {
            var curChild = node.firstChild;
            while (curChild) {


                if (!getNodeKey(curChild)) {
                    // We only want to handle nodes that don't have an ID to avoid double
                    // walking the same saved element.

                    onNodeDiscarded(curChild);

                    // Walk recursively
                    walkDiscardedChildNodes(curChild);
                }

                curChild = curChild.nextSibling;
            }
        }
    }

    function removeNode(node, parentNode, alreadyVisited) {
        if (onBeforeNodeDiscarded(node) === false) {
            return;
        }

        parentNode.removeChild(node);
        if (alreadyVisited) {
            if (!getNodeKey(node)) {
                onNodeDiscarded(node);
                walkDiscardedChildNodes(node);
            }
        } else {
            removeNodeHelper(node);
        }
    }

    function morphEl(fromEl, toEl, alreadyVisited, childrenOnly) {
        var toElKey = getNodeKey(toEl);
        if (toElKey) {
            // If an element with an ID is being morphed then it is will be in the final
            // DOM so clear it out of the saved elements collection
            delete savedEls[toElKey];
        }

        if (!childrenOnly) {
            if (onBeforeElUpdated(fromEl, toEl) === false) {
                return;
            }

            morphAttrs(fromEl, toEl);
            onElUpdated(fromEl);

            if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
                return;
            }
        }

        if (fromEl.nodeName !== 'TEXTAREA') {
            var curToNodeChild = toEl.firstChild;
            var curFromNodeChild = fromEl.firstChild;
            var curToNodeId;

            var fromNextSibling;
            var toNextSibling;
            var savedEl;
            var unmatchedEl;

            outer: while (curToNodeChild) {
                toNextSibling = curToNodeChild.nextSibling;
                curToNodeId = getNodeKey(curToNodeChild);

                while (curFromNodeChild) {
                    var curFromNodeId = getNodeKey(curFromNodeChild);
                    fromNextSibling = curFromNodeChild.nextSibling;

                    if (!alreadyVisited) {
                        if (curFromNodeId && (unmatchedEl = unmatchedEls[curFromNodeId])) {
                            unmatchedEl.parentNode.replaceChild(curFromNodeChild, unmatchedEl);
                            morphEl(curFromNodeChild, unmatchedEl, alreadyVisited);
                            curFromNodeChild = fromNextSibling;
                            continue;
                        }
                    }

                    var curFromNodeType = curFromNodeChild.nodeType;

                    if (curFromNodeType === curToNodeChild.nodeType) {
                        var isCompatible = false;

                        // Both nodes being compared are Element nodes
                        if (curFromNodeType === ELEMENT_NODE) {
                            if (compareNodeNames(curFromNodeChild, curToNodeChild)) {
                                // We have compatible DOM elements
                                if (curFromNodeId || curToNodeId) {
                                    // If either DOM element has an ID then we
                                    // handle those differently since we want to
                                    // match up by ID
                                    if (curToNodeId === curFromNodeId) {
                                        isCompatible = true;
                                    }
                                } else {
                                    isCompatible = true;
                                }
                            }

                            if (isCompatible) {
                                // We found compatible DOM elements so transform
                                // the current "from" node to match the current
                                // target DOM node.
                                morphEl(curFromNodeChild, curToNodeChild, alreadyVisited);
                            }
                        // Both nodes being compared are Text or Comment nodes
                    } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
                            isCompatible = true;
                            // Simply update nodeValue on the original node to
                            // change the text value
                            curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
                        }

                        if (isCompatible) {
                            curToNodeChild = toNextSibling;
                            curFromNodeChild = fromNextSibling;
                            continue outer;
                        }
                    }

                    // No compatible match so remove the old node from the DOM
                    // and continue trying to find a match in the original DOM
                    removeNode(curFromNodeChild, fromEl, alreadyVisited);
                    curFromNodeChild = fromNextSibling;
                }

                if (curToNodeId) {
                    if ((savedEl = savedEls[curToNodeId])) {
                        morphEl(savedEl, curToNodeChild, true);
                        // We want to append the saved element instead
                        curToNodeChild = savedEl;
                    } else {
                        // The current DOM element in the target tree has an ID
                        // but we did not find a match in any of the
                        // corresponding siblings. We just put the target
                        // element in the old DOM tree but if we later find an
                        // element in the old DOM tree that has a matching ID
                        // then we will replace the target element with the
                        // corresponding old element and morph the old element
                        unmatchedEls[curToNodeId] = curToNodeChild;
                    }
                }

                // If we got this far then we did not find a candidate match for
                // our "to node" and we exhausted all of the children "from"
                // nodes. Therefore, we will just append the current "to node"
                // to the end
                if (onBeforeNodeAdded(curToNodeChild) !== false) {
                    fromEl.appendChild(curToNodeChild);
                    onNodeAdded(curToNodeChild);
                }

                if (curToNodeChild.nodeType === ELEMENT_NODE &&
                    (curToNodeId || curToNodeChild.firstChild)) {
                    // The element that was just added to the original DOM may
                    // have some nested elements with a key/ID that needs to be
                    // matched up with other elements. We'll add the element to
                    // a list so that we can later process the nested elements
                    // if there are any unmatched keyed elements that were
                    // discarded
                    movedEls.push(curToNodeChild);
                }

                curToNodeChild = toNextSibling;
                curFromNodeChild = fromNextSibling;
            }

            // We have processed all of the "to nodes". If curFromNodeChild is
            // non-null then we still have some from nodes left over that need
            // to be removed
            while (curFromNodeChild) {
                fromNextSibling = curFromNodeChild.nextSibling;
                removeNode(curFromNodeChild, fromEl, alreadyVisited);
                curFromNodeChild = fromNextSibling;
            }
        }

        var specialElHandler = specialElHandlers[fromEl.nodeName];
        if (specialElHandler) {
            specialElHandler(fromEl, toEl);
        }
    } // END: morphEl(...)

    var morphedNode = fromNode;
    var morphedNodeType = morphedNode.nodeType;
    var toNodeType = toNode.nodeType;

    if (!childrenOnly) {
        // Handle the case where we are given two DOM nodes that are not
        // compatible (e.g. <div> --> <span> or <div> --> TEXT)
        if (morphedNodeType === ELEMENT_NODE) {
            if (toNodeType === ELEMENT_NODE) {
                if (!compareNodeNames(fromNode, toNode)) {
                    onNodeDiscarded(fromNode);
                    morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
                }
            } else {
                // Going from an element node to a text node
                morphedNode = toNode;
            }
        } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) { // Text or comment node
            if (toNodeType === morphedNodeType) {
                morphedNode.nodeValue = toNode.nodeValue;
                return morphedNode;
            } else {
                // Text node to something else
                morphedNode = toNode;
            }
        }
    }

    if (morphedNode === toNode) {
        // The "to node" was not compatible with the "from node" so we had to
        // toss out the "from node" and use the "to node"
        onNodeDiscarded(fromNode);
    } else {
        morphEl(morphedNode, toNode, false, childrenOnly);

        /**
         * What we will do here is walk the tree for the DOM element that was
         * moved from the target DOM tree to the original DOM tree and we will
         * look for keyed elements that could be matched to keyed elements that
         * were earlier discarded.  If we find a match then we will move the
         * saved element into the final DOM tree.
         */
        var handleMovedEl = function(el) {
            var curChild = el.firstChild;
            while (curChild) {
                var nextSibling = curChild.nextSibling;

                var key = getNodeKey(curChild);
                if (key) {
                    var savedEl = savedEls[key];
                    if (savedEl && compareNodeNames(curChild, savedEl)) {
                        curChild.parentNode.replaceChild(savedEl, curChild);
                        // true: already visited the saved el tree
                        morphEl(savedEl, curChild, true);
                        curChild = nextSibling;
                        if (empty(savedEls)) {
                            return false;
                        }
                        continue;
                    }
                }

                if (curChild.nodeType === ELEMENT_NODE) {
                    handleMovedEl(curChild);
                }

                curChild = nextSibling;
            }
        };

        // The loop below is used to possibly match up any discarded
        // elements in the original DOM tree with elemenets from the
        // target tree that were moved over without visiting their
        // children
        if (!empty(savedEls)) {
            handleMovedElsLoop:
            while (movedEls.length) {
                var movedElsTemp = movedEls;
                movedEls = [];
                for (var i=0; i<movedElsTemp.length; i++) {
                    if (handleMovedEl(movedElsTemp[i]) === false) {
                        // There are no more unmatched elements so completely end
                        // the loop
                        break handleMovedElsLoop;
                    }
                }
            }
        }

        // Fire the "onNodeDiscarded" event for any saved elements
        // that never found a new home in the morphed DOM
        for (var savedElId in savedEls) {
            if (savedEls.hasOwnProperty(savedElId)) {
                var savedEl = savedEls[savedElId];
                onNodeDiscarded(savedEl);
                walkDiscardedChildNodes(savedEl);
            }
        }
    }

    if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
        // If we had to swap out the from node with a new node because the old
        // node was not compatible with the target node then we need to
        // replace the old DOM node in the original DOM tree. This is only
        // possible if the original DOM node was part of a DOM tree which
        // we know is the case if it has a parent node.
        fromNode.parentNode.replaceChild(morphedNode, fromNode);
    }

    return morphedNode;
}

module.exports = morphdom;

},{}],12:[function(require,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],13:[function(require,module,exports){
/**
 * Module Dependencies
 */

var iterator = require('dom-iterator');
var selection = window.getSelection();

/**
 * Expose position fn
 */

module.exports = position;

/**
 * Get or set cursor, selection, relative to
 * an element.
 *
 * @param  {Element} el
 * @param  {Object} pos selection range
 * @return {Object|Undefined}
 */

function position(el, pos){

  /**
   * Get cursor or selection position
   */

  if (1 == arguments.length) {
    if (!selection.rangeCount) return;
    var indexes = {};
    var range = selection.getRangeAt(0);
    var clone = range.cloneRange();
    clone.selectNodeContents(el);
    clone.setEnd(range.endContainer, range.endOffset);
    indexes.end = clone.toString().length;
    clone.setStart(range.startContainer, range.startOffset);
    indexes.start = indexes.end - clone.toString().length;
    indexes.atStart = clone.startOffset === 0;
    return indexes;
  }

  /**
   * Set cursor or selection position
   */

  var setSelection = pos.end && (pos.end !== pos.start);
  var length = 0;
  var range = document.createRange();
  var it = iterator(el).select(Node.TEXT_NODE).revisit(false);
  var next;
  var startindex;
  var start = pos.start > el.textContent.length ? el.textContent.length : pos.start;
  var end = pos.end > el.textContent.length ? el.textContent.length : pos.end;
  var atStart = pos.atStart;

  while (next = it.next()){
    var olen = length;
    length += next.textContent.length;

    // Set start point of selection
    var atLength = atStart ? length > start : length >= start;
    if (!startindex && atLength) {
      startindex = true;
      range.setStart(next, start - olen);
      if (!setSelection) {
        range.collapse(true);
        makeSelection(el, range);
        break;
      }
    }

    // Set end point of selection
    if (setSelection && (length >= end)) {
      range.setEnd(next, end - olen);
      makeSelection(el, range);
      break;
    }
  }
}

/**
 * add selection / insert cursor.
 *
 * @param  {Element} el
 * @param  {Range} range
 */

function makeSelection(el, range){
  el.focus();
  selection.removeAllRanges();
  selection.addRange(range);
}

},{"dom-iterator":6}],14:[function(require,module,exports){
var bel = require('bel') // turns template tag into DOM elements
var morphdom = require('morphdom') // efficiently diffs + morphs two DOM elements
var defaultEvents = require('./update-events.js') // default events to be copied when dom elements update

module.exports = bel

// TODO move this + defaultEvents to a new module once we receive more feedback
module.exports.update = function (fromNode, toNode, opts) {
  if (!opts) opts = {}
  if (opts.events !== false) {
    if (!opts.onBeforeMorphEl) opts.onBeforeMorphEl = copier
  }

  return morphdom(fromNode, toNode, opts)

  // morphdom only copies attributes. we decided we also wanted to copy events
  // that can be set via attributes
  function copier (f, t) {
    // copy events:
    var events = opts.events || defaultEvents
    for (var i = 0; i < events.length; i++) {
      var ev = events[i]
      if (t[ev]) { // if new element has a whitelisted attribute
        f[ev] = t[ev] // update existing element
      } else if (f[ev]) { // if existing element has it and new one doesnt
        f[ev] = undefined // remove it from existing element
      }
    }
    // copy values for form elements
    if ((f.nodeName === 'INPUT' && f.type !== 'file') || f.nodeName === 'TEXTAREA' || f.nodeName === 'SELECT') {
      if (t.getAttribute('value') === null) t.value = f.value
    }
  }
}

},{"./update-events.js":15,"bel":1,"morphdom":11}],15:[function(require,module,exports){
module.exports = [
  // attribute events (can be set with attributes)
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'ondragstart',
  'ondrag',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondrop',
  'ondragend',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onunload',
  'onabort',
  'onerror',
  'onresize',
  'onscroll',
  'onselect',
  'onchange',
  'onsubmit',
  'onreset',
  'onfocus',
  'onblur',
  'oninput',
  // other common events
  'oncontextmenu',
  'onfocusin',
  'onfocusout'
]

},{}],16:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _templateObject = _taggedTemplateLiteral(['<div class="main">\n      <div class="center-col">\n        ', '\n        ', '\n        <h2 class="comments-header">Comments</h2>\n        ', '\n      </div>\n    </div>'], ['<div class="main">\n      <div class="center-col">\n        ', '\n        ', '\n        <h2 class="comments-header">Comments</h2>\n        ', '\n      </div>\n    </div>']),
    _templateObject2 = _taggedTemplateLiteral(['<ul class="user-list ', '">\n    ', '\n  </ul>'], ['<ul class="user-list ', '">\n    ', '\n  </ul>']),
    _templateObject3 = _taggedTemplateLiteral(['<div class="user-list-item"\n          data-username="', '"\n          onclick=', '>\n        ', '\n      </div>'], ['<div class="user-list-item"\n          data-username="', '"\n          onclick=', '>\n        ', '\n      </div>']),
    _templateObject4 = _taggedTemplateLiteral(['<ul class="comment-list">\n    ', '\n  </ul>'], ['<ul class="comment-list">\n    ', '\n  </ul>']),
    _templateObject5 = _taggedTemplateLiteral(['<div class="comment-list-item--text"\n          onload=', '\n          onunload=', '>\n      </div>'], ['<div class="comment-list-item--text"\n          onload=', '\n          onunload=', '>\n      </div>']),
    _templateObject6 = _taggedTemplateLiteral(['<div class="comment-list-item">\n        ', '\n        ', '\n      </div>'], ['<div class="comment-list-item">\n        ', '\n        ', '\n      </div>']),
    _templateObject7 = _taggedTemplateLiteral(['<div class="user-heading">\n    <img class="user-heading__avatar" src="', '">\n    <div class="user-heading__info">\n      <h1 class="user-heading__name">', '</h1>\n      <a href="#" class="user-heading__username">@', '</a>\n    </div>\n  </div>'], ['<div class="user-heading">\n    <img class="user-heading__avatar" src="', '">\n    <div class="user-heading__info">\n      <h1 class="user-heading__name">', '</h1>\n      <a href="#" class="user-heading__username">@', '</a>\n    </div>\n  </div>']),
    _templateObject8 = _taggedTemplateLiteral(['<div class="rich-editor"\n          contenteditable=true\n          style="white-space: pre-wrap"\n          placeholder="Write comment and press enter to submit"\n          onkeydown=', '></div>'], ['<div class="rich-editor"\n          contenteditable=true\n          style="white-space: pre-wrap"\n          placeholder="Write comment and press enter to submit"\n          onkeydown=', '></div>']);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

var yo = require('yo-yo');
var select = require('selection-range');
var assign = require('object-assign');

var _require = require('./trie');

var trie = _require.trie;
var findWithPrefix = _require.findWithPrefix;

var data = require('./data.json');

function app(data, update) {
  var friendTrie = trie(asKeyValPairs(data, 'username'));
  var renderRichEditor = richEditor({ prefix: '@' });
  var autocompleteHandler = void 0;

  return function render(state) {
    var friends = state.friends;
    var autocomplete = state.autocomplete;
    var comments = state.comments;

    return yo(_templateObject, userList({ users: friends, onSelect: onSelectFriend }), renderRichEditor({ subscribeAutocomplete: subscribeAutocomplete, onKeywordChange: onKeywordChange, onSubmit: onSubmit }), commentList({ comments: comments }));

    function onKeywordChange(prefix, keyword) {
      var friends = void 0;
      if (keyword.length > 0) {
        friends = findWithPrefix(friendTrie, keyword);
      } else {
        friends = [];
      }
      update(assign(state, { friends: friends }));
    }

    /**
     * Just using plain functions instead of a whole
     * event system to communicate between components
     */
    function subscribeAutocomplete(fn) {
      autocompleteHandler = fn;
    }

    function onSubmit(text) {
      state.comments.push({
        user: {
          username: 'sfrdmn',
          name: 'Sean Fridman',
          avatar_url: 'https://c2.staticflickr.com/2/1216/1408154388_b34a66bdcf.jpg'
        },
        text: text
      });
      update(state);
    }

    function onSelectFriend(friend) {
      // Clear friend list
      update(assign(state, { friends: [] }));
      autocompleteHandler && autocompleteHandler(friend);
    }
  };
}

function userList(_ref) {
  var users = _ref.users;
  var onSelect = _ref.onSelect;

  var active = users.length ? 'active' : '';
  return yo(_templateObject2, active, users.map(function (user) {
    return yo(_templateObject3, user.username, onClick, userHeading(user));
  }));

  function onClick(e) {
    e.target.blur();
    onSelect(e.currentTarget.getAttribute('data-username'));
  }
}

function commentList(_ref2) {
  var comments = _ref2.comments;

  return yo(_templateObject4, comments.map(function (comment) {
    var el = yo(_templateObject5, onLoad, function () {});

    return yo(_templateObject6, userHeading(comment.user), el);

    // Need to use innerHTML since comment may contain
    // HTML that we want parsed
    function onLoad() {
      el.innerHTML = comment.text;
    }
  }));
}

function userHeading(user) {
  return yo(_templateObject7, user.avatar_url, user.name, user.username);
}

/**
 * Component handling keyboard input, username input detection, and
 * inserting autocomplete results.
 * Essentially implements a mini rich text editor which intercepts all keyboard
 * input and keeps track of the user caret position.
 * This extra complexity was needed due to the problem of completing user input
 * at arbitrary offsets in the input field.
 * It's stateful, so watch out
 */
function richEditor(_ref3) {
  var prefix = _ref3.prefix;

  var state = { buffer: [] };
  var el = void 0;

  return function render(_ref4) {
    var subscribeAutocomplete = _ref4.subscribeAutocomplete;
    var onSubmit = _ref4.onSubmit;
    var onKeywordChange = _ref4.onKeywordChange;

    if (!el) {
      subscribeAutocomplete(function (username) {
        dispatchAction({ type: 'autocomplete', data: username });
      });

      // Only ever render this once. Similar to shouldComponentUpdate => false
      // We don't want stuff overriding the HTML and reseting
      // our caret position when we don't expect it
      el = yo(_templateObject8, onKeyDown);
    }

    return el;

    function onKeyDown(e) {
      dispatchAction({ type: 'keyEvent', data: e });
    }

    /**
     * Contains all event driven logic of component
     * Meant to be a Redux-like pattern
     */
    function dispatchAction(_ref5) {
      var type = _ref5.type;
      var d = _ref5.data;

      // If autocomplete event, replace keyword at caret with autocomplete text
      if (type === 'autocomplete') {
        var range = state.range;
        var buffer = state.buffer;
        var zone = keywordZone(buffer, prefix, range.start);
        // If no zone, we weren't even expecting an autocomplete result
        if (!zone) return;

        var _zone = _slicedToArray(zone, 2);

        var start = _zone[0];
        var end = _zone[1];
        // Add a space after completion

        d += ' ';
        buffer.splice.apply(buffer, [start, end - start].concat(d.split('')));
        range.start = range.end = range.start + d.length;
        update(assign(state, { range: range }));

        // Otherwise, handle user keyboard input
      } else if (type === 'keyEvent') {
        // Enter means 'submit comment'
        if (d.key === 'Enter' && !d.shiftKey) {
          d.preventDefault();
          el.blur();
          onSubmit(el.innerHTML);
          state.buffer = [];
          el.innerHTML = '';
          return;

          // Pass commands like Ctrl-A, Cmd-A, etc through to browser
        } else if (keyCommand(d)) {
          return;

          // Everything else will require editing of our text buffer
        } else if (textual(d.key) || d.key === 'Backspace' || d.key === 'Enter') {
          // Determine selection position
          var _range = select(el);
          // Not sure why, but caret was invisible when this was set to true
          _range.atStart = false;
          var selection = _range.end - _range.start;
          var _buffer = state.buffer;
          // Don't pass key event through to browser
          d.preventDefault();

          if (d.key === 'Backspace') {
            if (selection) _buffer.splice(_range.start, selection);else _buffer.pop();
            var keyword = keywordAt(_buffer, prefix, _range.start);
            if (keyword) onKeywordChange(prefix, keyword);
            // Update cursor
            _range.end = _range.start = _range.end - selection;
          } else {
            // Handle keyword delimiters
            if (isSpace(d.key) || d.key === 'Enter' && d.shiftKey) {
              var _keyword = keywordAt(_buffer, prefix, _range.start);
              _buffer.splice(_range.start, selection, d.key === 'Enter' ? '\n' : d.key);
              if (_keyword) onKeywordChange(prefix, '');

              // Other stuff is good ol fashioned text
            } else {
              _buffer.splice(_range.start, selection, d.key);
              var _keyword2 = keywordAt(_buffer, prefix, _range.start);
              if (_keyword2) onKeywordChange(prefix, _keyword2);
            }
            // Update cursor
            _range.end = _range.start = _range.start + 1;
          }
          update(assign(state, { range: _range }));
        }
      }
    }

    function update(_ref6) {
      var buffer = _ref6.buffer;
      var range = _ref6.range;

      el.innerHTML = renderBuffer(buffer);
      el.focus();
      select(el, range);
    }

    /**
     * Render our text buffer into HTML, parsing keywords into links
     */
    function renderBuffer(buffer) {
      var text = buffer.join('');
      return text.replace(/@([^ \t\n\r]+)/g, '<a href="#">$&</a>');
    }
  };
}

/**
 * Represent an array of objects as an array of key val pairs
 * by extracting a property of each object as its key
 */
function asKeyValPairs(arr, key) {
  return arr.map(function (obj) {
    return [obj[key], obj];
  });
}

/**
 * Whether key represents text to be displayed
 */
function textual(key) {
  return !(key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Enter' || key === 'Backspace' || key === 'Meta' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowUp');
}

/**
 * We in da keyword zone!?!?
 * aka is this word prefixed by '@' or whatever the prefix is
 * returns the index range of the keyword if it exists
 */
function keywordZone(buffer, prefix, cursor) {
  if (!prefix) return false;
  var start = void 0,
      end = void 0,
      found = void 0;
  for (start = cursor; start >= 0; start--) {
    if (isSpace(buffer[start])) return false;
    if (buffer[start] === prefix && (found = true)) break;
  }
  if (!found) return false;
  for (end = cursor; end < buffer.length; end++) {
    if (isSpace(buffer[end])) break;
  }
  return [start + 1, end];
}

function keywordAt(buffer, prefix, cursor) {
  var zone = keywordZone(buffer, prefix, cursor);
  if (zone) return buffer.slice.apply(buffer, zone).join('');else return '';
}

function isSpace(ch) {
  return ch === ' ' || ch === 'Tab' || ch === 'Enter';
}

function keyCommand(e) {
  return e.ctrlKey || e.altKey || e.metaKey;
}

// Bootstrap it!

var renderApp = app(data, function update(state, options) {
  yo.update(el, render(state), options);
});

function render(state) {
  console.log('Updating app state', state);
  return renderApp(state);
}

var el = render({ comments: [], friends: [] });
document.body.appendChild(el);

},{"./data.json":17,"./trie":18,"object-assign":12,"selection-range":13,"yo-yo":14}],17:[function(require,module,exports){
module.exports=[
  {
    "username": "pturner0",
    "avatar_url": "https://secure.gravatar.com/avatar/cd4318b7fb1cf64648f59198aca8757f?d=mm",
    "name": "Paula Turner"
  },
  {
    "username": "pdixon1",
    "avatar_url": "https://secure.gravatar.com/avatar/be09ed96613495dccda4eeffc4dd2daf?d=mm",
    "name": "Patrick Dixon"
  },
  {
    "username": "mhansen2",
    "avatar_url": "https://secure.gravatar.com/avatar/15442f219c2c472e0f1572aacc1cdfd7?d=mm",
    "name": "Michael Hansen"
  },
  {
    "username": "nbennett3",
    "avatar_url": "https://secure.gravatar.com/avatar/e21a9ebe5d4937a2d968a97e21bb9480?d=mm",
    "name": "Nicholas Bennett"
  },
  {
    "username": "pdiaz4",
    "avatar_url": "https://secure.gravatar.com/avatar/bf11f17c04317b097e635d1f4a66f01f?d=mm",
    "name": "Phillip Diaz"
  },
  {
    "username": "bknight5",
    "avatar_url": "https://secure.gravatar.com/avatar/f04241571d95d005e4a54f4278670718?d=mm",
    "name": "Bobby Knight"
  },
  {
    "username": "ebishop6",
    "avatar_url": "https://secure.gravatar.com/avatar/5c72cdd9729a363eff338b611f582ce1?d=mm",
    "name": "Elizabeth Bishop"
  },
  {
    "username": "bwillis7",
    "avatar_url": "https://secure.gravatar.com/avatar/2a8ceb6a856e3577b6b5a7b0afc666ab?d=mm",
    "name": "Brandon Willis"
  },
  {
    "username": "gwest8",
    "avatar_url": "https://secure.gravatar.com/avatar/87bbfb3052d3f969da04c1b56cee786c?d=mm",
    "name": "Gregory West"
  },
  {
    "username": "jmurray9",
    "avatar_url": "https://secure.gravatar.com/avatar/0a8511401fb6505d8516bc936db0acc9?d=mm",
    "name": "Justin Murray"
  },
  {
    "username": "drileya",
    "avatar_url": "https://secure.gravatar.com/avatar/788fe1ab28b0c0679fa802edd698b01c?d=mm",
    "name": "Dennis Riley"
  },
  {
    "username": "jwillisb",
    "avatar_url": "https://secure.gravatar.com/avatar/6d18b464f665c600965e869e0d312ad9?d=mm",
    "name": "Joseph Willis"
  },
  {
    "username": "rmurrayc",
    "avatar_url": "https://secure.gravatar.com/avatar/1f1356a7bf48b072ec34dadbe9323be2?d=mm",
    "name": "Raymond Murray"
  },
  {
    "username": "lmontgomeryd",
    "avatar_url": "https://secure.gravatar.com/avatar/174de803acffda6363801437b8170e0d?d=mm",
    "name": "Laura Montgomery"
  },
  {
    "username": "tevanse",
    "avatar_url": "https://secure.gravatar.com/avatar/2dc8da689fe4afa81d8e987d6388647c?d=mm",
    "name": "Tina Evans"
  },
  {
    "username": "wadamsf",
    "avatar_url": "https://secure.gravatar.com/avatar/3e16bdf52c31dc3277550ec75b607ed1?d=mm",
    "name": "Willie Adams"
  },
  {
    "username": "abowmang",
    "avatar_url": "https://secure.gravatar.com/avatar/6c3dcb266783491ccb2528146339df10?d=mm",
    "name": "Anthony Bowman"
  },
  {
    "username": "rlewish",
    "avatar_url": "https://secure.gravatar.com/avatar/124c03ce93a589b05672bcb248c0d67a?d=mm",
    "name": "Ronald Lewis"
  },
  {
    "username": "rwheeleri",
    "avatar_url": "https://secure.gravatar.com/avatar/1fca6d6f73af40bda57d7496cbd9ee39?d=mm",
    "name": "Richard Wheeler"
  },
  {
    "username": "jpowellj",
    "avatar_url": "https://secure.gravatar.com/avatar/552307213188e6a04d5055e0988787b6?d=mm",
    "name": "James Powell"
  },
  {
    "username": "krosek",
    "avatar_url": "https://secure.gravatar.com/avatar/7bcdbe60824f4913159bee79a57dd4e3?d=mm",
    "name": "Kathryn Rose"
  },
  {
    "username": "dwrightl",
    "avatar_url": "https://secure.gravatar.com/avatar/f74a396d9da21ede62010eb24041c913?d=mm",
    "name": "Diane Wright"
  },
  {
    "username": "lmurraym",
    "avatar_url": "https://secure.gravatar.com/avatar/ecd8ae129c027b7d2b726a5b0b8807be?d=mm",
    "name": "Lori Murray"
  },
  {
    "username": "sjordann",
    "avatar_url": "https://secure.gravatar.com/avatar/a001ad347d3dce3b92d77a6f09e3e87d?d=mm",
    "name": "Shawn Jordan"
  },
  {
    "username": "lsimso",
    "avatar_url": "https://secure.gravatar.com/avatar/06e0e3602f251986ff5b49ae4254648e?d=mm",
    "name": "Larry Sims"
  },
  {
    "username": "dhillp",
    "avatar_url": "https://secure.gravatar.com/avatar/b8c1dee44c1c61af66c129f135ed490c?d=mm",
    "name": "Donna Hill"
  },
  {
    "username": "kcoleq",
    "avatar_url": "https://secure.gravatar.com/avatar/4c5f81f8f2ecd3eb101d1f2f6af48974?d=mm",
    "name": "Karen Cole"
  },
  {
    "username": "hmillerr",
    "avatar_url": "https://secure.gravatar.com/avatar/7748d17696d936fac13dd4062b4462a8?d=mm",
    "name": "Harold Miller"
  },
  {
    "username": "gwarrens",
    "avatar_url": "https://secure.gravatar.com/avatar/5094770b7ce4faf0fb4fdbbd351554b5?d=mm",
    "name": "Gregory Warren"
  },
  {
    "username": "hharpert",
    "avatar_url": "https://secure.gravatar.com/avatar/add918cb0ef6497bfdf41116a1ce2f3f?d=mm",
    "name": "Harold Harper"
  },
  {
    "username": "jgrahamu",
    "avatar_url": "https://secure.gravatar.com/avatar/9fd0011fc4cc25efb387bbb7ca9d3951?d=mm",
    "name": "Jeremy Graham"
  },
  {
    "username": "rgrantv",
    "avatar_url": "https://secure.gravatar.com/avatar/778bdb3b7f8665c60c5ce2bebdec36fb?d=mm",
    "name": "Ronald Grant"
  },
  {
    "username": "jkimw",
    "avatar_url": "https://secure.gravatar.com/avatar/64666932cef4a3e7a8e5d6d9573f9569?d=mm",
    "name": "Jose Kim"
  },
  {
    "username": "lgibsonx",
    "avatar_url": "https://secure.gravatar.com/avatar/ac46377c629bc979f37deb0bbab8c187?d=mm",
    "name": "Lawrence Gibson"
  },
  {
    "username": "fcoopery",
    "avatar_url": "https://secure.gravatar.com/avatar/56dbb3799dd6358c3bee3468d0328046?d=mm",
    "name": "Frank Cooper"
  },
  {
    "username": "grichardsonz",
    "avatar_url": "https://secure.gravatar.com/avatar/620bbd49c95f74a25fef6a816eb0f2f9?d=mm",
    "name": "Gary Richardson"
  },
  {
    "username": "hfernandez10",
    "avatar_url": "https://secure.gravatar.com/avatar/da9f019c6efd49985ddfffb673ed2ca6?d=mm",
    "name": "Howard Fernandez"
  },
  {
    "username": "larnold11",
    "avatar_url": "https://secure.gravatar.com/avatar/34d80c268b469c471d72c0fe67646bb2?d=mm",
    "name": "Lillian Arnold"
  },
  {
    "username": "psanchez12",
    "avatar_url": "https://secure.gravatar.com/avatar/59bf3afff99f6ad038052af216f7fdaa?d=mm",
    "name": "Pamela Sanchez"
  },
  {
    "username": "sbrown13",
    "avatar_url": "https://secure.gravatar.com/avatar/e7ab71af8d307e110fec83a2f0fe7d7f?d=mm",
    "name": "Sean Brown"
  },
  {
    "username": "bcruz14",
    "avatar_url": "https://secure.gravatar.com/avatar/d450cea9e3448d39919effd7c3c5aeac?d=mm",
    "name": "Barbara Cruz"
  },
  {
    "username": "lray15",
    "avatar_url": "https://secure.gravatar.com/avatar/32459beee4cf922618c2ea4fcf6136b0?d=mm",
    "name": "Lillian Ray"
  },
  {
    "username": "dbrooks16",
    "avatar_url": "https://secure.gravatar.com/avatar/3bbd286eab4e49e35756b4bdd52e2b0a?d=mm",
    "name": "Daniel Brooks"
  },
  {
    "username": "ksnyder17",
    "avatar_url": "https://secure.gravatar.com/avatar/521a44257fb442cdce83cc3f53bdacdd?d=mm",
    "name": "Kevin Snyder"
  },
  {
    "username": "wlarson18",
    "avatar_url": "https://secure.gravatar.com/avatar/5b1f01ed6ed3a1a57e5fca7c31841be5?d=mm",
    "name": "William Larson"
  },
  {
    "username": "jprice19",
    "avatar_url": "https://secure.gravatar.com/avatar/5793f3ff872d7972f6525bdff1c700eb?d=mm",
    "name": "Janice Price"
  },
  {
    "username": "cpalmer1a",
    "avatar_url": "https://secure.gravatar.com/avatar/ac836d39c7be1503f636843bdcd7b199?d=mm",
    "name": "Catherine Palmer"
  },
  {
    "username": "hclark1b",
    "avatar_url": "https://secure.gravatar.com/avatar/fdf4364544389fd9e44e95b2bca58614?d=mm",
    "name": "Howard Clark"
  },
  {
    "username": "rking1c",
    "avatar_url": "https://secure.gravatar.com/avatar/c5153d28af7a83b9754d4b65cc7c4b4f?d=mm",
    "name": "Rebecca King"
  },
  {
    "username": "bnelson1d",
    "avatar_url": "https://secure.gravatar.com/avatar/97d355152778582acfd4056a38212814?d=mm",
    "name": "Benjamin Nelson"
  },
  {
    "username": "tkim1e",
    "avatar_url": "https://secure.gravatar.com/avatar/b66d3c98a68dfe90fc7c59c0e39c7153?d=mm",
    "name": "Thomas Kim"
  },
  {
    "username": "jrivera1f",
    "avatar_url": "https://secure.gravatar.com/avatar/299e9d9708afe9177030ac17501a37ef?d=mm",
    "name": "Julie Rivera"
  },
  {
    "username": "glane1g",
    "avatar_url": "https://secure.gravatar.com/avatar/0dd57f059bde695600c3ca93613a0f03?d=mm",
    "name": "Gloria Lane"
  },
  {
    "username": "akelly1h",
    "avatar_url": "https://secure.gravatar.com/avatar/225a15b55312cdea87f87a17ee92cd2a?d=mm",
    "name": "Amanda Kelly"
  },
  {
    "username": "tross1i",
    "avatar_url": "https://secure.gravatar.com/avatar/4dfa6a8e3d5a28a84fd34f5403c7f1ee?d=mm",
    "name": "Timothy Ross"
  },
  {
    "username": "mduncan1j",
    "avatar_url": "https://secure.gravatar.com/avatar/347acc8ae4f645234b7afa1d90e757db?d=mm",
    "name": "Mark Duncan"
  },
  {
    "username": "aandrews1k",
    "avatar_url": "https://secure.gravatar.com/avatar/8e635d9c1d6292db7079820ec194abe9?d=mm",
    "name": "Arthur Andrews"
  },
  {
    "username": "dstone1l",
    "avatar_url": "https://secure.gravatar.com/avatar/7581f5e2ccf17b9fe17de38cb4fd4246?d=mm",
    "name": "Daniel Stone"
  },
  {
    "username": "tday1m",
    "avatar_url": "https://secure.gravatar.com/avatar/2d2a8b9a4b6c78f3163f546b40eb09a1?d=mm",
    "name": "Todd Day"
  },
  {
    "username": "hcollins1n",
    "avatar_url": "https://secure.gravatar.com/avatar/596b325106f0d23bfcffcec08ac45198?d=mm",
    "name": "Harry Collins"
  },
  {
    "username": "bgilbert1o",
    "avatar_url": "https://secure.gravatar.com/avatar/523b19e3f52b25d1b580084480f570ab?d=mm",
    "name": "Bruce Gilbert"
  },
  {
    "username": "sramirez1p",
    "avatar_url": "https://secure.gravatar.com/avatar/c3e019e55ab4fe507076597ce458882d?d=mm",
    "name": "Sara Ramirez"
  },
  {
    "username": "ralvarez1q",
    "avatar_url": "https://secure.gravatar.com/avatar/c0f0e0d6b5258427a57e9ccca10ecac2?d=mm",
    "name": "Robert Alvarez"
  },
  {
    "username": "tstephens1r",
    "avatar_url": "https://secure.gravatar.com/avatar/dffd10ad145d7a3169637ecfbfa8d24e?d=mm",
    "name": "Tammy Stephens"
  },
  {
    "username": "rray1s",
    "avatar_url": "https://secure.gravatar.com/avatar/d750bad9e91ac327c9e740b0ccd899f6?d=mm",
    "name": "Ronald Ray"
  },
  {
    "username": "dhamilton1t",
    "avatar_url": "https://secure.gravatar.com/avatar/995de87496ba6394e9a152b66ef66a0f?d=mm",
    "name": "Douglas Hamilton"
  },
  {
    "username": "jwebb1u",
    "avatar_url": "https://secure.gravatar.com/avatar/98011a99d25f95de5a7ee0affbf93fe9?d=mm",
    "name": "Jose Webb"
  },
  {
    "username": "abaker1v",
    "avatar_url": "https://secure.gravatar.com/avatar/f458752f6163770dc70c5b7753bf24df?d=mm",
    "name": "Andrew Baker"
  },
  {
    "username": "sperry1w",
    "avatar_url": "https://secure.gravatar.com/avatar/be734a89580487cf0ac236d1129b2470?d=mm",
    "name": "Samuel Perry"
  },
  {
    "username": "jmarshall1x",
    "avatar_url": "https://secure.gravatar.com/avatar/ff0f2a6abf6627a2aea9f3046895c325?d=mm",
    "name": "Juan Marshall"
  },
  {
    "username": "dlawson1y",
    "avatar_url": "https://secure.gravatar.com/avatar/1f8c9b30a2dd6a1dcffcb69628692a11?d=mm",
    "name": "Dennis Lawson"
  },
  {
    "username": "krobinson1z",
    "avatar_url": "https://secure.gravatar.com/avatar/a33318792cf24c007b92b50c34f5e51c?d=mm",
    "name": "Kimberly Robinson"
  },
  {
    "username": "fcruz20",
    "avatar_url": "https://secure.gravatar.com/avatar/36b6b0113c3dcdfc659806b9d0c6a80e?d=mm",
    "name": "Fred Cruz"
  },
  {
    "username": "emorales21",
    "avatar_url": "https://secure.gravatar.com/avatar/1e98fa59f1ea0bf5419cafbb14d86f3b?d=mm",
    "name": "Eugene Morales"
  },
  {
    "username": "cgriffin22",
    "avatar_url": "https://secure.gravatar.com/avatar/711543d6739872a1f235697fd6ec92a2?d=mm",
    "name": "Charles Griffin"
  },
  {
    "username": "chenry23",
    "avatar_url": "https://secure.gravatar.com/avatar/b93a5281ec891c9222b47c0a3abe50fe?d=mm",
    "name": "Clarence Henry"
  },
  {
    "username": "dbrooks24",
    "avatar_url": "https://secure.gravatar.com/avatar/f92ea3b947907f08717c77e7bcbb8416?d=mm",
    "name": "Denise Brooks"
  },
  {
    "username": "jduncan25",
    "avatar_url": "https://secure.gravatar.com/avatar/1c03083bd092a15877d6690cb13255ae?d=mm",
    "name": "Jose Duncan"
  },
  {
    "username": "jlittle26",
    "avatar_url": "https://secure.gravatar.com/avatar/7df24c3988bb8281004c22e034d57ee1?d=mm",
    "name": "Jose Little"
  },
  {
    "username": "tgutierrez27",
    "avatar_url": "https://secure.gravatar.com/avatar/521440b7709440a690b09c73359367a3?d=mm",
    "name": "Tammy Gutierrez"
  },
  {
    "username": "bbryant28",
    "avatar_url": "https://secure.gravatar.com/avatar/a3e6242e9f5da68ae845c2e3fc8cca73?d=mm",
    "name": "Bruce Bryant"
  },
  {
    "username": "jrobertson29",
    "avatar_url": "https://secure.gravatar.com/avatar/465cfdd3056936c3306118fa1049f607?d=mm",
    "name": "Jose Robertson"
  },
  {
    "username": "sporter2a",
    "avatar_url": "https://secure.gravatar.com/avatar/3a65bcebc5ef5323b38446d23c8a88ae?d=mm",
    "name": "Steve Porter"
  },
  {
    "username": "ladams2b",
    "avatar_url": "https://secure.gravatar.com/avatar/528d4c94f7e74beff70a3351c7bca33c?d=mm",
    "name": "Lois Adams"
  },
  {
    "username": "tperez2c",
    "avatar_url": "https://secure.gravatar.com/avatar/66f1c64d0e0401c079de149c010fd254?d=mm",
    "name": "Teresa Perez"
  },
  {
    "username": "vwood2d",
    "avatar_url": "https://secure.gravatar.com/avatar/1580024eadcaac84c86041ca93d7498c?d=mm",
    "name": "Virginia Wood"
  },
  {
    "username": "nsanders2e",
    "avatar_url": "https://secure.gravatar.com/avatar/6545a7c3ba26a36c62facacf39cb4b51?d=mm",
    "name": "Norma Sanders"
  },
  {
    "username": "fford2f",
    "avatar_url": "https://secure.gravatar.com/avatar/c35db03c7ecd3c62b6c89be47b60f3fd?d=mm",
    "name": "Frances Ford"
  },
  {
    "username": "rfranklin2g",
    "avatar_url": "https://secure.gravatar.com/avatar/d940a11adfa876b130168b03561884f9?d=mm",
    "name": "Raymond Franklin"
  },
  {
    "username": "adavis2h",
    "avatar_url": "https://secure.gravatar.com/avatar/7631101425189aa0ce8aeb95b7b67f50?d=mm",
    "name": "Arthur Davis"
  },
  {
    "username": "rgonzales2i",
    "avatar_url": "https://secure.gravatar.com/avatar/6dfcb9f86c11622cf6d63709f0737007?d=mm",
    "name": "Russell Gonzales"
  },
  {
    "username": "smartin2j",
    "avatar_url": "https://secure.gravatar.com/avatar/58afe9ed654ca2566295f874d492da54?d=mm",
    "name": "Sean Martin"
  },
  {
    "username": "nsnyder2k",
    "avatar_url": "https://secure.gravatar.com/avatar/840a3abaf67e9fef8c58225d2e20608a?d=mm",
    "name": "Nicholas Snyder"
  },
  {
    "username": "pmyers2l",
    "avatar_url": "https://secure.gravatar.com/avatar/5e97f045278c0e0606a588d77a3ff929?d=mm",
    "name": "Phyllis Myers"
  },
  {
    "username": "jhamilton2m",
    "avatar_url": "https://secure.gravatar.com/avatar/8d4169f1a7fd27bd9a11a25ccfed62c8?d=mm",
    "name": "Jose Hamilton"
  },
  {
    "username": "darnold2n",
    "avatar_url": "https://secure.gravatar.com/avatar/77019d4bbceccfa5131ac5e859654bc5?d=mm",
    "name": "Doris Arnold"
  },
  {
    "username": "pryan2o",
    "avatar_url": "https://secure.gravatar.com/avatar/6035ba3b8ccecda262316076dfd1ff60?d=mm",
    "name": "Patrick Ryan"
  },
  {
    "username": "acunningham2p",
    "avatar_url": "https://secure.gravatar.com/avatar/b285245cb5cf8faeae7777456d2e58c2?d=mm",
    "name": "Andrew Cunningham"
  },
  {
    "username": "rmorris2q",
    "avatar_url": "https://secure.gravatar.com/avatar/7033d0e84d10d256a4b850461f69a10b?d=mm",
    "name": "Roger Morris"
  },
  {
    "username": "pgray2r",
    "avatar_url": "https://secure.gravatar.com/avatar/d3492dc17fd7396f98ab3e1fe9b2d7c6?d=mm",
    "name": "Peter Gray"
  },
  {
    "username": "jlarson2s",
    "avatar_url": "https://secure.gravatar.com/avatar/8774d6c923f1985d3464415a17ac899b?d=mm",
    "name": "Judy Larson"
  },
  {
    "username": "jbryant2t",
    "avatar_url": "https://secure.gravatar.com/avatar/af1d15ad4000f94d9b6da5c8dac52f27?d=mm",
    "name": "Janice Bryant"
  },
  {
    "username": "lmartin2u",
    "avatar_url": "https://secure.gravatar.com/avatar/a7b1ac4e1a78525013dec39e07446839?d=mm",
    "name": "Lillian Martin"
  },
  {
    "username": "jgreen2v",
    "avatar_url": "https://secure.gravatar.com/avatar/05f72f27ebbc83cc9c2c44811e343a4a?d=mm",
    "name": "James Green"
  },
  {
    "username": "lfrazier2w",
    "avatar_url": "https://secure.gravatar.com/avatar/106fb72c20ca641d05b27f97d13edea8?d=mm",
    "name": "Louise Frazier"
  },
  {
    "username": "cknight2x",
    "avatar_url": "https://secure.gravatar.com/avatar/e504cceac6285c65874a48c4cd1c44bd?d=mm",
    "name": "Chris Knight"
  },
  {
    "username": "ctaylor2y",
    "avatar_url": "https://secure.gravatar.com/avatar/80bbf8eec0648fc01448bbe494b0c02b?d=mm",
    "name": "Charles Taylor"
  },
  {
    "username": "cmitchell2z",
    "avatar_url": "https://secure.gravatar.com/avatar/fe32c36e8db442d15f545085034e505d?d=mm",
    "name": "Catherine Mitchell"
  },
  {
    "username": "jferguson30",
    "avatar_url": "https://secure.gravatar.com/avatar/01c1f42cd88047cb6687459c2ccd997a?d=mm",
    "name": "Jeffrey Ferguson"
  },
  {
    "username": "tthompson31",
    "avatar_url": "https://secure.gravatar.com/avatar/f32250645019514e7aadb48eb4ef0a01?d=mm",
    "name": "Thomas Thompson"
  },
  {
    "username": "dstewart32",
    "avatar_url": "https://secure.gravatar.com/avatar/6bd499deee6bca166ac0d77ea2fd86e9?d=mm",
    "name": "Donald Stewart"
  },
  {
    "username": "rroberts33",
    "avatar_url": "https://secure.gravatar.com/avatar/e512f68cf2e38d9b1fdf0e5e19c80942?d=mm",
    "name": "Ronald Roberts"
  },
  {
    "username": "jgarrett34",
    "avatar_url": "https://secure.gravatar.com/avatar/ab4f7379be88e19468e85cee67041335?d=mm",
    "name": "Judith Garrett"
  },
  {
    "username": "rholmes35",
    "avatar_url": "https://secure.gravatar.com/avatar/5008d5295e9bc2636313c7b50ed5981d?d=mm",
    "name": "Roy Holmes"
  },
  {
    "username": "cjacobs36",
    "avatar_url": "https://secure.gravatar.com/avatar/76eb73d5276073fbf832e98199a886bf?d=mm",
    "name": "Clarence Jacobs"
  },
  {
    "username": "jkim37",
    "avatar_url": "https://secure.gravatar.com/avatar/0f8c5cac726873bd92805b056dbcecd8?d=mm",
    "name": "Jose Kim"
  },
  {
    "username": "mrogers38",
    "avatar_url": "https://secure.gravatar.com/avatar/ec83e6995445f6416f74f1bb7e411075?d=mm",
    "name": "Martha Rogers"
  },
  {
    "username": "dpalmer39",
    "avatar_url": "https://secure.gravatar.com/avatar/2764d7d935ebb81cdb5e4fe7cd11f15a?d=mm",
    "name": "Debra Palmer"
  },
  {
    "username": "rcook3a",
    "avatar_url": "https://secure.gravatar.com/avatar/8fbf38dc06c3fef0ad881b66d9bf588b?d=mm",
    "name": "Roger Cook"
  },
  {
    "username": "cmorrison3b",
    "avatar_url": "https://secure.gravatar.com/avatar/2144047c0485cbd122f6fe79a11cc14f?d=mm",
    "name": "Carolyn Morrison"
  },
  {
    "username": "dwright3c",
    "avatar_url": "https://secure.gravatar.com/avatar/d05ec76b03bb3cc3f9189b0f5a9817f4?d=mm",
    "name": "Daniel Wright"
  },
  {
    "username": "aroberts3d",
    "avatar_url": "https://secure.gravatar.com/avatar/5d40bb22aa977db91a892b75e7ed3a66?d=mm",
    "name": "Angela Roberts"
  },
  {
    "username": "jsnyder3e",
    "avatar_url": "https://secure.gravatar.com/avatar/4ecd5dc9b9981daf8c1a30fb3e2e31ea?d=mm",
    "name": "Juan Snyder"
  },
  {
    "username": "khawkins3f",
    "avatar_url": "https://secure.gravatar.com/avatar/54d390c79764a5cc89c985c80fdd2faa?d=mm",
    "name": "Kathleen Hawkins"
  },
  {
    "username": "ehicks3g",
    "avatar_url": "https://secure.gravatar.com/avatar/a3316c3e67a423f3428eb6ee7e4dd9bf?d=mm",
    "name": "Edward Hicks"
  },
  {
    "username": "jperkins3h",
    "avatar_url": "https://secure.gravatar.com/avatar/dfee2c5670ece4b25dc2b2bf58cfc918?d=mm",
    "name": "Julia Perkins"
  },
  {
    "username": "vjohnson3i",
    "avatar_url": "https://secure.gravatar.com/avatar/9d1a1acb4f673cf3c8796acfeaa2bb54?d=mm",
    "name": "Victor Johnson"
  },
  {
    "username": "lfox3j",
    "avatar_url": "https://secure.gravatar.com/avatar/09599f568967ccd408a862e26bf083cf?d=mm",
    "name": "Louis Fox"
  },
  {
    "username": "arichardson3k",
    "avatar_url": "https://secure.gravatar.com/avatar/d487a89e302981f4052b7517917a62a1?d=mm",
    "name": "Arthur Richardson"
  },
  {
    "username": "dsanders3l",
    "avatar_url": "https://secure.gravatar.com/avatar/4ac2d2eade1de7d7148ecc0c29164f5a?d=mm",
    "name": "Daniel Sanders"
  },
  {
    "username": "jmedina3m",
    "avatar_url": "https://secure.gravatar.com/avatar/7d670c3cd3f27f98b5c5f242d23964cb?d=mm",
    "name": "James Medina"
  },
  {
    "username": "jday3n",
    "avatar_url": "https://secure.gravatar.com/avatar/b1720ad8dd59327f01f704eb8870247f?d=mm",
    "name": "Julie Day"
  },
  {
    "username": "mhart3o",
    "avatar_url": "https://secure.gravatar.com/avatar/82bc7926daa9d674c4457452f1e70867?d=mm",
    "name": "Melissa Hart"
  },
  {
    "username": "cparker3p",
    "avatar_url": "https://secure.gravatar.com/avatar/e346088a66cc798bb8c114dbd40649f3?d=mm",
    "name": "Charles Parker"
  },
  {
    "username": "whowell3q",
    "avatar_url": "https://secure.gravatar.com/avatar/a4e3ebd69a25977a25358281aa7ff471?d=mm",
    "name": "Walter Howell"
  },
  {
    "username": "bmartin3r",
    "avatar_url": "https://secure.gravatar.com/avatar/267cdc970648ac38b8179b4717605c8f?d=mm",
    "name": "Benjamin Martin"
  },
  {
    "username": "dstone3s",
    "avatar_url": "https://secure.gravatar.com/avatar/99d295f61d33ef010bb705fdb68ff1c8?d=mm",
    "name": "Deborah Stone"
  },
  {
    "username": "cbell3t",
    "avatar_url": "https://secure.gravatar.com/avatar/15336e825849edd5db442f691ab50c4a?d=mm",
    "name": "Chris Bell"
  },
  {
    "username": "cmorales3u",
    "avatar_url": "https://secure.gravatar.com/avatar/f9a8c6026fafea47a209a4aeb7e9de0f?d=mm",
    "name": "Christopher Morales"
  },
  {
    "username": "lferguson3v",
    "avatar_url": "https://secure.gravatar.com/avatar/0ab7be06d631f8d6a97ed87d0edb7737?d=mm",
    "name": "Lillian Ferguson"
  },
  {
    "username": "arice3w",
    "avatar_url": "https://secure.gravatar.com/avatar/9d262e876ca3b437245cb3cc7eb5ad9b?d=mm",
    "name": "Annie Rice"
  },
  {
    "username": "swagner3x",
    "avatar_url": "https://secure.gravatar.com/avatar/ce58eae1fa6650b7c85a410485df1536?d=mm",
    "name": "Sara Wagner"
  },
  {
    "username": "jbailey3y",
    "avatar_url": "https://secure.gravatar.com/avatar/78cb44e86cb967e382c44eb4887295fb?d=mm",
    "name": "Judy Bailey"
  },
  {
    "username": "smoreno3z",
    "avatar_url": "https://secure.gravatar.com/avatar/56bde8b477483fbe26a641404b87d69f?d=mm",
    "name": "Shawn Moreno"
  },
  {
    "username": "pwood40",
    "avatar_url": "https://secure.gravatar.com/avatar/c0d71d7c4bedf9960e5f724bae9afbf8?d=mm",
    "name": "Philip Wood"
  },
  {
    "username": "tdunn41",
    "avatar_url": "https://secure.gravatar.com/avatar/5a571ddc5f6c3fe0da7d5bef6fe90379?d=mm",
    "name": "Teresa Dunn"
  },
  {
    "username": "jdiaz42",
    "avatar_url": "https://secure.gravatar.com/avatar/7aae1baae1288ee17c4391b0ebf1bca9?d=mm",
    "name": "Janice Diaz"
  },
  {
    "username": "ggibson43",
    "avatar_url": "https://secure.gravatar.com/avatar/c78dbe4eb34d179842e7dfd31431f069?d=mm",
    "name": "George Gibson"
  },
  {
    "username": "rrichards44",
    "avatar_url": "https://secure.gravatar.com/avatar/28ac8a840e825f5b350e98109c7ceeff?d=mm",
    "name": "Raymond Richards"
  },
  {
    "username": "rwatkins45",
    "avatar_url": "https://secure.gravatar.com/avatar/5512ccf279a18f032d9a48bece03437d?d=mm",
    "name": "Ruth Watkins"
  },
  {
    "username": "storres46",
    "avatar_url": "https://secure.gravatar.com/avatar/3d391fcff877d7fbf94d412c2b6be4cb?d=mm",
    "name": "Shirley Torres"
  },
  {
    "username": "jlee47",
    "avatar_url": "https://secure.gravatar.com/avatar/c328bb4533ca77fac029dd9c645b12ec?d=mm",
    "name": "Jean Lee"
  },
  {
    "username": "pmartin48",
    "avatar_url": "https://secure.gravatar.com/avatar/c28195f1f075e96643c789f77ec7cff5?d=mm",
    "name": "Pamela Martin"
  },
  {
    "username": "gnguyen49",
    "avatar_url": "https://secure.gravatar.com/avatar/b88805a281a26d7befffdb73ebec4ba6?d=mm",
    "name": "Gary Nguyen"
  },
  {
    "username": "ataylor4a",
    "avatar_url": "https://secure.gravatar.com/avatar/14f4159e86ad3fed384567e1c2f30c26?d=mm",
    "name": "Antonio Taylor"
  },
  {
    "username": "dmedina4b",
    "avatar_url": "https://secure.gravatar.com/avatar/c873afd2a1a059a2d82ebad7f3002f93?d=mm",
    "name": "Dorothy Medina"
  },
  {
    "username": "dreed4c",
    "avatar_url": "https://secure.gravatar.com/avatar/0d904663a93e6fcb4c26dc5290e4ec57?d=mm",
    "name": "David Reed"
  },
  {
    "username": "gwhite4d",
    "avatar_url": "https://secure.gravatar.com/avatar/d5df78794ec20d0e5345939006866e11?d=mm",
    "name": "Gregory White"
  },
  {
    "username": "wellis4e",
    "avatar_url": "https://secure.gravatar.com/avatar/c90b3e54eb8899b398cfab7d9c4c11ec?d=mm",
    "name": "Walter Ellis"
  },
  {
    "username": "klane4f",
    "avatar_url": "https://secure.gravatar.com/avatar/eb8b29978660649b23f5068decc95d55?d=mm",
    "name": "Kathryn Lane"
  },
  {
    "username": "mgeorge4g",
    "avatar_url": "https://secure.gravatar.com/avatar/d4da14dcd2ce263246d6c3b502a5fe30?d=mm",
    "name": "Martin George"
  },
  {
    "username": "parnold4h",
    "avatar_url": "https://secure.gravatar.com/avatar/5d1f5d503cd3640552eb4cce327e3c2a?d=mm",
    "name": "Paul Arnold"
  },
  {
    "username": "mmcdonald4i",
    "avatar_url": "https://secure.gravatar.com/avatar/6a81e30bb476bc8268815e849a6f19b6?d=mm",
    "name": "Melissa Mcdonald"
  },
  {
    "username": "tmcdonald4j",
    "avatar_url": "https://secure.gravatar.com/avatar/a47c6102b0285d27553299b639cfe9f4?d=mm",
    "name": "Theresa Mcdonald"
  },
  {
    "username": "jlee4k",
    "avatar_url": "https://secure.gravatar.com/avatar/fd129233fd4eae6e1894bbbe9b107582?d=mm",
    "name": "Janice Lee"
  },
  {
    "username": "rlong4l",
    "avatar_url": "https://secure.gravatar.com/avatar/f79982effd3a14096843461bfeccf775?d=mm",
    "name": "Roger Long"
  },
  {
    "username": "jbell4m",
    "avatar_url": "https://secure.gravatar.com/avatar/271ce22b6d779ccf67abd73688234905?d=mm",
    "name": "Johnny Bell"
  },
  {
    "username": "jberry4n",
    "avatar_url": "https://secure.gravatar.com/avatar/ab49a378c77b9202a177d6ce65bde6f9?d=mm",
    "name": "Jeremy Berry"
  },
  {
    "username": "bwalker4o",
    "avatar_url": "https://secure.gravatar.com/avatar/c04c26afcba6f34a6be8ffbb1ee4b3ff?d=mm",
    "name": "Betty Walker"
  },
  {
    "username": "nscott4p",
    "avatar_url": "https://secure.gravatar.com/avatar/353e19e71e6c45dae96af324b476633b?d=mm",
    "name": "Nicole Scott"
  },
  {
    "username": "kbell4q",
    "avatar_url": "https://secure.gravatar.com/avatar/7c3b2176b9e18b158809cf073357ccdd?d=mm",
    "name": "Katherine Bell"
  },
  {
    "username": "kjames4r",
    "avatar_url": "https://secure.gravatar.com/avatar/7f91b8c06cf1d893f05fca82c283edca?d=mm",
    "name": "Kimberly James"
  },
  {
    "username": "gharrison4s",
    "avatar_url": "https://secure.gravatar.com/avatar/b1268e3cabab0d8837e902d4738f69fb?d=mm",
    "name": "Gregory Harrison"
  },
  {
    "username": "lhudson4t",
    "avatar_url": "https://secure.gravatar.com/avatar/f7e909ffe8d1f51621a3a418f95c431e?d=mm",
    "name": "Lori Hudson"
  },
  {
    "username": "cmontgomery4u",
    "avatar_url": "https://secure.gravatar.com/avatar/a93b472ab35c2cff246aaab08c1f29e1?d=mm",
    "name": "Christopher Montgomery"
  },
  {
    "username": "promero4v",
    "avatar_url": "https://secure.gravatar.com/avatar/8141e517c86cdd279832efaafd1a017c?d=mm",
    "name": "Paula Romero"
  },
  {
    "username": "wwashington4w",
    "avatar_url": "https://secure.gravatar.com/avatar/856a25a75a0c0556b43ebf94f24c7915?d=mm",
    "name": "William Washington"
  },
  {
    "username": "troberts4x",
    "avatar_url": "https://secure.gravatar.com/avatar/d6b4cff9754d8de7093b57960746cc6b?d=mm",
    "name": "Tammy Roberts"
  },
  {
    "username": "wstephens4y",
    "avatar_url": "https://secure.gravatar.com/avatar/bc9f1585cb1c175fdc3aa1e7d592f66b?d=mm",
    "name": "Willie Stephens"
  },
  {
    "username": "jgonzalez4z",
    "avatar_url": "https://secure.gravatar.com/avatar/da6434532a14cbef1df643f5e96671a8?d=mm",
    "name": "Jessica Gonzalez"
  },
  {
    "username": "solson50",
    "avatar_url": "https://secure.gravatar.com/avatar/2d7d9fe4faaff50a50f38d0d4d879b29?d=mm",
    "name": "Steve Olson"
  },
  {
    "username": "sknight51",
    "avatar_url": "https://secure.gravatar.com/avatar/6d6953276a29a65fc6fe3c4a7ac80252?d=mm",
    "name": "Sara Knight"
  },
  {
    "username": "nwarren52",
    "avatar_url": "https://secure.gravatar.com/avatar/a9df2f35a26d3222baa456096aa09f1c?d=mm",
    "name": "Nicole Warren"
  },
  {
    "username": "hgriffin53",
    "avatar_url": "https://secure.gravatar.com/avatar/9feaa841587336cf3420c608d0788a3d?d=mm",
    "name": "Henry Griffin"
  },
  {
    "username": "ahunt54",
    "avatar_url": "https://secure.gravatar.com/avatar/175d384bc809a8c3b62e39424314ab0d?d=mm",
    "name": "Anthony Hunt"
  },
  {
    "username": "alewis55",
    "avatar_url": "https://secure.gravatar.com/avatar/83bae373df680fe76c7755e6f6b54abc?d=mm",
    "name": "Amanda Lewis"
  },
  {
    "username": "calvarez56",
    "avatar_url": "https://secure.gravatar.com/avatar/e5ee4cef8cba70dd34619cfdd757e479?d=mm",
    "name": "Carolyn Alvarez"
  },
  {
    "username": "nbaker57",
    "avatar_url": "https://secure.gravatar.com/avatar/0d1156c23b008db3aa56e3d02d595861?d=mm",
    "name": "Nicole Baker"
  },
  {
    "username": "kkennedy58",
    "avatar_url": "https://secure.gravatar.com/avatar/453094ae5c92f0ba6ec9608efe9b337a?d=mm",
    "name": "Kathleen Kennedy"
  },
  {
    "username": "awatkins59",
    "avatar_url": "https://secure.gravatar.com/avatar/89b7080945d2f86846269cc702d1746d?d=mm",
    "name": "Ashley Watkins"
  },
  {
    "username": "kbutler5a",
    "avatar_url": "https://secure.gravatar.com/avatar/af3f0ebd102e641f714a5bedbe9466f2?d=mm",
    "name": "Kenneth Butler"
  },
  {
    "username": "trogers5b",
    "avatar_url": "https://secure.gravatar.com/avatar/f1f1ecb536a07dce0263d59d68a9784e?d=mm",
    "name": "Terry Rogers"
  },
  {
    "username": "bmorrison5c",
    "avatar_url": "https://secure.gravatar.com/avatar/7735d49d1b04ba5e18bbe107ad756b0d?d=mm",
    "name": "Brenda Morrison"
  },
  {
    "username": "ngrant5d",
    "avatar_url": "https://secure.gravatar.com/avatar/24acc97dd570da7c417e65ac0e2b5e55?d=mm",
    "name": "Norma Grant"
  },
  {
    "username": "mwashington5e",
    "avatar_url": "https://secure.gravatar.com/avatar/06c8c2c1698cc433690bf3b561d5f8d7?d=mm",
    "name": "Mildred Washington"
  },
  {
    "username": "nweaver5f",
    "avatar_url": "https://secure.gravatar.com/avatar/979f7d8a5e14df8caaa32987487b296a?d=mm",
    "name": "Nicole Weaver"
  },
  {
    "username": "tjenkins5g",
    "avatar_url": "https://secure.gravatar.com/avatar/a71fb81e7e46474654f8ef7f03d94478?d=mm",
    "name": "Thomas Jenkins"
  },
  {
    "username": "jgomez5h",
    "avatar_url": "https://secure.gravatar.com/avatar/e3b62d0e77b6568d799717fd195c558b?d=mm",
    "name": "Jeremy Gomez"
  },
  {
    "username": "hrichardson5i",
    "avatar_url": "https://secure.gravatar.com/avatar/1c8c8eeba90d924df74f588bc2f1de23?d=mm",
    "name": "Harold Richardson"
  },
  {
    "username": "dstephens5j",
    "avatar_url": "https://secure.gravatar.com/avatar/70b35a0cb42929f545ee4a0a3fc5d354?d=mm",
    "name": "Debra Stephens"
  }
]

},{}],18:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Trie data structure represented with plain arrays and objects
 * The root node is an object with branches or leaves as values
 * Branches are arrays where the first index contains another branch
 *    and the second (optionaly) a value
 * Leaves are arrays where the first index is null and the second
 *    contains a value
 * E.g. { "y": [ { "o": [ null, { "msg": "what's up" } ] } ] }
 */

module.exports = {
  trie: trie,
  findWithPrefix: findWithPrefix
};

/**
 * Create a trie
 * Assumes keys are strings
 */
function trie(keyValPairs) {
  return keyValPairs.map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var k = _ref2[0];
    var v = _ref2[1];
    return [k.toLowerCase(), v];
  }).reduce(function (trie, _ref3) {
    var _ref4 = _slicedToArray(_ref3, 2);

    var k = _ref4[0];
    var v = _ref4[1];
    return add(trie, k, v);
  }, {});
}

function add(root, key, val) {
  // Iteratively encode keys as nested paths to values
  return key.split('').reduce(function (_ref5, ch, i) {
    var _ref6 = _slicedToArray(_ref5, 1);

    var node = _ref6[0];

    if (i === key.length - 1) {
      node[ch] = [node[ch] && node[ch][0] || null, val];
      return root;
    } else {
      if (!node[ch]) node[ch] = [{}];
      // Case where we previously marked the node as a bottom leaf
      // Here we mark it again as a branch so we can go deeper
      else if (!node[ch][0]) node[ch] = [{}, node[ch][1]];
      return node[ch];
    }
  }, [root]);
}

function findWithPrefix(root, prefix) {
  if (!prefix) return [];
  // Find branch node for prefix by traversing down tree
  var branch = prefix.split('').reduce(function (root, ch) {
    return root && root[0][ch];
  }, [root]);
  if (branch) return leaves(branch);else return [];
}

/**
 * Yield list of leaves for trie branch where leaves are
 * defined to be all values in the branch
 */
function leaves(branch) {
  var root = branch[0];
  return Object.keys(root).reduce(function (list, key) {
    // Check if we have to recurse
    if (root[key][0]) {
      return list.concat(leaves(root[key]));
      // Otherwise just return list
    } else {
      // Must be at bottom now
      list.push(root[key][1]);
      return list;
    }
  }, branch[1] ? [branch[1]] : []);
}

},{}]},{},[16]);
