"use strict";

 /**
  * @typedef Editor
  * @type {Object}
  *
  * @property {Function} update - sets the original values of the object, returns the
  * object to use with the ui components (with event handlers etc)
  * @property {Function} compile - returns a new object of the same format as the original,
  * but with the new values.
  */

/**
 * Manages editable objects, procuding event handlers which can be supplied to
 * other ui components which will update the current status of the editable object.
 *
 * @param  {Function} cb - callback when an event handler has caused a change to
 * the editor state.
 * @return {Object} interface to the editor.
 */
export default function(cb) {

  var initialize = function(original, edited, previous) {
    var currentCopy = {
      edited: false
    };

    for(var prop in original) {
      (prop => {
        // create closure for prop
        if (typeof original[prop] === 'object') {
          // this is not a leaf
          currentCopy[prop] = initialize(original[prop], newChildState => {
            var newState = {
              edited: false
            };

            for(var prop2 in original) {
              newState[prop2] = (prop === prop2) ? newChildState : currentCopy[prop2];
              newState.edited = newState.edited || newState[prop2].edited;
            }

            currentCopy = newState;

            edited(currentCopy);
          }, previous ? previous[prop] : null);

        }else{
          // this is a leaf
          //
          var handler = function(event) {
            var newState = {
              edited: false
            };

            for(var prop2 in original) {
              newState[prop2] = (prop !== prop2) ? currentCopy[prop2] : {
                current: event.target.value,
                original: currentCopy[prop].original,
                edited: event.target.value !== currentCopy[prop].original,
                handler: handler
              };

              newState.edited = newState.edited || newState[prop2].edited;
            }

            currentCopy = newState;
            edited(currentCopy);
          };

          if (previous && previous[prop].current) {
            currentCopy[prop] = {
              current: previous[prop].current,
              original: original[prop],
              edited: previous[prop].current !== original[prop],
              handler: handler
            };
          }else{
            currentCopy[prop] = {
              current: original[prop],
              original: original[prop],
              edited: false,
              handler: handler
            };
          }


        }
      })(prop);

      currentCopy.edited = currentCopy.edited || currentCopy[prop].edited;
    }

    return currentCopy;
  };

  var compile = function(original, current) {
    var state = {};

    for(var prop in original) {
      if (typeof original[prop] === 'object') {
        // not a leaf
        state[prop] = compile(original[prop], current[prop]);
      }else{
        // a leaf
        state[prop] = current[prop].current;
      }
    }

    return state;
  }

  var originalCopy = null;
  var currentCopy = null;

  return {
    /**
     * [function description]
     * @param  {[type]} original [description]
     * @return {[type]}          [description]
     */
    update: function(original){
      originalCopy = original;

      currentCopy = initialize(original, newState => {
        currentCopy = newState
        cb(newState);
      }, currentCopy);

      return currentCopy;
    },
    compile: function(){

      return compile(originalCopy, currentCopy);
    }
  };

}
