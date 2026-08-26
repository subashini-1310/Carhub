const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { 
  getPendingInspections, 
  getAllCarsForAdmin, 
  runAIInspectionScan, 
  purchaseAndPublishCar, 
  updateCarByAdmin, 
  getReportsAndStats,
  getAdminUsers,
  deleteCarByAdmin,
  deleteUserByAdmin
} = require('../controllers/adminController');

// Enforce JWT Auth & Admin Role Check for all Administrative API routes
router.use(protect);
router.use(requireRole('Admin'));

router.get('/pending-inspections', getPendingInspections);
router.get('/cars', getAllCarsForAdmin);
router.get('/users', getAdminUsers);
router.delete('/users/:id', deleteUserByAdmin);
router.post('/ai-inspect/:id', runAIInspectionScan);
router.post('/purchase-and-publish/:id', purchaseAndPublishCar);
router.put('/update-car/:id', updateCarByAdmin);
router.delete('/cars/:id', deleteCarByAdmin);
router.get('/reports', getReportsAndStats);

module.exports = router;
