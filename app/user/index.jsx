"use strict";
import http from 'axios';
import * as journal from '../journal';

var user_token = null;
var guest_token = null;

journal.report({
  action: '#/user/current',
  data: {
    guest: false,
    _id: null
  }
});



/**
 * Checks whether or not there is a user currently logged in by checking window storage
 * for stored tokens. If not it will automatically request a guest user
 * @return {Boolean} true if there is a user logged in.
 */
export function isLoggedIn() {

  if (user_token) {
    journal.setAuthorization(user_token.base64);

    return journal.report({
      action: '#/user/current',
      data: {
        guest: false,
        _id: user_token._id
      }
    })
    .then(() => {return true;});
  }

  if (guest_token) {
    journal.setAuthorization(guest_token.base64);

    return journal.report({
      action: '#/user/current',
      data: {
        guest: true,
        _id: guest_token._id
      }
    })
    .then(() => {return false;});
  }


  // check local storage for a user login
  user_token = JSON.parse(window.localStorage.getItem("user_token"));

  if (user_token && user_token.base64) {
    journal.setAuthorization(user_token.base64);

    return journal.report({
      action: '#/user/current',
      data: {
        guest: false,
        _id: user_token._id
      }
    })
    .then(() => {return true;});
  }

  // check session storage for a user login
  user_token = JSON.parse(window.sessionStorage.getItem("user_token"));

  if (user_token && user_token.base64) {
    journal.setAuthorization(user_token.base64);

    return journal.report({
      action: '#/user/current',
      data: {
        guest: false,
        _id: user_token._id
      }
    })
    .then(() => {return true;});
  }

  // check session storage for a guest account
  guest_token = JSON.parse(window.sessionStorage.getItem("guest_token"));

  if (guest_token && guest_token.base64) {

    journal.setAuthorization(guest_token.base64);

    return journal.report({
      action: '#/user/current',
      data: {
        guest: true,
        _id: guest_token._id
      }
    })
    .then(() => {return false;});
  }

  // there is no record of a user or a guest on this computer that could
  // be found. so the only recourse is to report a guest account from the
  // server.
  return http.post('/api/user/guest')
  .then(function(res) {

    if (res.data.token) {
      guest_token = res.data.token;

      // only store guest users in session storage.
      window.sessionStorage.setItem("guest_token", JSON.stringify(guest_token));

      journal.setAuthorization(guest_token.base64);

      return journal.report({
        action: '#/user/current',
        data: {
          guest: true,
          _id: guest_token._id
        }
      })
      .then(() => {return false;});
    }
  })
  .catch(res => {
    if (res.data && res.data.error) {
      throw res.data.error;
    }

    throw res;
  });
}

export function register(user) {
  return http.post('/api/user', user)
  .then(res => {
    return res.data;
  })
  .catch(res => {
    if (res.data && res.data.error) {
      throw res.data.error;
    }

    throw res;
  });

};

export function login(data) {

  if (data.username && data.password) {
    return http.post('/api/user/token', data)
    .then(function(res) {

      if (res.data.token) {
        user_token = res.data.token;

        journal.setAuthorization(user_token.base64);
        journal.report({
          action: '#/user/current',
          data: {
            guest: false,
            _id: user_token._id
          }
        });

        if (data.rememberLogin) {
          window.localStorage.setItem("user_token", JSON.stringify(user_token));
        } else {
          window.sessionStorage.setItem("user_token", JSON.stringify(user_token));
        }

        if (guest_token) {
          return http.post('/api/user/merge', {
            fromToken: guest_token,
            toToken: user_token
          })
          .then(function() {
            guest_token = null;
            window.sessionStorage.removeItem('guest_token');
          });
        }
      }
    })
    .catch(res => {
      if (res.data && res.data.error) {
        throw res.data.error;
      }

      throw res;
    });
  }else if (data.googleCode){
    return http.post('/api/user/google/auth/token', {code: data.googleCode})
    .then(function(res) {
      if (res.data.token) {
        user_token = res.data.token;

        journal.setAuthorization(user_token.base64);

        journal.report({
          action: '#/user/current',
          data: {
            guest: false,
            _id: user_token._id
          }
        });

        if (data.rememberLogin) {
          window.localStorage.setItem("user_token", JSON.stringify(user_token));
        } else {
          window.sessionStorage.setItem("user_token", JSON.stringify(user_token));
        }

        if (guest_token) {
          return http.post('/api/user/merge', {
            fromToken: guest_token,
            toToken: user_token
          })
          .then(function() {
            guest_token = null;
            window.sessionStorage.removeItem('guest_token');
          });
        }
      }
    }).catch(function(res) {
      if (res.data && res.data.error) {
        throw res.data.error;
      }

      throw res;
    });
  }
}

/**
 * Completely logs user out, removing all stored tokens
 */
export function logout() {
  // logout also functions as complete reset to default values.
  user_token = null;
  guest_token = null;
  window.localStorage.removeItem('user_token');
  window.sessionStorage.removeItem('user_token');
  window.sessionStorage.removeItem('guest_token');

  journal.setAuthorization('');
  return journal.report({
    action: '#/user/current',
    data: {
      guest: false,
      _id: null
    }
  })
  .then(() => {isLoggedIn();});
  // will request a guest account for the remainder of the browser session

}

// check once on module loading
isLoggedIn()
.catch(function(error){
  journal.report({
    action: '#/error',
    data: error
  })
})

// define actions handled by this module
journal.report([{
  action: '#/user/register',
  definition: register
},{
  action: '#/user/login',
  definition: login
},{
  action: '#/user/logout',
  definition: logout
}]);
