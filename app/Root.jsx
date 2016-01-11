import React from 'react';
import { Router, Route, Link, browserHistory  } from 'react-router';


import Navbar from 'Navbar';
import RegisterModal from './user/RegisterModal';

import ErrorModal from 'ErrorModal';
import Index from 'Index';
import RegisterBody from './user/RegisterBody';

import './css/bootstrap.css';

export default React.createClass({
  render: function() {
    var brand = {
      name: 'My Site',
      url: '#'
    };
    var links = [];

    return (
      <div>
        <Navbar brand={brand} links={links}></Navbar>
        <Router history={browserHistory}>
          <Route path="/" component={Index}>
            <Route path="/register" component={RegisterBody} />
          </Route>
        </Router>
        <RegisterModal></RegisterModal>
        <ErrorModal></ErrorModal>
      </div>
    );
  }
});
