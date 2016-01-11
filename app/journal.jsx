"use strict";
/**
 * Manages local state of data through pub/sub and action messaging system.
 *
 * Wraps http operations to external data into this pattern. Actions result
 * in http POST, and get/subscribe result in GET operations. However, the meaning
 * of url's have a slightly different meaning.
 *
 * @module
 */

import http from 'axios';

//TODO: convert the processing of reports into an iteration of the reports Array to
// create a queue of reports which might derive from an orinigal report.
// a record of all actions determining the 'current' state of the app
let reports = [];
let actions = {};
let publishings = {};

// this really has nothing to do with the current state, but only used to notify
let subscribers = {};

var parseURI = uri => {

  let uriObj = {
    query: {}
  };

  let path_query = uri.split('?');
  let pathElements = path_query[0] ? path_query[0].split('/') : [];
  let queryElements = path_query[1] ? path_query[1].split('&') : [];

  queryElements.forEach(element => {
    let pair = element.split('=');

    uriObj.query[pair[0]] = pair[1]; // TODO: parse value as well
  });

  uriObj.pathParts = pathElements;

  return uriObj;
};

/**
 * @typedef ReportUpdate
 * @type {Object}
 *
 * @property {string} action - A uri/url to the action of concern. May be local by
 * using the hash (#) of the url to refer to local actions. Other urls will be processed
 * using an http post.
 * @property {Object} data - An action takes some json serializable data to make actions
 * more general.
 * @property {function} [definition] - Optionaly define what the action is by supplying
 * a function which takes a single data argument, which will be the data specified
 * whenever the action is reported. This will be used for all reports to the
 * same action url after the report of the definition.
 * This currently can only define local actions.
 */

/**
 * Creates a report of an action, which may result in a state change.
 *
 * @param  {ReportUpdate|ReportUpdate[]} update - Update action(s) to report
 * @return {Promise} A promise which resolves to the value returned directly by
 * an action, which may or may not be the same as any state changes the action
 * caused. For example, an action might be used to create a public key as a new state, but
 * will only resolve the promise to the value of the private key.
 *
 * Also, the promise is only resolved when the action is first resolved back to
 * the 'caller', which is asynchronous. State changes could be passed to some subscribers
 * before or after the promise of the action itself is resolved.
 */
export function report(update) {

  if (Array.isArray(update)) {
    return update.map(u => {return report(u);});
  }else{
    // in principle, the current state can be re-constructed by a re-play of the reports
    // but that functionality should be added by another function
    reports.push(update);

    // map the url onto the action tree.
    let uriObj = parseURI(update.action);

    if (uriObj.pathParts[0] === '#') {
      // this action should be defined locally
      let act = actions;

      if (update.definition) {
        // first add the defintition to the actions
        var lastPart = uriObj.pathParts[uriObj.pathParts.length-1];
        uriObj.pathParts.forEach(part => {
          if (part === lastPart) {
            if (!act[part]) {
              act[part] = {};
            }
            act[part].action = update.definition;
            act = act[part];
          }else{
            act = act[part] ? act[part] : act[part] = {};
          }
        });
      }else{
        uriObj.pathParts.forEach(part => {
          act = act && act[part] ? act[part] : null;
        });
      }

      if (update.data) {

        if (!act || !act.action || typeof act.action !== 'function') {

          // TODO: get the definition from server if a valid url is given?

          return Promise.resolve(update.data)
          .then(data => {
            // this might seem silly, but gives an idea what an action should be doing

            // for now just use a default action which simply publishes the contents of
            // data as the state of the action url
            // but actions can theoretically publish the state of any resource.
            publish(update.action, data);

            // the action can return a result which is returned to whever reported
            // the action to resolve the ultimate promise that started the action
            return data;
          });
        }

        return Promise.resolve(update.data).then(act.action);
      }

      return Promise.resolve();
    }

    // if it's not defined locally, then perform an http POST to perform the action
    return http.post(update.action, update.data)
    .then(res => {
      return res.data;
    })
    .catch(res => {
      if (res.data) {
        if (res.data.error) {
          throw res.data.error;
        }
        throw res.data;
      }
      throw res;
    });
  }
}


/**
 * Publishes a new state for a given url, which will alert any subscribers.
 *
 * Publishing should only be done by actions since this is a direct change
 * to state.
 *
 * @param  {string} resource - url to publish state about
 * @param  {Object} state    - json serializable object to put as state
 * @return {undefined}
 */
export function publish (resource, state) {

  if (typeof state === 'object') {
    let pub = publishings;
    let sub = subscribers;

    // map the url onto the publications tree.
    // TODO: use a better url parser/mapper
    let uriObj = parseURI(resource);
    let lastPart = uriObj.pathParts[uriObj.pathParts.length-1];

    // TODO: go down the tree from first change and fire all subscribers, instead of overriding
    uriObj.pathParts.forEach(part => {
      if (part === lastPart) {
        pub = (pub[part] = state);
      }else{
        pub = pub[part] || (pub[part] = {});
      }

      sub = sub[part] || (sub[part] = {});
    });

    if (sub.subscribers) {
      // notify the subscribers of a change in the state
      sub.subscribers.forEach(subscription => {subscription(state)});
    }
  }else if (typeof state === 'function'){
    let act = actions;

    // TODO: use a better url parser/mapper
    let uriObj = parseURI(resource);

    uriObj.pathParts.forEach(part => {
      act = act[part] || (act[part] = {});
    });

    act.action = state;

    // no need to notify anyone since action tree is now current for future use
    // of this action.
  }
}

/**
 * Gets the current state at a given url.
 *
 * get('api.somebody.com/data/reallyImportantData')
 * .then(data => {
 * 	// do something with data
 * })
 * .catch(err => {
 * 	// do something with the error
 * });
 *
 * @param  {string} resource - url of state to get
 * @return {Promise} Resolves to the value of the 'current' state.
 */
export function get (resource) {

  var uriObj = parseURI(resource);

  if (uriObj.pathParts[0] === '#') {
    uriObj.pathParts.forEach(part => {
      pub = pub && pub[part] ? pub[part] : null;
    });

    if (pub) {
      return Promise.resolve(pub);
    }
  }else{
    return http.get(resource)
    .then(res => {
      return res.data;
    })
    .catch(res => {
      if (res.data) {
        if (res.data.error) {
          throw res.data.error;
        }
        //throw res.data;
      }
      throw res;
    });
  }

  return Promise.reject(new Error("Resource not found."));
}

/**
 * Listens for the current state of resources, whether or not it exists. Any changes
 * to the state of the resource are given to the first parameter of the callback.
 *
 * If the resource exists, the callback is called with the current state, and called
 * anytime the state changes.
 *
 * If the resource does not exist, the callback will not be called. But it will be
 * called when/if the resource is created.
 *
 * Each resource state is updated as a partial update to the total state, and it is
 * up to you (or react or whatever) to manage merging the changes into the total state.
 *
 * Currently, errors are reported to #/error
 *
 * var unsubscribe = subscribe({
 *   resource1: 'some/url',
 *   localError: '#/error'
 * }, state => {
 * 	 if (state.localError) {
 * 		 console.log(state.localError);
 * 	 }
 *
 *   this.setState(state);
 * });
 *
 * // unsubscribe some time later
 * unsubscribe();
 *
 *
 * @param  {Object} resources - Property is a resource to subscribe to.
 * @param  {function} subscriber - callback when there is an update to one or more
 * of the resources specified as partial updates. Takes a single parameter.
 * @return {[type]}            [description]
 */
export function subscribe (resources, subscriber) {
  var unsubs = [];

  for(let prop in resources){

    var resource = resources[prop];

    var pub = publishings;
    var sub = subscribers;

    // map the url onto the publications tree.
    // TODO: use a better url parser
    var parts = resource.split('/');
    parts.forEach(part => {
      pub = pub && pub[part] ? pub[part] : null;
      sub = sub[part] || (sub[part] = {});
    });

    if (!sub.subscribers){
      // if this is the first subscriber to this publication, then initialize
      sub.subscribers = [];
    }

    var subscription = (prop => {
      // form closure for 'prop' in the loop over resources
      return microState => {
        // each publication updates its part of the state
        var macroState = {};
        macroState[prop] = microState; // copy?
        subscriber(macroState);
      }
    })(prop);

    ((subscription, subscribers) => {
      // form closure for 'subscription' in loop over resources
      // add the subscriber callback to the publication
      subscribers.push(subscription);
      unsubs.push(() => {
        var index = subscribers.indexOf(subscription);
        subscribers.splice(index, 1);

        // TODO: stop listening when no subscribers, if listening was started?
      });
    })(subscription, sub.subscribers);

    // TODO: this is just a really bad cache. See about different way.
    if (pub) {
      // if there is something to see, go ahead and pull it in.
      var macroState = {};
      macroState[prop] = pub;
      subscriber(macroState);
    }else{
      // Not all resources are on the internet though
      if (parts[0] !== '#') {
        // TODO: this does not implement the goal of a subscription
        http({
          method: 'get',
          url: resource
        })
        .then(res => {
          publish(resource, res.data);
        })
        .catch(res => {
          var err;
          if (res.data) {
            if (res.data.error) {
              err = res.data.error;
            }else{
              err = res.data;
            }
          }else{
            err = res;
          }

          report({
            action: '#/error',
            data: err
          })
        });
      }

      //TODO: start listening for this resource via socketio?
    }
  }

  return () => {
    // this is the un-susbscribe function
    unsubs.forEach(unsub => {unsub()});
  }
}
