import React from 'react';
import * as journal from '../journal';
import ErrorBody from '../error-body';

export default React.createClass({
  componentWillMount: function(){
    // subscribe to a specific instance
    this.subscription = journal.subscribe({
      crud: 'api/crud/{this.props.params.id}'
    }, state => {
      this.setState(state);
    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  render() {
    try{
      if (!this.state || !this.state.crud){
        return (<div></div>);
      }

      return (
        <pre>
          {JSON.stringify(this.state.crud.data || {})}
        </pre>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
