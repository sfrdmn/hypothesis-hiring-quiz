const yo = require('yo-yo')
const select = require('selection-range')
const assign = require('object-assign')
const {trie, findWithPrefix} = require('./trie')
const data = require('./data.json')

function app (data, update) {
  const friendTrie = trie(asKeyValPairs(data, 'username'))
  const renderRichEditor = richEditor({prefix: '@'})
  let autocompleteHandler

  return function render (state) {
    const {friends, autocomplete, comments} = state
    return yo`<div class="main">
      <div class="center-col">
        ${userList({users: friends, onSelect: onSelectFriend})}
        ${renderRichEditor({subscribeAutocomplete, onKeywordChange, onSubmit})}
        <h2 class="comments-header">Comments</h2>
        ${commentList({comments})}
      </div>
    </div>`

    function onKeywordChange (prefix, keyword) {
      let friends
      if (keyword.length > 0) {
        friends = findWithPrefix(friendTrie, keyword)
      } else {
        friends = []
      }
      update(assign(state, {friends}))
    }

    /**
     * Just using plain functions instead of a whole
     * event system to communicate between components
     */
    function subscribeAutocomplete (fn) {
      autocompleteHandler = fn
    }

    function onSubmit (text) {
      state.comments.push({
        user: {
          username: 'sfrdmn',
          name: 'Sean Fridman',
          avatar_url: 'https://c2.staticflickr.com/2/1216/1408154388_b34a66bdcf.jpg'
        },
        text,
      })
      update(state)
    }

    function onSelectFriend (friend) {
      // Clear friend list
      update(assign(state, {friends: []}))
      autocompleteHandler && autocompleteHandler(friend)
    }
  }
}

function userList ({users, onSelect}) {
  const active = users.length ? 'active' : ''
  return yo`<ul class="user-list ${active}">
    ${users.map((user) => {
      return yo`<div class="user-list-item"
          data-username="${user.username}"
          onclick=${onClick}>
        ${userHeading(user)}
      </div>`
    })}
  </ul>`

  function onClick (e) {
    e.target.blur()
    onSelect(e.currentTarget.getAttribute('data-username'))
  }
}

function commentList ({comments}) {
  return yo`<ul class="comment-list">
    ${comments.map((comment) => {
      const el = yo`<div class="comment-list-item--text"
          onload=${onLoad}
          onunload=${() => {}}>
      </div>`

      return yo`<div class="comment-list-item">
        ${userHeading(comment.user)}
        ${el}
      </div>`

      // Need to use innerHTML since comment may contain
      // HTML that we want parsed
      function onLoad () {
        el.innerHTML = comment.text
      }
    })}
  </ul>`
}

function userHeading (user) {
  return yo`<div class="user-heading">
    <img class="user-heading__avatar" src="${user.avatar_url}">
    <div class="user-heading__info">
      <h1 class="user-heading__name">${user.name}</h1>
      <a href="#" class="user-heading__username">@${user.username}</a>
    </div>
  </div>`
}

/**
 * Component handling keyboard input, username input detection, and
 * inserting autocomplete results.
 * Essentially implements a mini rich text editor which intercepts all keyboard
 * input and keeps track of the user caret position.
 * This extra complexity was needed due to the problem of completing user input
 * at arbitrary offsets in the input field.
 * There are some bugs handling user input, but implementing a fully
 * featured text editor is also outside of the scope of this exercise
 * And it's stateful, so watch out
 */
function richEditor ({prefix}) {
  const state = {buffer: []}
  let el

  return function render ({subscribeAutocomplete, onSubmit, onKeywordChange}) {
    if (!el) {
      subscribeAutocomplete((username) => {
        dispatchAction({type: 'autocomplete', data: username})
      })

      // Only ever render this once. Similar to shouldComponentUpdate => false
      // We don't want stuff overriding the HTML and reseting
      // our caret position when we don't expect it
      el = yo`<div class="rich-editor"
          contenteditable=true
          style="white-space: pre-wrap"
          placeholder="Write comment and press enter to submit"
          onkeydown=${onKeyDown}></div>`
    }

    return el

    function onKeyDown (e) {
      dispatchAction({type: 'keyEvent', data: e})
    }

    /**
     * Contains all event driven logic of component
     * Meant to be a Redux-like pattern
     */
    function dispatchAction ({type, data: d}) {
      // If autocomplete event, replace keyword at caret with autocomplete text
      if (type === 'autocomplete') {
        const range = state.range
        const buffer = state.buffer
        const zone = keywordZone(buffer, prefix, range.start)
        // If no zone, we weren't even expecting an autocomplete result
        if (!zone) return
        const [start, end] = zone
        // Add a space after completion
        d += ' '
        buffer.splice.apply(buffer,
            [start, end - start].concat(d.split('')))
        range.start = range.end = range.start + d.length
        update(assign(state, {range}))

      // Otherwise, handle user keyboard input
      } else if (type === 'keyEvent') {
        // Enter means 'submit comment'
        if (d.key === 'Enter' && !d.shiftKey) {
          d.preventDefault()
          el.blur()
          onSubmit(el.innerHTML)
          state.buffer = []
          el.innerHTML = ''
          return

        // Pass commands like Ctrl-A, Cmd-A, etc through to browser
        } else if (keyCommand(d)) {
          return

        // Everything else will require editing of our text buffer
        } else if (textual(d.key) || d.key === 'Backspace' ||
            d.key === 'Enter') {
          // Determine selection position
          const range = select(el)
          // Not sure why, but caret was invisible when this was set to true
          range.atStart = false
          const selection = range.end - range.start
          const buffer = state.buffer
          // Don't pass key event through to browser
          d.preventDefault()

          if (d.key === 'Backspace') {
            if (selection)
              buffer.splice(range.start, selection)
            else
              buffer.pop()
            const keyword = keywordAt(buffer, prefix, range.start)
            // 'buffer[range.start - 2] === prefix' is a hack to check for the
            // case where only a '@' is left after backspacing
            if (keyword || buffer[range.start - 2] === prefix)
              onKeywordChange(prefix, keyword)
            // Update cursor
            range.end = range.start = range.end - selection

          } else {
            // Handle keyword delimiters
            if (isSpace(d.key) || (d.key === 'Enter' && d.shiftKey)) {
              const keyword = keywordAt(buffer, prefix, range.start)
              buffer.splice(range.start, selection,
                  d.key === 'Enter' ? '\n' : d.key)
              if (keyword) onKeywordChange(prefix, '')

            // Other stuff is good ol fashioned text
            } else {
              buffer.splice(range.start, selection, d.key)
              const keyword = keywordAt(buffer, prefix, range.start)
              if (keyword) onKeywordChange(prefix, keyword)
            }
            // Update cursor
            range.end = range.start = range.start + 1
          }
          update(assign(state, {range}))
        }
      }
    }

    function update ({buffer, range}) {
      el.innerHTML = renderBuffer(buffer)
      el.focus()
      select(el, range)
    }

    /**
     * Render our text buffer into HTML, parsing keywords into links
     */
    function renderBuffer (buffer) {
      const text = buffer.join('')
      return text.replace(/@([^ \t\n\r]+)/g, '<a href="#">$&</a>')
    }
  }
}

/**
 * Represent an array of objects as an array of key val pairs
 * by extracting a property of each object as its key
 */
function asKeyValPairs (arr, key) {
  return arr.map((obj) => [obj[key], obj])
}

/**
 * Whether key represents text to be displayed
 */
function textual (key) {
  return !(key === 'Control' || key === 'Shift' || key === 'Alt' ||
      key === 'Enter' || key === 'Backspace' || key === 'Meta' ||
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowDown' ||
      key === 'ArrowUp')
}

/**
 * We in da keyword zone!?!?
 * aka is this word prefixed by '@' or whatever the prefix is
 * returns the index range of the keyword if it exists
 */
function keywordZone (buffer, prefix, cursor) {
  if (!prefix) return false
  let start, end, found
  for (start = cursor; start >= 0; start--) {
    if (isSpace(buffer[start])) return false
    if (buffer[start] === prefix && (found = true))
      break
  }
  if (!found) return false
  for (end = cursor; end < buffer.length; end++) {
    if (isSpace(buffer[end])) break
  }
  return [start + 1, end]
}

function keywordAt (buffer, prefix, cursor) {
  const zone = keywordZone(buffer, prefix, cursor)
  if (zone) return buffer.slice.apply(buffer, zone).join('')
  else return ''
}

function isSpace (ch) {
  return ch === ' ' || ch === 'Tab' || ch === 'Enter'
}

function keyCommand (e) {
  return e.ctrlKey || e.altKey || e.metaKey
}



// Bootstrap it!

const renderApp = app(data, function update (state, options) {
  yo.update(el, render(state), options)
})

function render (state) {
  console.log('Updating app state', state)
  return renderApp(state)
}

const el = render({comments: [], friends: []})
document.body.appendChild(el)
