import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from './journal';

export default React.createClass({
  getInitialState(){
    return {
      processing: false,
      start: 0
    };
  },
  handleReport(event) {
    event.preventDefault();
    var that = this;

    this.setState({
      processing: true,
      start: Date.now()
    }, () => {
      journal.report(this.props.report)
      .then(result => {
        that.setState({
          processing: false,
          start: 0
        });

        if (this.props.resolve){
          this.props.resolve(result);
        }
      })
      .catch(err => {
        that.setState({
          processing: false,
          start: 0
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
      if (this.props.progressValue) {
        if (typeof this.props.progressValue === 'function') {
          value = this.props.progressValue(Date.now() - this.state.start);
        }else{
          value = this.props.progressValue;
        }
      }else{
        value = 'Reporting...'
      }

    }else{
      value = this.props.value ? this.props.value : 'Report';
    }

    return (
      <Bootstrap.Button
        onClick={this.handleReport}
        bsStyle={this.props.bsStyle}
        style={{
          display: 'inline'
        }}
        disabled={this.state.processing || this.props.disabled}
      >{value}</Bootstrap.Button>
    );
  }
});
