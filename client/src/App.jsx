import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Login from './pages/auth/Login';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Switch>
      <Route exact path="/login" component={Login} />
      <PrivateRoute path="/" component={Layout} />
      <Redirect to="/" />
    </Switch>
  );
}
