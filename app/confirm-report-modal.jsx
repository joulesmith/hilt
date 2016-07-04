"use strict";

import React from 'react';
import {subscribe, publish} from 'journal';
import {Modal, Button} from 'react-bootstrap';
import ErrorBody from 'error-body';
import * as journal from './journal';

export default React.createClass({
  getInitialState: function(){
    return {
      show: false,
      processing: false
    };
  },
  handleRequest (event) {
    this.setState({show: true});
  },
  handleReport(event) {
    var that = this;

    this.setState({
      processing: true
    }, () => {
      journal.report(this.props.value)
      .then(result => {
        that.setState({
          processing: false,
          show: false
        });

        if (this.props.resolve){
          this.props.resolve(result);
        }
      })
      .catch(err => {
        that.setState({
          processing: false,
          show: false
        });

        if (this.props.reject){
          this.props.reject(err);
        }

      });
    });

  },
  handleDismiss: function() {
    this.setState({show: false});
  },
  render: function() {
    var value;

    if (this.state.processing) {
      value = this.props.reporting ? this.props.reporting : 'Reporting...';
    }else{
      value = this.props.request ? this.props.request : 'Report';
    }

    return (
      <span>
        <Button
          onClick={this.handleRequest}
        >
          {this.props.request}
        </Button>
        <Modal show={this.state.show} onHide={this.handleDismiss}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Footer>
            <Button onClick={this.handleReport} disabled={this.state.processing}>{value}</Button>
            <Button onClick={this.handleDismiss}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </span>
    );

  }
});
