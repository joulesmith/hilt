"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import braintree from 'braintree-web';
import journal from '../journal';
import PaymentSubmit from './payment-submit';

export default React.createClass({
  componentWillMount() {

  },
  componentWillUnmount() {

  },
  render: function() {
    return <PaymentSubmit recipient={this.props.params.recipient}></PaymentSubmit>;
  }
});
