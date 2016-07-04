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

        if (this.props.onResolve){
          this.props.onResolve(result);
        }
      })
      .catch(err => {
        that.setState({
          processing: false
        });

        if (this.props.onReject){
          this.props.onReject(err);
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
      <Bootstrap.ButtonInput
        onClick={this.handleReport}
        bsStyle={this.props.bsStyle}
        style={{
          display: 'inline'
        }}
        value={value}
        disabled={this.state.processing}
      ></Bootstrap.ButtonInput>
    );
  }
});
