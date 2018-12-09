import React, { Component } from 'react';

import './App.css';

import BubbleChart from './components/BubbleChart';

class App extends Component {
  render() {
    return (
      <div className="App">
        <BubbleChart />
      </div>
    );
  }
}

export default App;
