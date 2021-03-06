/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactTestUtils;

describe('ReactUpdates', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should batch state when updating state twice', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
      instance.setState({x: 2});
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.state.x).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch state when updating two different state keys', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0, y: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return (
          <div>
            ({this.state.x}, {this.state.y})
          </div>
        );
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);
    expect(instance.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
      instance.setState({y: 2});
      expect(instance.state.x).toBe(0);
      expect(instance.state.y).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(instance.state.y).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch state and props together', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {y: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return (
          <div>
            ({this.props.x}, {this.state.y})
          </div>
        );
      }
    }

    var container = document.createElement('div');
    var instance = ReactDOM.render(<Component x={0} />, container);
    expect(instance.props.x).toBe(0);
    expect(instance.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      ReactDOM.render(<Component x={1} />, container);
      instance.setState({y: 2});
      expect(instance.props.x).toBe(0);
      expect(instance.state.y).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(instance.props.x).toBe(1);
    expect(instance.state.y).toBe(2);
    expect(updateCount).toBe(1);
  });

  it('should batch parent/child state updates together', () => {
    var parentUpdateCount = 0;

    class Parent extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        parentUpdateCount++;
      }

      render() {
        return (
          <div>
            <Child ref="child" x={this.state.x} />
          </div>
        );
      }
    }

    var childUpdateCount = 0;

    class Child extends React.Component {
      state = {y: 0};

      componentDidUpdate() {
        childUpdateCount++;
      }

      render() {
        return <div>{this.props.x + this.state.y}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = instance.refs.child;
    expect(instance.state.x).toBe(0);
    expect(child.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
      child.setState({y: 2});
      expect(instance.state.x).toBe(0);
      expect(child.state.y).toBe(0);
      expect(parentUpdateCount).toBe(0);
      expect(childUpdateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(child.state.y).toBe(2);
    expect(parentUpdateCount).toBe(1);
    expect(childUpdateCount).toBe(1);
  });

  it('should batch child/parent state updates together', () => {
    var parentUpdateCount = 0;

    class Parent extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        parentUpdateCount++;
      }

      render() {
        return (
          <div>
            <Child ref="child" x={this.state.x} />
          </div>
        );
      }
    }

    var childUpdateCount = 0;

    class Child extends React.Component {
      state = {y: 0};

      componentDidUpdate() {
        childUpdateCount++;
      }

      render() {
        return <div>{this.props.x + this.state.y}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = instance.refs.child;
    expect(instance.state.x).toBe(0);
    expect(child.state.y).toBe(0);

    ReactDOM.unstable_batchedUpdates(function() {
      child.setState({y: 2});
      instance.setState({x: 1});
      expect(instance.state.x).toBe(0);
      expect(child.state.y).toBe(0);
      expect(parentUpdateCount).toBe(0);
      expect(childUpdateCount).toBe(0);
    });

    expect(instance.state.x).toBe(1);
    expect(child.state.y).toBe(2);
    expect(parentUpdateCount).toBe(1);

    // Batching reduces the number of updates here to 1.
    expect(childUpdateCount).toBe(1);
  });

  it('should support chained state updates', () => {
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    var innerCallbackRun = false;
    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1}, function() {
        instance.setState({x: 2}, function() {
          expect(this).toBe(instance);
          innerCallbackRun = true;
          expect(instance.state.x).toBe(2);
          expect(updateCount).toBe(2);
        });
        expect(instance.state.x).toBe(1);
        expect(updateCount).toBe(1);
      });
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(innerCallbackRun).toBeTruthy();
    expect(instance.state.x).toBe(2);
    expect(updateCount).toBe(2);
  });

  it('should batch forceUpdate together', () => {
    var shouldUpdateCount = 0;
    var updateCount = 0;

    class Component extends React.Component {
      state = {x: 0};

      shouldComponentUpdate() {
        shouldUpdateCount++;
      }

      componentDidUpdate() {
        updateCount++;
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(instance.state.x).toBe(0);

    var callbacksRun = 0;
    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1}, function() {
        callbacksRun++;
      });
      instance.forceUpdate(function() {
        callbacksRun++;
      });
      expect(instance.state.x).toBe(0);
      expect(updateCount).toBe(0);
    });

    expect(callbacksRun).toBe(2);
    // shouldComponentUpdate shouldn't be called since we're forcing
    expect(shouldUpdateCount).toBe(0);
    expect(instance.state.x).toBe(1);
    expect(updateCount).toBe(1);
  });

  it('should update children even if parent blocks updates', () => {
    var parentRenderCount = 0;
    var childRenderCount = 0;

    class Parent extends React.Component {
      shouldComponentUpdate() {
        return false;
      }

      render() {
        parentRenderCount++;
        return <Child ref="child" />;
      }
    }

    class Child extends React.Component {
      render() {
        childRenderCount++;
        return <div />;
      }
    }

    expect(parentRenderCount).toBe(0);
    expect(childRenderCount).toBe(0);

    var instance = <Parent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    expect(parentRenderCount).toBe(1);
    expect(childRenderCount).toBe(1);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.setState({x: 1});
    });

    expect(parentRenderCount).toBe(1);
    expect(childRenderCount).toBe(1);

    ReactDOM.unstable_batchedUpdates(function() {
      instance.refs.child.setState({x: 1});
    });

    expect(parentRenderCount).toBe(1);
    expect(childRenderCount).toBe(2);
  });

  it('should not reconcile children passed via props', () => {
    var numMiddleRenders = 0;
    var numBottomRenders = 0;

    class Top extends React.Component {
      render() {
        return (
          <Middle>
            <Bottom />
          </Middle>
        );
      }
    }

    class Middle extends React.Component {
      componentDidMount() {
        this.forceUpdate();
      }

      render() {
        numMiddleRenders++;
        return React.Children.only(this.props.children);
      }
    }

    class Bottom extends React.Component {
      render() {
        numBottomRenders++;
        return null;
      }
    }

    ReactTestUtils.renderIntoDocument(<Top />);
    expect(numMiddleRenders).toBe(2);
    expect(numBottomRenders).toBe(1);
  });

  it('should flow updates correctly', () => {
    var willUpdates = [];
    var didUpdates = [];

    var UpdateLoggingMixin = {
      componentWillUpdate: function() {
        willUpdates.push(this.constructor.displayName);
      },
      componentDidUpdate: function() {
        didUpdates.push(this.constructor.displayName);
      },
    };

    class Box extends React.Component {
      render() {
        return <div ref="boxDiv">{this.props.children}</div>;
      }
    }
    Object.assign(Box.prototype, UpdateLoggingMixin);

    class Child extends React.Component {
      render() {
        return <span ref="span">child</span>;
      }
    }
    Object.assign(Child.prototype, UpdateLoggingMixin);

    class Switcher extends React.Component {
      state = {tabKey: 'hello'};
      render() {
        var child = this.props.children;

        return (
          <Box ref="box">
            <div
              ref="switcherDiv"
              style={{
                display: this.state.tabKey === child.key ? '' : 'none',
              }}>
              {child}
            </div>
          </Box>
        );
      }
    }
    Object.assign(Switcher.prototype, UpdateLoggingMixin);

    class App extends React.Component {
      render() {
        return (
          <Switcher ref="switcher">
            <Child key="hello" ref="child" />
          </Switcher>
        );
      }
    }
    Object.assign(App.prototype, UpdateLoggingMixin);

    var root = <App />;
    root = ReactTestUtils.renderIntoDocument(root);

    function expectUpdates(desiredWillUpdates, desiredDidUpdates) {
      var i;
      for (i = 0; i < desiredWillUpdates; i++) {
        expect(willUpdates).toContain(desiredWillUpdates[i]);
      }
      for (i = 0; i < desiredDidUpdates; i++) {
        expect(didUpdates).toContain(desiredDidUpdates[i]);
      }
      willUpdates = [];
      didUpdates = [];
    }

    function triggerUpdate(c) {
      c.setState({x: 1});
    }

    function testUpdates(components, desiredWillUpdates, desiredDidUpdates) {
      var i;

      ReactDOM.unstable_batchedUpdates(function() {
        for (i = 0; i < components.length; i++) {
          triggerUpdate(components[i]);
        }
      });

      expectUpdates(desiredWillUpdates, desiredDidUpdates);

      // Try them in reverse order

      ReactDOM.unstable_batchedUpdates(function() {
        for (i = components.length - 1; i >= 0; i--) {
          triggerUpdate(components[i]);
        }
      });

      expectUpdates(desiredWillUpdates, desiredDidUpdates);
    }
    testUpdates(
      [root.refs.switcher.refs.box, root.refs.switcher],
      // Owner-child relationships have inverse will and did
      ['Switcher', 'Box'],
      ['Box', 'Switcher'],
    );

    testUpdates(
      [root.refs.child, root.refs.switcher.refs.box],
      // Not owner-child so reconcile independently
      ['Box', 'Child'],
      ['Box', 'Child'],
    );

    testUpdates(
      [root.refs.child, root.refs.switcher],
      // Switcher owns Box and Child, Box does not own Child
      ['Switcher', 'Box', 'Child'],
      ['Box', 'Switcher', 'Child'],
    );
  });

  it('should queue mount-ready handlers across different roots', () => {
    // We'll define two components A and B, then update both of them. When A's
    // componentDidUpdate handlers is called, B's DOM should already have been
    // updated.

    var bContainer = document.createElement('div');

    var a;
    var b;

    var aUpdated = false;

    class A extends React.Component {
      state = {x: 0};

      componentDidUpdate() {
        expect(ReactDOM.findDOMNode(b).textContent).toBe('B1');
        aUpdated = true;
      }

      render() {
        var portal = null;
        // If we're using Fiber, we use Portals instead to achieve this.
        portal = ReactDOM.createPortal(<B ref={n => (b = n)} />, bContainer);
        return (
          <div>
            A{this.state.x}
            {portal}
          </div>
        );
      }
    }

    class B extends React.Component {
      state = {x: 0};

      render() {
        return <div>B{this.state.x}</div>;
      }
    }

    a = ReactTestUtils.renderIntoDocument(<A />);
    ReactDOM.unstable_batchedUpdates(function() {
      a.setState({x: 1});
      b.setState({x: 1});
    });

    expect(aUpdated).toBe(true);
  });

  it('should flush updates in the correct order', () => {
    var updates = [];

    class Outer extends React.Component {
      state = {x: 0};

      render() {
        updates.push('Outer-render-' + this.state.x);
        return (
          <div>
            <Inner x={this.state.x} ref="inner" />
          </div>
        );
      }

      componentDidUpdate() {
        var x = this.state.x;
        updates.push('Outer-didUpdate-' + x);
        updates.push('Inner-setState-' + x);
        this.refs.inner.setState({x: x}, function() {
          updates.push('Inner-callback-' + x);
        });
      }
    }

    class Inner extends React.Component {
      state = {x: 0};

      render() {
        updates.push('Inner-render-' + this.props.x + '-' + this.state.x);
        return <div />;
      }

      componentDidUpdate() {
        updates.push('Inner-didUpdate-' + this.props.x + '-' + this.state.x);
      }
    }

    var instance = ReactTestUtils.renderIntoDocument(<Outer />);

    updates.push('Outer-setState-1');
    instance.setState({x: 1}, function() {
      updates.push('Outer-callback-1');
      updates.push('Outer-setState-2');
      instance.setState({x: 2}, function() {
        updates.push('Outer-callback-2');
      });
    });

    /* eslint-disable indent */
    expect(updates).toEqual([
      'Outer-render-0',
      'Inner-render-0-0',

      'Outer-setState-1',
      'Outer-render-1',
      'Inner-render-1-0',
      'Inner-didUpdate-1-0',
      'Outer-didUpdate-1',
      // Happens in a batch, so don't re-render yet
      'Inner-setState-1',
      'Outer-callback-1',

      // Happens in a batch
      'Outer-setState-2',

      // Flush batched updates all at once
      'Outer-render-2',
      'Inner-render-2-1',
      'Inner-didUpdate-2-1',
      'Inner-callback-1',
      'Outer-didUpdate-2',
      'Inner-setState-2',
      'Outer-callback-2',
      'Inner-render-2-2',
      'Inner-didUpdate-2-2',
      'Inner-callback-2',
    ]);
    /* eslint-enable indent */
  });

  it('should flush updates in the correct order across roots', () => {
    var instances = [];
    var updates = [];

    class MockComponent extends React.Component {
      render() {
        updates.push(this.props.depth);
        return <div />;
      }

      componentDidMount() {
        instances.push(this);
        if (this.props.depth < this.props.count) {
          ReactDOM.render(
            <MockComponent
              depth={this.props.depth + 1}
              count={this.props.count}
            />,
            ReactDOM.findDOMNode(this),
          );
        }
      }
    }

    ReactTestUtils.renderIntoDocument(<MockComponent depth={0} count={2} />);

    expect(updates).toEqual([0, 1, 2]);

    ReactDOM.unstable_batchedUpdates(function() {
      // Simulate update on each component from top to bottom.
      instances.forEach(function(instance) {
        instance.forceUpdate();
      });
    });

    expect(updates).toEqual([0, 1, 2, 0, 1, 2]);
  });

  it('should queue nested updates', () => {
    // See https://github.com/facebook/react/issues/1147

    class X extends React.Component {
      state = {s: 0};

      render() {
        if (this.state.s === 0) {
          return (
            <div>
              <span>0</span>
            </div>
          );
        } else {
          return <div>1</div>;
        }
      }

      go = () => {
        this.setState({s: 1});
        this.setState({s: 0});
        this.setState({s: 1});
      };
    }

    class Y extends React.Component {
      render() {
        return (
          <div>
            <Z />
          </div>
        );
      }
    }

    class Z extends React.Component {
      render() {
        return <div />;
      }

      componentWillUpdate() {
        x.go();
      }
    }

    var x;
    var y;

    x = ReactTestUtils.renderIntoDocument(<X />);
    y = ReactTestUtils.renderIntoDocument(<Y />);
    expect(ReactDOM.findDOMNode(x).textContent).toBe('0');

    y.forceUpdate();
    expect(ReactDOM.findDOMNode(x).textContent).toBe('1');
  });

  it('should queue updates from during mount', () => {
    // See https://github.com/facebook/react/issues/1353
    var a;

    class A extends React.Component {
      state = {x: 0};

      componentWillMount() {
        a = this;
      }

      render() {
        return <div>A{this.state.x}</div>;
      }
    }

    class B extends React.Component {
      componentWillMount() {
        a.setState({x: 1});
      }

      render() {
        return <div />;
      }
    }

    ReactDOM.unstable_batchedUpdates(function() {
      ReactTestUtils.renderIntoDocument(
        <div>
          <A />
          <B />
        </div>,
      );
    });

    expect(a.state.x).toBe(1);
    expect(ReactDOM.findDOMNode(a).textContent).toBe('A1');
  });

  it('calls componentWillReceiveProps setState callback properly', () => {
    var callbackCount = 0;

    class A extends React.Component {
      state = {x: this.props.x};

      componentWillReceiveProps(nextProps) {
        var newX = nextProps.x;
        this.setState({x: newX}, function() {
          // State should have updated by the time this callback gets called
          expect(this.state.x).toBe(newX);
          callbackCount++;
        });
      }

      render() {
        return <div>{this.state.x}</div>;
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<A x={1} />, container);
    ReactDOM.render(<A x={2} />, container);
    expect(callbackCount).toBe(1);
  });

  it('does not call render after a component as been deleted', () => {
    var renderCount = 0;
    var componentB = null;

    class B extends React.Component {
      state = {updates: 0};

      componentDidMount() {
        componentB = this;
      }

      render() {
        renderCount++;
        return <div />;
      }
    }

    class A extends React.Component {
      state = {showB: true};

      render() {
        return this.state.showB ? <B /> : <div />;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<A />);

    ReactDOM.unstable_batchedUpdates(function() {
      // B will have scheduled an update but the batching should ensure that its
      // update never fires.
      componentB.setState({updates: 1});
      component.setState({showB: false});
    });

    expect(renderCount).toBe(1);
  });

  it('throws in setState if the update callback is not a function', () => {
    spyOnDev(console, 'error');

    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<A />);

    expect(() => component.setState({}, 'no')).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: no',
    );
    if (__DEV__) {
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'setState(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: no.',
      );
    }
    component = ReactTestUtils.renderIntoDocument(<A />);
    expect(() => component.setState({}, {foo: 'bar'})).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );
    if (__DEV__) {
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'setState(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
    }
    component = ReactTestUtils.renderIntoDocument(<A />);
    expect(() => component.setState({}, new Foo())).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );
    if (__DEV__) {
      expect(console.error.calls.argsFor(2)[0]).toContain(
        'setState(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
      expect(console.error.calls.count()).toBe(3);
    }
  });

  it('throws in forceUpdate if the update callback is not a function', () => {
    spyOnDev(console, 'error');

    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    var component = ReactTestUtils.renderIntoDocument(<A />);

    expect(() => component.forceUpdate('no')).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: no',
    );
    if (__DEV__) {
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'forceUpdate(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: no.',
      );
    }
    component = ReactTestUtils.renderIntoDocument(<A />);
    expect(() => component.forceUpdate({foo: 'bar'})).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );
    if (__DEV__) {
      expect(console.error.calls.argsFor(1)[0]).toContain(
        'forceUpdate(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
    }
    component = ReactTestUtils.renderIntoDocument(<A />);
    expect(() => component.forceUpdate(new Foo())).toThrowError(
      'Invalid argument passed as callback. Expected a function. Instead ' +
        'received: [object Object]',
    );
    if (__DEV__) {
      expect(console.error.calls.argsFor(2)[0]).toContain(
        'forceUpdate(...): Expected the last optional `callback` argument to be ' +
          'a function. Instead received: [object Object].',
      );
      expect(console.error.calls.count()).toBe(3);
    }
  });

  it('does not update one component twice in a batch (#2410)', () => {
    class Parent extends React.Component {
      getChild = () => {
        return this.refs.child;
      };

      render() {
        return <Child ref="child" />;
      }
    }

    var renderCount = 0;
    var postRenderCount = 0;
    var once = false;

    class Child extends React.Component {
      state = {updated: false};

      componentWillUpdate() {
        if (!once) {
          once = true;
          this.setState({updated: true});
        }
      }

      componentDidMount() {
        expect(renderCount).toBe(postRenderCount + 1);
        postRenderCount++;
      }

      componentDidUpdate() {
        expect(renderCount).toBe(postRenderCount + 1);
        postRenderCount++;
      }

      render() {
        expect(renderCount).toBe(postRenderCount);
        renderCount++;
        return <div />;
      }
    }

    var parent = ReactTestUtils.renderIntoDocument(<Parent />);
    var child = parent.getChild();
    ReactDOM.unstable_batchedUpdates(function() {
      parent.forceUpdate();
      child.forceUpdate();
    });
  });

  it('does not update one component twice in a batch (#6371)', () => {
    var callbacks = [];
    function emitChange() {
      callbacks.forEach(c => c());
    }

    class App extends React.Component {
      constructor(props) {
        super(props);
        this.state = {showChild: true};
      }
      componentDidMount() {
        this.setState({showChild: false});
      }
      render() {
        return (
          <div>
            <ForceUpdatesOnChange />
            {this.state.showChild && <EmitsChangeOnUnmount />}
          </div>
        );
      }
    }

    class EmitsChangeOnUnmount extends React.Component {
      componentWillUnmount() {
        emitChange();
      }
      render() {
        return null;
      }
    }

    class ForceUpdatesOnChange extends React.Component {
      componentDidMount() {
        this.onChange = () => this.forceUpdate();
        this.onChange();
        callbacks.push(this.onChange);
      }
      componentWillUnmount() {
        callbacks = callbacks.filter(c => c !== this.onChange);
      }
      render() {
        return <div key={Math.random()} onClick={function() {}} />;
      }
    }

    ReactDOM.render(<App />, document.createElement('div'));
  });

  it('unstable_batchedUpdates should return value from a callback', () => {
    var result = ReactDOM.unstable_batchedUpdates(function() {
      return 42;
    });
    expect(result).toEqual(42);
  });

  it('unmounts and remounts a root in the same batch', () => {
    var container = document.createElement('div');
    ReactDOM.render(<span>a</span>, container);
    ReactDOM.unstable_batchedUpdates(function() {
      ReactDOM.unmountComponentAtNode(container);
      ReactDOM.render(<span>b</span>, container);
    });
    expect(container.textContent).toBe('b');
  });

  it('handles reentrant mounting in synchronous mode', () => {
    var mounts = 0;
    class Editor extends React.Component {
      render() {
        return <div>{this.props.text}</div>;
      }
      componentDidMount() {
        mounts++;
        // This should be called only once but we guard just in case.
        if (!this.props.rendered) {
          this.props.onChange({rendered: true});
        }
      }
    }

    var container = document.createElement('div');
    function render() {
      ReactDOM.render(
        <Editor
          onChange={newProps => {
            props = {...props, ...newProps};
            render();
          }}
          {...props}
        />,
        container,
      );
    }

    var props = {text: 'hello', rendered: false};
    render();
    props = {...props, text: 'goodbye'};
    render();
    expect(container.textContent).toBe('goodbye');
    expect(mounts).toBe(1);
  });

  it('mounts and unmounts are sync even in a batch', () => {
    var ops = [];
    var container = document.createElement('div');
    ReactDOM.unstable_batchedUpdates(() => {
      ReactDOM.render(<div>Hello</div>, container);
      ops.push(container.textContent);
      ReactDOM.unmountComponentAtNode(container);
      ops.push(container.textContent);
    });
    expect(ops).toEqual(['Hello', '']);
  });

  it(
    'in sync mode, updates in componentWillUpdate and componentDidUpdate ' +
      'should both flush in the immediately subsequent commit',
    () => {
      let ops = [];
      class Foo extends React.Component {
        state = {a: false, b: false};
        componentWillUpdate(_, nextState) {
          if (!nextState.a) {
            this.setState({a: true});
          }
        }
        componentDidUpdate() {
          ops.push('Foo updated');
          if (!this.state.b) {
            this.setState({b: true});
          }
        }
        render() {
          ops.push(`a: ${this.state.a}, b: ${this.state.b}`);
          return null;
        }
      }

      const container = document.createElement('div');
      // Mount
      ReactDOM.render(<Foo />, container);
      // Root update
      ReactDOM.render(<Foo />, container);
      expect(ops).toEqual([
        // Mount
        'a: false, b: false',
        // Root update
        'a: false, b: false',
        'Foo updated',
        // Subsequent update (both a and b should have flushed)
        'a: true, b: true',
        'Foo updated',
        // There should not be any additional updates
      ]);
    },
  );

  it(
    'in sync mode, updates in componentWillUpdate and componentDidUpdate ' +
      '(on a sibling) should both flush in the immediately subsequent commit',
    () => {
      let ops = [];
      class Foo extends React.Component {
        state = {a: false};
        componentWillUpdate(_, nextState) {
          if (!nextState.a) {
            this.setState({a: true});
          }
        }
        componentDidUpdate() {
          ops.push('Foo updated');
        }
        render() {
          ops.push(`a: ${this.state.a}`);
          return null;
        }
      }

      class Bar extends React.Component {
        state = {b: false};
        componentDidUpdate() {
          ops.push('Bar updated');
          if (!this.state.b) {
            this.setState({b: true});
          }
        }
        render() {
          ops.push(`b: ${this.state.b}`);
          return null;
        }
      }

      const container = document.createElement('div');
      // Mount
      ReactDOM.render(
        <div>
          <Foo />
          <Bar />
        </div>,
        container,
      );
      // Root update
      ReactDOM.render(
        <div>
          <Foo />
          <Bar />
        </div>,
        container,
      );
      expect(ops).toEqual([
        // Mount
        'a: false',
        'b: false',
        // Root update
        'a: false',
        'b: false',
        'Foo updated',
        'Bar updated',
        // Subsequent update (both a and b should have flushed)
        'a: true',
        'b: true',
        'Foo updated',
        'Bar updated',
        // There should not be any additional updates
      ]);
    },
  );

  it('uses correct base state for setState inside render phase', () => {
    spyOnDev(console, 'error');

    let ops = [];

    class Foo extends React.Component {
      state = {step: 0};
      render() {
        const memoizedStep = this.state.step;
        this.setState(baseState => {
          const baseStep = baseState.step;
          ops.push(`base: ${baseStep}, memoized: ${memoizedStep}`);
          return baseStep === 0 ? {step: 1} : null;
        });
        return null;
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(<Foo />, container);
    expect(ops).toEqual(['base: 0, memoized: 0', 'base: 1, memoized: 1']);
    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Cannot update during an existing state transition',
      );
    }
  });

  it('does not re-render if state update is null', () => {
    let container = document.createElement('div');

    let instance;
    let ops = [];
    class Foo extends React.Component {
      render() {
        instance = this;
        ops.push('render');
        return <div />;
      }
    }
    ReactDOM.render(<Foo />, container);

    ops = [];
    instance.setState(() => null);
    expect(ops).toEqual([]);
  });

  // Will change once we switch to async by default
  it('synchronously renders hidden subtrees', () => {
    const container = document.createElement('div');
    let ops = [];

    function Baz() {
      ops.push('Baz');
      return null;
    }

    function Bar() {
      ops.push('Bar');
      return null;
    }

    function Foo() {
      ops.push('Foo');
      return (
        <div>
          <div hidden={true}>
            <Bar />
          </div>
          <Baz />
        </div>
      );
    }

    // Mount
    ReactDOM.render(<Foo />, container);
    expect(ops).toEqual(['Foo', 'Bar', 'Baz']);
    ops = [];

    // Update
    ReactDOM.render(<Foo />, container);
    expect(ops).toEqual(['Foo', 'Bar', 'Baz']);
  });

  it('can render ridiculously large number of roots without triggering infinite update loop error', () => {
    class Foo extends React.Component {
      componentDidMount() {
        const limit = 1200;
        for (let i = 0; i < limit; i++) {
          if (i < limit - 1) {
            ReactDOM.render(<div />, document.createElement('div'));
          } else {
            ReactDOM.render(<div />, document.createElement('div'), () => {
              // The "nested update limit" error isn't thrown until setState
              this.setState({});
            });
          }
        }
      }
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(<Foo />, container);
  });

  it('does not fall into an infinite update loop', () => {
    class NonTerminating extends React.Component {
      state = {step: 0};
      componentDidMount() {
        this.setState({step: 1});
      }
      componentWillUpdate() {
        this.setState({step: 2});
      }
      render() {
        return (
          <div>
            Hello {this.props.name}
            {this.state.step}
          </div>
        );
      }
    }

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<NonTerminating />, container);
    }).toThrow('Maximum');
  });

  it('does not fall into an infinite error loop', () => {
    function BadRender() {
      throw new Error('error');
    }

    class ErrorBoundary extends React.Component {
      componentDidCatch() {
        this.props.parent.remount();
      }
      render() {
        return <BadRender />;
      }
    }

    class NonTerminating extends React.Component {
      state = {step: 0};
      remount() {
        this.setState(state => ({step: state.step + 1}));
      }
      render() {
        return <ErrorBoundary key={this.state.step} parent={this} />;
      }
    }

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<NonTerminating />, container);
    }).toThrow('Maximum');
  });
});
