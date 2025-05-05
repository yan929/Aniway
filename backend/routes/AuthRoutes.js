import express from 'express';
import passport from 'passport';

const router = express.Router();

router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

router.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
    
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

router.get('/api/logout', (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).send('Logout failed');
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({});
    });
  });
});

export default router;