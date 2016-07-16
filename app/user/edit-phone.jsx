"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import If from '../if';
import formatMessage from 'format-message';
import PhoneNumber from '../format/phone-number';
import * as journal from 'journal';
import editor from '../editor';
import Loading from '../loading';
import ErrorBody from '../error-body';

var phone_regex = /\b[0-9]{10}\b/;

export default React.createClass({
  getInitialState () {
    return {
      phoneStatus : 'error',
      processing: false
    };
  },
  componentWillMount: function(){
    this.editor = editor({
      // structure and labels of editable variables
      form: {
        number: "Phone Number",
        signin: "Use for multi-step sign-in",
        verified: ''
      },
      // callback for when there are edit events
      handler: newPhone => {
        this.setState({
          phone: newPhone,
          phoneStatus: phone_regex.test(newPhone.number.current) ? 'success' : 'error',
        });
      }
    });

    if (this.props.id){
      this.subscription = journal.subscribe({
        phone: 'api/phone/{this.props.id}'
      }, state => {
        this.editor.update(state.phone);

        this.setState({
          processing: false
        });

      }, this);
    }else{
      this.editor.update({
        number: "",
        signin: false,
        verified: false
      });

      this.setState({
        processing: false
      });
    }
  },
  componentWillUnmount: function(){
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  },
  handleSetPhone (event) {
    var that = this;

    event.preventDefault();

    this.setState({
      processing: true
    }, () => {
      if (!that.props.id){
        // create
        journal.report({
          action: 'api/phone/',
          data: that.editor.compile()
        })
        .catch(error => {
          return journal.report({
            action: '#/error',
            data: error
          });
        });
      }else {
        // update
        journal.report({
          action: 'api/phone/' + that.props.id,
          data: that.editor.compile()
        })
        .catch(error => {
          return journal.report({
            action: '#/error',
            data: error
          });
        });
      }
    });
  },
  componentWillReceiveProps(props) {
    if (props.id !== this.props.id) {
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }

      if (this.props.id){
        this.subscription = journal.subscribe({
          phone: 'api/phone/{this.props.id}'
        }, state => {

          this.setState({
            phone: this.editor.update(state.phone),
            phoneStatus: 'success',
            processing: false
          });

        }, this);
      }else{
        this.setState({
          phone: this.editor.update({
            number: "",
            signin: false,
            verified: false
          }),
          phoneStatus: 'error',
          processing: false
        });
      }
    }
  },
  handleSendCode() {
    var that = this;

    this.setState({
      processing: true
    }, () => {
      if (!that.props.id){
        // create
        journal.report({
          action: 'api/phone/',
          data: that.editor.compile()
        })
        .then(phone => {
          return journal.report({
            action: 'api/phone/' + phone.id + '/send-code-link',
            data: {}
          });
        })
        .catch(error => {
          return journal.report({
            action: '#/error',
            data: error
          });
        });
      }else {
        // update
        journal.report({
          action: 'api/phone/' + that.props.id,
          data: that.editor.compile()
        })
        .then(phone => {
          return journal.report({
            action: 'api/phone/' + this.props.id + '/send-code-link',
            data: {}
          });
        })
        .catch(error => {
          return journal.report({
            action: '#/error',
            data: error
          });
        });
      }
    });
  },
  render () {
    try{
      if (this.props.id && !this.state.phone) {
        return <Loading value="Phone"/>;
      }

      return (
        <div>
          <PhoneNumber
            onChange={this.state.phone.number.handler}
            value={this.state.phone.number.current}
            label={this.state.phone.number.label}
            bsStyle={this.state.phoneStatus}
            style={{backgroundColor : this.state.phone.number.edited ? '#FFE5C4' : '#ffffff'}}
            hasFeedback
          />
          <If condition={!this.state.phone.verified.current || this.state.phone.number.edited}>
            <span>This phone number is un-verified.</span>
          </If>
          <Bootstrap.ButtonInput
            onClick={this.handleSendCode}
            type="button"
            value={this.state.processing ? "Processing..." : this.state.phone.verified.current && !this.state.phone.address.edited ? "Phone Verified" : "Send Verification Link"}
            disabled={this.state.processing || this.state.phone.verified.current && !this.state.phone.number.edited || this.state.phoneStatus !== 'success'}
          />
          <Bootstrap.Input
            onClick={event => {
              this.state.phone.signin.handler(!this.state.phone.signin.current)
            }}
            type="checkbox"
            label={<span style={{backgroundColor : this.state.phone.signin.edited ? '#FFE5C4' : '#ffffff'}}>{this.state.phone.signin.label}</span>}
            checked={this.state.phone.signin.current}
            onChange={event => {}}
          />
          <Bootstrap.Well>
            {formatMessage({
              id: 'phone_multistep_info',
              default: 'Using a phone for a multi-step sign-in will send a sms text message with a verification code upon every future sign-in attempt. This may help keep this account more secure, or at least as secure as your phone.',
            })}
          </Bootstrap.Well>
          <Bootstrap.ButtonInput
            onClick={this.state.processing ? null : this.handleSetPhone}
            type="submit"
            value={this.state.processing ? "Processing..." : "Set Phone"}
            disabled={this.state.processing || this.state.phoneStatus !== 'success'}
            bsStyle={this.state.phone.edited ? "warning" : "default"}
          />
        </div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
