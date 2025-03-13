import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';
import { loginUser, registerUser } from './auth.js';
import { createThread, getThread, getAllThreads, updateThread, deleteThread, updateLikeStatus, watchThread } from './thread.js';
import { getComments, postComment, likeComment, editComment, deleteComment } from './comments.js';
import { getUser, updateUser, setAdminStatus } from './user.js';


let token = null;
let userId = null;
let userIsAdmin = false;
let currThreadDisplayId = "";
let currThreadDisplayPublic = null
let currThreadDisplayLock = null;
let currNumThreads = 0;
let currThreadDisplayLike = false;
let currThreadDisplayWatch = false;

function hideElement(elementId) {
    document.getElementById(elementId).style.display = 'none';
}

function showElement(elementId) {
    document.getElementById(elementId).style.display = '';
}

function removeElement(elementId) {
    document.getElementById(elementId).remove();
}

////////////////////////////////Manage Screen States////////////////////////////////
let currentPage = 'login';
const pages = ['login', 'register', 'dashboard', 'create-thread', 'user-profile'];

function navigateTo(newPage) {
    for (const page of pages) {
        hideElement(`${page}-page`);
    }
    currentPage = newPage;
    document.getElementById(`${newPage}-page`).style.display = '';

    if (newPage === 'register') {
        document.getElementById('nav-login-signup').textContent = 'Log In';
        hideElement('create-btn');
        hideElement('user-profile-btn');
        hideElement('nav-sidebar-btn');
        hideElement('nav-logout');
    } else if (newPage === 'login') {
        document.getElementById('nav-login-signup').textContent = 'Sign Up';
        hideElement('create-btn');
        hideElement('user-profile-btn');
        hideElement('nav-sidebar-btn');
        hideElement('nav-logout');

    } else if (newPage === 'create-thread') {
        document.getElementById('create-btn').textContent = 'Back';
    } else if (newPage === 'dashboard') {
        showElement('nav-logout');
        hideElement('save-btn');
        hideElement('delete-btn');
        document.getElementById('create-btn').textContent = 'Create';
        setupDashboard();
    } else if (newPage == 'user-profile') {
        hideElement('save-profile');
        document.getElementById('user-profile-btn').textContent = 'Back';
    }
}

// Set Up Dashboard Display
function setupDashboard() {
    showElement('user-profile-btn');
    document.getElementById('user-profile-btn').textContent = 'My Profile';
    document.getElementById('nav-login-signup').style.display = 'none';
    document.getElementById('create-btn').style.display = ''

    // Remove all threads in side bar if any
    const threadsContainer = document.getElementById('threads-list-container')
    while (threadsContainer.firstChild) {
        threadsContainer.firstChild.remove();
    }
    // Add threads to side bar
    handleThreadsList(0)
    showElement('individual-thread-display-screen');
    hideElement('individual-thread-edit-screen');
    if (currThreadDisplayId == "") {
        hideElement('author-picture');
        hideElement('thread-post-author');
        hideElement('edit-btn');
        hideElement('like-btn');
        hideElement('watch-btn');
        hideElement('comments-container');
    } else {
        displayThread(currThreadDisplayId);
        showElement('comments-container');
    }


}

///////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////Event Listeners//////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

document.getElementById('site-logo').addEventListener('click', () => {
    if (currentPage === 'create-thread' || currentPage === 'user-profile') {
        navigateTo('dashboard');
    }
})

document.getElementById('nav-logout').addEventListener('click', () => {
    displayErrorPopup('Logout ?');
    hideElement("error-title");
    const confirmBtn = document.getElementById('error-close');
    confirmBtn.textContent = "Yes";
    confirmBtn.addEventListener('click', (event) => {
        if (!confirmBtn.contains(event.target)) {
            hideElement('error-popup');
        } else {
            handleLogout();
        }
    })

});

// Navigation Bar Login/Signup Button
document.getElementById('nav-login-signup').addEventListener('click', () => {
    if (currentPage === 'login') {
        navigateTo('register');
    } else if (currentPage === 'register') {
        navigateTo('login');
    }
});

document.getElementById('create-btn').addEventListener('click', () => {
    if (currentPage === 'dashboard') {
        navigateTo('create-thread');
    } else if (currentPage === 'create-thread') {
        navigateTo('dashboard');
    } else if (currentPage === 'user-profile') {
        navigateTo('dashboard');
    }
})

document.getElementById('side-bar-create').addEventListener('click', () => {
    navigateTo('create-thread');
})

document.getElementById('nav-sidebar-btn').addEventListener('click', () => {
    const sidebar = document.getElementById('left-side-bar');
    sidebar.classList.toggle('show');
})

document.getElementById('user-profile-btn').addEventListener('click', () => {
    if (document.getElementById('user-profile-btn').textContent === 'Back') {
        navigateTo('dashboard');
    } else {
        goToUserProfile(userId);
    }
})

//Login/Register Links
document.getElementById('register-link').addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('register');
});
document.getElementById('login-link').addEventListener('click', (event) => {
    event.preventDefault();
    navigateTo('login');
});

// Login/Register Submission
document.getElementById('login-btn').addEventListener('click', handleLogin);
document.getElementById('login-password').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleLogin();
    }
});
document.getElementById('signup-btn').addEventListener('click', handleRegister);
document.getElementById('register-conf-password').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleRegister();
    }
});

// Error Close Button
document.getElementById('error-close').addEventListener('click', () => {
    document.getElementById('error-popup').style.display = 'none';
});

//Threads
document.getElementById('post-thread-btn').addEventListener('click', createThreadHandler);
document.getElementById('edit-btn').addEventListener('click', (editThread));
document.getElementById('save-btn').addEventListener('click', saveEditThread);
document.getElementById('delete-btn').addEventListener('click', deleteCurrThread);
document.getElementById('like-btn').addEventListener('click', handleLike);
document.getElementById('watch-btn').addEventListener('click', handleWatch);
document.getElementById('show-more-threads').addEventListener('click', displayMoreThreads);

//Comments
document.getElementById('comment-submit').addEventListener('click', () => {
    createComment(currThreadDisplayId);
    document.getElementById('new-comment-input').value = "";
});
document.getElementById('comment-list-container').addEventListener('click', function (event) {
    if (event.target && event.target.matches('.comment-item-username')) {
        const classString = event.target.className;
        const commenterUserId = classString.match(/\d+/)[0];
        goToUserProfile(commenterUserId);
    }
})

//Profile
document.getElementById('thread-post-author').addEventListener('click', goToThreadPostProfile);
document.getElementById('edit-profile').addEventListener('click', handleEditUserProfile);
document.getElementById('save-profile').addEventListener('click', saveEditsUserProfile);
document.getElementById('admin-set').addEventListener('change', () => {
    const profileCont = document.getElementsByClassName('user-info-container')[0];
    const userProfileId = profileCont.id.match(/\d+/)[0];
    const selectedValue = document.getElementById('admin-set').value;
    updateAdminStatus(userProfileId, selectedValue);
});

// Automatically adjust the height as the user types
const textarea = document.getElementById('new-comment-input');
textarea.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

/**
 * Handles user login by retrieving email and password input values,
 * authenticating the user, and navigating to the dashboard if successful.
 *
 * @function
 * @returns {Promise<void>} A promise that resolves when the user is logged in
 * and navigated to the dashboard, or rejects with an error if any step fails.
 * 
 * @throws {Error} Throws an error if there is a problem during the login process,
 *                 including network errors or invalid credentials.
 */
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    loginUser(email, password)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                token = data.token;
                userId = data.userId;
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);

                getUser(token, userId)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            throw new Error(data.error);
                        }
                        userIsAdmin = data.admin;
                        navigateTo('dashboard')
                    })
                    .catch(error => {
                        displayErrorPopup(error);
                    })
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}


/**
 * Handles user register by retrieving name, email and password input values,
 * and navigating to the dashboard if successful.
 *
 * @function
 * @returns {Promise<void>} A promise that resolves when the user is registered
 * and navigated to the dashboard, or rejects with an error if any step fails.
 * 
 * @throws {Error} Throws an error if there is a problem during the register process,
 */
function handleRegister() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confPassword = document.getElementById('register-conf-password').value;

    if (!isValidEmail(email)) {
        displayErrorPopup(`Invalid Email: ${email}`);
        return;
    } else if (password !== confPassword) {
        displayErrorPopup('Passwords dont match');
        return;
    }

    registerUser(name, email, password)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                token = data.token;
                userId = data.userId
                localStorage.setItem('token', token);
                localStorage.setItem('userId', userId);
                userIsAdmin = false;
                navigateTo('dashboard');
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Retrieves the admin status of a user based on their user ID.
 *
 * @function
 * @param {number} id - The user ID of the user whose admin status is being checked.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating
 *                              whether the user is an admin (`true` or `false`).
 * @throws {Error} Throws an error if there is a problem during the retrieval
 *                 of the user's admin status, including network errors or
 *                 invalid user ID.
 */
function getIsUserAdmin(id) {
    return getUser(token, id)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            return data.admin;
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Handles the creation of a new thread by retrieving user input,
 * sending the data to create a thread, and updating the UI accordingly.
 *
 * Steps:
 * 1. Retrieve title, visibility (public/private), and content
 *    of the thread from input fields.
 * 2. Sets the initial state of the like and watch buttons.
 * 3. Calls the `createThread` function (which makes a POST request) 
 * 4. If successful, it updates the current thread display ID,
 *    displays the newly created thread, clears the input fields, and navigates
 *    to the dashboard.
 * 5. Displays an error popup if there is an error in the response or during the process.
 *
 * @function
 * @returns {Promise<void>} A promise that resolves when the thread is successfully created
 *                          and the UI is updated, or rejects with an error if the creation fails.
 * 
 * @throws {Error} Throws an error if there is a problem during the creation process,
 *                 including network errors or invalid input data.
 */
function createThreadHandler() {
    const title = document.getElementById('thread-title').value;
    const isPublic = !(document.getElementById('private-checkbox').checked);
    const content = document.getElementById('thread-content').value;
    document.getElementById('like-btn').className = 'unliked';
    document.getElementById('watch-btn').className = 'unwatched';

    if (!title) {
        displayErrorPopup('Please add a thread title');
    } else if (!content) {
        displayErrorPopup('Thread can not be empty');
    } else {
        createThread(token, title, isPublic, content)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                } else {
                    currThreadDisplayId = data.id;
                    displayThread(currThreadDisplayId);

                    document.getElementById('thread-title').value = "";
                    document.getElementById('private-checkbox').checked = false;
                    document.getElementById('thread-content').value = "";

                    navigateTo('dashboard');
                }
            })
            .catch(error => {
                displayErrorPopup(error);
            })
    }
}


/**
 * Handles retrieving information of thread to be displayed on main page 
 *
 * Steps:
 * 1. Calls 'getThread' function (which makes a GET request)
 * 2. If successful, updates the global variables that represent the current thread's
 *    display state (lock, public, threadId, liked/watched by current user)
 * 3. Displays an error popup if there is an error in the response or during the process.
 * 4. Extracts relevant details about the thread, including title, content,
 *    like count, and creator ID.
 * 5. Calls 'individualThreadDisplay' to update the UI with thread information      
 * 6. Calls 'handeGetComments' to display comments of the thread
 * 
 * @function
 * @returns {Promise<void>} A promise that resolves when the thread is successfully created
 *                          and the UI is updated, or rejects with an error if the creation fails.
 * 
 * @throws {Error} Throws an error if there is a problem during the creation process,
 *                 including network errors or invalid input data.
 */
function displayThread(threadId) {
    getThread(token, threadId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayErrorPopup(data.error);
            } else {
                currThreadDisplayLock = data.lock;
                currThreadDisplayPublic = data.isPublic;
                currThreadDisplayId = data.id;
                currThreadDisplayLike = data.likes.includes(Number(userId));
                currThreadDisplayWatch = data.watchees.includes(Number(userId));

                const title = data.title;
                const contents = data.content;
                const likeCount = data.likes.length;
                const creatorId = data.creatorId;

                individualThreadDisplay(title, contents, likeCount, creatorId);
                handleGetComments();
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Updates the UI to display the details of a specific thread
 *
 * Steps:
 * 1. Call `getUser` (which makes GET request) to retrieve the author's information
 *    based on the given creator ID.
 * 2. If successful, it updates thread display author's name and profile picture 
 *    in the UI. If the author has no profile image, a default image is used.
 * 3. Updates the thread title, body content and like count.
 * 4. Displays like/watch buttons for the thread based on the current user's interaction.
 * 5. Shows the edit button if the current user is the creator of the thread or an admin.
 * 6. Hides the edit button if the thread is locked or if the user does not have permission to edit.
 * 7. Displays error popup if any errors occur during data retrieval.
 *
 * @function
 * @param {string} title - The title of the thread to display.
 * @param {string} contents - The content/body of the thread to display.
 * @param {number} likeCount - The number of likes the thread has received.
 * @param {number} creatorId - The ID of the user who created the thread.
 * @returns {Promise<void>} A promise that resolves when the thread details are successfully updated in the UI,
 *                          or rejects with an error if data retrieval fails.
 * 
 * @throws {Error} Throws an error if there is a problem retrieving user data or if the data returned
 *                 contains an error message.
 */
function individualThreadDisplay(title, contents, likeCount, creatorId) {
    let author;
    getUser(token, creatorId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                author = data.name;
                const threadAuthor = document.getElementById('thread-post-author');
                threadAuthor.textContent = author;
                showElement('thread-post-author');

                if (!data.image) {
                    document.getElementById('author-picture').src = "assets/defaultUserProfile.svg";
                } else {
                    document.getElementById('author-picture').src = data.image;
                }
                showElement('author-picture');
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })

    document.getElementById('thread-name').textContent = title;
    document.getElementById('thread-body').innerHTML = contents.replace(/\n/g, '<br>');
    document.getElementById('thread-like-count').textContent = `${likeCount} ${likeCount === 1 ? 'Like' : 'Likes'}`;

    showElement('like-btn');
    showElement('watch-btn');

    document.getElementById('watch-btn').className = currThreadDisplayWatch ? 'watched' : 'unwatched';
    document.getElementById('watch-btn').textContent = currThreadDisplayWatch ? 'Watching' : 'Watch';

    document.getElementById('like-btn').className = currThreadDisplayLike ? 'liked' : 'unliked';
    const likeBtn = document.getElementById('like-btn');

    if (likeBtn.className === "liked") {
        likeBtn.src = "assets/heartIconLiked.svg";
    } else {
        likeBtn.src = "assets/heartIconUnliked.svg";
    }

    if (currThreadDisplayLock) {
        hideElement('edit-btn');
        hideElement('like-btn')
    } else if (creatorId.toString() == userId) {
        showElement('edit-btn');
    } else {
        getUser(token, userId)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                data.admin ? showElement('edit-btn') : hideElement('edit-btn');
            })
            .catch(error => {
                displayErrorPopup(error);
            })
    }
}

/**
 * Retrieves thread information to be displayed including their 
 * titles, creation dates, and creator names.
 *
 * Steps:
 * 1. Calls the `getAllThreads` function (which makes GET request) 
 * 2. For each thread ID, it retrieves information about the thread 
 *    and its creator using the `getThread` and `getUser` functions
 *    (which make GET requests)
 * 3. Maps the retrieved thread information to an array of objects containing thread details,
 *    including the thread ID, title, creation date, creator's name, and likes
 * 4. Once all thread data is collected, calls `displayThreadsList` to render in the UI
 * 5. Displays error popup if any
 *
 * @function
 * @param {number} start - The index to start retrieving threads from.
 * @returns {Promise<void>} A promise that resolves when the threads are successfully retrieved and displayed,
 *                          or rejects with an error if data retrieval fails.
 * @throws {Error} Throws an error if there is a problem retrieving the list of threads or user data,
 *                 or if the data returned contains an error message.
 */
function handleThreadsList(start) {
    return getAllThreads(token, start)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            else {
                const threadMapPromises = data.map(threadId =>
                    getThread(token, threadId)
                        .then(response => response.json())
                        .then(threadData =>
                            getUser(token, threadData.creatorId)
                                .then(response => response.json())
                                .then(userData => ({
                                    id: threadId,
                                    title: threadData.title,
                                    createdAt: threadData.createdAt,
                                    creatorName: userData.name,
                                    likes: threadData.likes,
                                }))
                        )
                )
                Promise.all(threadMapPromises)
                    .then(threads => {
                        displayThreadsList(threads);
                    })
                    .catch(error => {
                        displayErrorPopup(error);
                    })
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Displays a list of threads by creating elemnts
 *
 * Steps:
 * 1. Iterates over the array of thread objects.
 * 2. For each thread, creates a new thread item and add to UI.
 * 3. Adds an event listener to the thread item that triggers the `displayThread` function when clicked.
 * 4. Creates and appends child elements to the thread item
 *
 * @function
 * @param {Array<Object>} threads - An array of thread objects with:
 *   - {number} id
 *   - {string} title
 *   - {string} createdAt
 *   - {string} creatorName
 *   - {Array<number>} likes - An array of IDs who liked the thread
 * 
 * @returns {void}
 */
function displayThreadsList(threads) {

    for (const thread of threads) {
        const newThread = document.createElement('ul');
        newThread.className = 'thread-item';
        newThread.id = `thread-item-${thread.id}`;
        document.getElementById('threads-list-container').appendChild(newThread);

        document.getElementById(newThread.id).addEventListener('click', () => {
            const activeLists = document.querySelectorAll('.thread-item.active');
            activeLists.forEach(list => list.classList.remove('active'));
            newThread.classList.add('active');
            displayThread(thread.id);
        })

        const newThreadTitle = document.createElement('p');
        newThreadTitle.className = 'thread-title';
        newThreadTitle.textContent = thread.title;
        newThread.appendChild(newThreadTitle);

        const dateFormat = helperFormatDate(thread.createdAt);
        const newThreadDate = document.createElement('p');
        newThreadDate.className = 'thread-date';
        newThreadDate.textContent = dateFormat;
        newThread.appendChild(newThreadDate);

        const newThreadAuthor = document.createElement('p');
        newThreadAuthor.className = 'thread-author';
        newThreadAuthor.textContent = `by ${thread.creatorName}`;
        newThread.appendChild(newThreadAuthor);

        const newThreadLikeCount = document.createElement('p');
        newThreadLikeCount.className = 'thread-likes';
        newThreadLikeCount.setAttribute('id', `thread-likes-${thread.id}`);
        newThreadLikeCount.textContent = `Likes: ${thread.likes.length}`;
        newThread.appendChild(newThreadLikeCount);
    }

    threads.length < 5 ? hideElement('show-more-threads') : showElement('show-more-threads');
}

/**
 * Help function for displayThreadsList
 * Formats a date string into format (DD MMM YYYY).
 *
 * @param {string} dateString - The date string to format.
 * @returns {string} The formatted date ass 'DD MMM YYYY'.
 */
function helperFormatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-GB', options);
    return formattedDate;
}

/**
 * Loads and displays more threads in the threads list container.
 * Calculates the current number of threads displayed,
 * then calls `handleThreadsList` to fetch and display additional threads.
 *
 * @returns {void}
 */
function displayMoreThreads() {
    currNumThreads = document.getElementById('threads-list-container').children.length;
    handleThreadsList(currNumThreads);
}

/**
 * Prepares the edit thread screen by loading the current thread's data.
 *
 * This function hides the individual thread display screen and shows the 
 * edit screen, allowing the user to edit thread's title and content.
 * It retrieves the current thread's details and populates the edit fields.
 * Displays buttons for saving or deleting the thread.
 *
 * @returns {void}
 */
function editThread() {
    hideElement('individual-thread-display-screen');
    showElement('individual-thread-edit-screen');
    showElement('save-btn');
    showElement('delete-btn');

    getThread(token, currThreadDisplayId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(error);
            } else {
                document.getElementById('edit-title').value = data.title;
                document.getElementById('edit-body').value = data.content;
                if (!currThreadDisplayPublic) {
                    document.getElementById('private-checkbox-edit').checked = true;
                }
                document.getElementById('lock-checkbox-edit').checked = false;
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Saves the edits made to the current thread.
 *
 * Retrieves the updated thread title, content, 
 * and visibility settings from the edit form. It checks if the 
 * lock status has changed and updates the thread accordingly 
 * using the updateThread API. If successful, displays the updated 
 * thread and hides the edit interface.
 *
 * @returns {void}
 */
function saveEditThread() {
    const threadTitle = document.getElementById('edit-title').value;
    const threadContent = document.getElementById('edit-body').value;
    const isPublic = !(document.getElementById('private-checkbox-edit').checked);
    let lockChanged = false;
    let lock = true;
    if (!currThreadDisplayLock) {
        lockChanged = true;
        lock = document.getElementById('lock-checkbox-edit').checked;
    }
    updateThread(token, currThreadDisplayId, threadTitle, isPublic, lock, threadContent)
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                showElement('individual-thread-display-screen');
                hideElement('individual-thread-edit-screen');

                currThreadDisplayLock = lock;
                currThreadDisplayPublic = isPublic;
                if (lock) {
                    hideElement('edit-btn');
                }
                displayThread(currThreadDisplayId);
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })

    hideElement('save-btn');
    hideElement('delete-btn');
}

/**
 * Deletes the currently displayed thread.
 *
 * Resets the like and watch buttons, then calls 
 * the deleteThread API to delete the current thread. If success,
 * clears the thread display elements and navigates back to the 
 * dashboard. If an error occurs, displays an error popup.
 *
 * @returns {void}
 */
function deleteCurrThread() {
    document.getElementById('like-btn').className = 'unliked';
    document.getElementById('watch-btn').className = 'unwatched';
    document.getElementById('like-btn').textContent = 'Like';
    document.getElementById('watch-btn').textContent = 'Watch';
    deleteThread(token, currThreadDisplayId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                currThreadDisplayId = "";
                currThreadDisplayPublic = null
                currThreadDisplayLock = null;
                hideElement('individual-thread-edit-screen');
                hideElement('comments-container');
                document.getElementById('author-picture').src = "";
                hideElement('author-picture');
                document.getElementById('thread-post-author').textContent = "";
                document.getElementById('thread-name').textContent = "";
                document.getElementById('thread-body').textContent = "";
                document.getElementById('thread-like-count').textContent = "";
                // navigateTo('dashboard');
                const latestThread = document.getElementById('threads-list-container').firstChild;
                if (latestThread) {
                    const idThread = latestThread.id.match(/\d+/)[0];
                    currThreadDisplayId = idThread;
                    navigateTo('dashboard');
                }
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Toggles the like status for the currently displayed thread.
 *
 * Updates the like button  appearance based on the current
 * like status and calls API to update the like status on the server. 
 * It then updates the like count displayed to the user. 
 *
 * @returns {void}
 */
function handleLike() {
    const likeButton = document.getElementById('like-btn');
    let like = true;
    if (currThreadDisplayLike) {
        likeButton.classList.replace('liked', 'unliked');
        likeButton.src = "assets/heartIconUnliked.svg";
        like = false;

    } else {
        likeButton.classList.replace('unliked', 'liked');
        likeButton.src = "assets/heartIconLiked.svg";
    }
    currThreadDisplayLike = !(currThreadDisplayLike);

    updateLikeStatus(token, currThreadDisplayId, currThreadDisplayLike)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                let likeCountElement = document.getElementById('thread-like-count');
                let likeCount = Number(likeCountElement.textContent.split(' ')[0]) + (like ? 1 : -1);
                let likeCountText = `${likeCount} Like${likeCount !== 1 ? 's' : ''}`;
                likeCountElement.textContent = likeCountText;
                changeLikeSideBar();
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Updates the sidebar to reflect the current like count for the displayed thread.
 *
 * This function retrieves the latest thread data from the server and updates
 * the like count displayed in the sidebar. If an error occurs during the
 * API call, an error popup is displayed.
 *
 * @returns {void}
 */
function changeLikeSideBar() {

    getThread(token, currThreadDisplayId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                let likeDisplay = document.getElementById(`thread-likes-${currThreadDisplayId}`);
                if (likeDisplay) {
                    likeDisplay.textContent = `Likes: ${data.likes.length}`
                }
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}


/**
 * Toggles the watch status for the currently displayed thread.
 *
 * This function updates the watch button's visual state and calls the server
 * to change the watch status for the thread. If the thread is currently being
 * watched, it will stop watching; otherwise, it will start watching.
 * If an error occurs during the API call, an error popup is displayed.
 *
 * @returns {void}
 */
function handleWatch() {
    let watch = true;
    const watchButton = document.getElementById('watch-btn');

    // Toggle the like button's state and styles
    if (watchButton.classList.contains('watched')) {
        watchButton.classList.replace('watched', 'unwatched');
        watchButton.textContent = 'Watch';
        watch = false;
    } else {
        watchButton.classList.replace('unwatched', 'watched');
        watchButton.textContent = 'Watching';
    }

    watchThread(token, currThreadDisplayId, watch)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Creates a new comment for the currently displayed thread.
 *
 * This function retrieves the comment content from the input field, sends it to the server,
 * and posts the comment. If successful, it refreshes the comments list by calling 
 * `handleGetComments()`. If an error occurs during the API call, an error popup is displayed.
 *
 * @returns {void}
 */
function createComment() {

    const content = document.getElementById('new-comment-input').value;

    postComment(token, content, currThreadDisplayId, null)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                handleGetComments();
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Retrieves and displays comments for the currently displayed thread.
 *
 * This function manages the visibility of the comment input container based on the thread's lock status.
 * It clears existing comments, fetches the latest comments from the server, and handles sorting and 
 * displaying them. If an error occurs during the API call, an error popup is displayed.
 *
 * @returns {void}
 */
function handleGetComments() {
    currThreadDisplayLock ? hideElement('comment-input-container') : showElement('comment-input-container');

    const commentsList = document.getElementById('comment-list-container')
    while (commentsList.firstChild) {
        commentsList.removeChild(commentsList.firstChild);
    }
    showElement('comments-container');
    getComments(token, currThreadDisplayId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            (data.length == 0) ? showElement('empty-comment-list') : hideElement('empty-comment-list');
            data.sort((a, b) => {
                const aHasParent = a.parentCommentId !== null;
                const bHasParent = b.parentCommentId !== null;
                if (aHasParent === bHasParent) {
                    return new Date(a.createdAt) - new Date(b.createdAt);
                }
                // If a has a parent and b does not, b should come first
                return aHasParent ? 1 : -1;
            });
            getCommentInfo(data);
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Retrieves user information for each comment and adds comment elements to the DOM.
 *
 * @param {Array} comments - An array of comment objects, each containing a creatorId 
 *                           and other relevant data.
 * @returns {void}
 */
function getCommentInfo(comments) {
    let user;
    let parentCommentId;
    for (const comment of comments) {
        getUser(token, comment.creatorId)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                } else {
                    user = data;
                    parentCommentId = comment.parentCommentId;
                    addCommentsElements(user, comment, parentCommentId);
                }
            })
            .catch(error => {
                displayErrorPopup(error);
            })
    }
}

/**
 * Creates and appends comment elements to the DOM, including user information and interaction features.
 *
 * This function constructs a new comment item element, populating it with user profile information, 
 * the comment's content, like button, and reply button. It also handles the styling and event listeners 
 * for liking and replying to comments. If the comment is a reply, it adjusts the indentation 
 * based on the parent comment. The function checks if the user is the comment creator or an admin 
 * to display edit options.
 *
 * @param {Object} user - The user object containing information about the comment's creator.
 * @param {Number} user.id - The unique identifier of the user.
 * @param {string} user.name - The name of the user.
 * @param {string} user.image - The URL of the user's profile image.
 * 
 * @param {Object} comment - The comment object containing details about the comment.
 * @param {Number} comment.id - The unique identifier of the comment.
 * @param {string} comment.content - The text content of the comment.
 * @param {Array} comment.likes - An array of user IDs who liked the comment.
 * @param {Date} comment.createdAt - The timestamp when the comment was created.
 * 
 * @param {Number|null} parentCommentId - The ID of the parent comment if this comment is a reply; null if it's a top-level comment.
 *
 * @returns {void}
 */
function addCommentsElements(user, comment, parentCommentId) {

    const newCommentItem = document.createElement('div');
    newCommentItem.className = 'comment-item';
    newCommentItem.id = `comment-${comment.id}`

    const profilePic = document.createElement('img');
    profilePic.className = 'comment-profile';
    profilePic.id = 'comment-profile-image';

    profilePic.src = user.image ? user.image : "assets/defaultUserProfile.svg";
    profilePic.alt = 'pic';

    const commentBodyContainer = document.createElement('div');
    commentBodyContainer.className = 'comment-body';

    const commentItemHeader = document.createElement('div');
    commentItemHeader.className = 'comment-item-header';


    const headerText = document.createElement('p');

    const commentItemUsername = document.createElement('span');
    commentItemUsername.className = 'comment-item-username';
    commentItemUsername.classList.add(`${user.id}`);
    commentItemUsername.textContent = user.name;

    const commentItemTime = document.createElement('span');
    commentItemTime.className = 'comment-item-time-posted';
    commentItemTime.textContent = calcTimeSinceComment(comment.createdAt);

    const commentItemText = document.createElement('p');
    commentItemText.className = 'comment-item-text';
    commentItemText.id = `comment-item-text-${comment.id}`;
    commentItemText.textContent = comment.content;

    const commentItemLike = document.createElement('div');
    commentItemLike.className = 'comment-item-like';
    commentItemLike.id = `comment-item-like-${comment.id}`;

    const commentItemLikeCount = document.createElement('p');
    commentItemLikeCount.className = 'comment-item-like-count';
    commentItemLikeCount.id = `comment-item-like-count-${comment.id}`;
    commentItemLikeCount.textContent = `${comment.likes.length} ${comment.likes.length === 1 ? 'Like' : 'Likes'}`;

    const commentItemLikeButton = document.createElement('img');

    const isLiked = comment.likes.includes(Number(userId)) ? "liked" : "unliked";
    commentItemLikeButton.classList.add('comment-item-like-button', isLiked);

    if (isLiked === 'liked') {
        commentItemLikeButton.src = "assets/thumbsUpFilled.svg";
    } else if (isLiked === 'unliked') {
        commentItemLikeButton.src = "assets/thumbsUpUnfilled.svg";
    }
    commentItemLikeButton.id = `comment-like-${comment.id}`;

    const replyBtn = document.createElement('button');
    replyBtn.textContent = 'Reply';
    replyBtn.className = 'comment-reply-btn';
    replyBtn.id = `comment-reply-${comment.id}`;

    newCommentItem.appendChild(profilePic);
    newCommentItem.appendChild(commentBodyContainer);

    if ((!currThreadDisplayLock) && ((userId == user.id) || (userIsAdmin))) {
        const commentItemMenu = document.createElement('button');
        commentItemMenu.className = 'comment-item-menu';
        commentItemMenu.id = `comment-item-menu-${comment.id}`;
        commentItemMenu.textContent = 'Edit';
        newCommentItem.appendChild(commentItemMenu);

        commentItemMenu.addEventListener('click', () => {
            editCommentText(comment.id, comment.content);
        });
    }

    commentBodyContainer.appendChild(commentItemHeader);
    commentItemHeader.appendChild(headerText);

    headerText.appendChild(commentItemUsername);
    headerText.appendChild(commentItemTime);

    commentBodyContainer.appendChild(commentItemText);
    commentBodyContainer.appendChild(commentItemLike);
    commentItemLike.appendChild(commentItemLikeButton);
    commentItemLike.appendChild(commentItemLikeCount);
    commentItemLike.appendChild(replyBtn);

    if (parentCommentId != null) {
        setTimeout(() => {
            const parentCommentItem = document.getElementById(`comment-${parentCommentId}`);
            const computedStyle = window.getComputedStyle(parentCommentItem);
            const marginLeft = computedStyle.marginLeft;
            let marginLeftValue = parseInt(marginLeft, 10);
            let indent = marginLeftValue + 35;
            newCommentItem.style.marginLeft = `${indent}px`;
            newCommentItem.classList.add(`parent-${parentCommentId}`);
            parentCommentItem.insertAdjacentElement('afterend', newCommentItem);
            insertCommentEventListeners(comment.id)
        }, 500);
    } else {
        setTimeout(() => {
            document.getElementById('comment-list-container').appendChild(newCommentItem);
            insertCommentEventListeners(comment.id)
        }, 500);
    }
}

/**
 * Attaches event listeners to the like and reply buttons of a specific comment.
 *
 * @param {number} commentId 
 * @returns {void}
 */
function insertCommentEventListeners(commentId) {
    document.getElementById(`comment-like-${commentId}`).addEventListener('click', () => {
        if (!currThreadDisplayLock) {
            likeCommentId(commentId);
        }
    });
    document.getElementById(`comment-reply-${commentId}`).addEventListener('click', () => {
        if (!currThreadDisplayLock) {
            replyComment(commentId);
        }
    });
}

/**
 * Toggles the like status of a specific comment and updates the UI accordingly.
 *
 * @param {number} commentId 
 * @returns {void}
 */
function likeCommentId(commentId) {
    let likeStatus = false;
    const comment = document.getElementById(`comment-like-${commentId}`);
    if (comment.classList.contains('unliked')) {
        comment.classList.replace('unliked', 'liked');
        comment.src = "assets/thumbsUpFilled.svg";
        likeStatus = true;
    } else {
        comment.classList.replace('liked', 'unliked');
        comment.src = "assets/thumbsUpUnfilled.svg";
    }

    likeComment(token, commentId, likeStatus)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayErrorPopup(data.error);
            }
            getComments(token, currThreadDisplayId)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(error);
                    } else {
                        updateCommentLike(commentId);
                    }
                })
                .catch(error => {
                    displayErrorPopup(error);
                })
        })
}

/**
 * Updates the like count display for a specific comment based on the latest data.
 * @param {number} commentId
 */
function updateCommentLike(commentId) {
    getComments(token, currThreadDisplayId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                displayErrorPopup(data.error);
            } else {
                for (const obj of data) {
                    if (obj.id == commentId) {
                        document.getElementById(`comment-item-like-count-${commentId}`).textContent =
                            `${obj.likes.length} ${obj.likes.length === 1 ? 'Like' : 'Likes'}`;
                    }
                }
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Edits the content of a comment by replacing it with a textarea 
 * and providing options to save or delete the comment.
 *
 * @param {number} commentId - The ID of the comment to edit.
 * @param {string} currContent - The current content of the comment.
 */
function editCommentText(commentId, currContent) {
    hideElement(`comment-item-like-${commentId}`);
    const editCommentBox = document.createElement('textarea');
    editCommentBox.id = 'edit-comment-textbox';
    editCommentBox.textContent = currContent;

    document.getElementById(`comment-item-text-${commentId}`).replaceWith(editCommentBox);

    const editCommentOptions = document.createElement('div');
    editCommentOptions.id = 'edit-comment-options';
    document.getElementById(`comment-item-like-${commentId}`).replaceWith(editCommentOptions);

    const saveComment = document.createElement('button');
    saveComment.id = 'comment-save-btn';
    saveComment.textContent = 'Save';
    editCommentOptions.appendChild(saveComment);

    const deleteComment = document.createElement('button');
    deleteComment.id = 'comment-delete-btn';
    deleteComment.textContent = 'Delete'
    editCommentOptions.appendChild(deleteComment);

    saveComment.addEventListener('click', () => {
        saveEditedComment(commentId);
    })

    deleteComment.addEventListener('click', () => {
        deleteCommentItem(commentId);
    })
}

/**
 * Saves the edited content of a comment by updating it on the server.
 * 
 * @param {number} commentId - The ID of the comment to be edited.
 */
function saveEditedComment(commentId) {
    const newContent = document.getElementById('edit-comment-textbox').value;
    editComment(token, commentId, newContent)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                handleGetComments();
            }
        })
        .catch(error => {
            displayErrorPopup(data.error);
        })
}

/**
 * Deletes a comment from the server and removes it from the DOM.
 * 
 * @param {number} commentId - The ID of the comment to be deleted.
 */
function deleteCommentItem(commentId) {
    deleteComment(token, commentId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            const commentItem = document.getElementById(`comment-${commentId}`);
            deleteRepliesRecursive(commentId);
            while (commentItem.firstChild) {
                commentItem.firstChild.remove();
            }
            commentItem.remove();
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Recursively deletes replies of a parent comment
 * 
 * @param {number} parentCommentId
 */
function deleteRepliesRecursive(parentCommentId) {
    const replyItems = document.querySelectorAll(`[class*="parent-${parentCommentId}"]`);
    replyItems.forEach(reply => {
        const replyId = reply.id.match(/comment-(\d+)/)[1];
        deleteRepliesRecursive(replyId);
        reply.remove();
    });
}

/**
 * Creates a reply interface for a specified comment, allowing the user to add a reply or cancel it.
 * 
 * @param {number} parentCommentId - The ID of the comment being replied to.
 */

function replyComment(parentCommentId) {
    const replyTextbox = document.createElement('textarea');
    replyTextbox.id = 'reply-text-box';
    replyTextbox.focus();
    replyTextbox.placeholder = 'Add a reply...';
    document.getElementById(`comment-item-like-${parentCommentId}`).insertAdjacentElement('afterend', replyTextbox);
    hideElement(`comment-reply-${parentCommentId}`);

    const postReply = document.createElement('button');
    postReply.id = 'post-reply-btn';
    postReply.textContent = 'Reply'

    const cancelReply = document.createElement('button');
    cancelReply.id = 'cancel-reply-btn';
    cancelReply.textContent = 'Cancel'

    const replyContainer = document.createElement('div');
    replyContainer.id = 'reply-container';

    replyContainer.appendChild(cancelReply);
    replyContainer.appendChild(postReply)
    replyTextbox.insertAdjacentElement('afterend', replyContainer);
    replyTextbox.focus();

    postReply.addEventListener('click', () => {
        submitReply(parentCommentId);
        showElement(`comment-reply-${parentCommentId}`);
        removeElement('reply-text-box');
        removeElement('cancel-reply-btn');
        removeElement('post-reply-btn');
        removeElement('reply-container');
    })

    cancelReply.addEventListener('click', () => {
        showElement(`comment-reply-${parentCommentId}`);
        removeElement('reply-text-box');
        removeElement('cancel-reply-btn');
        removeElement('post-reply-btn');
        removeElement('reply-container');
    })

}

/**
 * Submits a reply to a specified parent comment, updating the comment list with the new reply.
 * 
 * @param {number} parentCommentId - The ID of the parent comment to which the reply is being submitted.
 */

function submitReply(parentCommentId) {
    const content = document.getElementById('reply-text-box').value
    postComment(token, content, currThreadDisplayId, parentCommentId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } return data.id;
        })
        .then(commentId => {
            getComments(token, currThreadDisplayId)
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        throw new Error(data.error);
                    }

                    const comment = data.find(comment => (comment.id == commentId));
                    getUser(token, userId)
                        .then(response => response.json())
                        .then(data => {
                            if (data.error) {
                                throw new Error(data.error);
                            }
                            addCommentsElements(data, comment, parentCommentId);
                        })
                        .catch(error => {
                            displayErrorPopup(error);
                        })

                })
        })

        .catch(error => {
            displayErrorPopup(error)
        })
}

/**
 * Calculates the time since a comment was created and returns a human-readable string.
 * 
 * @param {string} timeCreated - The creation time of the comment in a date format.
 * @returns {string} A string representing the time since the comment was created (e.g., "2 minutes ago").
 */

function calcTimeSinceComment(timeCreated) {
    const now = new Date();
    const commentDate = new Date(timeCreated);
    const diffInSeconds = Math.floor((now - commentDate) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        if (diffInMinutes == 1) {
            return `${diffInMinutes} minute ago`;
        }
        return `${diffInMinutes} minutes ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        if (diffInHours == 1) {
            return `${diffInHours} hour ago`;
        }
        return `${diffInHours} hours ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        if (diffInDays == 1) {
            return `${diffInDays} day ago`;
        }
        return `${diffInDays} days ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks == 1) {
        return `${diffInWeeks} week ago`;
    }

    return `${diffInWeeks} weeks ago`;
}

/**
 * Navigates to the user profile page and displays the user's profile and threads.
 * 
 * @param {number} id
 */

function goToUserProfile(id) {
    navigateTo('user-profile');
    handleUserProfileDisplay(id);
    getThreadsUserPosted(id);
}

/**
 * Navigates to the user profile page of the thread creator and displays their information and threads.
 */

function goToThreadPostProfile() {
    navigateTo('user-profile');
    getThread(token, currThreadDisplayId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            handleUserProfileDisplay(data.creatorId);
            getThreadsUserPosted(data.creatorId);
            const currProfileDisplay = document.getElementsByClassName('user-info-container')[0];
            currProfileDisplay.id = `profile-${data.creatorId}`
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Displays the user profile based on the provided user profile ID
 */
function handleUserProfileDisplay(userProfileId) {
    (!(userId == userProfileId)) ? hideElement('edit-profile') : showElement('edit-profile');
    (userIsAdmin) ? showElement('admin-dropdown-container') : hideElement('admin-dropdown-container');

    getIsUserAdmin(userProfileId)
        .then(isAdmin => {
            if (isAdmin) {
                document.getElementById('admin-set').value = "is-admin";
            } else {
                document.getElementById('admin-set').value = "is-user";
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        });

    const profileContainer = document.getElementsByClassName('user-info-container')[0];
    profileContainer.id = `user-info-${userProfileId}`;

    getUser(token, userProfileId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            const name = data.name;
            const email = data.email;
            const admin = data.admin;
            const image = data.image;
            displayUserProfileDetails(name, email, admin, image);
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Updates the admin status of a user based on the provided ID and admin status string.
 */

function updateAdminStatus(id, adminStatus) {
    let isAdmin = false;
    if (adminStatus == 'is-admin') {
        isAdmin = true;
    }
    setAdminStatus(token, id, isAdmin)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            if (isAdmin) {
                document.getElementById('admin-set').value = "is-admin";
                document.getElementById('user-profile-admin').textContent = 'Administrator';
            } else {
                document.getElementById('user-profile-admin').textContent = 'User';
                if (userId == id) {
                    document.getElementById('admin-set').style.display = 'none';
                } else {
                    document.getElementById('admin-set').value = "is-user";
                }
            }
            if (userId == id) {
                userIsAdmin = isAdmin;
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Displays the user profile details, including the user's image, name, email, and admin status.
 * 
 * @param {string} name - The name of the user.
 * @param {string} email - The email of the user.
 * @param {boolean} isAdmin - Indicates if the user is an admin.
 * @param {string} image - The URL of the user's profile image.
 * 
 * @returns {void}
 */
function displayUserProfileDetails(name, email, isAdmin, image) {
    const userImage = document.getElementById('user-profile-image');
    if (image) {
        userImage.src = image;
    } else {
        userImage.src = "assets/defaultUserProfile.svg";
    }

    document.getElementById('user-profile-name').textContent = `${name}`;
    document.getElementById('user-profile-email').textContent = `${email}`;
    if (isAdmin) {
        document.getElementById('user-profile-admin').textContent = "Administrator";
    } else {
        document.getElementById('user-profile-admin').textContent = "";
    }
}

/**
 * Fetches and displays all threads posted by a specific user.
 *
 * @param {number} userId - The ID of the user whose threads are to be fetched.
 * @returns {void}
 */
function getThreadsUserPosted(userId) {
    let index = 0;
    let allThreads = [];

    function fetchThreads(index) {
        getAllThreads(token, index)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(error);
                } else {
                    if (data.length === 0) {
                        Promise.all(allThreads)
                            .then(threads => {
                                const userThreads = threads.filter(thread => thread !== null);
                                displayUserThreads(userThreads);
                            })
                            .catch(error => {
                                displayErrorPopup(error);
                            });
                        return;
                    }
                    const threadsArray = data.map(threadId =>
                        getThread(token, threadId)
                            .then(response => response.json())
                            .then(threadData => {
                                if (threadData.creatorId == userId) {
                                    return threadData;
                                }
                                return null;
                            })
                    );
                    allThreads.push(...threadsArray);
                    fetchThreads(index + 5);
                }
            })
            .catch(error => {
                displayErrorPopup(error);
            });
    }
    fetchThreads(index);
}

/**
 * Displays the threads posted by a user in the user profile.
 * 
 * @param {Array} threads - An array of thread objects, where each thread object 
 * contains :
 *   - {number} id - The unique identifier for the thread.
 *   - {string} title - The title of the thread.
 *   - {string} content - The content of the thread.
 *   - {Array} likes - An array of likes associated with the thread.
 * 
 * @returns {void}
 */

function displayUserThreads(threads) {

    const userThreadList = document.getElementById('user-threads-container');
    while (userThreadList.firstChild) {
        userThreadList.firstChild.remove();
    }
    const threadsListHeader = document.createElement('h4');
    threadsListHeader.id = 'user-profile-thread-header';
    threadsListHeader.textContent = "Threads";
    userThreadList.appendChild(threadsListHeader);
    let numLikes;
    let numComments;
    threads.forEach(thread => {
        numLikes = thread.likes.length;
        getComments(token, thread.id)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                } else {
                    numComments = data.length ? data.length : 0;
                }

                const threadItem = document.createElement('div');
                threadItem.className = 'user-thread-list-item';
                threadItem.id = `user-thread-list-item-${thread.id}`;

                const threadTitle = document.createElement('p');
                threadTitle.className = 'user-thread-list-item-title';
                threadTitle.textContent = thread.title;
                threadItem.appendChild(threadTitle);

                const threadBody = document.createElement('p');
                threadBody.className = 'user-thread-list-item-body'
                threadBody.textContent = thread.content;
                threadItem.appendChild(threadBody);

                const threadDetails = document.createElement('div');
                threadDetails.className = 'user-thread-list-item-details'

                const threadLikes = document.createElement('p');
                threadLikes.className = 'user-thread-list-item-likes'
                threadLikes.textContent = (numLikes == 1) ? `${numLikes} Like` : `${numLikes} Likes`;
                threadDetails.appendChild(threadLikes);

                const threadComments = document.createElement('p');
                threadComments.className = 'user-thread-list-item-comments'
                threadComments.textContent = (numComments == 1) ? `${numComments} Comment` : `${numComments} Comments`;;
                threadDetails.appendChild(threadComments);
                threadItem.appendChild(threadDetails);

                userThreadList.appendChild(threadItem);
            })
            .catch(error => {
                displayErrorPopup(error);
            })

    })
}

/**
 * Handles the process of editing a user's profile.
 * @returns {void}
 */
function handleEditUserProfile() {
    hideElement('edit-profile');
    showElement('save-profile');

    const detailsContainer = document.getElementById('user-details-container')

    const editImage = document.createElement('input');
    editImage.id = 'user-profile-edit-image';
    editImage.type = 'file';
    editImage.accept = "image/jpeg, image/png, image/jpg"
    editImage.style.display = 'none';


    const editImageLabel = document.createElement('label');
    editImageLabel.setAttribute('for', 'user-profile-edit-image');
    editImageLabel.id = "input-file-btn";
    editImageLabel.innerText = 'Upload Image';

    const userImage = document.getElementById('user-profile-image');
    userImage.insertAdjacentElement('afterend', editImageLabel);
    userImage.insertAdjacentElement('afterend', editImage);

    editImage.addEventListener('change', function (event) {
        let image = userImage.src;
        const file = event.target.files[0];
        fileToDataUrl(file)
            .then(dataUrl => {
                image = dataUrl;
                userImage.src = image;
            })
            .catch(error => {
                displayErrorPopup(error);
            });

    });


    const editName = document.createElement('input')
    editName.className = 'register-input';
    editName.classList.add('edit-input');
    editName.value = document.getElementById('user-profile-name').textContent;
    editName.id = 'user-profile-edit-name';

    const editEmail = document.createElement('input')
    editEmail.className = 'register-input';
    editEmail.classList.add('edit-input');
    editEmail.value = document.getElementById('user-profile-email').textContent;
    editEmail.id = 'user-profile-edit-email';

    detailsContainer.replaceChild(editName, document.getElementById('user-profile-name'));
    detailsContainer.replaceChild(editEmail, document.getElementById('user-profile-email'));

    const passwordLabel = document.createElement('h6');
    passwordLabel.className = 'profile-detail-label';
    passwordLabel.id = 'password-label';
    passwordLabel.textContent = 'Password:';

    const passwordInput = document.createElement('input');
    passwordInput.className = 'register-input';
    passwordInput.classList.add('edit-input');
    passwordInput.type = "password";
    passwordInput.id = 'user-profile-password';

    const confPasswordLabel = document.createElement('h6');
    confPasswordLabel.className = 'profile-detail-label';
    confPasswordLabel.id = 'confpassword-label';
    confPasswordLabel.textContent = 'Confirm Password:';

    const confPasswordInput = document.createElement('input');
    confPasswordInput.className = 'register-input';
    confPasswordInput.classList.add('edit-input');
    confPasswordInput.type = "password";
    confPasswordInput.id = 'user-profile-confpassword';

    editEmail.insertAdjacentElement('afterend', passwordLabel);
    passwordLabel.insertAdjacentElement('afterend', passwordInput);

    passwordInput.insertAdjacentElement('afterend', confPasswordLabel);
    confPasswordLabel.insertAdjacentElement('afterend', confPasswordInput);

}

/**
 * Saves the edits made to the user's profile.
 * @returns {void}
 */
function saveEditsUserProfile() {
    const newName = document.getElementById('user-profile-edit-name').value;
    let newEmail = document.getElementById('user-profile-edit-email').value;
    const newPassword = document.getElementById('user-profile-password').value;
    const newConfPassword = document.getElementById('user-profile-confpassword').value;

    if (newName == null) {
        displayErrorPopup("Invalid name");
    } else if (!isValidEmail(newEmail)) {
        displayErrorPopup("Invalid email address");
    } else if (newPassword != newConfPassword) {
        displayErrorPopup("Passwords don't match");
    }
    const userId = document.getElementsByClassName('user-info-container')[0].id.match(/\d+$/)[0];

    getUser(token, userId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error)
            } else {
                if (newEmail == data.email) {
                    newEmail = null;
                }
            }
        })
        .then(() => {
            const imageInput = document.getElementById('user-profile-edit-image');
            let image = null;
            if (imageInput.files.length > 0) {
                const file = imageInput.files[0];
                fileToDataUrl(file)
                    .then(dataUrl => {
                        image = dataUrl;
                        updateUser(token, newEmail, newPassword, newName, image)
                            .then(response => response.json())
                            .then(data => {
                                if (data.error) {
                                    throw new Error(data.error);
                                } else {
                                    saveDisplay(userId)
                                }
                            })
                            .catch(error => {
                                displayErrorPopup(error);
                            })
                    })
                    .catch(error => {
                        displayErrorPopup(error);
                    });
            } else {
                updateUser(token, newEmail, newPassword, newName, image)
                    .then(response => response.json())
                    .then(data => {
                        if (data.error) {
                            throw new Error(data.error);
                        } else {
                            saveDisplay(userId)
                        }
                    })
                    .catch(error => {
                        displayErrorPopup(error);
                    })
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })
}

/**
 * Updates the user profile display after saving edits.
 * @param {number} userId
 * @returns {void}
 */

function saveDisplay(userId) {
    showElement('user-profile-admin');
    removeElement('user-profile-edit-image');
    removeElement('input-file-btn');
    const nameInput = document.getElementById('user-profile-edit-name');
    const nameText = document.createElement('p');
    nameText.id = 'user-profile-name'
    nameInput.parentNode.replaceChild(nameText, nameInput);

    const emailInput = document.getElementById('user-profile-edit-email');
    const emailText = document.createElement('p');
    emailText.id = 'user-profile-email'
    emailInput.parentNode.replaceChild(emailText, emailInput);


    removeElement('user-profile-password');
    removeElement('user-profile-confpassword');
    removeElement('password-label');
    removeElement('confpassword-label');
    showElement('edit-profile');

    getUser(token, userId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            } else {
                const name = data.name;
                const email = data.email;
                const admin = data.admin;
                const image = data.image;
                displayUserProfileDetails(name, email, admin, image);
                hideElement('save-profile');
                showElement('edit-profile');
            }
        })
        .catch(error => {
            displayErrorPopup(error);
        })

}

/**
 * Validates an email address format.
 * @param {string} email
 * @returns {boolean} - `true` if the email is valid, `false` if it is not.
 */
function isValidEmail(email) {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
}

/**
 * Displays an error popup with a specified message.
 * @param {string} message - The error message to be displayed in the popup.
 */
function displayErrorPopup(message) {
    document.getElementById('error-popup').style.display = '';
    document.getElementById('error-message').textContent = message;
}

/**
 * Handles user logout by resetting session data and navigating to the login page.
 */
function handleLogout() {
    token = null;
    userId = null;
    userIsAdmin = null;
    currThreadDisplayId = ""
    currThreadDisplayPublic = null
    currThreadDisplayLock = null;
    currNumThreads = 0;
    currThreadDisplayLike = false;
    currThreadDisplayWatch = false;

    document.getElementById('thread-name').textContent = '';
    document.getElementById('thread-body').innerHTML = '';
    document.getElementById('thread-like-count').textContent = '';


    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-name').value = '';
    document.getElementById('register-conf-password').value = '';
    navigateTo('login');
}

/**
 * Checks for an existing authentication token in local storage and retrieves the 
 * corresponding user ID. If a token is found, it fetches the user data to determine 
 * if the user has admin privileges.Then navigates to the dashboard. 
 * If no token is present, it redirects the user to the login page.
 */
if (localStorage.getItem('token') != null) {
    token = localStorage.getItem('token');
    userId = localStorage.getItem('userId');
    getUser(token, userId)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            userIsAdmin = data.admin;
        })
        .catch(error => {
            displayErrorPopup(error);
        })

    navigateTo('dashboard');
} else {
    navigateTo('login');
}
