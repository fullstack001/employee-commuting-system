import axios from 'axios';

function getApiBase() {
  var env = process.env.REACT_APP_API_URL;
  if (env) {
    return env.replace(/\/$/, '') + '/api';
  }
  return '/api';
}

const api = axios.create({
  baseURL: getApiBase(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(function (config) {
  var token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

export default api;

export function assetUrl(relativePath) {
  if (!relativePath) return '';
  if (relativePath.indexOf('http') === 0) return relativePath;
  var env = process.env.REACT_APP_API_URL;
  if (env) {
    var base = env.replace(/\/api\/?$/, '');
    return base + '/' + relativePath.replace(/^\//, '');
  }
  return '/' + relativePath.replace(/^\//, '');
}
