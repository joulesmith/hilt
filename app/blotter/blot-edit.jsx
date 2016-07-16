import Text from './text-edit';
import Col from './col-edit';
import Row from './row-edit';
import List from './list-edit';
import Image from './image-edit';
import ErrorBody from '../error-body';
import React from 'react';
import * as Bootstrap from 'react-bootstrap';

var types = {
  text: Text,
  col: Col,
  row: Row,
  list: List,
  image: Image
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
          text: ""
        });
      });
    }
  },
  handleImage(){
    if(this.props.onChange) {
      var that = this;

      this.props.keygen().then(key => {
        that.props.onChange({
          type: 'image',
          key: key,
          url: "",
          description: ""
        });
      });
    }
  },
  render() {
    try{
      if (!this.props.value || !this.props.value.type || !types[this.props.value.type]) {
        return (
          <Bootstrap.ButtonGroup>
            <Bootstrap.Button onClick={this.handleList} bsSize="xsmall">Create List</Bootstrap.Button>
            <Bootstrap.Button onClick={this.handleText} bsSize="xsmall">Create Text</Bootstrap.Button>
            <Bootstrap.Button onClick={this.handleImage} bsSize="xsmall">Create Image</Bootstrap.Button>
          </Bootstrap.ButtonGroup>
        );
      }

      return React.createElement(types[this.props.value.type], this.props);
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
