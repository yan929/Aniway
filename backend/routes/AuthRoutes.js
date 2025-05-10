import express from 'express';
import passport from 'passport';

const router = express.Router();
const FRONTEND_URL = 'http://localhost:5173';

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/login` }),
  (req, res) => {
    const userId = req.user.id || req.user._id || '';
    res.redirect(`${FRONTEND_URL}/profile/${userId}`);
  }
);

router.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    // Return user information if authenticated
    res.json({
      id: req.user.id,
      name: req.user.displayName,
      avatar: req.user.photos?.[0]?.value || '',
      email: req.user.emails?.[0]?.value || ''
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

router.get('/api/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).send('Logout failed');
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect(`${FRONTEND_URL}/login`);
    });
  });
});

export default router;
