import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import ErrorBody from '../error-body';

export default React.createClass({
  render() {
    try{
      return <Bootstrap.Image src={this.props.value.url} alt={this.props.value.description} responsive/>;
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
