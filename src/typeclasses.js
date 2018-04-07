import { Applicative, Functor, map, append, Monad, flatMap } from 'funcadelic';
import Microstate from './microstate';
import { reveal } from './utils/secret';
import Tree from './utils/tree';
import thunk from './thunk';
import { collapse } from './typeclasses/collapse';

const { keys } = Object;

Functor.instance(Microstate, {
  map(fn, microstate) {
    let _tree = reveal(microstate);
    // tree of transitions
    let next = map(node => {
      return map(transition => {
        return (...args) => {
          let tree = transition(_tree)(...args);
          return new Microstate(tree);
        };
      }, node.transitions);
    }, _tree);

    let mapped = map(transitions => map(fn, transitions), next);

    return append(microstate, collapse(mapped));
  }
});

Functor.instance(Tree, {
  /**
   * Lazily invoke callback on every property of given tree,
   * the return value is assigned to property value.
   *
   * @param {*} fn (TypeTree, path) => any
   * @param {*} tree Tree
   */
  map(fn, tree) {
    return new Tree({
      data() {
        return fn(tree.data);
      },
      children() {
        return map(child => map(fn, child), tree.children);
      },
    });
  },
});

Applicative.instance(Tree, {
  pure(value) {
    return new Tree({
      data() {
        return value;
      }
    });
  }
});


Monad.instance(Tree, {
  flatMap(fn, tree) {
    let next = thunk(() => fn(tree.data));
    return new Tree({
      data() {
        return next().data;
      },
      children() {
        return map(child => flatMap(fn, child), next().children);
      },
    });
  },
});
