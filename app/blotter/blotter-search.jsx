import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { Router, Route, Link, browserHistory  } from 'react-router';

export default React.createClass({
  getInitialState: function(){
    return {
      words: '',
      search : []
    };
  },
  componentWillMount: function(){
    // subscribe to a search using a variable name
    this.subscription = journal.subscribe({
      search: 'api/blotter/search?words={this.state.words}'
    }, state => {
      this.setState(state);
    }, this);

  },
  componentWillUnmount: function(){
    // cancel subscription when component goes away
    this.subscription.unsubscribe();
  },
  handleWords(event) {
    this.setState({
      words: event.target.value
    }, this.subscription.thisChanged);
  },
  handleSearch(event) {
    // state changed which will affect search query, so much update subscription too

  },
  render() {
    //var searchButton = <Bootstrap.Button onClick={this.handleSearch}>Search</Bootstrap.Button>;
    // display a blotter search box
    console.log(this.state);
    return (
      <div>
        <div style={{padding: '1em'}}>
          <Bootstrap.Row>
            <Bootstrap.Col md={2}>
              <Bootstrap.Input
                type="text"
                value={this.state.words}
                onChange={this.handleWords}
                //buttonAfter={searchButton}
              />
            </Bootstrap.Col>
          </Bootstrap.Row>
        </div>
        {this.state.search.map(blotter => {
          return (
            <div key={blotter._id} style={{padding: '1em'}}>
              <Link to={'/blotter/' + blotter._id}>{blotter.name}</Link>
            </div>
          );
        })}
      </div>
    );
  }
});
