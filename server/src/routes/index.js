const express = require('express');
const { auth } = require('../middlewares/auth');
const { allowRoles } = require('../middlewares/role');
const { upload } = require('../middlewares/upload');

const authController = require('../controllers/authController');
const unitsController = require('../controllers/unitsController');
const positionsController = require('../controllers/positionsController');
const membersController = require('../controllers/membersController');
const attendanceController = require('../controllers/attendanceController');
const reportsController = require('../controllers/reportsController');
const analyticsController = require('../controllers/analyticsController');
const settingsController = require('../controllers/settingsController');

const router = express.Router();

router.post('/auth/login', authController.login);
router.get('/auth/me', auth, authController.me);

router.get('/settings', auth, settingsController.get);
router.put('/settings', auth, allowRoles('super_admin'), settingsController.update);

router.get('/units', auth, unitsController.list);
router.post('/units', auth, allowRoles('super_admin', 'admin'), unitsController.create);
router.put('/units/:id', auth, allowRoles('super_admin', 'admin'), unitsController.update);
router.delete('/units/:id', auth, allowRoles('super_admin', 'admin'), unitsController.remove);

router.get('/positions', auth, positionsController.list);
router.post('/positions', auth, allowRoles('super_admin', 'admin'), positionsController.create);
router.put('/positions/:id', auth, allowRoles('super_admin', 'admin'), positionsController.update);
router.delete('/positions/:id', auth, allowRoles('super_admin', 'admin'), positionsController.remove);

router.get('/members', auth, membersController.list);
router.get('/members/:id', auth, membersController.getOne);
router.get('/members/:id/qrcode', auth, membersController.qrcodeFile);
router.post(
  '/members',
  auth,
  allowRoles('super_admin', 'admin'),
  upload.single('profileImage'),
  membersController.create
);
router.put(
  '/members/:id',
  auth,
  allowRoles('super_admin', 'admin'),
  upload.single('profileImage'),
  membersController.update
);
router.delete('/members/:id', auth, allowRoles('super_admin', 'admin'), membersController.remove);

router.post('/attendance/scan', auth, allowRoles('super_admin', 'admin'), attendanceController.scan);
router.post(
  '/attendance/manual',
  auth,
  allowRoles('super_admin', 'admin'),
  attendanceController.manual
);
router.get('/attendance', auth, attendanceController.list);
router.get('/attendance/daily', auth, attendanceController.daily);
router.get('/attendance/member/:memberId', auth, attendanceController.byMember);
router.get('/attendance/unit/:unitId', auth, attendanceController.byUnit);

router.get('/reports/daily', auth, reportsController.daily);
router.get('/reports/monthly', auth, reportsController.monthly);
router.get('/reports/unit/:unitId', auth, reportsController.unitReport);
router.get('/reports/late-members', auth, reportsController.lateMembers);
router.get('/reports/export/excel', auth, reportsController.exportExcel);
router.get('/reports/export/pdf', auth, reportsController.exportPdf);

router.get('/analytics/dashboard', auth, analyticsController.dashboard);
router.get('/analytics/unit-summary', auth, analyticsController.unitSummary);
router.get('/analytics/monthly-trend', auth, analyticsController.monthlyTrend);
router.get('/analytics/late-summary', auth, analyticsController.lateSummary);

module.exports = router;
