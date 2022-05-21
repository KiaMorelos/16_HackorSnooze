"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 * isConnected, users can only delete their own stories
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, isUsersStory) {
  // console.debug("generateStoryMarkup", story);
  const isLoggedIn = Boolean(currentUser);
  const belongsToUser = isUsersStory;
  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
      ${isLoggedIn && belongsToUser ? allowDelete(): ""}
      ${isLoggedIn ? putStar(currentUser, story) : ""}

        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        ${isLoggedIn && belongsToUser ? allowEdit() : "" }
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

function putFavsOnPage() {
  console.debug("putFavsOnPage");

  $allStoriesList.empty();

  if(currentUser.favorites.length === 0){
    $allStoriesList.append("No favorites yet");
  }

  // loop through favorites of stories and generate HTML for them
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
}

$("#favorites-link").on("click", putFavsOnPage)

function putOwnStoriesOnPage() {
  console.debug("putOwnStoriesOnPage");
  const isUsersStory= true;

  $allStoriesList.empty();

  if(currentUser.ownStories.length === 0){
    $allStoriesList.append("No stories yet");
  } else {
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(story, isUsersStory);
       $allStoriesList.append($story);
    }
  }
  
}

$("#my-stories-link").on("click", putOwnStoriesOnPage)

function putStar(user, story){

  if(user.isFavorite(story)){
     console.log(story)
     return `<i class="fa-star fas"></i>`
  } else {
     return `<i class="fa-star far"></i>`
  }

}

function allowDelete(){
  return `<i class="fas fa-trash-alt"></i>`
}

function allowEdit(){
  return `<small class="edit-story"><a href="#">Edit Story</a></small>`
}

//add story to list on form submit
async function storyFormSubmit(evt){
  console.debug("storyFormSubmit - event triggered");

  evt.preventDefault()
  const title = $("#enter-title").val();
  const author = $("#enter-author").val();
  const url = $("#enter-url").val()
  const storyIs = {title, author, url} 
   
  const newStory = await storyList.addStory(currentUser, storyIs);

  const $story = generateStoryMarkup(newStory);
    $allStoriesList.prepend($story);
  $("#submit-story-form").trigger('reset').hide()
}

$("#submit-story-form").on("submit", storyFormSubmit);

//favorite and unfavorite stories UI changes, and send API calls
async function updateFavStatus(evt){
  const storyId = evt.target.parentElement.getAttribute("id");
  const story = storyList.stories.find(story => story.storyId === storyId); //find correct story object in the array pass object to fav || unfavorite methdd

  const $star = $(evt.target);

  if($star.hasClass("far")){
    $star.removeClass("far");
    $star.addClass("fas");
    await currentUser.favorite(story);
  } else {
    $star.removeClass("fas");
    $star.addClass("far");
    await currentUser.unfavorite(story);
  }
  // const star = evt.target;
  // if(star.classList.contains("far")){
  //   star.classList.remove("far");
  //   star.classList.add("fas");
  //   await currentUser.favorite(story);
  // } else {
  //   star.classList.remove("fas");
  //   star.classList.add("far");
  //   await currentUser.unfavorite(story);
  // }
  // console.log(story)
}

$allStoriesList.on("click", ".fa-star", updateFavStatus);

//delete story for DOM and pass the id of to deleteStory() and delete from all relevant arrays.
async function deletePressed(evt){
  const storyToDelete = evt.target.parentElement.getAttribute("id")
  await storyList.deleteStory(currentUser, storyToDelete);
  $(`#${storyToDelete}`).remove();
  
  if(currentUser.ownStories.length === 0){
    $allStoriesList.append("No stories yet");
  }
}

//open up the edting form on click
function openEditStoryForm(evt){
  const id = $(this).parent().attr('id');
  const storyBeingEdited = $(`#${id} > .story-link`).text()
  $editForm.show()
  $(".storeThis").text(`${id}`); 
  $("#active-edit").text(`You are editing your story titled: ${storyBeingEdited}`)
  // there's a probably a much better way to do this, i'm putting the id in a hidden div so I can access it in the update story function. I tried to combine these functions, but the submit event complicated things
}

$allStoriesList.on("click", ".edit-story", openEditStoryForm);

//tell API the story was updated
async function updateStory(evt){
  evt.preventDefault()

  const storyId = $(".storeThis").text()
  const title = $("#edit-title").val();
  const author = $("#edit-author").val();
  const url = $("#edit-url").val()
  const story = {title, author, url} 
   
  const newStory = await storyList.updateStory(currentUser, storyId, story);

  $("#active-edit").empty();
  $(".storeThis").empty();
  $("#edit-story-form").trigger('reset').hide()
  window.location.reload()
}

$editForm.on("submit", updateStory)


$allStoriesList.on("click", ".fa-trash-alt", deletePressed);
