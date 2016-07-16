"use strict";

import React from 'react';
import {subscribe, publish} from 'journal';
import {Modal, Button} from 'react-bootstrap';
import ErrorBody from 'error-body';
import * as journal from './journal';
import ErrorBody from 'error-body';

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
    try{
      var value;

      if (this.state.processing) {
        value = this.props.progressValue ? this.props.progressValue : 'Reporting...';
      }else{
        value = this.props.children + '' || this.props.value || 'Report';
      }

      return (
        <Button
          onClick={this.handleShow}
        >
          {value}
          <Modal show={this.state.show} onHide={this.handleHide}>
            <Modal.Header closeButton>
              <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Footer>
              <Button onClick={this.handleReport} disabled={this.state.processing}>{value}</Button>
              <Button onClick={this.handleHide}>Cancel</Button>
            </Modal.Footer>
          </Modal>
        </Button>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
