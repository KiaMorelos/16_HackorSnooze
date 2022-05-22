"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    // hostname is the host name (without the port number or square brackets)
    // host is the host name and port number
    //host makes more sense when using the python server - i think - if it actually worked for me more than once.
   return new URL(this.url).hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */
//Note regarding axios.post syntax. It looks like this:

  //axios.post('/user', {
  //   firstName: 'Fred',
  //   lastName: 'Flintstone'
  // })
 // ^^^^ data : (assingment is implied with this syntax)
 //unless using axios.delete


  async addStory(user, {title, author, url}) {
    const token = user.loginToken
    const response = await axios.post(`${BASE_URL}/stories`, {
    token, story: { title, author, url },
    });
    
    const addedStory = new Story(response.data.story)
    
    this.stories.unshift(addedStory)//add story to beginning of stories array so Javascript can find it for favoriting right away.

    user.ownStories.unshift(addedStory)//add story to beginning of ownStories array so Javascript can find it there right away.
    return addedStory
 }

  //pass story id to delete story, which then passes to the api along with the token authorization
  async deleteStory(user, storyId) {
    const token = user.loginToken;
    const apiResponse = await axios.delete(`${BASE_URL}/stories/${storyId}`,  { data: { token } })
     console.log(apiResponse)

     //find index location of story in the favorites array, and own stories
     //delete from the array
     const favStoryLoc = user.favorites.findIndex(story => story.StoryId === storyId);
    user.favorites.splice(favStoryLoc, 1);
    
    const ownStoryLoc = user.ownStories.findIndex(story => story.StoryId === storyId);
    user.ownStories.splice(ownStoryLoc, 1);

     // filter out the story being deleted otherwise it won't disappear from the DOM until refresh. The above approach won't work, i tried.
     this.stories = this.stories.filter(story => story.storyId !== storyId);
    }

    //pass the user, storyId, and the {story object} to the update story which then passes to the api and updates it
    async updateStory(user, storyId, {title, author, url }){
    const token = user.loginToken
      const apiResponse = await axios.patch(`${BASE_URL}/stories/${storyId}`, { token, story: { title, author, url },
    } )
  
  //this break the getHostName() function and I'm struggling to figure out why.
  //Stories.js has a window reload line so that the updated stories appear, but this is not an ideal solution.
  //Please help me undestand what I'm doing wrong.

  //   const favStoryLoc = user.favorites.findIndex(story => story.StoryId === storyId);
  //   user.favorites.splice(favStoryLoc, 1,  {title, author, url} );
  
  //   const findOwnStory = user.ownStories.findIndex(story => story.StoryId === storyId);
  //   user.ownStories.splice(findOwnStory, 1, {title, author, url} );

  // console.log(apiResponse)

  //   this.stories = this.stories.map(story => {
  //    if(story.storyId === storyId){
  //     console.log('story that needs to be updated: ',  story )
  //     return {...story, title, author, url};
  //    }
  //    console.log('story that was updated: ',  story )
  //    return story
  //   });
  }
}




/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  //add story object to favorites array, pass to api

  async favorite(story){
    this.favorites.push(story)
    await this.storyActions(story, "favorite")
  }

  //remove story object from the favorites array, pass to api
  async unfavorite(story){
   const storyLoc = this.favorites.findIndex(story => story.StoryId);
   this.favorites.splice(storyLoc, 1);

   await this.storyActions(story, "unfavorite");
  }

  //tell the API whether to remove or add a story object from favorites
  async storyActions(story, actionType) {
    const token = this.loginToken
    if(actionType === "favorite"){
      const apiResponse = await axios.post(`${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, { token })
    } 
    if(actionType ==="unfavorite") {
      const apiResponse = await axios.delete(`${BASE_URL}/users/${this.username}/favorites/${story.storyId}`, { data: { token } })
    } 
    return
    }

  //if storyId matches an object in favorites array, return true or false
  //I tried this with a for of loop and .includes() but it didn't work. .some() seems like the most efficient way to do this.
    isFavorite (story){
     return this.favorites.some(storyObj => (storyObj.storyId === story.storyId) )
    }

}
