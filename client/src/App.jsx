import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Login from './pages/auth/Login';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import JsQrScannerPage from './pages/attendance/JsQrScannerPage';    

export default function App() {
  return (
    <Switch>
      <Route exact path="/login" component={Login} />
      <Route exact path="/js-scan" component={JsQrScannerPage} />
      <PrivateRoute path="/" component={Layout} />
      <Redirect to="/" />
    </Switch>
  );
}
