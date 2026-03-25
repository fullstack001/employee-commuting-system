import React from 'react';
import { NavLink, Switch, Route, Redirect, useHistory } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Dashboard from '../pages/dashboard/Dashboard';
import UnitsPage from '../pages/units/UnitsPage';
import PositionsPage from '../pages/positions/PositionsPage';
import MembersPage from '../pages/members/MembersPage';
import MemberDetail from '../pages/members/MemberDetail';
import ScannerPage from '../pages/attendance/ScannerPage';
import ManualAttendancePage from '../pages/attendance/ManualAttendancePage';
import DailyAttendancePage from '../pages/attendance/DailyAttendancePage';
import ReportsPage from '../pages/reports/ReportsPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  var auth = useAuth();
  var user = auth.user;
  var logout = auth.logout;
  var isSuperAdmin = auth.isSuperAdmin;
  var isAdmin = auth.isAdmin;
  var isUserRole = auth.isUserRole;
  var history = useHistory();

  function handleLogout() {
    logout();
    history.push('/login');
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-2 col-lg-2 ecs-sidebar p-0">
          <div className="ecs-brand">Commute</div>
          <nav className="px-2 pb-4">
            <NavLink exact to="/" activeClassName="active" className="d-block rounded px-3 py-2">
              Dashboard
            </NavLink>
            {!isUserRole && (
              <>
                <NavLink to="/units" activeClassName="active" className="d-block rounded px-3 py-2">
                  Units
                </NavLink>
                <NavLink to="/positions" activeClassName="active" className="d-block rounded px-3 py-2">
                  Positions
                </NavLink>
                <NavLink to="/members" activeClassName="active" className="d-block rounded px-3 py-2">
                  Members
                </NavLink>
              </>
            )}
            {isAdmin && (
              <>
                <NavLink to="/attendance/scan" activeClassName="active" className="d-block rounded px-3 py-2">
                  Scanner
                </NavLink>
                <NavLink to="/attendance/manual" activeClassName="active" className="d-block rounded px-3 py-2">
                  Manual
                </NavLink>
              </>
            )}
            <NavLink to="/attendance/daily" activeClassName="active" className="d-block rounded px-3 py-2">
              Daily attendance
            </NavLink>
            {!isUserRole && (
              <NavLink to="/reports" activeClassName="active" className="d-block rounded px-3 py-2">
                Reports
              </NavLink>
            )}
            <NavLink to="/analytics" activeClassName="active" className="d-block rounded px-3 py-2">
              Analytics
            </NavLink>
            {isSuperAdmin && (
              <NavLink to="/settings" activeClassName="active" className="d-block rounded px-3 py-2">
                Settings
              </NavLink>
            )}
          </nav>
        </div>
        <div className="col-md-10 col-lg-10 ecs-main">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <strong>{user && user.name}</strong>
              <span className="text-muted ms-2 small">
                {user && user.role ? user.role.replace('_', ' ') : ''}
              </span>
            </div>
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
          <Switch>
            <Route exact path="/" component={Dashboard} />
            <PrivateRoute exact path="/units" component={UnitsPage} roles={['super_admin', 'admin']} />
            <PrivateRoute exact path="/positions" component={PositionsPage} roles={['super_admin', 'admin']} />
            <PrivateRoute exact path="/members" component={MembersPage} roles={['super_admin', 'admin']} />
            <PrivateRoute path="/members/:id" component={MemberDetail} roles={['super_admin', 'admin']} />
            <PrivateRoute path="/attendance/scan" component={ScannerPage} roles={['super_admin', 'admin']} />
            <PrivateRoute path="/attendance/manual" component={ManualAttendancePage} roles={['super_admin', 'admin']} />
            <Route path="/attendance/daily" component={DailyAttendancePage} />
            <PrivateRoute exact path="/reports" component={ReportsPage} roles={['super_admin', 'admin']} />
            <Route path="/analytics" component={AnalyticsPage} />
            <PrivateRoute path="/settings" component={SettingsPage} roles={['super_admin']} />
            <Redirect to="/" />
          </Switch>
        </div>
      </div>
    </div>
  );
}
