const express = require("express");
const app = express();
const bodyParser = require("body-parser");
//Databases
const mongoose = require("mongoose");
main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(
    "mongodb+srv://johan:dJGYFsWkuHUxY9nw@cluster0.xehl4ka.mongodb.net/SecrestDB"
  );
}

//Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});
//Model
const user = new mongoose.model("userSchema", userSchema);
//

const path = require("path");
const { name } = require("ejs");
const publicPath = path.join(__dirname, "/public");
app.use(express.static(publicPath));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
app.post("/register", function (req, res) {
  const newUser = new user({
    email: req.body.username,
    password: req.body.password,
  });
  newUser
    .save()
    .then(function () {
      res.render("secrets");
    })
    .catch(function (err) {
      console.log(err);
    });
});
app.get("/secrets", function (req, res) {
  res.render("secrets");
});
app.get("/submit", function (req, res) {
  res.render("submit");
});
app.get("/logout", function (req, res) {
  res.render("logout");
});
app.listen(3000, function () {
  console.log("Running in Port 3000");
});
