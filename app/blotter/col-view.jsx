import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';
import ErrorBody from '../error-body';

export default React.createClass({
  render() {
    try{
      return (
        <Bootstrap.Col key={this.props.value.key} md={this.props.value.width} mdOffset={this.props.value.offset}>
          <Blot value={this.props.value.child} />
        </Bootstrap.Col>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
