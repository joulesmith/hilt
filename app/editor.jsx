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
export default function(form, cb) {

  var initialize = function(form, original, edited, previous) {
    var currentCopy = {
      edited: false
    };

    for(var prop in form) {
      (prop => {
        // create closure for prop
        if (typeof form[prop] === 'object') {
          // this is not a leaf
          currentCopy[prop] = initialize(
            form[prop],
            original ? original[prop] : null,
            newChildState => {
              var newState = {
                edited: false
              };

              for(var prop2 in form) {
                // the new state only replaces the property it corresponds to
                // all other properties are copied as they have not changed this time
                newState[prop2] = (prop === prop2) ? newChildState : currentCopy[prop2];

                // a non-leaf is edited if 1 or more of its branches are edited
                newState.edited = newState.edited || newState[prop2].edited;
              }

              // replace the current object with the new state
              currentCopy = newState;

              // call the parent edited function with the new constructed state
              edited(currentCopy);
            },
            previous ? previous[prop] : null
          );

        }else{
          // this is a leaf
          var handler = function(event) {
            var value;
            // only use event.target.value if that is the pattern being used
            if (event.target && event.target.value){
              value = event.target.value;
            }else{
              value = event;
            }

            var newState = {
              edited: false
            };

            for(var prop2 in form) {
              newState[prop2] = (prop !== prop2) ? currentCopy[prop2] : {
                current: value,
                original: currentCopy[prop].original,
                edited: value !== currentCopy[prop].original,
                label: form[prop2],
                handler: handler
              };

              // a non-leaf is edited if 1 or more of its branches are edited
              newState.edited = newState.edited || newState[prop2].edited;
            }

            currentCopy = newState;
            edited(currentCopy);
          };

          if (previous && previous[prop].current) {
            // TODO: remove 'previous' altogether, but leaving for now just in case it's needed later
            currentCopy[prop] = {
              current: original ? original[prop] : null,
              original: original ? original[prop] : null,
              edited: false,
              label: form[prop],
              handler: handler
            };
          }else{
            currentCopy[prop] = {
              current: original ? original[prop] : null,
              original: original ? original[prop] : null,
              edited: false,
              label: form[prop],
              handler: handler
            };
          }


        }
      })(prop);

      currentCopy.edited = currentCopy.edited || currentCopy[prop].edited;
    }

    return currentCopy;
  };

  var compile = function(form, current) {
    var state = {};

    for(var prop in form) {
      if (typeof form[prop] === 'object') {
        // not a leaf
        state[prop] = current ? compile(form[prop], current[prop]) : null;
      }else{
        // a leaf
        state[prop] = current ? current[prop].current : null;
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

      currentCopy = initialize(
        form,
        original,
        newState => {
          currentCopy = newState
          cb(newState);
        },
        currentCopy
      );

      return currentCopy;
    },
    compile: function(){

      return compile(form, currentCopy);
    }
  };

}
