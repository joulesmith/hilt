"use strict";
// first thing to actually be run in the app
import React from 'react';
import ReactDom from 'react-dom';
import { Router, Route, Link, browserHistory  } from 'react-router';
import './css/bootstrap.css';
import * as journal from './journal';

import user from 'user';
import * as fileUpload from './actions/file-upload';
import locale from './locale';
import Navbar from './navbar';
import RegisterModal from './user/register-modal';

import ErrorModal from './error-modal';
import NoMatch from './no-match';
import Home from './home';
import RegisterBody from './user/register-body';
import Settings from './user/settings';

import BlotterCreate from './blotter/blotter-create';
import BlotterView from './blotter/blotter-view';
import BlotterEdit from './blotter/blotter-edit';
import BlotterSearch from './blotter/blotter-search';

var Root = React.createClass({
  getInitialState: function(){
    return {

    };
  },
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

            <Route path="/blotter" component={BlotterCreate} />
            <Route path="/blotter/search" component={BlotterSearch} />
            <Route path="/blotter/:id" component={BlotterView} />
            <Route path="/blotter/:id/edit" component={BlotterEdit} />


            <Route path="*" component={NoMatch}/>
          </Route>
        </Router>

        <RegisterModal></RegisterModal>
        <ErrorModal></ErrorModal>
      </div>
    );
  }
});

ReactDom.render(
  <Root></Root>,
  document.getElementById('react_root')
);
