import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';
import ErrorBody from '../error-body';

export default React.createClass({
  render() {
    try{
      return (
        <Bootstrap.Row key={this.props.value.key}>
          {this.props.value.child.map(column => {
            return <Blot key={column.key} value={column} />;
          })}
        </Bootstrap.Row>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
