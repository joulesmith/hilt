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
import * as nodeUrl from 'url';

var authorizations = {};

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

let resourceTree = (function(){
  let tree = {
    local: {},
    remote: {}
  };

  return {
    find : (route, create) => {
      let parsedUrl = nodeUrl.parse(route);
      let node;
      let local;

      if (!parsedUrl.host && parsedUrl.hash) {
        // still need to distinguish between local routes which are into this application
        // which are given by the hash path #/path/to/resource
        // and routes to the server from which the app was served, which also may
        // not have a hostname property since it is relative to the current page url
        local = true;
        let uriHash = parseURI(parsedUrl.hash);

        node = tree.local;

        let lastPart = uriHash.pathParts[uriHash.pathParts.length-1];
        if (create) {
          uriHash.pathParts.forEach(part => {
            if (part === lastPart) {
              // if this is the last part of the path
              if (!node[part]) {
                // if the path endpoint is not defined yet, start with blank object
                node[part] = {};
              }

              // finish setting the endpoint
              node = node[part];
            }else{
              // if this is not the endpoint, keep creating branches where it should be
              node = node[part] ? node[part] : node[part] = {};
            }
          });
        }else{
          // the endpoint may or may not be defined. do not create any new branches
          uriHash.pathParts.forEach(part => {
            node = (node && node[part]) ? node[part] : null;
          });
        }

      }else{
        local = false;
        let uriPath = parseURI(parsedUrl.pathname);

        node = tree.remote[parsedUrl.host];

        if (create && !node) {
          node = tree.remote[parsedUrl.host] = {};
        }

        if (create) {
          let lastPart = uriPath.pathParts[uriPath.pathParts.length-1];

          uriPath.pathParts.forEach(part => {
            if (part === lastPart) {
              // if this is the last part of the path
              if (!node[part]) {
                // if the path endpoint is not defined yet, start with blank object
                node[part] = {};
              }

              // finish setting the endpoint
              node = node[part];
            }else{
              // if this is not the endpoint, keep creating branches where it should be
              node = node[part] ? node[part] : node[part] = {};
            }
          });
        }else{
          // the endpoint may or may not be defined. do not create any new branches
          uriPath.pathParts.forEach(part => {
            node = (node && node[part]) ? node[part] : null;
          });
        }
      }

      return {
        node: node,
        parsedUrl, parsedUrl,
        local: local
      };
    }
  };
})();




export function setAuthorization(authorization, host) {
    // define the authentication to use with this host
    authorizations[host || 'apphost'] = authorization;
}

var httpPost = function(url, data) {
  // use any authorizations set to contact the server
  var parsedUrl = nodeUrl.parse(url);
  var headers = {};
  headers.Authorization = authorizations[parsedUrl.host || 'apphost'];

  // if it's not defined locally, then perform an http POST to perform the action
  return http({
    method: 'post',
    headers: headers,
    url: url,
    data: data
  })
  .then(res => {
    // success!
    // whatever this action did will be handled by the server the request was
    // sent to according to the url, which may or may not affect anything in
    // this app.
    // return the data portion of the response to resolve the promise
    return res.data;
  })
  .catch(res => {
    if (res.data) {
      if (res.data.error) {
        // the server has a customized error message
        throw res.data.error;
      }
      // there is a server response, but theres a error, so display status code
      // and text
      throw new Error(res.status + ": " + res.statusText);
    }
    // Some other kind of exception has happened, so just re-throw whatever it was
    throw res;
  });
};

var httpGet = function(url) {
  // use any authorizations set to contact the server
  var parsedUrl = nodeUrl.parse(url);
  var headers = {};
  headers.Authorization = authorizations[parsedUrl.host || 'apphost'];

  // if it's not defined locally, then perform an http POST to perform the action
  return http({
    method: 'get',
    headers: headers,
    url: url
  })
  .then(res => {
    // success!
    // whatever this action did will be handled by the server the request was
    // sent to according to the url, which may or may not affect anything in
    // this app.
    // return the data portion of the response to resolve the promise
    return res.data;
  })
  .catch(res => {
    if (res.data) {
      if (res.data.error) {
        // the server has a customized error message
        throw res.data.error;
      }
      // there is a server response, but theres a error, so display status code
      // and text
      throw new Error(res.status + ": " + res.statusText);
    }
    // Some other kind of exception has happened, so just re-throw whatever it was
    throw res;
  });
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
 * If the action is not defined, the default action is to publish the data as
 * the new state, and resolve the promise with the new data/state.
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

    // find resource, create if doesn't exist only if it is being defined now
    let result = resourceTree.find(update.action, !!update.definition);

    if (result.local) {
      // this action should be defined locally

      if (update.definition){
        // set the new definition for the action on this local resource node
        // I node the ndoe exists because I it would have been created while
        // searching for it.
        result.node._action = update.definition;
      }

      if (update.data) {
        // if there is data, then this is an occurence of the action
        if (!result.node || !result.node._action || typeof result.node._action !== 'function') {

          // if the action is not defined locally, then a default action is performed
          return Promise.resolve(update.data)
          .then(data => {
            // this might seem silly, but gives an idea what an action should be doing

            // for now just use a default action which simply publishes the contents of
            // data as the state of the action url
            // but actions can theoretically publish the state of any resource.
            publish(update.action, data);

            // the action can return a result which is returned to whoever reported
            // the action to resolve the promise returned when the action was reported
            //
            // this just returns the same data that was used in the report
            return data;
          });
        }

        // if the action is defined, then it is called within a promise chain
        // whatever the action returns will be passed into the resolve function
        return Promise.resolve(update.data).then(result.node._action);
      }

      // if it gets this far, then no further actions are to be performed
      // simply resolve
      return Promise.resolve();
    }

    // if execution reaches here, it means the action could not be handled locally
    return httpPost(update.action, update.data);
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
    var result = resourceTree.find(resource, true);

    if (result.local) {
      result.node._state = state;

      if (result.node._subscribers) {
        result.node._subscribers.forEach(subscription => {subscription()});
      }
    }else{
      throw new Error(resource + " is a remote resource and cannot be published directly from the app. Report an action instead.");
    }
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
  var result = resourceTree.find(resource, false);

  if (result.node && result.node._state) {
    return Promise.resolve(result.node._state);
  }

  if (!result.local) {
    return httpGet(resource);
  }

  return Promise.reject(new Error("Resource not found."));
}

// helper function to tie a subscriber function to a resource
var makeSubscription = (resource, subscriber) => {
  // form closure
  // add the subscriber callback to the publication
  let subscription = () => {
    // notify any of the dependent resources
    resource.dependents.forEach(dependent => {
      // TODO:  changes the resulting uri of the dependent.
      dependent.resolveURI();
    });

    // each publication updates its part of the state
    var macroState = {};
    macroState[resource.localName] = resource.node._state; // copy?
    subscriber(macroState);
  };


  if (!resource.node._subscribers){
    // if this is the first subscriber to this publication, then initialize
    resource.node._subscribers = [];
  }

  resource.node._subscribers.push(subscription);

  resource.unsub = () => {
    var index = resource.node._subscribers.indexOf(subscription);
    resource.node._subscribers.splice(index, 1);

    // TODO: stop listening when no subscribers, if listening was started?
    // and delete branches without subscribers
  };

  if (resource.node._state) {
    // since this is not a change in the state, fire an initial response to
    // the subscription (it won't otherwise)
    subscription();
  }
};

/**
 * Listens for the current state of resources, whether or not it exists. Any changes
 * to the state of the resource are given to the first parameter of the callback.
 *
 * If the resource exists, the callback is called with the current state, and called
 * anytime the state changes, until it is un-subscribed.
 *
 * If the resource does not exist, the callback will not be called. But it will be
 * called when/if the resource is created.
 *
 * Each resource state is updated as a partial update to the total state, and it is
 * up to you (or react or whatever) to manage merging the changes into the total state.
 *
 * Currently, errors are globally reported to #/error
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
 * unsubscribe()
 * .then(() => {
 * 	 // do something once it is un-subscribed
 * })
 * .catch(err => {
 *   // assume the subscription is not valid, so messages to #/error won't do
 *   // much good at this point, so catch the final score here.
 * });
 *
 *
 * @param  {Object} resources - Property is a resource to subscribe to.
 * @param  {function} subscriber - callback when there is an update to one or more
 * of the resources specified as partial updates. Takes a single parameter.
 * @return {Promise} Resolves when subscription has be un-subscribed (ie. no more calls to the callback)
 */
export function subscribe (resources, subscriber, _this) {

  // allows referencing each resource using its name
  var resourceKeyValues = {};

  for(let prop in resources){
    resourceKeyValues[prop] = {
      localName: prop,
      uriTemplate: resources[prop],
      resolveURI: null,
      currentUri: '',
      node: null,
      unresolvedDependencies: {},
      resolvedDependencies: {},
      thisProperties: {},
      dependents: [],
      unsub: null
    };
  }

  var resourceList = [];
  var thisDependents = {};

  // this initial loop builds the map of resource dependencies on one-another
  for(let prop in resources){
    let resource = resourceKeyValues[prop];

    resourceList.push(resource);

    let uritmpl = resources[prop];
    let re = /\{([^\}]+)\}/g;
    let match;

    let dependencies = {};

    while(match = re.exec(uritmpl)) {
      let props = match[1].split('.');
      let dependency = props[0];

      if (dependency === 'this') {
        if (!thisDependents[prop]) {
          thisDependents[prop] = resource;
        }

        if (!resource.thisProperties[match[0]]){
          resource.thisProperties[match[0]] = props.slice(1);
        }
      }else{

        if (!resource.unresolvedDependencies[dependency]) {
          resource.unresolvedDependencies[dependency] = {
            resource: resourceKeyValues[dependency],
            properties: {}
          };

          resourceKeyValues[dependency].dependents.push(resource);
        }

        if (!resource.unresolvedDependencies[dependency].properties[match[0]]){
          resource.unresolvedDependencies[dependency].properties[match[0]] = props.slice(1);
        }
      }
    }
  }

  var resourcesWithDependencies = [];
  var resourcesWithOnlyResolvedDependencies = [];

  // find all the resources that do not have any dependencies
  // there must be at least one for the tree to be resolvable
  resourceList.forEach(res => {
    for(var unresolved in res.unresolvedDependencies) {
      resourcesWithDependencies.push(res);
      return;
    }

    resourcesWithOnlyResolvedDependencies.push(res);
  });

  // this would be a valid order to load the resources
  var sortedResources;

  if (resourcesWithDependencies.length === 0) {
    sortedResources = resourcesWithOnlyResolvedDependencies;
  }else{
    // Kahn's algorithm

    sortedResources = [];

    // Basically this uses resources that have their dependencies already resolved
    // to resolve the dependencies of their dependents. If there are any left unresolved
    // after we use these up, then there is no way to resolve them.
    while(resourcesWithOnlyResolvedDependencies.length > 0) {
      var res = resourcesWithOnlyResolvedDependencies.pop();
      sortedResources.push(res);

      res.dependents.forEach(dependent => {
        dependent.resolvedDependencies[res.localName] = dependent.unresolvedDependencies[res.localName];
        delete dependent.unresolvedDependencies[res.localName];

        for(var unresolvedDependency in dependent.unresolvedDependencies){
          // I want to return if there are still any unresolved dependencies
          return;
        }

        // if there are no more dependencies, I can now use this resource to
        // resolve its dependents' dependency
        resourcesWithOnlyResolvedDependencies.push(dependent);
      });
    }

    // finally check to see if any of the resource dependencies we started with
    // are left unresolved. If so, issue a warning because this means the subscription
    // is malformed or something.
    resourcesWithDependencies.forEach(resource => {
      for(var unresolvedDependency in resource.unresolvedDependencies){
        // this will only throw on the first occurence of an unresolved dependency
        throw new Error(resource.localName + " depends on " + unresolvedDependency + ", but it could not be resolved within the subscription.");
      }
    });

    // !Kahn's algorithm
  }

  sortedResources.forEach(resource => {

    resource.resolveURI = function() {
      // this will be a running solution of the actual uri
      var uri = resource.uriTemplate;
      // pull the data in from the dependencies
      for(let dependency in resource.resolvedDependencies){
        var dep = resource.resolvedDependencies[dependency];

        if (dep.resource.node && dep.resource.node._state) {
          for(let match in dep.properties) {
            let value = dep.resource.node._state;

            // lookup the value in the state
            dep.properties[match].forEach(part => {
              if (value === null) return;
              if (typeof value[part] === 'undefined') return value = null;
              value = value[part];
            });

            if (value === null){

              // the state exists, but the specific property does not exist
              // two thoughts:
              // 1. treat the existance of a property itself as a subscription
              // and so wait until the property appears in a future update. and perhaps
              // being undefined is acceptable behaviour for this particular subscription
              // until it is defined.
              return; // <-- comment out if going with 2.
              // 2. people may have just made an error, and not understand why
              // the url is never resolving since it depends on a property that
              // will never exist. So, maybe throw an error here when we get a State
              // where the property isn't defined.
              //throw new Error("A value for " + match + " could not be found in " + JSON.stringify(dep.resource.node._state));
            }

            // substitute the value into the url template
            uri = uri.replace(match, () => {
              return value;
            });

          }
        }else{
          // if any of the dependencies aren't ready, cannot make uri.
          return;
        }
      }

      for(let match in resource.thisProperties) {
        let value = _this;

        // lookup the value in the state
        resource.thisProperties[match].forEach(part => {
          if (typeof value[part] === 'undefined') {
            throw new Error("A value for " + match + " could not be found in 'this' provided to the subscription.");
          }

          value = value[part];
        });


        uri = uri.replace(match, () => {
          return value;
        });
      }


      // all required dependency values have been replaced, so now can use it
      // to subscribe to the resource

      if (uri === resource.currentUri) {
        // already subscribed to it
        return;
      }

      if (resource.unsub) {
        // there is already a subscription for this resource, so unsubscribe first
        resource.unsub();
        resource.unsub = null;
      }

      resource.currentUri = uri;
      // the uri should be complete now
      let result = resourceTree.find(resource.currentUri, true);

      // just reference the node. Changes to _state will be reflected in the reference
      resource.node = result.node;

      makeSubscription(resource, subscriber);

      if (!result.local) {
        // TODO: this does not implement subscription for remote resources.
        httpGet(resource.currentUri)
        .then(state => {
          result.node._state = state; // copy?

          if (result.node._subscribers) {
            result.node._subscribers.forEach(subscription => {subscription()});
          }
        })
        .catch(error => {

        });
      }

    };
  });

  sortedResources.forEach(resource => {
    if (resource.currentUri === '') {
      resource.resolveURI();
    }
  });

  return {
    thisChanged: () => {
      for(let dep in thisDependents) {
        thisDependents[dep].resolveURI();
      }
    },
    unsubscribe: () => {
      // this is the un-susbscribe function
      sortedResources.forEach(resource => {return resource.unsub ? resource.unsub() : null;});

      // TODO: reject when errors have occured
      return Promise.resolve();
    }
  };
}
