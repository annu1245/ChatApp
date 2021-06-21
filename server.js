const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
var userInfo = {};
const mongoose = require("mongoose");
const multer = require("multer");
var path = require('path');
const fileUpload = require('express-fileupload');

const passport              =  require("passport");
const bodyParser            =  require("body-parser");
const LocalStrategy         =  require("passport-local");
const passportLocalMongoose =  require("passport-local-mongoose");
const User                  =  require("./models/users");
const Message               =  require("./models/messages");

// app.set('views', __dirname);


app.use(express.static(__dirname + '/public'));

//In app.js
mongoose.connect("mongodb://localhost/ChatAdmin");
app.use(require("express-session")({
secret:"ast+@snu",//decode or encode session
    resave: false,          
    saveUninitialized:false    
}));

    io.on('connection', (socket) => {
	console.log('a user connected ' + socket.id);
	
	socket.on('disconnect', (data) => {
	console.log('a user disconnected ' + socket.id);
    var time = new Date();
    User.findOneAndUpdate({socketid: socket.id},{status: time},null, function(err,res){
        console.log(res);
    })
	});

    


	socket.on('myMessage', (data) => {
        var msg = new Message({ from: data.userid, to: data.userto, message:data.message });
        msg.save(function(err, doc) {
          if (err) 
          	return console.error(err);

          console.log("Document inserted succussfully!");
	      User.findById(data.userto, function(err, user) { 
			io.to(user.socketid).emit("ServerResponse", {msg: data.message, userid: data.userid, time:data.time});
	        });

        });
	})
	

	socket.on('userData', (data)=>{    
		// userInfo[data.username] = data.userid;
        User.findByIdAndUpdate(data.userid, { socketid: data.socketid, status:"online" }, 
        function (err, docs) {
        if (err){
            console.log(err)
        }
        else{
            console.log("Updated User : ", docs);
        }
    });

        io.emit("userConnected", {userid: data.userid})
	})
	
	// socket.on('fetchMsg',(data)=>{
 //        Message.find({}, function(err, allmsg){
 //            socket.emit("sr",{dd:data});
 //        });
 //    })
var sts;
var img;
socket.on('fetchMsg',(data)=>{
    console.log(data.user);
    console.log(data.userto);
    User.findById(data.userto, function(err,res){
        sts = res.status;
        img = res.image;

    })
    Message.find({
    $or: [
        {
        $and: [
              { from: data.user },
              { to: data.userto },
            ],
        },
        { 
        $and: [
              { from: data.userto },
              { to: data.user },
            ],
        },
    ]
    }, null,{ sort:{ time: 'asc' } }, 

    function(err,allmsg){
    console.log(allmsg);
    socket.emit("AllMessages", {rep: allmsg, status:sts, image:img});
    })  
})


});

passport.serializeUser(User.serializeUser());       //session encoding
passport.deserializeUser(User.deserializeUser());   //session decoding
passport.use(new LocalStrategy(User.authenticate()));



app.set("view engine","ejs");
app.use(bodyParser.urlencoded(
      { extended:true }
));
app.use(bodyParser.json());
app.use(fileUpload());

app.use(passport.initialize());
app.use(passport.session());

//=======================
//      R O U T E S
//=======================
app.get("/", (req,res) =>{
    res.render("home");
})

// app.get("/chat", isLoggedIn, (req, res) => {
//   res.sendFile(__dirname + '/index2.html');
// });

// app.get("/userprofile",isLoggedIn ,(req,res) =>{
//     res.render("userprofile");
// })
//Auth Routes
app.get("/auth",(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect("/chat");
    }
    else{
    return res.render("login", {"status": 0});
    }
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/chat",
    failureRedirect:"/auth"
}),function (req, res){
});

app.get("/register",(req,res)=>{
    res.render("register");
});


// var Storage = multer.diskStorage({
//     destination : "./public/users_img",
//     filename:(req, file, cb)=>{
//         cb(null, file.fieldname+"_"+Date.now()+path.extname(file.originalname))
//     }
// });

// var upload = multer({
//     storage:Storage
// }).single('file');

app.post("/register", (req,res)=>{

    user_image = req.files.userimg;
      
    uploadPath = path.join(__dirname, "public", "users_img",  user_image.name);

    user_image.mv(uploadPath, function(err) {
        if (err)
            return res.status(500).send("err");
        });

    imagePath = path.join("users_img", user_image.name);

    User.register(new User(
    	{username: req.body.username,
            email: req.body.email,
            mobile: req.body.mobile_no,
            image: imagePath}),
    	req.body.password,function(err,user){
        if(err){
            console.log(err);
            return res.render('login', {"status": 1});
            // res.redirect("/auth");
            
        }
    passport.authenticate("local")(req,res,function(){
        return res.redirect("/auth");
    })    
    })
})

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/auth");
});

function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        console.log(req.isAuthenticated());
        return next();
    }
    res.redirect("/auth");
    // return res.render("login", {"status": 0});
    // console.log("hi");
}

app.get('/chat', isLoggedIn, function(req, res) {
    // mongoose operations are asynchronous, so you need to wait 
    User.find({}, function(err, data) {
        res.render('chat2.ejs',{ practices: data, current_user: req.user});
    });
});


server.listen(3000, () => {
  console.log('listening on *:3000');
});


