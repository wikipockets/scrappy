$(document).ready(function(){
console.log("file loaded");

// handle scrape button

$("#scrape").on("click", function () {
   $.ajax({
      method: "GET",
      url: "/scrape",
   }).done(function (data) {
      console.log(data)
      window.location = "/";
   });
});

// handle save article button
$(".save").on("click", function () {
   var thisId = $(this).attr("data-id");
   $.ajax({
      method: "POST",
      url: "/articles/save/" + thisId
   }).done(function (data) {
      window.location = "/";
   });
});

$(".delete").on("click", function () {
   var thisId = $(this).attr("data-id");
   $.ajax({
      method: "POST",
      url: "/articles/delete/" + thisId
   }).done(function (data) {
      window.location = "/saved";
   });
});

$(document).on("click", ".addNote", function(){
   console.log("hasbeen click'd");
   //$(".modalNote").modal("show");
   $(".modalNote").addClass("customModal");
});

//Handle Save Note button
$(document).on("click",".saveNote", function () {
   console.log("this has been clicked!");
   var thisId = $(this).attr("data-id");
   if (!$("#noteText" + thisId).val()) {
      alert("please enter a note to save")
   } else {
      $.ajax({
         method: "POST",
         url: "/notes/save/" + thisId,
         data: {
            text: $("#noteText" + thisId).val()
         }
      }).done(function (data) {
         // Log the response
         console.log(data);
         // Empty the notes section
         $("#noteText" + thisId).val("");
         $(".modalNote").modal("hide");
         window.location = "/saved";
      });
   }
});

$(".deleteNote").on("click", function () {
   var noteId = $(this).attr("data-note-id");
   var articleId = $(this).attr("data-article-id");
   $.ajax({
      method: "DELETE",
      url: "/notes/delete/" + noteId + "/" + articleId
   }).done(function (data) {
      console.log(data)
      $(".modalNote").modal("hide");
      window.location = "/saved";
   });
});
});