import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected route: requires login; optional roles (e.g. super_admin, admin).
 */
export default function PrivateRoute({ component: Component, roles, path, exact }) {
  var auth = useAuth();
  var user = auth.user;
  var loading = auth.loading;

  return (
    <Route
      path={path}
      exact={exact}
      render={function (routeProps) {
        if (loading) {
          return (
            <div className="p-5 text-center text-muted">
              Loading…
            </div>
          );
        }
        if (!user) {
          return <Redirect to="/login" />;
        }
        if (roles && roles.indexOf(user.role) === -1) {
          return <Redirect to="/" />;
        }
        return <Component {...routeProps} />;
      }}
    />
  );
}
