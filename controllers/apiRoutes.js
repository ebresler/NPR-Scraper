const axios = require("axios");
const db = require("../models");
const express = require("express");
const app = express();
const cheerio = require("cheerio");

  // SCRAPE NPR.ORG AND SAVE TO RESULT OBJECT
  app.get("/scrape", function(req, res) {
    axios.get("http://www.npr.org").then(function(response) {
      let $ = cheerio.load(response.data);
      $(".story-wrap").each(function(i, element) {
        let result = {};
        // CREATE ARTICLE FROM MODEL
        result.title = $(this)
          .children(".story-text")
          .children("a")
          .children(".title")
          .text();
        result.link = $(this)
          .children(".story-text")
          .children("a")
          .attr("href");
        result.summary = $(this)
          .children(".story-text")
          .children("a")
          .children("p")
          .text();
        result.image = $(this)
          .children("figure")
          .children("div")
          .children("div")
          .children("a")
          .children("img")
          .attr("src");
        // SAVE ARTICLE TO DB
        db.Article.create(result)
          .then(function(dbArticle) {
            console.log(dbArticle);
          })
          .catch(function(err) {
            console.log(err);
          });
      });
      res.json("/");
    });
  });
  // GET SAVED ARTICLES FROM DB
  app.get("/articles/savedArticles", function(req, res){
    db.Article.find({
      saved: true
    })
    .then(function(dbSavedArticles){
      res.json(dbSavedArticles);
    })
  });

  // SAVE ARTICLES TO DB
  app.post("/articles/saveOneArticle/:id", function(req, res){
    db.Article.findByIdAndUpdate(req.params.id, { saved: true })
    .then(function(dbSavedArticle){
      res.json(dbSavedArticle);
    })
    .catch(function(err){
      res.json(err);
    })
  });
  
  // GET MAIN PAGE ARTICLES
  app.get("/articles", function(req, res) {
    db.Article.find({
      saved: false
    })
    .then(function(dbArticles){
      res.json(dbArticles);
    })
  });
  
  // GET NOTES FROM DB AND POPULATE 
  app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id})
    .populate("note")
    .then(function(dbArticles){
      res.json(dbArticles)
    })
  });
  
  // PUSH NOTE TO ARTICLE IN DB
  app.post("/notes/:id", function(req, res) {
    db.Note.create(req.body)
      .then(function(dbNote) {
        return db.Article.findByIdAndUpdate(req.params.id, { note: dbNote._id });
      })
      .then(function(dbArticle){
        res.json(dbArticle);
      })
      .catch(function(err){
        res.json(err);
      })
  });

  // DELETE NOTE FROM DB
  app.delete("/notes/:id", function(req, res) {
    db.Note.deleteOne(req.body)
    .then(function(dbNote){
      return db.Article.findByIdAndUpdate(req.params.id, { note: dbNote._id });
    })
    .then(function(deleted){
      res.json(deleted);
    })
    .catch(function(err){
      res.json(err);
    })
  });

  // DELETE ARTICLE FROM DB
  app.delete("/articles/deleteOne/:id", function(req, res){
    db.Article.findByIdAndDelete({_id: req.params.id})
    .then(function(deleted){
      res.json(deleted);
    })
    .catch(function(err){
      res.json(err);
    })
  })


  // CLEAR ALL ARTICLES FROM DB ECCEPT FOR SAVED ARTICLES.
  app.delete("/articles/deleteAll", function(req, res){
    db.Article.deleteMany({ saved: false })
    .then(function(deleted){
      res.json(deleted);
    })
    .catch(function(err){
      res.json(err);
    })
  })

module.exports = app;