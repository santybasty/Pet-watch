// ============================================
// PET WATCH
// Firebase + Social Feed
// ============================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// ============================================
// 1. FIREBASE CONFIG
// ============================================

// REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT VALUES

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};


// ============================================
// 2. INITIALIZE FIREBASE
// ============================================

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);

const storage = getStorage(firebaseApp);


// ============================================
// 3. DOM ELEMENTS
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
// 4. SWITCH LOGIN / REGISTER
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
// 5. REGISTER
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

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;


    await updateProfile(user, {
      displayName: name
    });


    await addDoc(collection(db, "users"), {

      uid: user.uid,

      name: name,

      email: email,

      createdAt: serverTimestamp(),

      posts: 0,

      helped: 0,

      found: 0

    });


    alert("Welcome to Pet Watch! 🐾");

  } catch (error) {

    console.error(error);

    alert(error.message);

  }

});


// ============================================
// 6. LOGIN
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

    alert("Unable to log in. Please check your information.");

  }

});


// ============================================
// 7. LOGOUT
// ============================================

document.getElementById("logoutBtn").addEventListener("click", async () => {

  await signOut(auth);

});


// ============================================
// 8. AUTH STATE
// ============================================

onAuthStateChanged(auth, async (user) => {

  if (user) {

    authScreen.classList.add("hidden");

    appScreen.classList.remove("hidden");

    updateProfileUI(user);

    await loadFeed();

  } else {

    authScreen.classList.remove("hidden");

    appScreen.classList.add("hidden");

  }

});


// ============================================
// 9. UPDATE PROFILE UI
// ============================================

function updateProfileUI(user) {

  const name =
    user.displayName ||
    user.email.split("@")[0];

  document.getElementById("profileName").textContent = name;

  document.getElementById("profileEmail").textContent =
    user.email;

}


// ============================================
// 10. OPEN POST MODAL
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
// 11. CREATE POST
// ============================================

document.getElementById("submitPost").addEventListener("click", async () => {

  const user = auth.currentUser;

  if (!user) {

    alert("You must be logged in.");

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


    // Upload image to Firebase Storage

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


    // Create Firestore post

    await addDoc(collection(db, "posts"), {

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

    });


    // Reset form

    document.getElementById("petName").value = "";

    document.getElementById("petLocation").value = "";

    document.getElementById("postDescription").value = "";

    document.getElementById("petPhoto").value = "";

    document.getElementById("postType").value = "general";

    postModal.classList.remove("active");


    await loadFeed();


    alert("Your post has been published! 🐾");


  } catch (error) {

    console.error(error);

    alert("There was a problem publishing your post.");

  }

});


// ============================================
// 12. LOAD FEED
// ============================================

async function loadFeed() {

  feed.innerHTML = `

    <div style="
      text-align:center;
      padding:30px;
      color:#89948f;
    ">
      Loading posts...
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

      const post =
        postDocument.data();

      const postID =
        postDocument.id;

      renderPost(
        post,
        postID
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
          Check your Firebase configuration and Firestore rules.
        </p>

      </div>

    `;

  }

}


// ============================================
// 13. RENDER POST
// ============================================

function renderPost(post, postID) {

  const user = auth.currentUser;

  const likes =
    post.likes || [];

  const isLiked =
    user && likes.includes(user.uid);


  let tag = "";

  if (post.type === "missing") {

    tag = `<span class="pet-tag">🚨 MISSING PET</span>`;

  }

  if (post.type === "found") {

    tag = `<span class="pet-tag">❤️ PET FOUND</span>`;

  }


  const image = post.imageURL
    ? `
      <img
        class="post-image"
        src="${escapeHTML(post.imageURL)}"
        alt="Pet"
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
          ${escapeHTML(post.authorName || "Pet Watch User")}
        </strong>

        <small>
          ${escapeHTML(post.location || "Community")}
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
          ? `<strong>${escapeHTML(post.petName)}</strong><br>`
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


  // Like button

  const likeButton =
    postElement.querySelector(
      `[data-like="${postID}"]`
    );


  likeButton.addEventListener(
    "click",
    () => toggleLike(
      postID,
      likes
    )
  );


  // Comment button

  const commentButton =
    postElement.querySelector(
      `[data-comment="${postID}"]`
    );


  commentButton.addEventListener(
    "click",
    () => {

      const comment =
        prompt("Write a comment:");

      if (comment && comment.trim()) {

        addComment(
          postID,
          comment.trim()
        );

      }

    }
  );


  // Share

  const shareButton =
    postElement.querySelector(
      `[data-share="${postID}"]`
    );


  shareButton.addEventListener(
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

        alert("Post information copied!");

      } catch {

        alert(shareText);

      }

    }
  );

}


// ============================================
// 14. LIKE POST
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

    if (currentLikes.includes(user.uid)) {

      await updateDoc(
        postReference,
        {
          likes: arrayRemove(user.uid)
        }
      );

    } else {

      await updateDoc(
        postReference,
        {
          likes: arrayUnion(user.uid)
        }
      );

    }


    await loadFeed();

  } catch (error) {

    console.error(error);

  }

}


// ============================================
// 15. ADD COMMENT
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
// 16. SEARCH POSTS
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
          orderBy("createdAt", "desc")
        );


      const snapshot =
        await getDocs(postsQuery);


      feed.innerHTML = "";


      snapshot.forEach((document) => {

        const post =
          document.data();


        const searchableText = `

          ${post.authorName || ""}

          ${post.petName || ""}

          ${post.location || ""}

          ${post.description || ""}

        `.toLowerCase();


        if (
          searchableText.includes(search)
        ) {

          renderPost(
            post,
            document.id
          );

        }

      });

    }
  );


// ============================================
// 17. NAVIGATION
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
// 18. SECURITY HELPER
// ============================================

function escapeHTML(value) {

  if (!value) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
