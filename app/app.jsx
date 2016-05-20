"use strict";
// first thing to actually be run in the app
import React from 'react';
import ReactDom from 'react-dom';
import { Router, Route, Link, browserHistory, hashHistory } from 'react-router';
import './css/bootstrap.css';
import * as journal from './journal';

import user from 'user';

import locale from './locale';
import Navbar from './navbar';
import RegisterModal from './user/register-modal';

import ErrorModal from './error-modal';
import NoMatch from './no-match';
import Home from './home';
import RegisterBody from './user/register-body';
import UserSettings from './user/settings';
import SiteSettings from './admin/settings';

import AccessRecords from './user/access-records';
import BlotterCreate from './blotter/blotter-create';
import BlotterView from './blotter/blotter-view';
import BlotterEdit from './blotter/blotter-edit';
import BlotterSearch from './blotter/blotter-search';

import PaymentCreate from './payment/payment-create';

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
    var links = [{
      href: "#/blotter",
      name: "Create Blotter"
    },{
      href: "#/blotter/search",
      name: "Search Blotters"
    }];

    return (
      <div>
        <Navbar brand={brand} links={links}></Navbar>
        <Router history={hashHistory}>
          <Route path="/" component={Home}>
            <Route path="/site-settings" component={SiteSettings} />
            <Route path="/user-settings" component={UserSettings} />
            <Route path="/register" component={RegisterBody} />
            <Route path="/records" component={AccessRecords} />

            <Route path="/blotter" component={BlotterCreate} />
            <Route path="/blotter/search" component={BlotterSearch} />
            <Route path="/blotter/:id" component={BlotterView} />
            <Route path="/blotter/:id/edit" component={BlotterEdit} />

            <Route path="/payment/:recipient" component={PaymentCreate} />

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
