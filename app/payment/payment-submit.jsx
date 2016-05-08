"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import braintree from 'braintree-web';
import * as journal from '../journal';
import PaymentMethod from './payment-method';
import * as Bootstrap from 'react-bootstrap';

import editor from '../editor';

export default React.createClass({
  componentWillMount() {
    this.editor = editor({
      // structure and labels of editable variables
      form: {
        amount: {
          label: "Amount",
          format: value => {
            return value.toFixed(2);
          },
          parse: value => {
            return parseFloat(value);
          },
          validate: value => {
            value = value.replace(/[^0-9\.]/g, '');

            var parts = value.split('.');

            if (parts.length > 1) {
              return parts[0] + '.' + parts[1].slice(0,2);
            }

            return value;
          }
        },
        recipient: "Recipient",
        transaction_id: 'Transaction ID'
      },
      // callback for when there are edit events
      handler: newPayment => {
        this.setState({
          payment: newPayment
        });
      }
    });

    if (this.props.id){
      this.subscription = journal.subscribe({
        payment: 'api/payment/' + this.props.id
      }, state => {

        this.editor.update(state.payment);

        this.setState({
          processing: false
        });

      }, this);
    }else{
      this.editor.update({
        amount: 0,
        recipient: this.props.recipient,
        transaction_id: ''
      });

      this.setState({
        processing: false
      });
    }
  },
  componentWillUnmount() {
    if (this.subscription){
      this.subscription.unsubscribe();
    }
  },
  handlePaymentMethod(paymentMethod){
    var that = this;

    if (this.props.id) {
      journal.report({
        action: 'api/payment/' + this.props.id,
        data: that.editor.compile()
      })
      .then(payment => {
        return journal.report({
          action: 'api/payment/' + payment._id + '/submit',
          data: {
            paymentMethodNonce: paymentMethod.nonce
          }
        });
      })
      .catch(error => {
        journal.report({
          action: '#/error',
          data: error
        });
      });
    }else{
      journal.report({
        action: 'api/payment',
        data: that.editor.compile()
      })
      .then(payment => {
        return journal.report({
          action: 'api/payment/' + payment._id + '/submit',
          data: {
            paymentMethodNonce: paymentMethod.nonce
          }
        })
      })
      .then(payment => {
        this.subscription = journal.subscribe({
          payment: 'api/payment/' + payment._id
        }, state => {

          this.editor.update(state.payment);

          this.setState({
            processing: false
          });

        }, this);
      })
      .catch(error => {
        journal.report({
          action: '#/error',
          data: error
        });
      });
    }

  },
  handleReady(){
    this.setState({
      ready: true
    });
  },
  handleError(error) {

    journal.report({
      action: '#/error',
      data: error
    });

  },
  render: function() {
    if (this.state.payment.transaction_id.current !== '') {
      return (
        <div>You have made a payment of ${this.state.payment.amount.current}.</div>
      );
    }

    return (
      <form>
        <label>Payment Method</label>
        <PaymentMethod
          onPaymentMethodReceived={this.handlePaymentMethod}
          onError={this.handleError}
          onReady={this.handleReady}
        ></PaymentMethod>
        <Bootstrap.Input
          onChange={this.state.payment.amount.handler}
          value={this.state.payment.amount.current}
          type="text"
          label={this.state.payment.amount.label}
        />
        <Bootstrap.ButtonInput
          type="submit"
          value={this.state.payment.transaction_id.current ? 'Payment Submitted' : this.state.processing ? 'Processing...' : 'Submit Payment of $' + this.state.payment.amount.current}
          disabled={this.state.processing || !this.state.ready}
        />
      </form>
    );
  }
});
