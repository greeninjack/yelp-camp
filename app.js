  
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
	passport 	= require("passport"),
	LocalStrategy = require("passport-local"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
	seedDB      = require("./seeds")
mongoose.connect('mongodb://localhost:27017/yelp_camp_v3', {
    useUnifiedTopology: true,
    useNewUrlParser: true
});
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/public"));
seedDB();

//Passport Configuration
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//We want currentUser: req.user  available on every route. And there's an easy way of doing that where we don't have to manually added to every single route. You add a middleware, Whatever function we provide to it will be called on every route.
app.use(function(req, res, next){
	//whatever we put in res.locals. is what's available instead of our template and then the other really important thing is you need to move on to the actual next code, because this is a middleware that will run for every single route.
   res.locals.currentUser = req.user;
   next();//If we don't have this next it will just stop. Nothing will happen
});

//-------
app.get('/', function(req, res) {
    res.render('landing');
});

//INDEX Route Show all campgrounds
app.get('/campgrounds', function(req, res) {
	console.log(req.user);
    // Get all campgrounds from DB

    Campground.find({}, function(err, allCampgrounds) {
        if (err) {
            console.log(err);
        } else {
            res.render('campgrounds/index', { campgrounds: allCampgrounds, currentUser: req.user }); // {name you want to give (you can name it anything) : data that you are passing in}
        }
    });
});

//Create Route -- Add new campground to DB
app.post('/campgrounds', function(req, res) {
    //get data from the form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var description = req.body.description;
    var newCampground = { name: name, image: image, description: description };

    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated) {
        if (err) {
            console.log(err);
        } else {
            //redirect back to campgrounds page with the update
            res.redirect('/campgrounds');
        }
    });
});

//NEW - show form to create new campground
app.get('/campgrounds/new', function(req, res) {
    res.render('campgrounds/new');
});

//SHOW Route - Shows more info about campgrounds
app.get('/campgrounds/:id', function(req, res) {
    //find the campground with provided provided
    // CampgroundFindById(id, callback)
    Campground.findById(req.params.id)
        .populate('comments')
        .exec(function(err, foundCampground) {
            if (err) {
                console.log(err);
            } else {
                console.log(foundCampground);
                //render show template with that campground
                res.render('campgrounds/show', { campground: foundCampground });
            }
        });
    // req.params.id
    //render show template with that campground
});

//==========================
// COMMENTS ROUTES
//==========================
app.get('/campgrounds/:id/comments/new',isLoggedIn, function(req, res) {
    //find campground by id
    Campground.findById(req.params.id, function(err, campground) {
        if (err) {
            console.log(err);
        } else {
            res.render('comments/new', { campground: campground });
        }
    });
});

app.post('/campgrounds/:id/comments', isLoggedIn, function(req, res) {
    //lookup campground using ID
    Campground.findById(req.params.id, function(err, campground) {
        if (err) {
            console.log(err);
            res.redirect('/campgrounds');
        } else {
            Comment.create(req.body.comment, function(err, comment) {
                if (err) {
                    console.log(err);
                } else {
                    campground.comments.push(comment);
                    campground.save();
                    res.redirect('/campgrounds/' + campground._id);
                }
            });
        }
    });
    //create new comment
    //connect new comment to campground
    //redirect campground show page
});

//  ===========
// AUTH ROUTES
//  ===========

// show register form
app.get("/register", function(req, res){
   res.render("register"); 
});

//handle sign up logic
app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/campgrounds"); 
        });
    });
});

// show login form 
app.get('/login', function(req, res){
	res.render('login');
});
// handling login logic
//app.post("/login", middleware, callback)
app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), function(req, res){
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/campgrounds");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}


//----------------- listen
app.listen(3000, process.env.IP, function() {
    console.log('YelpCamp Server has Started!');
});