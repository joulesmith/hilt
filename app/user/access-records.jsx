import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { Router, Route, Link, browserHistory  } from 'react-router';
import Loading from '../loading';
import SigninRequired from '../signin-required';
import ErrorBody from '../error-body';

export default React.createClass({
  getInitialState: function(){
    return {
    };
  },
  componentWillMount: function(){
    // subscribe to a specific profile
    this.subscription = journal.subscribe({
      currentUser: '#/user/current',
      accessRecords: 'api/user/{currentUser._id}/records/'
    }, state => {
      this.setState(state);
    }, this);

  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  render() {
      try{
      if (!this.state.currentUser || !this.state.currentUser._id || this.state.currentUser.guest){
        return <SigninRequired value='access records' />;
      }

      if (!this.state.accessRecords) {
        return <Loading value='access records' />;
      }

      var models = [];

      for (var model in this.state.accessRecords) {
        var records = this.state.accessRecords[model].id.map((id, idIndex) => {
          return (
            <li key={id}>
              <Link  to={'/' + model + '/' + id}>{id}</Link>
              ({this.state.accessRecords[model].actions[idIndex].map((action, actionIndex) => {
                return (
                  <span key={action}>{action}{actionIndex !== this.state.accessRecords[model].actions[idIndex].length-1 ? ', ' : ''}</span>
                );
              })})
            </li>
          );
        });

        models.push(
          <Bootstrap.Well key={model}>
            <Bootstrap.Row>
              <Bootstrap.Col xsOffset={1}>
                {model}
              </Bootstrap.Col>
            </Bootstrap.Row>
            <Bootstrap.Row>
              <Bootstrap.Col xsOffset={1}>
                <ul>
                  {records}
                </ul>
              </Bootstrap.Col>
            </Bootstrap.Row>
          </Bootstrap.Well>
        );
      }

      return (
        <div>
          {models}
        </div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
