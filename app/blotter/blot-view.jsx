import Text from './text-view';
import Col from './col-view';
import Row from './row-view';
import List from './list-view';
import Image from './image-view';
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
  render() {
    try{
      if (!this.props.value || !this.props.value.type || !types[this.props.value.type]) {
        return <span></span>;
      }

      return React.createElement(types[this.props.value.type], this.props);
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
