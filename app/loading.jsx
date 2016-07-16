"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import ErrorBody from 'error-body';

export default React.createClass({
  getInitialState(){
    return {
      ellipses: ''
    };
  },
  componentWillMount() {
    var that = this;
    this.ellipsesInterval = setInterval(function(){
      that.setState({
        ellipses: that.state.ellipses === '...' ? '' : that.state.ellipses + '.'
      });
    }, 333);
  },
  componentWillUnmount(){
    clearInterval(this.ellipsesInterval);
  },
  render () {
    try{
      return (
        <div>Loading {this.props.value ? this.props.value + this.state.ellipses : this.state.ellipses}</div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
