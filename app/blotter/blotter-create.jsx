import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { hashHistory } from 'react-router';

export default React.createClass({
  getInitialState: function(){
    return {
      name: '',
      processing: false
    };
  },
  handleName(event){
    this.setState({
      name: event.target.value,
    })
  },
  handleCreate() {
    this.setState({
      processing: true
    }, () => {
      journal.report({
        action: 'api/blotter/',
        data: {
          name: this.state.name
        }
      })
      .then(blotter => {
        hashHistory.push("/blotter/" + blotter._id + "/edit");
      });
    });
  },
  render() {

    return (
      <form>
        <Bootstrap.Input type='text' value={this.state.name} onChange={this.handleName} />
        <Bootstrap.ButtonInput
          onClick={this.state.processing ? null : this.handleCreate}
          value={this.state.processing ? "Processing..." : "New Blotter"}
        >
        </Bootstrap.ButtonInput>
      </form>
    );
  }
});
