
var express = require('express');
// var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var model = require("./models");

const PORT = process.env.PORT || 3000;

// Initialize Express
const app = express();

// Configure middleware

// Use morgan logger for logging requests
// app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({
   extended: true
}));
app.use(express.json());
// Make public a static folder
app.use(express.static('public'));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({
   defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/nytimes", { useNewUrlParser: true });

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nytimes";

mongoose.connect(MONGODB_URI, {
   useNewUrlParser: true
});

// Routes

// get all the articles

app.get("/", function (req, res) {
   model.Article.find({}, function (error, data) {
      var hbsObject = {
         article: data
      };
      //   console.log(hbsObject);
      res.render("saved", hbsObject);
   });
});


app.get("/scrape", function (req, res) {
   // First, we grab the body of the html with axios
   axios.get("https://www.nytimes.com/section/world").then(function (response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);


      // Now, we grab every article tag, and do the following:
      $("article").each(function (i, element) {
         // Save an empty result object
         var result = {};


         result.title = $(this).find("h2").text();
         result.summary = $(this).find("p").text();
         result.link = "https://www.nytimes.com" + $(this).find("a").attr("href");

         console.log(result.summary);

         // Create a new Article using the `result` object built from scraping
         model.Article.create(result)
            .then(function (dbArticle) {
               // View the added result in the console
               console.log(dbArticle);
            })
            .catch(function (err) {
               // If an error occurred, log it
               console.log(err);
            });
      });

      // Send a message to the client
      // res.send("Scrape Complete");
      console.log("Scrape complete");
   });
});

app.get("/saved", function (req, res) {
   model.Article.find({
      "saved": true
   }).populate("notes").exec(function (error, articles) {
      var hbsObject = {
         article: articles
      };
      res.render("saved", hbsObject);
   });
});

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
   // Grab every document in the Articles collection
   model.Article.find({})
      .then(function (dbArticle) {
         // If we were able to successfully find Articles, send them back to the client
         res.json(dbArticle);
      })
      .catch(function (err) {
         // If an error occurred, send it to the client
         res.json(err);
      });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
   // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
   model.Article.findOne({
         _id: req.params.id
      })
      // ..and populate all of the notes associated with it
      .populate("note")
      .then(function (dbArticle) {
         // If we were able to successfully find an Article with the given id, send it back to the client
         res.json(dbArticle);
      })
      .catch(function (err) {
         // If an error occurred, send it to the client
         res.json(err);
      });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
   // Create a new note and pass the req.body to the entry
   model.Note.create(req.body)
      .then(function (dbNote) {
         // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
         // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
         // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
         return model.Article.findOneAndUpdate({
            _id: req.params.id
         }, {
            note: dbNote._id
         }, {
            new: true
         });
      })
      .then(function (dbArticle) {
         // If we were able to successfully update an Article, send it back to the client
         res.json(dbArticle);
      })
      .catch(function (err) {
         // If an error occurred, send it to the client
         res.json(err);
      });
});

// Save an article
app.post("/articles/save/:id", function (req, res) {
   // Use the article id to find and update its saved boolean
   model.Article.findOneAndUpdate({
         _id: req.params.id
      }, {
         saved: true
      })
      .then(function (dbArticle) {
         res.json(dbArticle);
      })
      .catch(function (err) {
         res.json(err);
      });
});

// Delete an article
app.post("/articles/delete/:id", function (req, res) {

   model.Article.findOneAndUpdate({
         _id: req.params.id
      }, {
         saved: false,
      })
      .then(function (dbArticle) {
         res.json(dbArticle)
         // console.log(dbArticle);
      })
      .catch(function (err) {
         res.json(err)
      });
});

// Create a new note
app.post("/notes/save/:id", function (req, res) {

   var newNote = new model.Note({
      body: req.body.text,
      article: req.params.id
   });
   console.log(req.body);
   
});

// Delete a note
app.delete("/notes/delete/:note_id/:article_id", function (req, res) {
   // Use the note id to find and delete it
   model.Note.findOneAndDelete({
      // stuff goes here
   });
});

// Start the server
app.listen(PORT, function () {
   console.log("App running on port " + PORT + "!");

});