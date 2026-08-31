```javascript
// ============================================
// PET WATCH
// Firebase + Social Feed
// ============================================

// ---------- FIREBASE IMPORTS ----------

import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBwx1-yHrGXNkVvIIBP97W9-HR2bj9UFBc",
  authDomain: "pet-watch-76184.firebaseapp.com",
  projectId: "pet-watch-76184",
  storageBucket: "pet-watch-76184.firebasestorage.app",
  messagingSenderId: "453733578590",
  appId: "1:453733578590:web:d0799bedc92e204643c1cf"
};


// ============================================
// INITIALIZE FIREBASE
// ============================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);

const storage = getStorage(firebaseApp);


// ============================================
// HTML ELEMENTS
// ============================================

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("app");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");

const feed = document.getElementById("feed");

const postModal = document.getElementById("postModal");


// ============================================
// LOGIN / REGISTER SWITCH
// ============================================

document.getElementById("showRegister").addEventListener("click", () => {

  loginForm.classList.add("hidden");

  registerForm.classList.remove("hidden");

});


document.getElementById("showLogin").addEventListener("click", () => {

  registerForm.classList.add("hidden");

  loginForm.classList.remove("hidden");

});


// ============================================
// REGISTER NEW USER
// ============================================

document.getElementById("registerBtn").addEventListener("click", async () => {

  const name = registerName.value.trim();

  const email = registerEmail.value.trim();

  const password = registerPassword.value;


  if (!name || !email || !password) {

    alert("Please complete all fields.");

    return;

  }


  if (password.length < 6) {

    alert("Password must be at least 6 characters.");

    return;

  }


  try {

    // Create Firebase account

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user = userCredential.user;


    // Add the user's name to Firebase Authentication

    await updateProfile(user, {

      displayName: name

    });


    // Create user document in Firestore

    await addDoc(
      collection(db, "users"),
      {

        uid: user.uid,

        name: name,

        email: email,

        posts: 0,

        found: 0,

        helped: 0,

        createdAt: serverTimestamp()

      }
    );


    alert("Account created! Welcome to Pet Watch 🐾");


  } catch (error) {

    console.error(error);

    alert(error.message);

  }

});


// ============================================
// LOGIN
// ============================================

document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = loginEmail.value.trim();

  const password = loginPassword.value;


  if (!email || !password) {

    alert("Please enter your email and password.");

    return;

  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


  } catch (error) {

    console.error(error);

    alert("Incorrect email or password.");

  }

});


// ============================================
// LOGOUT
// ============================================

document.getElementById("logoutBtn").addEventListener("click", async () => {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

  }

});


// ============================================
// AUTHENTICATION STATE
// ============================================

onAuthStateChanged(auth, async (user) => {

  if (user) {

    // User is logged in

    authScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");


    updateProfileUI(user);


    await loadFeed();


  } else {

    // User is logged out

    authScreen.classList.remove("hidden");

    appScreen.classList.add("hidden");

  }

});


// ============================================
// UPDATE PROFILE
// ============================================

function updateProfileUI(user) {

  const name =
    user.displayName ||
    user.email.split("@")[0];


  document.getElementById(
    "profileName"
  ).textContent = name;


  document.getElementById(
    "profileEmail"
  ).textContent = user.email;

}


// ============================================
// OPEN CREATE POST MODAL
// ============================================

document.getElementById("openPostBtn").addEventListener("click", () => {

  postModal.classList.add("active");

});


document.getElementById("quickPostInput").addEventListener("click", () => {

  postModal.classList.add("active");

});


document.getElementById("missingBtn").addEventListener("click", () => {

  postModal.classList.add("active");

  document.getElementById("postType").value = "missing";

});


document.getElementById("photoBtn").addEventListener("click", () => {

  postModal.classList.add("active");

  document.getElementById("petPhoto").click();

});


document.getElementById("closeModal").addEventListener("click", () => {

  postModal.classList.remove("active");

});


// ============================================
// CREATE POST
// ============================================

document.getElementById("submitPost").addEventListener("click", async () => {

  const user = auth.currentUser;


  if (!user) {

    alert("Please log in first.");

    return;

  }


  const type =
    document.getElementById("postType").value;


  const petName =
    document.getElementById("petName").value.trim();


  const location =
    document.getElementById("petLocation").value.trim();


  const description =
    document.getElementById("postDescription").value.trim();


  const photoFile =
    document.getElementById("petPhoto").files[0];


  if (!description) {

    alert("Please write a description.");

    return;

  }


  try {

    let imageURL = "";


    // ========================================
    // UPLOAD PET PHOTO
    // ========================================

    if (photoFile) {

      const filePath =
        `posts/${user.uid}/${Date.now()}_${photoFile.name}`;


      const storageReference =
        ref(storage, filePath);


      await uploadBytes(
        storageReference,
        photoFile
      );


      imageURL =
        await getDownloadURL(storageReference);

    }


    // ========================================
    // SAVE POST TO FIRESTORE
    // ========================================

    await addDoc(
      collection(db, "posts"),
      {

        uid: user.uid,

        authorName:
          user.displayName ||
          user.email.split("@")[0],

        authorEmail: user.email,

        type: type,

        petName: petName,

        location: location,

        description: description,

        imageURL: imageURL,

        likes: [],

        comments: [],

        createdAt: serverTimestamp()

      }
    );


    // ========================================
    // CLEAR FORM
    // ========================================

    document.getElementById("petName").value = "";

    document.getElementById("petLocation").value = "";

    document.getElementById("postDescription").value = "";

    document.getElementById("petPhoto").value = "";

    document.getElementById("postType").value = "general";


    postModal.classList.remove("active");


    await loadFeed();


    alert("Post published! 🐾");


  } catch (error) {

    console.error(error);

    alert(
      "There was a problem publishing your post. Check your Firebase settings."
    );

  }

});


// ============================================
// LOAD POSTS
// ============================================

async function loadFeed() {

  feed.innerHTML = `

    <div style="
      text-align:center;
      padding:30px;
      color:#89948f;
    ">
      Loading community posts...
    </div>

  `;


  try {

    const postsQuery = query(

      collection(db, "posts"),

      orderBy("createdAt", "desc")

    );


    const snapshot =
      await getDocs(postsQuery);


    feed.innerHTML = "";


    if (snapshot.empty) {

      feed.innerHTML = `

        <div class="post">

          <h3>No posts yet 🐾</h3>

          <p style="
            color:#89948f;
            margin-top:8px;
          ">
            Be the first person to help your community!
          </p>

        </div>

      `;

      return;

    }


    snapshot.forEach((postDocument) => {

      renderPost(
        postDocument.data(),
        postDocument.id
      );

    });


  } catch (error) {

    console.error(error);

    feed.innerHTML = `

      <div class="post">

        <h3>Unable to load posts</h3>

        <p style="
          color:#89948f;
          margin-top:8px;
        ">
          Check your Firestore setup and security rules.
        </p>

      </div>

    `;

  }

}


// ============================================
// DISPLAY A POST
// ============================================

function renderPost(post, postID) {

  const user = auth.currentUser;


  const likes =
    post.likes || [];


  const isLiked =
    user &&
    likes.includes(user.uid);


  let tag = "";


  if (post.type === "missing") {

    tag =
      `<span class="pet-tag">
        🚨 MISSING PET
      </span>`;

  }


  if (post.type === "found") {

    tag =
      `<span class="pet-tag">
        ❤️ PET FOUND
      </span>`;

  }


  const image =
    post.imageURL
      ? `
        <img
          class="post-image"
          src="${escapeHTML(post.imageURL)}"
          alt="Missing or found pet"
        >
      `
      : "";


  const postElement =
    document.createElement("article");


  postElement.className = "post";


  postElement.innerHTML = `

    <div class="post-header">

      <div class="avatar">
        🐾
      </div>


      <div class="post-user">

        <strong>
          ${escapeHTML(
            post.authorName ||
            "Pet Watch User"
          )}
        </strong>


        <small>
          ${escapeHTML(
            post.location ||
            "Community"
          )}
        </small>

      </div>


      <button class="post-more">
        •••
      </button>

    </div>


    <div class="post-text">

      ${tag}


      ${
        post.petName
          ? `
            <strong>
              ${escapeHTML(post.petName)}
            </strong>
            <br>
          `
          : ""
      }


      ${escapeHTML(post.description)}

    </div>


    ${image}


    <div class="post-actions">

      <button
        class="action-btn ${isLiked ? "liked" : ""}"
        data-like="${postID}"
      >
        ❤️ ${likes.length} Like
      </button>


      <button
        class="action-btn"
        data-comment="${postID}"
      >
        💬 Comment
      </button>


      <button
        class="action-btn"
        data-share="${postID}"
      >
        ↗ Share
      </button>

    </div>

  `;


  feed.appendChild(postElement);


  // LIKE

  postElement
    .querySelector(
      `[data-like="${postID}"]`
    )
    .addEventListener(
      "click",
      () => toggleLike(
        postID,
        likes
      )
    );


  // COMMENT

  postElement
    .querySelector(
      `[data-comment="${postID}"]`
    )
    .addEventListener(
      "click",
      () => {

        const comment =
          prompt("Write a comment:");


        if (
          comment &&
          comment.trim()
        ) {

          addComment(
            postID,
            comment.trim()
          );

        }

      }
    );


  // SHARE

  postElement
    .querySelector(
      `[data-share="${postID}"]`
    )
    .addEventListener(
      "click",
      async () => {

        const shareText =
          `Check out this Pet Watch post about ${
            post.petName || "a pet"
          } 🐾`;


        try {

          await navigator.clipboard.writeText(
            shareText
          );


          alert(
            "Post information copied!"
          );


        } catch {

          alert(shareText);

        }

      }
    );

}


// ============================================
// LIKE / UNLIKE
// ============================================

async function toggleLike(
  postID,
  currentLikes
) {

  const user =
    auth.currentUser;


  if (!user) return;


  const postReference =
    doc(
      db,
      "posts",
      postID
    );


  try {

    if (
      currentLikes.includes(
        user.uid
      )
    ) {

      await updateDoc(
        postReference,
        {

          likes:
            arrayRemove(
              user.uid
            )

        }
      );


    } else {

      await updateDoc(
        postReference,
        {

          likes:
            arrayUnion(
              user.uid
            )

        }
      );

    }


    await loadFeed();


  } catch (error) {

    console.error(error);

  }

}


// ============================================
// ADD COMMENT
// ============================================

async function addComment(
  postID,
  commentText
) {

  const user =
    auth.currentUser;


  if (!user) return;


  const postReference =
    doc(
      db,
      "posts",
      postID
    );


  const comment = {

    uid: user.uid,

    author:
      user.displayName ||
      user.email.split("@")[0],

    text: commentText,

    createdAt:
      new Date().toISOString()

  };


  try {

    await updateDoc(
      postReference,
      {

        comments:
          arrayUnion(comment)

      }
    );


    alert("Comment added! 💬");


  } catch (error) {

    console.error(error);

    alert("Could not add comment.");

  }

}


// ============================================
// SEARCH
// ============================================

document
  .getElementById("searchInput")
  .addEventListener(
    "input",
    async (event) => {

      const search =
        event.target.value
          .toLowerCase()
          .trim();


      const postsQuery =
        query(
          collection(db, "posts"),
          orderBy(
            "createdAt",
            "desc"
          )
        );


      const snapshot =
        await getDocs(postsQuery);


      feed.innerHTML = "";


      snapshot.forEach(
        (postDocument) => {

          const post =
            postDocument.data();


          const searchableText = `

            ${post.authorName || ""}

            ${post.petName || ""}

            ${post.location || ""}

            ${post.description || ""}

          `.toLowerCase();


          if (
            searchableText.includes(
              search
            )
          ) {

            renderPost(
              post,
              postDocument.id
            );

          }

        }
      );

    }
  );


// ============================================
// NAVIGATION
// ============================================

document
  .getElementById("homeBtn")
  .addEventListener(
    "click",
    () => {

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });


      loadFeed();

    }
  );


document
  .getElementById("profileBtn")
  .addEventListener(
    "click",
    () => {

      alert(
        "Profile section coming next! 🐾"
      );

    }
  );


document
  .getElementById("exploreBtn")
  .addEventListener(
    "click",
    () => {

      document
        .getElementById("searchInput")
        .focus();

    }
  );


document
  .getElementById("notificationsBtn")
  .addEventListener(
    "click",
    () => {

      alert(
        "No new notifications 🔔"
      );

    }
  );


// ============================================
// SECURITY HELPER
// ============================================

function escapeHTML(value) {

  if (!value) return "";

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}
```
