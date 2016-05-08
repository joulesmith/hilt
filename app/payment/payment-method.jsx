"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import braintree from 'braintree-web';
import * as journal from '../journal';

export default React.createClass({
  componentDidMount() {
    var that = this;
    // get client token and setup braintree-web
    journal.get({
      clientToken: 'api/payment/client-token'
    }, state => {
      braintree.setup(
        state.clientToken,
        'dropin',
        {
          container: ReactDOM.findDOMNode(this),
          onReady: integration => {
            that.integration = integration;
            that.props.onReady ? that.props.onReady() : '';
          },
          onPaymentMethodReceived: that.props.onPaymentMethodReceived,
          onError: that.props.onError
        }
      );
    });
  },
  componentWillUnmount() {
    this.integration ? this.integration.teardown(() => {
      // braintree.setup can safely be run again!
      this.integration = null;
    }) : '';
  },
  render: function() {
    return <div></div>;
  }
});
