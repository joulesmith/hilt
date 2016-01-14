import React from 'react';
import { Router, Route, Link, browserHistory  } from 'react-router';


import Navbar from './navbar';
import RegisterModal from './user/register-modal';

import ErrorModal from './error-modal';
import NoMatch from './no-match';
import Home from './home';
import RegisterBody from './user/register-body';
import Settings from './user/settings';

import './css/bootstrap.css';

export default React.createClass({
  render: function() {
    var brand = {
      name: document.title,
      url: '#'
    };
    var links = [];

    return (
      <div>
        <Navbar brand={brand} links={links}></Navbar>
        <Router history={browserHistory}>
          <Route path="/" component={Home}>
            <Route path="/settings" component={Settings} />
            <Route path="/register" component={RegisterBody} />
            <Route path="*" component={NoMatch}/>
          </Route>
        </Router>
        <RegisterModal></RegisterModal>
        <ErrorModal></ErrorModal>
      </div>
    );
  }
});
