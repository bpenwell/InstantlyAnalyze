import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Header } from './Header';
import SamplePage from './MaterialUISamplePage';
import GraphAndTable from './ChartAndTable';

ReactDOM.render(
  <React.StrictMode>
    <SamplePage/>
    <GraphAndTable/>
  </React.StrictMode>,
  document.getElementById('root'),
)
 
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
