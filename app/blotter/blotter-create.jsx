import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';



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
  handleSave() {
    journal.report({
      action: 'api/blotter/',
      data: {
        name: this.state.name
      }
    });
  },
  render() {

    return (
      <div>
        <Bootstrap.Input type='text' value={this.state.name} onChange={this.handleName} />
        <Bootstrap.Button onClick={this.handleSave}>Create</Bootstrap.Button>
      </div>
    );
  }
});
