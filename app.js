import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const CLOUD_NAME = "dunnzpbq1";
const UPLOAD_PRESET = "Jireh-menu";
const auth = getAuth();

// ================= STATE
let categories = [];
let products = [];

let updatedProductId = null;
let editingProductId = null;
let isSubmitting = false;

// ================= TITLE STATE
let currentTitle = "Jireh Menu";

let currentLang = localStorage.getItem("lang") || "en";
let isAdmin = false;

const adminPanel =
  document.getElementById("adminPanel");

function renderAdminPanel() {

  adminPanel.innerHTML = `
  
    <h2>Admin Panel</h2>

    <h3>ADD Product</h3>

    <input id="pname" placeholder="Product Name EN">
    <input id="pname_ar" placeholder="Product Name AR">

    <input id="pprice" placeholder="Price">
    <label class="drink-check">
      <input type="checkbox" id="hasSizes">
      Drink With Sizes
    </label>

    <input id="plargePrice"
    placeholder="Large Price"
    disabled>

    <textarea id="pdesc"
    placeholder="Description EN"></textarea>

    <textarea id="pdesc_ar"
    placeholder="Description AR"></textarea>

    <select id="pcat"></select>

    <input type="file" id="pimage">

    <img
      id="imagePreview"
      src=""
      style="
        width:120px;
        height:120px;
        object-fit:cover;
        margin-top:10px;
        display:none;
        border-radius:10px;
        border:1px solid #ccc;
      "
    >

    <button id="addBtn">Add Product</button>

    <div id="editSection">

      <h3>Edit Product</h3>

      <input id="editName" placeholder="Name EN">
      <input id="editName_ar" placeholder="Name AR">

      <input id="editPrice" placeholder="Price">
      <label class="drink-check">
        <input type="checkbox" id="editHasSizes">
        Drink With Sizes
      </label>

      <input id="editLargePrice"
      placeholder="Large Price"
      disabled>

      <textarea id="editDesc"
      placeholder="Description EN"></textarea>

      <textarea id="editDesc_ar"
      placeholder="Description AR"></textarea>

      <input type="file" id="editImage">

      <img
        id="editImagePreview"
        src=""
        style="
          width:120px;
          height:120px;
          object-fit:cover;
          margin:10px;
          display:none;
          border-radius:10px;
          border:1px solid #ccc;
        "
      >

      <select id="editCat"></select>

      <button id="updateBtn">
        Update
      </button>

      <h3>ADD Category</h3>

      <input id="catName_en" placeholder="Category EN">

      <input id="catName_ar" placeholder="Category AR">

      <button id="addCatBtn">
        Add Category
      </button>

      <br><br>

      <h3>Edit Categories</h3>

      <select id="catList"></select>

      <input id="editCatName_en"
        placeholder="English Name">

      <input id="editCatName_ar"
        placeholder="Arabic Name">

      <button id="updateCatBtn">
        Update Category
      </button>

      <button id="deleteCatBtn">
        Delete Category
      </button>

      <br><br>

      <button id="logoutBtn">
        Logout
      </button>

    </div>
  `;
}

function setupAdminEvents() {

  // ================= LOGOUT
  document.getElementById("logoutBtn").onclick = async () => {

    await signOut(auth);

    showAlert("Success", "Logged out 👋");

    isAdmin = false;

    renderMenu();
    renderSidebar();
  };

  // ================= ADD PRODUCT
  function validateProduct() {

    const name =
      document.getElementById("pname").value.trim();

    const nameAr =
      document.getElementById("pname_ar").value.trim();

    const price =
      document.getElementById("pprice").value.trim();

    const category =
      document.getElementById("pcat").value.trim();

    if (!name || !nameAr || !price || !category) {

      showAlert(
        "Missing Data",
        "Please fill all required fields"
      );

      return false;
    }

    return true;
  }

  document.getElementById("addBtn").onclick = async () => {

    if (isSubmitting) return;

    isSubmitting = true;

    const addBtn =
      document.getElementById("addBtn");

    addBtn.disabled = true;
    addBtn.innerText = "Adding...";

    try {

      // ================= VALIDATION

      const name =
        document.getElementById("pname")
        .value.trim();

      const nameAr =
        document.getElementById("pname_ar")
        .value.trim();

      const price =
        Number(
          document.getElementById("pprice")
          .value
        );

      const hasSizes =
        document.getElementById("hasSizes")
        .checked;

      const largePrice =
        Number(
          document.getElementById("plargePrice")
          .value
        );

      if (!name) {
        showAlert("Error ❌", "Product name required");
        throw new Error();
      }

      if (!nameAr) {
        showAlert("Error ❌", "Arabic name required");
        throw new Error();
      }

      if (price <= 0 || isNaN(price)) {
        showAlert("Error ❌", "Invalid price");
        throw new Error();
      }

      // Description EN مطلوب
      if (!document.getElementById("pdesc").value.trim()) {
        showAlert("Error ❌", "Description EN required");
        throw new Error();
      }

      // Description AR مطلوب
      if (!document.getElementById("pdesc_ar").value.trim()) {
        showAlert("Error ❌", "Description AR required");
        throw new Error();
      }

      // صورة مطلوبة
      const file =
      document.getElementById("pimage").files[0];

      if (!file) {
        showAlert("Error ❌", "Image required");
        throw new Error();
      }

      // Large Price اختياري
      if (
        hasSizes &&
        document.getElementById("plargePrice").value &&
        (largePrice <= 0 || isNaN(largePrice))
      ) {
        showAlert("Error ❌", "Invalid large price");
        throw new Error();
      }

      const exists = products.some(
        p => p.name.toLowerCase() === name.toLowerCase()
      );

      if (exists) {
        showAlert("Error ❌", "Product already exists");
        throw new Error();
      }

      let imageURL = "";

      if (file) {

        imageURL =
          await uploadImage(file);
      }

      await addDoc(
        collection(db, "products"),
        {

          name: name,

          name_ar: nameAr,

          price: price,

          order: Date.now(),

          hasSizes: hasSizes,

          largePrice:
            hasSizes &&
            document.getElementById(
            "plargePrice"
            ).value
            ? largePrice
            : null,

          description:
            document.getElementById(
            "pdesc"
            ).value,

          description_ar:
            document.getElementById(
            "pdesc_ar"
            ).value,

          category:
            document.getElementById(
            "pcat"
            ).value,

          image: imageURL
        }
      );

      showAlert(
        "Success ✅",
        "Product Added Successfully"
      );

      document.getElementById("pname").value = "";
      document.getElementById("pname_ar").value = "";
      document.getElementById("pprice").value = "";
      document.getElementById("plargePrice").value = "";
      document.getElementById("pdesc").value = "";
      document.getElementById("pdesc_ar").value = "";
      document.getElementById("pimage").value = "";
      document.getElementById("imagePreview").style.display = "none";
      document.getElementById("hasSizes").checked = false;

      loadData();

    } finally {

      isSubmitting = false;

      addBtn.disabled = false;

      addBtn.innerText = "Add Product";
    }
  };

  // ================= FILL CATEGORY EDIT INPUTS
  document.getElementById("catList").onchange = () => {

    const selectedCategory = categories.find(
      c => c.id === document.getElementById("catList").value
    );

    if (!selectedCategory) return;

    document.getElementById("editCatName_en").value =
      selectedCategory.name || "";

    document.getElementById("editCatName_ar").value =
      selectedCategory.name_ar || "";
  };

  // ================= DELETE PRODUCT
  window.deleteProduct = async (id) => {

    await deleteDoc(doc(db, "products", id));

    showAlert("Success ✅", "Product Deleted Successfully");

    loadData();
  };

  // ================= EDIT PRODUCT
  window.setEdit = (id) => {

    const p = products.find(x => x.id === id);

    editingProductId = p.id;
    document.getElementById("editName").value = p.name;
    document.getElementById("editName_ar").value = p.name_ar;
    document.getElementById("editPrice").value = p.price;
    document.getElementById("editHasSizes").checked = p.hasSizes || false;
    document.getElementById("editLargePrice").disabled = !p.hasSizes;
    document.getElementById("editLargePrice").value = p.largePrice || "";
    document.getElementById("editDesc").value = p.description;
    document.getElementById("editDesc_ar").value = p.description_ar;
    document.getElementById("editCat").value = p.category;
    document.getElementById("editImagePreview").src =p.image || "img/default.jpg";
    document.getElementById("editImagePreview").style.display = "block";
    document.getElementById("editSection")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  // ================= IMAGE PREVIEW
  document.getElementById("pimage")
  .onchange = function(){

    const file = this.files[0];

    const preview =
    document.getElementById(
      "imagePreview"
    );

    if(file){

      preview.src =
      URL.createObjectURL(file);

      preview.style.display =
      "block";

    }else{

      preview.style.display =
      "none";
    }
  };

  // ================= TOGGLE LARGE PRICE
  document.getElementById("hasSizes")
  .onchange = function () {

    document.getElementById("plargePrice")
      .disabled = !this.checked;

    if (!this.checked) {
      document.getElementById("plargePrice").value = "";
    }
  };

  // ================= EDIT IMAGE PREVIEW
  document.getElementById("editImage")
  .onchange = function(){

    const file = this.files[0];

    const preview =
    document.getElementById(
      "editImagePreview"
    );

    if(file){

      preview.src =
      URL.createObjectURL(file);

      preview.style.display =
      "block";

    }
  };

  // ================= EDIT TOGGLE
  document.getElementById("editHasSizes")
  .onchange = function () {

    document.getElementById("editLargePrice")
      .disabled = !this.checked;

    if (!this.checked) {
      document.getElementById("editLargePrice").value = "";
    }
  };

  // ================= UPDATE PRODUCT
  document.getElementById("updateBtn").onclick = async () => {

    if(isSubmitting) return;

    isSubmitting = true;

    const updateBtn =
    document.getElementById("updateBtn");

    updateBtn.disabled = true;

    updateBtn.innerText = "Updating...";

    // ================= VALIDATION

    const name =
    document.getElementById("editName")
    .value.trim();

    const nameAr =
    document.getElementById("editName_ar")
    .value.trim();

    const price =
    Number(
    document.getElementById("editPrice")
    .value
    );

    const hasSizes =
    document.getElementById("editHasSizes")
    .checked;

    const largePrice =
    Number(
    document.getElementById("editLargePrice")
    .value
    );

    // Name required
    if(!name){

    showAlert(
    "Error ❌",
    "Product name required"
    );

    return;
    }

    // Arabic name required
    if(!nameAr){

    showAlert(
    "Error ❌",
    "Arabic name required"
    );

    return;
    }

    // Invalid price
    if(price <= 0 || isNaN(price)){

    showAlert(
    "Error ❌",
    "Invalid price"
    );

    return;
    }

    // Optional Large Price validation
    if(
    hasSizes &&
    document.getElementById("editLargePrice").value &&
    (largePrice <= 0 || isNaN(largePrice))
    ){

    showAlert(
    "Error ❌",
    "Invalid large price"
    );

    return;
    }

    // Duplicate name
    const exists = products.some(
    p =>
    p.id !== editingProductId &&
    p.name.toLowerCase() ===
    name.toLowerCase()
    );

    if(exists){

    showAlert(
    "Error ❌",
    "Product already exists"
    );

    return;
    }

    try{
    
    let imageURL = "";

    const file = document.getElementById("editImage").files[0];

    if (file) {
      imageURL = await uploadImage(file);
    } else {
      const old = products.find(p => p.id === editingProductId);
      imageURL = old?.image || "";
    }

    updatedProductId = editingProductId;
    await updateDoc(doc(db, "products", editingProductId), {

      name: document.getElementById("editName").value,

      name_ar: document.getElementById("editName_ar").value,

      price: Number(document.getElementById("editPrice").value),

      hasSizes: hasSizes,

      largePrice:
      hasSizes &&
      document.getElementById("editLargePrice").value
      ? largePrice
      : null,

      description: document.getElementById("editDesc").value,

      description_ar:
        document.getElementById("editDesc_ar").value,

      category: document.getElementById("editCat").value,

      image: imageURL
    });

    showAlert("Success ✅", "Product Updated Successfully");

    document.getElementById("editName").value = "";
    document.getElementById("editName_ar").value = "";
    document.getElementById("editPrice").value = "";
    document.getElementById("editLargePrice").value = "";
    document.getElementById("editDesc").value = "";
    document.getElementById("editDesc_ar").value = "";
    document.getElementById("editImage").value = "";
    document.getElementById("editImagePreview").style.display = "none";
    document.getElementById("editHasSizes").checked = false;
    document.getElementById("editLargePrice").disabled = true;
    editingProductId = null;

    loadData();
  }
  finally{

    isSubmitting = false;

    updateBtn.disabled = false;

    updateBtn.innerText = "Update";
  }
  };

  // ================= ADD CATEGORY
  function validateCategory() {

    const nameEn =
      document.getElementById("catName_en")
      .value.trim();

    const nameAr =
      document.getElementById("catName_ar")
      .value.trim();

    // منع القيم الفاضية
    if (!nameEn || !nameAr) {

      showAlert(
        "Missing Data",
        "Please fill all category fields"
      );

      return false;
    }

    // منع التكرار للإنجليزي
    const existsEn = categories.some(
      c =>
        c.name.toLowerCase() ===
        nameEn.toLowerCase()
    );

    // منع التكرار للعربي
    const existsAr = categories.some(
      c =>
        c.name_ar.trim() ===
        nameAr
    );

    if (existsEn || existsAr) {

      showAlert(
        "Duplicate Category",
        "This category already exists"
      );

      return false;
    }

    return true;
  }

  document.getElementById("addCatBtn").onclick =
  async () => {

    if (!validateCategory()) return;

    const newNameEn = document.getElementById("catName_en").value;
    const newNameAr = document.getElementById("catName_ar").value;

    await addDoc(collection(db, "categories"), {
      name: newNameEn,
      name_ar: newNameAr
    });

    showAlert(
      "Success ✅",
      "Category Added Successfully"
    );

    await loadData();

    setTimeout(() => {

      const categoryElement =
        [...document.querySelectorAll(".cat-title")]
          .find(el =>
            el.innerText === newNameEn ||
            el.innerText === newNameAr
          );

      if (categoryElement) {

        categoryElement.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

        categoryElement.classList.add(
          "updated-highlight"
        );

        setTimeout(() => {
          categoryElement.classList.remove(
            "updated-highlight"
          );
        }, 2000);
      }

    }, 300);
  };

  // ================= UPDATE CATEGORY
  document.getElementById("updateCatBtn").onclick = async () => {

    const id = document.getElementById("catList").value;

    // الكاتيجوري القديمة
    const oldCategory = categories.find(c => c.id === id);
    const oldName = oldCategory.name;

    // الاسم الجديد (EN + AR)
    const newName_en = document.getElementById("editCatName_en").value;
    const newName_ar = document.getElementById("editCatName_ar").value;

    // 1️⃣ تحديث الكاتيجوري نفسها
    await updateDoc(doc(db, "categories", id), {
      name: newName_en,
      name_ar: newName_ar
    });

    // 2️⃣ تحديث كل المنتجات المرتبطة
    const relatedProducts = products.filter(
      p => p.category === oldName
    );
    for (const product of relatedProducts) {
      await updateDoc(doc(db, "products", product.id), {
        category: newName_en
      });
    }
    showAlert("Success ✅", "Category Updated Successfully");
    loadData();
  };

  // ================= DELETE CATEGORY
  document.getElementById("deleteCatBtn").onclick =
  async () => {

    const id =
    document.getElementById("catList").value;

    const category =
    categories.find(c => c.id === id);

    if(!category) return;

    const relatedProducts =
    products.filter(
      p => p.category === category.name
    );

    // لو فيه منتجات مرتبطة
    if(relatedProducts.length > 0){

      const confirmDelete = confirm(
        `This category contains ${relatedProducts.length} products.\nDelete everything?`
      );

      if(!confirmDelete) return;

      // حذف المنتجات المرتبطة
      for(const product of relatedProducts){

        await deleteDoc(
          doc(
            db,
            "products",
            product.id
          )
        );
      }
    }

    // حذف الكاتيجوري نفسها
    await deleteDoc(
      doc(
        db,
        "categories",
        id
      )
    );

    showAlert(
      "Success ✅",
      "Category Deleted Successfully"
    );

    loadData();
  };
}

// ================= INIT LANGUAGE
document.body.setAttribute("lang", currentLang);

document.body.dir =
  currentLang === "ar"
    ? "rtl"
    : "ltr";

const t = (en, ar) => currentLang === "en" ? en : ar;

function getBackgroundImage() {

  // هل الشاشة Desktop ولا Mobile
  const isDesktop =
    window.innerWidth >= 768;

  // تحديد الفولدر حسب اللغة وحجم الشاشة
  const langFolder =
    currentLang === "en"
      ? isDesktop
        ? "Desktop-En"
        : "Mobile-En"
      : isDesktop
        ? "Desktop-Ar"
        : "Mobile-Ar";

  // اسم الصورة الثابتة
  const imageName = "background.jpeg";

  return `
    linear-gradient(
      rgba(0,0,0,0.35),
      rgba(0,0,0,0.25)
    ),
    url(img/${langFolder}/${imageName})
  `;
}

// ================= UI ELEMENTS
const adminBtn = document.getElementById("adminBtn");
const loginBox = document.getElementById("loginBox");
const closeLogin = document.getElementById("closeLogin");

// ================= SIDEBAR ELEMENTS
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

// ================= CUSTOM ALERT FUNCTION
function showAlert(title, message) {

  const alertBox =
    document.getElementById("customAlert");

  document.getElementById("alertTitle")
    .innerText = title;

  document.getElementById("alertMessage")
    .innerText = message;

  alertBox.classList.add("show");
}

// CLOSE ALERT
document.getElementById("alertBtn").onclick = () => {

  document.getElementById("customAlert")
    .classList.remove("show");
};

// ================= INIT ADMIN STATE
onAuthStateChanged(auth, (user) => {

  isAdmin = !!user;

  if (user) {

    adminPanel.style.display = "block";

    renderAdminPanel();

    setupAdminEvents();

    loadCategories();

    adminBtn.style.display = "none";

  } else {

    adminPanel.style.display = "none";

    adminPanel.innerHTML = "";

    adminBtn.style.display = "block";
  }

  renderMenu();
  renderSidebar();
});

// ================= SIDEBAR OPEN / CLOSE
menuBtn.onclick = () => {
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
};

overlay.onclick = () => closeSidebar();

function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("show");
}

// ================= FILTER CATEGORY
window.filterCategory = (catName) => {

  // حفظ آخر كاتيجوري
  localStorage.setItem(
    "selectedCategory",
    catName || "all"
  );

  renderMenu(catName);

  // change background
  document.body.style.backgroundImage =
    getBackgroundImage();

  closeSidebar();
};

// ================= LOGIN UI
adminBtn.onclick = () => loginBox.style.display = "flex";
closeLogin.onclick = () => loginBox.style.display = "none";



// ================= LOGIN
async function login() {

  const email = document.getElementById("user").value;
  const password = document.getElementById("pass").value;

  try {

    await signInWithEmailAndPassword(auth, email, password);

    loginBox.style.display = "none";
    showAlert("Success", "Logged in successfully ✅");

  } catch (error) {

    showAlert("Error", "Wrong email or password ❌");
  }
}

window.login = login;

// ================= UPLOAD IMAGE FUNCTION
async function uploadImage(file) {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  return data.secure_url;
}

// ================= LOAD DATA
async function loadData() {

  const catSnap = await getDocs(collection(db, "categories"));
  const prodSnap = await getDocs(collection(db, "products"));

  categories = [];
  products = [];

  // ================= CATEGORIES WITH ID
  catSnap.forEach(d => {
    categories.push({
      id: d.id,
      ...d.data()
    });
  });

  // ================= PRODUCTS WITH ID
  let maxOrder = Math.max(
    ...prodSnap.docs.map(d => d.data().order || 0),
    0
  );

  for (const d of prodSnap.docs) {

    const data = d.data();

    if (data.order === undefined) {

      maxOrder++;

      await updateDoc(
        doc(db, "products", d.id),
        {
          order: maxOrder
        }
      );

      data.order = maxOrder;
    }

    products.push({
      id: d.id,
      ...data
    });
  }

  loadCategories();
renderSidebar();

const savedCategory =
  localStorage.getItem("selectedCategory");

if (savedCategory && savedCategory !== "all") {

  renderMenu(savedCategory);

} else {

  renderMenu();

}
}

// ================= SIDEBAR RENDER
function renderSidebar() {

  const side = document.getElementById("sideLinks");

  side.innerHTML = "";

  side.innerHTML += `
    <div class="side-link" onclick="filterCategory(null)">
      ${currentLang === "en" ? "All" : "كل"}
    </div>
  `;

  categories.forEach(cat => {

    side.innerHTML += `
      <div class="side-link"
        onclick="filterCategory('${cat.name}')">

        ${currentLang === "en" ? cat.name : cat.name_ar}

      </div>
    `;
  });
}

// ================= PRODUCT POPUP
const productPopup = document.getElementById("productPopup");

window.openProduct = (name, price, largePrice, hasSizes, desc, desc_ar, img) => {

  document.getElementById("popupName").innerText = name;

  document.getElementById("popupPrice").innerText =
  hasSizes === "true"
    ? `M ${price} EGP | L ${largePrice} EGP`
    : `${price} EGP`;

  document.getElementById("popupDesc").innerText =
  currentLang === "en"
    ? (desc || "No description")
    : (desc_ar || "لا يوجد وصف");

  document.getElementById("popupImg").src =
    img && img !== ""
      ? img
      : "img/default.jpg";

  productPopup.classList.add("show");
};

// ================= CLOSE POPUP
document.getElementById("closePopup").onclick = () => {
  productPopup.classList.remove("show");
};

productPopup.onclick = (e) => {

  if (e.target === productPopup) {
    productPopup.classList.remove("show");
  }
};


// ================= RENDER MENU
function renderMenu(filterCat = null) {

  const menu = document.getElementById("menu");
  const title = document.getElementById("pageTitle");

  menu.innerHTML = "";

  let catsToShow;

  // ================= TITLE LOGIC
  if (filterCat) {

    const cat = categories.find(c => c.name === filterCat);

    currentTitle = currentLang === "en"
      ? cat?.name
      : cat?.name_ar;

    catsToShow = categories.filter(c => c.name === filterCat);

  } else {

    currentTitle = currentLang === "en"
      ? "Jireh Menu"
      : "المنيو";

    catsToShow = categories;
  }

  // 🔥 IMPORTANT FIX
  title.innerText = currentTitle;

  // ================= RENDER
  catsToShow.forEach(cat => {

    const safeId = cat.name.replaceAll(" ", "_");

    if (!filterCat) {
      menu.innerHTML += `
        <h2 class="cat-title">
          ${currentLang === "en" ? cat.name : cat.name_ar}
        </h2>

        <div class="cat-block" id="${safeId}"></div>
      `;
    } else {
      menu.innerHTML += `
        <div class="cat-block" id="${safeId}"></div>
      `;
    }

    const container = document.getElementById(safeId);

    products
        .filter(p => p.category === cat.name)
        .sort((a,b)=>(a.order||0)-(b.order||0))
        .forEach(p => {

        container.innerHTML += `
          <div class="menu-item ${updatedProductId === p.id ? "updated-highlight" : ""}"
            data-id="${p.id}"
            onclick="openProduct(
              '${currentLang === "en" ? p.name : p.name_ar}',
              '${p.price}',
              '${p.largePrice || ""}',
              '${p.hasSizes}',
              '${p.description || ""}',
              '${p.description_ar || ""}',
              '${p.image || "img/default.jpg"}'
            )">

            <div class="top">

              <h3>${currentLang === "en" ? p.name : p.name_ar}</h3>

              <div>
              <span>
                ${
                  p.hasSizes
                    ? `M - ${p.price} EGP | L - ${p.largePrice} EGP`
                    : `${p.price} EGP`
                }
              </span>

              <i class="fa-solid fa-hand-pointer"></i>

              </div>

            </div>

            ${isAdmin ? `
              <div class="admin-actions">

                <button class="move-btn"
                  onclick="event.stopPropagation();
                  moveUp('${p.id}')">
                  ▲
                </button>

                <button class="move-btn"
                  onclick="event.stopPropagation();
                  moveDown('${p.id}')">
                  ▼
                </button>

                <button class="edit-btn"
                  onclick="event.stopPropagation();
                  setEdit(
                    '${p.id}',
                    '${p.name}',
                    '${p.price}',
                    '${p.description || ""}',
                    '${p.description_ar || ""}',
                    '${p.category}'
                  )">
                  Edit
                </button>

                <button class="delete-btn"
                  onclick="event.stopPropagation();
                  deleteProduct('${p.id}')">
                  Delete
                </button>

              </div>
            ` : ""}

          </div>
        `;
      });
  });

  if (updatedProductId) {

    const updatedElement =
      document.querySelector(
        `[data-id="${updatedProductId}"]`
      );

    if (updatedElement) {

      updatedElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      setTimeout(() => {
        updatedElement.classList.remove(
          "updated-highlight"
        );
      }, 2000);
    }

    updatedProductId = null;
  }
}


// ================= LOAD CATEGORIES
function loadCategories() {

  const select = document.getElementById("pcat");
  const editSelect = document.getElementById("editCat");
  const catList = document.getElementById("catList");

  if (!select || !editSelect || !catList) return;

  select.innerHTML = "";
  editSelect.innerHTML = "";
  catList.innerHTML = "";

  categories.forEach(cat => {

    select.innerHTML += `
      <option value="${cat.name}">
        ${cat.name}
      </option>
    `;

    editSelect.innerHTML += `
      <option value="${cat.name}">
        ${cat.name}
      </option>
    `;

    catList.innerHTML += `
      <option value="${cat.id}">
        ${cat.name}
      </option>
    `;
  });
}



// ================= UPDATE LANGUAGE BUTTON
function updateLangButton() {
  langBtn.innerText = currentLang === "en" ? "AR" : "EN";
}

// ================= UPDATE STATIC TEXTS
function updateStaticTexts() {
  document.getElementById("sidebarTitle").innerText =
    currentLang === "en" ? "Categories" : "الأصناف";
}

// ================= SWITCH LANGUAGE
document.getElementById("langBtn").onclick = () => {

  // تغيير اللغة
  currentLang =
    currentLang === "en" ? "ar" : "en";

  localStorage.setItem("lang", currentLang);

  // اتجاه الصفحة
  document.body.setAttribute("lang", currentLang);

  document.body.dir =
    currentLang === "ar"
      ? "rtl"
      : "ltr";

  // تحديث الزر
  updateLangButton();

  // الكاتيجوري الحالية
  const currentCategory =
    document.getElementById("pageTitle")
      .innerText;

  // إعادة رسم
  renderSidebar();

  // نرجع نفس الكاتيجوري
  const selectedCategory =
    categories.find(c =>
      c.name === currentCategory ||
      c.name_ar === currentCategory
    );

  if (selectedCategory) {

    renderMenu(selectedCategory.name);

    document.body.style.backgroundImage =
  getBackgroundImage();

  } else {

    renderMenu();

    document.body.style.backgroundImage =
  getBackgroundImage();
  }

  updateStaticTexts();
};


// ================= MOVE PRODUCT UP/ DOWN
window.moveUp = async (id) => {

  const current =
    products.find(p => p.id === id);

  if (!current) return;

  const above = products
    .filter(
      p =>
        p.category === current.category &&
        p.order < current.order
    )
    .sort((a,b)=>b.order-a.order)[0];

  if (!above) return;

  await updateDoc(
    doc(db,"products",current.id),
    { order: above.order }
  );

  await updateDoc(
    doc(db,"products",above.id),
    { order: current.order }
  );

  loadData();
};

window.moveDown = async (id) => {

  const current =
    products.find(p => p.id === id);

  if (!current) return;

  const below = products
    .filter(
      p =>
        p.category === current.category &&
        p.order > current.order
    )
    .sort((a,b)=>a.order-b.order)[0];

  if (!below) return;

  await updateDoc(
    doc(db,"products",current.id),
    { order: below.order }
  );

  await updateDoc(
    doc(db,"products",below.id),
    { order: current.order }
  );

  loadData();
};

// ================= INIT
loadData();
updateStaticTexts();
updateLangButton();
document.body.style.backgroundImage =
  getBackgroundImage();

window.addEventListener("resize", () => {

  document.body.style.backgroundImage =
    getBackgroundImage();

});

