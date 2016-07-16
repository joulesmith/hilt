import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { hashHistory } from 'react-router';
import ErrorBody from '../error-body';

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
  handleCreate(event) {
    event.preventDefault();

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
    try{
      return (
        <form>
          <Bootstrap.Input type='text' value={this.state.name} onChange={this.handleName} />
          <Bootstrap.ButtonInput
            onClick={this.state.processing ? null : this.handleCreate}
            value={this.state.processing ? "Processing..." : "New Blotter"}
            type="submit"
          >
          </Bootstrap.ButtonInput>
        </form>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
