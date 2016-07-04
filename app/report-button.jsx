import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from './journal';

export default React.createClass({
  getInitialState(){
    return {
      processing: false
    };
  },
  handleReport(event) {
    event.preventDefault();
    var that = this;

    this.setState({
      processing: true
    }, () => {
      journal.report(this.props.value)
      .then(result => {
        that.setState({
          processing: false
        });

        if (this.props.resolve){
          this.props.resolve(result);
        }
      })
      .catch(err => {
        that.setState({
          processing: false
        });

        if (this.props.reject){
          this.props.reject(err);
        }

      });
    });

  },
  render() {
    var value;

    if (this.state.processing) {
      value = this.props.reporting ? this.props.reporting : 'Reporting...';
    }else{
      value = this.props.name ? this.props.name : 'Report';
    }

    return (
      <Bootstrap.Button
        onClick={this.handleReport}
        bsStyle={this.props.bsStyle}
        style={{
          display: 'inline'
        }}
        disabled={this.state.processing}
      >{value}</Bootstrap.Button>
    );
  }
});
