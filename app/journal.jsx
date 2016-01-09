"use strict";

// a record of all updates to the
let logs = [];
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

export function log(update) {

  // in principle, the current state can be re-constructed by a re-play of the logs
  // but that functionality should be added by another function
  logs.push(update);

  let act = actions;

  // map the url onto the action tree.
  let uriObj = parseURI(update.action);

  uriObj.pathParts.forEach(part => {
    act = act && act[part] ? act[part] : null;
  });

  if (typeof update.data === 'function' || !act || !act.action || typeof act.action !== 'function') {
    // TODO: get the definition from server?
    // for now just use a default action which simply publishes the contents of
    // data as the state of the action url
    // if data is a function, it will become the action performed in subsequent logs
    // of the 'same' action (the uri)
    return publish(update.action, update.data);
  }

  act.action(update.data, uriObj.query);


}

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

export function subscribe (subscriber, resources) {
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

    if (pub) {
      // if there is something to see, go ahead and pull it in.
      var macroState = {};
      macroState[prop] = pub;
      subscriber(macroState);
    }else{
      // Not all resources are on the internet though
      if (parts[0] !== '.') {
        // TODO:
        http({
          method: 'get',
          url: resource
        })
        .then(res => {
          publish(resource, res.data);
        })
        .catch(res => {
          publish('./error', res.data);
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
