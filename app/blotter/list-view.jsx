import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';
import ErrorBody from '../error-body';

export default React.createClass({
  render() {
    try{
      return (
        <div key={this.props.value.key}>
          {this.props.value.child.map(row => {
            return <Blot key={row.key} value={row} />;
          })}
        </div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
