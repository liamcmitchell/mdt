import React, { Component } from 'react'
import keycode from 'keycode'
import { Combinator } from 'react-combinators/rx'
import NodeItem from 'components/node-item'
import Rx from 'rx'
import _ from 'underscore'
import data from 'client-data'
import wrapFn from 'lib/wrapFn'
import getLoopingArrayItem from 'lib/getLoopingArrayItem'

// Turn object into observable if it isn't already.
function $(v) {
  return Rx.Observable.isObservable(v) ? v : Rx.Observable.just(v)
}

// Turn path into array of paths including root (empty) and original.
function pathToSubPaths(path) {
  return [[]].concat(path.map((v, i) => path.slice(0, i + 1)))
}

function isNode(node) {
  return node && node.key && node.item
}

function isFocusable(node) {
  return node && node.focusable !== false
}

function getProp(prop, fallback, object) {
  return object.hasOwnProperty(prop) ?
    typeof object[prop] === 'function' ?
      object[prop]() :
      object[prop] :
    fallback
}

function getProp$(prop, fallback, object$) {
  return Rx.Observable.isObservable(object$) ?
    object$.flatMapLatest(object =>
      $(getProp(prop, fallback, object))
    ) :
    $(getProp(prop, fallback, object$))
}

const nodeItem$ = getProp$.bind(null, 'item', null)
const nodeChildren$ = getProp$.bind(null, 'nodes', [])
const nodeHandlers$ = getProp$.bind(null, 'handlers', [])

// Helper for common find arg.
function nodeWithKey(key) {
  return function(node) {
    return isNode(node) && node.key === key
  }
}

function nodeAtPath$(node$, path) {
  return path.reduce(nodeChild$, node$)
}

function nodeChild$(node$, key) {
  return node$
    .flatMapLatest(nodeChildren$)
    .map(children => {
      const child = children.find(nodeWithKey(key))
      if (child)
        return child
      else
        throw new Error('Child with key "' + key + '" not found')
    })
}

function setPath(path) {
  data.set('/path', '/' + path.join('/'))
}

function combineLatest(observables, fn) {
  if (Rx.Observable.isObservable(observables)) {
    return observables.map(fn)
  }
  else if (_.isArray(observables)) {
    return Rx.Observable.combineLatest(observables, fn)
  }
  else if (_.isObject(observables)) {
    const keys = _.keys(observables)
    return Rx.Observable.combineLatest(_.values(observables))
      .map(values => fn(_.object(keys, values)))
  }
  else {
    throw new Error('Require observable, array or object of observables')
  }
}

class NodeUI extends Component {
  static propTypes = {
    // Passed on to item, content & child nodes unless overridden.
    styles: React.PropTypes.object,
    // Root node. Only used for children.
    root: React.PropTypes.object.isRequired
  }

  render() {
    // Used to record last child visited for each node.
    this.lastChild = this.lastChild || {}
    const props = this.props
    const path$ = data.observable('/path').map(path => _.filter(path.split('/')))
    const nodeAt$ = nodeAtPath$.bind(null, $(props.root))
    const focusedNode$ = path$.flatMapLatest(nodeAt$)

    const focusedNodeHandlers$ = focusedNode$
      .flatMapLatest(nodeHandlers$)
      // Path may not point to valid node.
      .catch(Rx.Observable.just([]))

    // Siblings of current node. needed for up/down navigation.
    const siblings$ = path$
      .map(path => path.slice(0, -1))
      .flatMapLatest(nodeAt$)
      .flatMapLatest(nodeChildren$)
      // Path may not point to valid node.
      .catch(Rx.Observable.just([]))

    // Children of current node. Needed for right navigation.
    const children$ = focusedNode$
      .flatMapLatest(nodeChildren$)
      // Path may not point to valid node.
      .catch(Rx.Observable.just([]))

    // For every path, save the last selected child so we can use
    // it as the default when descending into children.
    const lastChild$ = path$.scan((lastChild, path) => {
      path.forEach((key, i) => {
        lastChild[path.slice(0, i).join('/')] = key
      })
      return lastChild
    }, this.lastChild)

    const leftHandler$ = path$.map(path => ({
      key: 'left',
      fn: () => {
        if (path.length > 1) {
          setPath(path.slice(0, -1))
        }
      }
    }))

    const upDownHandlers$ = Rx.Observable.combineLatest(
      [path$, siblings$],
      (path, siblings) => {
        // Handler is used by both up & down.
        const fn = (event) => {
          const key = keycode(event)
          const currentKey = path[path.length - 1]
          const keys = siblings.filter(isFocusable).map(n => n.key)
          // Siblings may be empty if there is a bad url (we still show error).
          if (keys.length) {
            setPath(path.slice(0, -1).concat(
              getLoopingArrayItem(keys, _.contains(keys, currentKey) ?
                // If the current key exists, we want a key relative to it.
                keys.indexOf(currentKey) + (key === 'up' ? -1 : +1) :
                // Otherwise pick the first or last key.
                key === 'up' ? -1 : 0
              )
            ))
          }
        }
        return [
          {key: 'up', fn: fn},
          {key: 'down', fn: fn}
        ]
      })
      .startWith([])

    const rightHandler$ = Rx.Observable.combineLatest(
      [path$, children$, lastChild$],
      (path, children, lastChild) => ({
        key: 'right',
        fn: () => {
          // Move to child.
          const focusable = children.filter(isFocusable)
          const lastChildKey = lastChild[path.join('/')]
          // Check there is a child to go to.
          if (focusable.length) {
            setPath(path.concat(
              // Prefer last child if it exists, otherwise use the first.
              lastChildKey && focusable.find(nodeWithKey(lastChildKey)) ?
                lastChildKey :
                focusable[0].key
            ))
          }
        }
      }))
      .startWith([])

    const handleDoubleClick$ = focusedNodeHandlers$.map(handlers => (path, event) => {
      const handler = _.findWhere(handlers, {key: 'enter'})
      if (handler) {
        handler.fn(event)
        event.preventDefault()
      }
    }).scan(wrapFn).distinctUntilChanged()

    const allHandlers$ = Rx.Observable.combineLatest(
      [focusedNodeHandlers$, leftHandler$, upDownHandlers$, rightHandler$]
    ).map(_.flatten)

    const handleKeyDown$ = allHandlers$.map(handlers => {
      return (path, event) => {
        const handler = _.findWhere(handlers, {key: keycode(event)})
        if (handler) {
          handler.fn(event)
          event.preventDefault()
        }
      }
    }).scan(wrapFn).distinctUntilChanged()

    return <Combinator>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          backgroundColor: props.styles.backgroundColor
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1
          }}
        >
          {Rx.Observable.combineLatest(
            [path$, handleDoubleClick$, handleKeyDown$],
            (path, handleDoubleClick, handleKeyDown) =>
              pathToSubPaths(path).map((subPath, i) =>
                <NodeChildren
                  key={subPath.join('/')}
                  path={subPath}
                  selected={path[i]}
                  selectedIsFocused={path.length === i + 1}
                  root={props.root}
                  styles={props.styles}
                  onMouseDown={setPath}
                  onDoubleClick={handleDoubleClick}
                  onKeyDown={handleKeyDown}
                />
              )
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexShrink: 0,
            backgroundColor: props.styles.backgroundHighlightColor
          }}
        >
          {focusedNodeHandlers$.map(handlers => handlers.map(handler =>
            <div
              key={handler.key}
              style={{
                padding: props.styles.padding,
                color: props.styles.primaryColor
              }}
            >
              <span
                style={{
                  backgroundColor: props.styles.backgroundColor,
                  padding: 6,
                  marginRight: 10,
                  borderRadius: 4
                }}
              >
                {handler.key}
              </span>
              {handler.label || 'action'}
            </div>
          ))}
        </div>
      </div>
    </Combinator>
  }
}

class NodeChildren extends Component {

  shouldComponentUpdate(nextProps, nextState) {
    return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state)
  }

  render() {
    const props = this.props

    const isOptions = !props.selected
    const isFocused = props.selectedIsFocused
    const isCompact = props.selected && !isFocused

    const nodes$ = nodeAtPath$($(props.root), props.path)
      // Get children.
      .flatMapLatest(nodeChildren$)
      // Show dummy node if there was an error getting the nodes.
      .catch(err => {
        console.error(err)
        return $([{
          key: '',
          item: Rx.Observable.throw(
            new Error("Can't find children for " + props.path.join('/'))
          )
        }])
      })
      .map(nodes => {
        // If the next node isn't there, add a placeholder for error.
        if (props.selected && !nodes.find(nodeWithKey(props.selected))) {
          const dummy = {
            key: props.selected,
            item: Rx.Observable.throw(new Error(props.selected + ' not found'))
          }
          nodes = [dummy].concat(nodes)
        }
        return nodes
      })

    return <Combinator>
      <div
        style={{
          backgroundColor: props.styles.backgroundColor,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          maxHeight: '100%',
          overflow: isCompact ? 'hidden' : 'auto',
          transition: 'all 0.2s',
          width: isCompact ?
            10 :
            isFocused ? 200 : 'auto',
          flexGrow: isOptions ? 1 : 0,
          flexShrink: isOptions ? 1 : 0,
          boxShadow: '-2px 0 2px 0 rgba(0, 0, 0, 0.2)',
          cursor: isCompact ? 'pointer' : null
        }}
        onClick={isCompact ? setPath.bind(null, props.path) : null}
      >
        {nodes$.map(nodes => nodes.map(node => {
          const nodePath = props.path.concat(node.key)
          const isOnPath = props.selected === node.key
          const isFocused = isOnPath && props.selectedIsFocused
          return <NodeItem
            key={node.key}
            path={nodePath}
            isFocusable={isFocusable(node)}
            isOnPath={isOnPath}
            isFocused={isFocused}
            styles={node.styles || props.styles}
            item={node.item}
            onMouseDown={props.onMouseDown}
            onDoubleClick={props.onDoubleClick}
            onKeyDown={props.onKeyDown}
          />
        }))}
      </div>
    </Combinator>
  }
}

export default NodeUI
