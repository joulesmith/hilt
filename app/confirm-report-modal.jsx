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
  handleShow (event) {
    this.setState({show: true});
  },
  handleReport(event) {
    event.preventDefault();
    var that = this;

    this.setState({
      processing: true
    }, () => {
      journal.report(this.props.report)
      .then(result => {
        that.setState({
          processing: false,
          show:false
        });

        if (this.props.resolve){
          this.props.resolve(result);
        }
      })
      .catch(err => {
        that.setState({
          processing: false,
          show:false
        });

        if (this.props.reject){
          this.props.reject(err);
        }

      });
    });

  },
  handleHide: function() {
    this.setState({show: false});
  },
  render: function() {
    var value;

    if (this.state.processing) {
      value = this.props.progressValue ? this.props.progressValue : 'Reporting...';
    }else{
      value = this.props.value ? this.props.value : 'Report';
    }

    return (
      <span>
        <Button
          onClick={this.handleShow}
        >
          {value}
        </Button>
        <Modal show={this.state.show} onHide={this.handleHide}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Footer>
            <Button onClick={this.handleReport} disabled={this.state.processing}>{value}</Button>
            <Button onClick={this.handleHide}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </span>
    );

  }
});
