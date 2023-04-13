require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const path = require("path");
const { name } = require("ejs");
const publicPath = path.join(__dirname, "/public");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
var findOrCreate = require("mongoose-findorcreate");
const { log } = require("console");
const app = express();
main().catch((err) => {
  console.log(err);
});
//Databases
async function main() {
  await mongoose.connect(
    "mongodb+srv://johan:dJGYFsWkuHUxY9nw@cluster0.xehl4ka.mongodb.net/SecrestDB"
  );
}
//Schema for the database
const userSchema = new mongoose.Schema({
  username: String,
  passsword: String,
  googleId: String,
  secret: String,
});
//Define the pluggin to the old Schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//
app.use(
  session({
    secret: "Our Little Secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
//Model
const User = new mongoose.model("userSchema", userSchema);
//setting up the session module that has various options, explained.

//config
app.use(express.static(publicPath));
//for the ejs Files
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
//Config the Google respond
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  let err, user;
  try {
    user = await User.findById(id).exec();
  } catch (e) {
    err = e;
  }
  done(err, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrests",
      passReqToCallback: true,
      userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    },

    function (request, accessToken, refreshToken, profile, done) {
      console.log(profile + "\n\n\n\n This is the Google Strategy");
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
    }
  )
);
//The respond to the call oauth
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
//The callback to the Sign In
app.get(
  "/auth/google/secrests",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);
//ROUTES
app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", function (req, res) {
  //check the DB to see if the username that was used to login exists in the DB
  User.findOne({ username: req.body.username }, function (err, foundUser) {
    //if username is found in the database, create an object called "user" that will store the username and password
    //that was used to login
    if (foundUser) {
      const user = new User({
        username: req.body.username,
        password: req.body.password,
      });
      //use the "user" object that was just created to check against the username and password in the database
      //in this case below, "user" will either return a "false" boolean value if it doesn't match, or it will
      //return the user found in the database
      passport.authenticate("local", function (err, user) {
        if (err) {
          console.log(err);
        } else {
          //this is the "user" returned from the passport.authenticate callback, which will be either
          //a false boolean value if no it didn't match the username and password or
          //a the user that was found, which would make it a truthy statement
          if (user) {
            //if true, then log the user in, else redirect to login page
            req.login(user, function (err) {
              res.redirect("/secrets");
            });
          } else {
            res.redirect("/login");
          }
        }
      })(req, res);
      //if no username is found at all, redirect to login page.
    } else {
      //user does not exists
      res.redirect("/login");
    }
  });
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, result) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});
app.get("/secrets", function (req, res) {
  User.find({ secret: { $ne: null } })
    .then(function (foundUsers) {
      res.render("secrets", { usersWithSecrets: foundUsers });
    })
    .catch(function (err) {
      console.log(err);
    });
});
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});
app.post("/submit", function (req, res) {
  console.log(req.user);
  User.findById(req.user)
    .then((foundUser) => {
      if (foundUser) {
        foundUser.secret = req.body.secret;
        return foundUser.save();
      }
      return null;
    })
    .then(() => {
      res.redirect("/secrets");
    })
    .catch((err) => {
      console.log(err);
    });
});
app.get("/logout", function (req, res) {
  req.logOut(function (err) {
    if (err) {
      console.log(err);
    }
  });
  res.redirect("/");
});
//SERVER
app.listen(3000, function () {
  console.log("Running in Port 3000");
});
