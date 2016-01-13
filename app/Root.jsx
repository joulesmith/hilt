import React from 'react';
import { Router, Route, Link, browserHistory  } from 'react-router';


import Navbar from 'Navbar';
import RegisterModal from './user/RegisterModal';

import ErrorModal from 'ErrorModal';
import NoMatch from 'NoMatch';
import Index from 'Index';
import RegisterBody from './user/RegisterBody';
import Settings from './user/Settings';

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
          <Route path="/" component={Index}>
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
