const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var userInfo = {};
const mongoose = require("mongoose");

const passport              =  require("passport");
const bodyParser            =  require("body-parser");
const LocalStrategy         =  require("passport-local");
const passportLocalMongoose =  require("passport-local-mongoose");
const User                  =  require("./models/users");




app.use(express.static(__dirname + '/public'));

//In app.js
mongoose.connect("mongodb://localhost/ChatAdmin");
app.use(require("express-session")({
secret:"annu@Poddar",//decode or encode session
    resave: false,          
    saveUninitialized:false    
}));

io.on('connection', (socket) => {
	console.log('a user connected ' + socket.id);
	
	socket.on('disconnect', (data) => {
	  console.log('a user disconnected ' + socket.id);
	});


	socket.on('myMessage', (data) => {
		var user_info = userInfo[data.userto];	
		console.log(userInfo);
		io.to(user_info).emit("ServerResponse", {msg: data.message, uname: data.username});
	})
	

	socket.on('userData', (data)=>{
		userInfo[data.username] = data.userid;
	})

});

passport.serializeUser(User.serializeUser());       //session encoding
passport.deserializeUser(User.deserializeUser());   //session decoding
passport.use(new LocalStrategy(User.authenticate()));



app.set("view engine","ejs");
app.use(bodyParser.urlencoded(
      { extended:true }
))
app.use(passport.initialize());
app.use(passport.session());

//=======================
//      R O U T E S
//=======================
app.get("/", (req,res) =>{
    res.render("home");
})

app.get("/chat", isLoggedIn, (req, res) => {
  res.sendFile(__dirname + '/index2.html');
});
app.get("/userprofile",isLoggedIn ,(req,res) =>{
    res.render("userprofile");
})
//Auth Routes
app.get("/login",(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect("/chat");
    }
    else{
    return res.render("login", {"status": 0});
    }
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/chat",
    failureRedirect:"/login"
}),function (req, res){
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    
    User.register(new User(
    	{username: req.body.username}),
    	req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.render('login', {"status": 1});
            // res.redirect("/login");
            
        }
    passport.authenticate("local")(req,res,function(){
        res.redirect("/login");
    })    
    })
})

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        console.log(req.isAuthenticated());
        return next();
    }
    return res.render("login", {"status": 0});
    // console.log("hi");
}



server.listen(3000, () => {
  console.log('listening on *:3000');
});


