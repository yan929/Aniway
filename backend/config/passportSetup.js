import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

const configureGoogleStrategy = (passport) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ google_id: profile.id });

          if (!user) {
            user = new User({
              google_id: profile.id,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value || "",
              email: profile.emails?.[0]?.value || "",
            });
            await user.save();
          }

          return done(null, {
            id: profile.id,
            displayName: profile.displayName,
            photos: profile.photos,
            emails: profile.emails,
            accessToken,
          });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findOne({ google_id: id });

      if (user) {
        done(null, {
          id: user.google_id,
          displayName: user.name,
          avatar: user.avatar,
          email: user.email,
        });
      } else {
        done(new Error("User not found"), null);
      }
    } catch (error) {
      done(error, null);
    }
  });
};

export default configureGoogleStrategy;
