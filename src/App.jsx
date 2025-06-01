import React from 'react';

import AuthElements from './firebaseAuth';
import './App.css';
import './exp.css';

function App() {
  return (
    <>
      <div className="App">
        <AuthElements.AppLogin />
      </div> 
    </>
  );
}

export default App;
