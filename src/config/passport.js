// // config/passport.js

// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// // import { Strategy as FacebookStrategy } from "passport-facebook";
// import AgriEstateUser from "../models/user/user.model.js";

// // 1. GOOGLE STRATEGY
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID, // from your .env
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET, // from your .env
//       callbackURL: "http://localhost:3000/api/auth/google/callback", // callback route
//       passReqToCallback: true,
//     },
//     async (req, accessToken, refreshToken, profile, done) => {
//       /*
//        * Google will return 'profile' containing user info.
//        * E.g. profile.id, profile.emails[0].value, profile.displayName
//        */
//       try {
//         // 1. Check if a user with googleId already exists
//         let user = await AgriEstateUser.findOne({
//           where: { googleId: profile.id },
//         });
//         // 2. If not, check if a user with the same email exists
//         if (!user && profile.emails?.length) {
//           user = await AgriEstateUser.findOne({
//             where: { email: profile.emails[0].value },
//           });
//         }

//         if (!user) {
//           // 3. If no user exists, create a new one
//           user = await AgriEstateUser.create({
//             fullName: profile.displayName || "Google User",
//             email:
//               profile.emails?.[0]?.value || `noemail-${profile.id}@google.com`,
//             password: "SOCIAL_LOGIN", // or any placeholder
//             phone: "0000000000", // placeholder if needed
//             googleId: profile.id,
//           });
//         } else {
//           // 4. If user exists but has no googleId set, update it
//           if (!user.googleId) {
//             user.googleId = profile.id;
//             await user.save();
//           }
//         }

//         return done(null, user);
//       } catch (err) {
//         return done(err, null);
//       }
//     }
//   )
// );

// // 2. FACEBOOK STRATEGY
// // passport.use(
// //   new FacebookStrategy(
// //     {
// //       clientID: process.env.FACEBOOK_CLIENT_ID, // from your .env
// //       clientSecret: process.env.FACEBOOK_CLIENT_SECRET, // from your .env
// //       callbackURL: "/api/auth/facebook/callback", // callback route
// //       profileFields: ["id", "displayName", "emails"],
// //       passReqToCallback: true,
// //     },
// //     async (req, accessToken, refreshToken, profile, done) => {
// //       /*
// //        * Facebook will return 'profile' containing user info.
// //        * E.g. profile.id, profile.emails[0].value, profile.displayName
// //        */
// //       try {
// //         let user = await AgriEstateUser.findOne({
// //           where: { facebookId: profile.id },
// //         });

// //         if (!user && profile.emails?.length) {
// //           user = await AgriEstateUser.findOne({
// //             where: { email: profile.emails[0].value },
// //           });
// //         }

// //         if (!user) {
// //           user = await AgriEstateUser.create({
// //             fullName: profile.displayName || "Facebook User",
// //             email:
// //               profile.emails?.[0]?.value ||
// //               `noemail-${profile.id}@facebook.com`,
// //             password: "SOCIAL_LOGIN",
// //             phone: "0000000000",
// //             facebookId: profile.id,
// //           });
// //         } else {
// //           if (!user.facebookId) {
// //             user.facebookId = profile.id;
// //             await user.save();
// //           }
// //         }

// //         return done(null, user);
// //       } catch (err) {
// //         return done(err, null);
// //       }
// //     }
// //   )
// // );

// // Passport serialize/deserialize (only needed if using sessions;
// // For JWT-based flow, you can skip sessions entirely or keep minimal session usage.)
// passport.serializeUser((user, done) => {
//   done(null, user.uuid);
// });

// passport.deserializeUser(async (uuid, done) => {
//   try {
//     const user = await AgriEstateUser.findByPk(uuid);
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// });

// export default passport;
