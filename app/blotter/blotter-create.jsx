import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { hashHistory } from 'react-router';

export default React.createClass({
  getInitialState: function(){
    return {
      name: ''
    };
  },
  handleName(event){
    this.setState({
      name: event.target.value,
    })
  },
  handleCreate() {
    journal.report({
      action: 'api/blotter/',
      data: {
        name: this.state.name
      }
    })
    .then(blotter => {
      hashHistory.push("/blotter/" + blotter._id + "/edit");
    });
  },
  render() {

    return (
      <div>
        <Bootstrap.Input type='text' value={this.state.name} onChange={this.handleName} />
        <Bootstrap.Button onClick={this.handleCreate}>Create</Bootstrap.Button>
      </div>
    );
  }
});
