import Text from './text-edit';
import Col from './col-edit';
import Row from './row-edit';
import List from './list-edit';

import React from 'react';
import * as Bootstrap from 'react-bootstrap';

var types = {
  text: Text,
  col: Col,
  row: Row,
  list: List
};

export default React.createClass({
  handleList() {
    if(this.props.onChange) {
      var that = this;

      this.props.keygen().then(key => {
        that.props.onChange({
          type: 'list',
          key: key,
          child: []
        });
      });
    }
  },
  handleText() {
    if(this.props.onChange) {
      var that = this;

      this.props.keygen().then(key => {
        that.props.onChange({
          type: 'text',
          key: key,
          child: ""
        });
      });
    }
  },
  render() {

    if (!this.props.element || !this.props.element.type || !types[this.props.element.type]) {
      return (
        <Bootstrap.ButtonGroup>
          <Bootstrap.Button onClick={this.handleList}>Create List</Bootstrap.Button>
          <Bootstrap.Button onClick={this.handleText}>Create Text</Bootstrap.Button>
        </Bootstrap.ButtonGroup>
      );
    }

    return React.createElement(types[this.props.element.type], this.props);

  }
});
