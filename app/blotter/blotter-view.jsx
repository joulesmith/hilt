import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { Router, Route, Link, browserHistory  } from 'react-router';
import Blot from './blot-view';


export default React.createClass({
  getInitialState: function(){
    return {
      blotter: {
        name : '',
        main : {}
      }
    };
  },
  componentWillMount: function(){
    // subscribe to a specific profile
    this.subscription = journal.subscribe({
      blotter: 'api/blotter/{this.props.params.id}/primary'
    }, state => {
      this.setState(state);
    }, this);

  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  render() {

    return (
      <div>
        <Link to={'/blotter/' + this.state.blotter._id}>{this.state.blotter.name}</Link> (<Link to={'/blotter/' + this.state.blotter._id + '/edit'}>edit</Link>)
        <Blot value={this.state.blotter.main} />
      </div>
    );
  }
});
