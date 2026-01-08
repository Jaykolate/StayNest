const User = require("../models/user")

module.exports.signupForm = (req,res)=>{
    res.render("users/signup.ejs");
};
module.exports.signupUser = async(req,res,next)=>{
    try{
    let {username,email,password} =req.body;
    const newUser = new User({email,username});
   const registeredUser = await User.register(newUser,password);
   req.login(registeredUser,(err)=>{
     if(err){ return next(err);}
       req.flash("success","Welcome to StayNest");
    res.redirect("/listings");
   })
   
}catch(e){
    req.flash("failure",e.message);
    res.redirect("/signup");
}
  };
module.exports.loginForm =(req,res)=>{
    res.render("users/login.ejs");
};

module.exports.loginUser =async(req,res)=>{
   req.flash("success","Welcome to StayNest!");
   let redirectUrl = res.locals.redirectUrl || "/listings";
   res.redirect(redirectUrl);
};

module.exports.logout=(req,res,next)=>{
    req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","ÿou are logged out!");
        res.redirect("/listings");
    })
};