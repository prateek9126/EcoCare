import { Router } from 'express';
import { marketplaceController } from '../controllers/marketplaceController.js';

const router = Router();

// Listings: /api/marketplace/listings
router.post('/listings', (req, res) => marketplaceController.createListing(req, res));
router.get('/listings', (req, res) => marketplaceController.getListings(req, res));
router.get('/listings/:id', (req, res) => marketplaceController.getListingById(req, res));
router.put('/listings/:id', (req, res) => marketplaceController.updateListing(req, res));
router.delete('/listings/:id', (req, res) => marketplaceController.deleteListing(req, res));

// Passport Links: /api/marketplace/passport-links
router.post('/passport-links', (req, res) => marketplaceController.linkPassport(req, res));
router.post('/passport-links/send-otp', (req, res) => marketplaceController.sendPassportOtp(req, res));
router.post('/passport-links/verify', (req, res) => marketplaceController.verifyPassportOtp(req, res));

export default router;
