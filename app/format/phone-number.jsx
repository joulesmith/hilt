"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';

export default React.createClass({
  handleNumber(event) {

    var number = event.target.value;

    // strip out formatting.
    number = number.replace(/[^0-9]/g,'');

    if (number.length > 10) {
      number = number.slice(0,10);
    }

    this.props.onChange(number);
  },
  render: function() {

    var number = this.props.value;
    var formatted;
    // reformat progressively.
    if (!number || number.length === 0) {
      formatted = '(';
    }else if (number.length <= 3){
      formatted = '(' + number;
    }else if (number.length <= 6){
      formatted = '(' + number.slice(0,3) + ') ' + number.slice(3);
    }else if (number.length <= 10){
      formatted = '(' + number.slice(0,3) + ') ' + number.slice(3,6) + '-' + number.slice(6);
    }else{
      formatted = '(' + number.slice(0,3) + ') ' + number.slice(3,6) + '-' + number.slice(6, 10);
    }

    return (
      <Bootstrap.Input
        onChange={this.handleNumber}
        value={formatted}
        type="tel"
        label={this.props.label}
        bsStyle={this.props.bsStyle}
        style={this.props.style}
        hasFeedback={this.props.hasFeedback}
      />
    )
  }
});
