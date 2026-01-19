// ============================================
// LIFESTYLE - FULL JS (Firebase Realtime DB)
// Includes: Tabs + Weekly + Materi + Keuangan (Rupiah) + Wishlist + Dashboard
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

// ========================
// FIREBASE CONFIG (punya kamu)
// ========================
const firebaseConfig = {
  apiKey: "AIzaSyBD1WydgiX2G2GCkZ0QUA0Z9CErZubr1v8",
  authDomain: "lifesytle-158e7.firebaseapp.com",
  databaseURL: "https://lifesytle-158e7-default-rtdb.firebaseio.com",
  projectId: "lifesytle-158e7",
  storageBucket: "lifesytle-158e7.firebasestorage.app",
  messagingSenderId: "395406862506",
  appId: "1:395406862506:web:31d22cd908a405e2d1c8d3",
  measurementId: "G-W8B5V6KK8L",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ========================
// HELPERS
// ========================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function rupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNum(n));
}

function todayISO() {
  const d = new Date();
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function byNewest(a, b) {
  return (b.createdAt || 0) - (a.createdAt || 0);
}

function mkLi(text) {
  const li = document.createElement("li");
  li.textContent = text;
  return li;
}

// ========================
// TAB SWITCHING
// ========================
(function initTabs() {
  const navButtons = $$("#tabNav .tab-btn");
  const panels = $$(".tab-panel");

  function showTab(tabId) {
    panels.forEach((p) => p.classList.remove("is-active"));
    navButtons.forEach((b) => b.classList.remove("is-active"));

    const panel = document.getElementById(tabId);
    const btn = $(`#tabNav .tab-btn[data-tab="${tabId}"]`);
    if (panel) panel.classList.add("is-active");
    if (btn) btn.classList.add("is-active");
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });
})();

// ========================
// IN-MEMORY STORE
// ========================
const store = {
  weekly: {}, // id -> item
  materi: {
    bahasa_inggris: {},
    pjok: {},
    speaking_class: {},
    kelas_diskusi: {},
  },
  keuangan: {},
  wishlist: {},
};

// ========================
// DASHBOARD RENDER
// ========================
function renderDashboard() {
  // ---- Weekly summary
  const weeklyArr = Object.entries(store.weekly).map(([id, it]) => ({ id, ...it }));
  const weeklyTotal = weeklyArr.length;
  const weeklyDone = weeklyArr.filter((x) => !!x.status).length;
  const weeklyTodo = weeklyTotal - weeklyDone;

  $("#sumWeeklyTotal").textContent = weeklyTotal;
  $("#sumWeeklyDone").textContent = weeklyDone;
  $("#sumWeeklyTodo").textContent = weeklyTodo;

  // ---- Materi summary
  const materiAll = [];
  for (const subjectKey of Object.keys(store.materi)) {
    for (const [id, it] of Object.entries(store.materi[subjectKey])) {
      materiAll.push({ id, subjectKey, ...it });
    }
  }
  const materiTotal = materiAll.length;
  const materiDone = materiAll.filter((x) => !!x.status).length;
  const materiTodo = materiTotal - materiDone;

  $("#sumMateriTotal").textContent = materiTotal;
  $("#sumMateriDone").textContent = materiDone;
  $("#sumMateriTodo").textContent = materiTodo;

  // ---- Keuangan summary (RUPIAH)
  const finArr = Object.entries(store.keuangan).map(([id, it]) => ({ id, ...it }));
  const income = finArr
    .filter((x) => x.jenis === "pendapatan")
    .reduce((a, x) => a + toNum(x.nominal), 0);

  const expense = finArr
    .filter((x) => x.jenis === "pengeluaran")
    .reduce((a, x) => a + toNum(x.nominal), 0);

  const balance = income - expense;

  $("#sumIncome").textContent = rupiah(income);
  $("#sumExpense").textContent = rupiah(expense);
  $("#sumBalance").textContent = rupiah(balance);

  // Tab Keuangan summary (RUPIAH)
  if ($("#financeIncome")) $("#financeIncome").textContent = rupiah(income);
  if ($("#financeExpense")) $("#financeExpense").textContent = rupiah(expense);
  if ($("#financeBalance")) $("#financeBalance").textContent = rupiah(balance);

  // ---- Wishlist summary
  const wishArr = Object.entries(store.wishlist).map(([id, it]) => ({ id, ...it }));
  const wishTotal = wishArr.length;
  const wishDone = wishArr.filter((x) => !!x.status).length;
  const wishTodo = wishTotal - wishDone;

  $("#sumWishTotal").textContent = wishTotal;
  $("#sumWishDone").textContent = wishDone;
  $("#sumWishTodo").textContent = wishTodo;

  
  // ---- Recent lists (ALL)
const recentWeekly = weeklyArr.sort(byNewest);
const recentMateri = materiAll.sort(byNewest);
const recentKeu = finArr.sort(byNewest);
const recentWish = wishArr.sort(byNewest);


  const rw = $("#recentWeeklyList");
  const rm = $("#recentMateriList");
  const rk = $("#recentKeuanganList");
  const rws = $("#recentWishList");

  if (rw) {
    rw.innerHTML = "";
    if (recentWeekly.length === 0) rw.appendChild(mkLi("Belum ada data."));
    recentWeekly.forEach((x) => rw.appendChild(mkLi(`${x.status ? "✓" : "•"} ${x.judul} (${x.kategori})`)));
  }

  if (rm) {
    rm.innerHTML = "";
    if (recentMateri.length === 0) rm.appendChild(mkLi("Belum ada data."));
    recentMateri.forEach((x) => rm.appendChild(mkLi(`${x.status ? "✓" : "•"} ${x.judul}`)));
  }

  if (rk) {
    rk.innerHTML = "";
    if (recentKeu.length === 0) rk.appendChild(mkLi("Belum ada data."));
    recentKeu.forEach((x) => rk.appendChild(mkLi(`${x.jenis}: ${x.keterangan} (${rupiah(x.nominal)})`)));
  }

  if (rws) {
    rws.innerHTML = "";
    if (recentWish.length === 0) rws.appendChild(mkLi("Belum ada data."));
    recentWish.forEach((x) => rws.appendChild(mkLi(`${x.status ? "✓" : "•"} ${x.judul}`)));
  }
}

// =====================================================
// 1) WEEKLY TRACKER (CRUD + Search + Filter + Per kategori)
// =====================================================
const WEEKLY_CATS = ["Sekolah", "Kampus", "Pemrograman", "Keseharian"];

const weeklyForm = $("#weeklyForm");
const weeklyId = $("#weeklyId");
const weeklyTitle = $("#weeklyTitle");
const weeklyCategory = $("#weeklyCategory");
const weeklyDay = $("#weeklyDay");
const weeklyTime = $("#weeklyTime");
const weeklySubmitBtn = $("#weeklySubmitBtn");
const weeklyCancelEditBtn = $("#weeklyCancelEditBtn");

const weeklySearch = $("#weeklySearch");
const weeklyStatusFilter = $("#weeklyStatusFilter");

const weeklyLists = {
  Sekolah: $("#weeklyListSekolah"),
  Kampus: $("#weeklyListKampus"),
  Pemrograman: $("#weeklyListProgramming"),
  Keseharian: $("#weeklyListDaily"),
};

const weeklyCounts = {
  Sekolah: { total: $("#weeklyCountSekolah"), done: $("#weeklyDoneSekolah") },
  Kampus: { total: $("#weeklyCountKampus"), done: $("#weeklyDoneKampus") },
  Pemrograman: { total: $("#weeklyCountProgramming"), done: $("#weeklyDoneProgramming") },
  Keseharian: { total: $("#weeklyCountDaily"), done: $("#weeklyDoneDaily") },
};

const weeklyItemTemplate = $("#weeklyItemTemplate");

function weeklyResetForm() {
  if (weeklyId) weeklyId.value = "";
  if (weeklyTitle) weeklyTitle.value = "";
  if (weeklyCategory) weeklyCategory.value = "Sekolah";
  if (weeklyDay) weeklyDay.value = "";
  if (weeklyTime) weeklyTime.value = "";
  if (weeklySubmitBtn) weeklySubmitBtn.textContent = "Simpan";
}

function weeklyGetFilters() {
  const q = (weeklySearch?.value || "").trim().toLowerCase();
  const st = weeklyStatusFilter?.value || "all";
  return { q, st };
}

function weeklyMatch(item, { q, st }) {
  const title = (item.judul || "").toLowerCase();
  const day = (item.hari || "").toLowerCase();
  const time = (item.jam || "").toLowerCase();
  const cat = (item.kategori || "").toLowerCase();

  const textOk = !q || title.includes(q) || day.includes(q) || time.includes(q) || cat.includes(q);

  const statusOk =
    st === "all" ||
    (st === "done" && !!item.status) ||
    (st === "todo" && !item.status);

  return textOk && statusOk;
}

function renderWeekly() {
  // clear lists
  for (const c of WEEKLY_CATS) {
    if (weeklyLists[c]) weeklyLists[c].innerHTML = "";
  }

  const filters = weeklyGetFilters();

  // group
  const grouped = {};
  WEEKLY_CATS.forEach((c) => (grouped[c] = []));

  for (const [id, it] of Object.entries(store.weekly)) {
    const cat = WEEKLY_CATS.includes(it.kategori) ? it.kategori : "Keseharian";
    const item = { id, ...it };

    if (weeklyMatch(item, filters)) grouped[cat].push(item);
  }

  // render each cat
  WEEKLY_CATS.forEach((cat) => {
    const arr = grouped[cat].sort(byNewest);

    const total = arr.length;
    const done = arr.filter((x) => !!x.status).length;

    if (weeklyCounts[cat]?.total) weeklyCounts[cat].total.textContent = total;
    if (weeklyCounts[cat]?.done) weeklyCounts[cat].done.textContent = done;

    const ul = weeklyLists[cat];
    if (!ul) return;

    if (total === 0) {
      const li = document.createElement("li");
      li.className = "item";
      li.innerHTML = `<div class="item-main"><p class="item-meta">Belum ada data (atau sedang terfilter).</p></div>`;
      ul.appendChild(li);
      return;
    }

    arr.forEach((x) => {
      const node = weeklyItemTemplate.content.firstElementChild.cloneNode(true);
      node.classList.toggle("is-done", !!x.status);

      node.querySelector(".item-title").textContent = x.judul || "(tanpa judul)";
      node.querySelector(".item-meta").textContent = `${x.hari || "-"} • ${x.jam || "-"}`;

      const btnToggle = node.querySelector(".btn-toggle");
      const btnEdit = node.querySelector(".btn-edit");
      const btnDelete = node.querySelector(".btn-delete");

      btnToggle.textContent = x.status ? "Belum" : "Selesai";
      btnToggle.addEventListener("click", () => {
        update(ref(db, `weekly/${x.id}`), { status: !x.status, updatedAt: Date.now() });
      });

      btnEdit.addEventListener("click", () => {
        weeklyId.value = x.id;
        weeklyTitle.value = x.judul || "";
        weeklyCategory.value = WEEKLY_CATS.includes(x.kategori) ? x.kategori : "Keseharian";
        weeklyDay.value = x.hari || "";
        weeklyTime.value = x.jam || "";
        weeklySubmitBtn.textContent = "Update";
        $("#weeklyFormSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      btnDelete.addEventListener("click", () => {
        if (confirm("Yakin hapus kegiatan ini?")) {
          remove(ref(db, `weekly/${x.id}`));
        }
      });

      ul.appendChild(node);
    });
  });
}

// Weekly listeners
if (weeklyForm) {
  weeklyForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      judul: weeklyTitle.value.trim(),
      kategori: weeklyCategory.value,
      hari: weeklyDay.value.trim(),
      jam: weeklyTime.value,
      status: false,
      updatedAt: Date.now(),
    };

    if (!payload.judul) return;

    if (weeklyId.value) {
      // update
      update(ref(db, `weekly/${weeklyId.value}`), payload);
    } else {
      // create
      push(ref(db, "weekly"), { ...payload, createdAt: Date.now() });
    }

    weeklyResetForm();
  });
}
if (weeklyCancelEditBtn) weeklyCancelEditBtn.addEventListener("click", weeklyResetForm);
if (weeklySearch) weeklySearch.addEventListener("input", renderWeekly);
if (weeklyStatusFilter) weeklyStatusFilter.addEventListener("change", renderWeekly);

// Weekly realtime sync
onValue(ref(db, "weekly"), (snap) => {
  store.weekly = snap.val() || {};
  renderWeekly();
  renderDashboard();
});

// =====================================================
// 2) MATERI SEKOLAH (4 mapel CRUD + selesai/belum + filter/search)
// =====================================================
const materiSearch = $("#materiSearch");
const materiStatusFilter = $("#materiStatusFilter");
const materiItemTemplate = $("#materiItemTemplate");

// mapping subject -> elements
const materiSubjects = {
  bahasa_inggris: {
    form: $("#materiFormInggris"),
    list: $("#materiListInggris"),
    count: $("#materiCountInggris"),
    done: $("#materiDoneInggris"),
  },
  pjok: {
    form: $("#materiFormPJOK"),
    list: $("#materiListPJOK"),
    count: $("#materiCountPJOK"),
    done: $("#materiDonePJOK"),
  },
  speaking_class: {
    form: $("#materiFormSpeaking"),
    list: $("#materiListSpeaking"),
    count: $("#materiCountSpeaking"),
    done: $("#materiDoneSpeaking"),
  },
  kelas_diskusi: {
    form: $("#materiFormDiskusi"),
    list: $("#materiListDiskusi"),
    count: $("#materiCountDiskusi"),
    done: $("#materiDoneDiskusi"),
  },
};

function materiFilters() {
  const q = (materiSearch?.value || "").trim().toLowerCase();
  const st = materiStatusFilter?.value || "all";
  return { q, st };
}

function materiMatch(item, { q, st }) {
  const title = (item.judul || "").toLowerCase();
  const note = (item.catatan || "").toLowerCase();

  const textOk = !q || title.includes(q) || note.includes(q);

  const statusOk =
    st === "all" ||
    (st === "done" && !!item.status) ||
    (st === "todo" && !item.status);

  return textOk && statusOk;
}

function renderMateri() {
  const filters = materiFilters();

  for (const subjectKey of Object.keys(materiSubjects)) {
    const sub = materiSubjects[subjectKey];
    if (!sub?.list) continue;

    sub.list.innerHTML = "";

    const arr = Object.entries(store.materi[subjectKey] || {})
      .map(([id, it]) => ({ id, ...it }))
      .filter((x) => materiMatch(x, filters))
      .sort(byNewest);

    const total = arr.length;
    const done = arr.filter((x) => !!x.status).length;

    if (sub.count) sub.count.textContent = total;
    if (sub.done) sub.done.textContent = done;

    if (total === 0) {
      const li = document.createElement("li");
      li.className = "item";
      li.innerHTML = `<div class="item-main"><p class="item-meta">Belum ada data (atau sedang terfilter).</p></div>`;
      sub.list.appendChild(li);
      continue;
    }

    arr.forEach((x) => {
      const node = materiItemTemplate.content.firstElementChild.cloneNode(true);
      node.classList.toggle("is-done", !!x.status);

      node.querySelector(".item-title").textContent = x.judul || "(tanpa judul)";
      node.querySelector(".item-meta").textContent = x.catatan ? x.catatan : "(tanpa catatan)";

      const btnToggle = node.querySelector(".btn-toggle");
      const btnEdit = node.querySelector(".btn-edit");
      const btnDelete = node.querySelector(".btn-delete");

      btnToggle.textContent = x.status ? "Belum" : "Selesai";
      btnToggle.addEventListener("click", () => {
        update(ref(db, `materi/${subjectKey}/${x.id}`), { status: !x.status, updatedAt: Date.now() });
      });

      btnEdit.addEventListener("click", () => {
        const form = sub.form;
        if (!form) return;

        form.querySelector(".materiId").value = x.id;
        form.querySelector(".materiTitle").value = x.judul || "";
        form.querySelector(".materiNote").value = x.catatan || "";

        form.querySelector(".materiSubmitBtn").textContent = "Update";
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      btnDelete.addEventListener("click", () => {
        if (confirm("Yakin hapus materi ini?")) {
          remove(ref(db, `materi/${subjectKey}/${x.id}`));
        }
      });

      sub.list.appendChild(node);
    });
  }

  renderDashboard();
}

function setupMateriForms() {
  for (const subjectKey of Object.keys(materiSubjects)) {
    const sub = materiSubjects[subjectKey];
    if (!sub?.form) continue;

    const form = sub.form;
    const idEl = form.querySelector(".materiId");
    const titleEl = form.querySelector(".materiTitle");
    const noteEl = form.querySelector(".materiNote");
    const submitBtn = form.querySelector(".materiSubmitBtn");
    const cancelBtn = form.querySelector(".materiCancelBtn");

    function reset() {
      idEl.value = "";
      titleEl.value = "";
      noteEl.value = "";
      submitBtn.textContent = "Simpan";
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const payload = {
        judul: titleEl.value.trim(),
        catatan: noteEl.value.trim(),
        status: false,
        updatedAt: Date.now(),
      };
      if (!payload.judul) return;

      if (idEl.value) {
        update(ref(db, `materi/${subjectKey}/${idEl.value}`), payload);
      } else {
        push(ref(db, `materi/${subjectKey}`), { ...payload, createdAt: Date.now() });
      }

      reset();
    });

    cancelBtn.addEventListener("click", reset);
  }
}
setupMateriForms();

if (materiSearch) materiSearch.addEventListener("input", renderMateri);
if (materiStatusFilter) materiStatusFilter.addEventListener("change", renderMateri);

// Materi realtime sync
for (const subjectKey of Object.keys(materiSubjects)) {
  onValue(ref(db, `materi/${subjectKey}`), (snap) => {
    store.materi[subjectKey] = snap.val() || {};
    renderMateri();
  });
}

// =====================================================
// 3) KEUANGAN (CRUD + summary) - DISPLAY RUPIAH
// =====================================================
const keuForm = $("#keuanganForm");
const keuId = $("#keuanganId");
const keuType = $("#keuanganType");
const keuDesc = $("#keuanganDesc");
const keuAmount = $("#keuanganAmount");
const keuDate = $("#keuanganDate");
const keuSubmitBtn = $("#keuanganSubmitBtn");
const keuCancelBtn = $("#keuanganCancelEditBtn");

const keuTbody = $("#keuanganTbody");
const keuRowTemplate = $("#keuanganRowTemplate");

function keuResetForm() {
  if (keuId) keuId.value = "";
  if (keuType) keuType.value = "pendapatan";
  if (keuDesc) keuDesc.value = "";
  if (keuAmount) keuAmount.value = "";
  if (keuDate) keuDate.value = "";
  if (keuSubmitBtn) keuSubmitBtn.textContent = "Simpan";
}

function renderKeuangan() {
  if (!keuTbody) return;
  keuTbody.innerHTML = "";

  const arr = Object.entries(store.keuangan)
    .map(([id, it]) => ({ id, ...it }))
    .sort((a, b) => {
      const da = (a.tanggal || "").toString();
      const dbb = (b.tanggal || "").toString();
      if (da !== dbb) return dbb.localeCompare(da);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  if (arr.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5" style="color:rgba(244,244,247,.72);padding:12px;">Belum ada catatan.</td>`;
    keuTbody.appendChild(tr);
    renderDashboard();
    return;
  }

  arr.forEach((x) => {
    const row = keuRowTemplate.content.firstElementChild.cloneNode(true);

    row.querySelector(".col-date").textContent = x.tanggal || "-";
    row.querySelector(".col-type").textContent = x.jenis || "-";
    row.querySelector(".col-desc").textContent = x.keterangan || "-";
    row.querySelector(".col-amount").textContent = rupiah(x.nominal); // <== RUPIAH

    const btnEdit = row.querySelector(".btn-edit");
    const btnDelete = row.querySelector(".btn-delete");

    btnEdit.addEventListener("click", () => {
      keuId.value = x.id;
      keuType.value = x.jenis || "pendapatan";
      keuDesc.value = x.keterangan || "";
      keuAmount.value = String(toNum(x.nominal)); // input tetap angka
      keuDate.value = x.tanggal || "";
      keuSubmitBtn.textContent = "Update";
      $("#keuanganFormSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    btnDelete.addEventListener("click", () => {
      if (confirm("Yakin hapus catatan keuangan ini?")) {
        remove(ref(db, `keuangan/${x.id}`));
      }
    });

    keuTbody.appendChild(row);
  });

  renderDashboard();
}

if (keuForm) {
  keuForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      jenis: keuType.value,
      keterangan: keuDesc.value.trim(),
      nominal: toNum(keuAmount.value),
      tanggal: keuDate.value || todayISO(),
      updatedAt: Date.now(),
    };

    if (!payload.keterangan) return;

    if (keuId.value) {
      update(ref(db, `keuangan/${keuId.value}`), payload);
    } else {
      push(ref(db, "keuangan"), { ...payload, createdAt: Date.now() });
    }

    keuResetForm();
  });
}
if (keuCancelBtn) keuCancelBtn.addEventListener("click", keuResetForm);

onValue(ref(db, "keuangan"), (snap) => {
  store.keuangan = snap.val() || {};
  renderKeuangan();
});

// =====================================================
// 4) WISH LIST (CRUD + selesai/belum + filter/search)
// =====================================================
const wishForm = $("#wishForm");
const wishId = $("#wishId");
const wishTitle = $("#wishTitle");
const wishTargetDate = $("#wishTargetDate");
const wishNote = $("#wishNote");
const wishSubmitBtn = $("#wishSubmitBtn");
const wishCancelBtn = $("#wishCancelEditBtn");

const wishSearch = $("#wishSearch");
const wishStatusFilter = $("#wishStatusFilter");

const wishListTodo = $("#wishListTodo");
const wishListDone = $("#wishListDone");
const wishItemTemplate = $("#wishItemTemplate");

function wishResetForm() {
  if (wishId) wishId.value = "";
  if (wishTitle) wishTitle.value = "";
  if (wishTargetDate) wishTargetDate.value = "";
  if (wishNote) wishNote.value = "";
  if (wishSubmitBtn) wishSubmitBtn.textContent = "Simpan";
}

function wishFilters() {
  const q = (wishSearch?.value || "").trim().toLowerCase();
  const st = wishStatusFilter?.value || "all";
  return { q, st };
}

function wishMatch(item, { q, st }) {
  const title = (item.judul || "").toLowerCase();
  const note = (item.catatan || "").toLowerCase();
  const target = (item.target || "").toLowerCase();

  const textOk = !q || title.includes(q) || note.includes(q) || target.includes(q);

  const statusOk =
    st === "all" ||
    (st === "done" && !!item.status) ||
    (st === "todo" && !item.status);

  return textOk && statusOk;
}

function renderWishlist() {
  if (wishListTodo) wishListTodo.innerHTML = "";
  if (wishListDone) wishListDone.innerHTML = "";

  const filters = wishFilters();

  const arr = Object.entries(store.wishlist)
    .map(([id, it]) => ({ id, ...it }))
    .filter((x) => wishMatch(x, filters))
    .sort(byNewest);

  const todo = arr.filter((x) => !x.status);
  const done = arr.filter((x) => !!x.status);

  function renderTo(listEl, items) {
    if (!listEl) return;

    if (items.length === 0) {
      const li = document.createElement("li");
      li.className = "item";
      li.innerHTML = `<div class="item-main"><p class="item-meta">Kosong (atau sedang terfilter).</p></div>`;
      listEl.appendChild(li);
      return;
    }

    items.forEach((x) => {
      const node = wishItemTemplate.content.firstElementChild.cloneNode(true);
      node.classList.toggle("is-done", !!x.status);

      node.querySelector(".item-title").textContent = x.judul || "(tanpa judul)";
      const metaParts = [];
      metaParts.push(x.target ? `Target: ${x.target}` : "Tanpa target");
      metaParts.push(x.catatan ? x.catatan : "Tanpa catatan");
      node.querySelector(".item-meta").textContent = metaParts.join(" • ");

      const btnToggle = node.querySelector(".btn-toggle");
      const btnEdit = node.querySelector(".btn-edit");
      const btnDelete = node.querySelector(".btn-delete");

      btnToggle.textContent = x.status ? "Belum" : "Selesai";
      btnToggle.addEventListener("click", () => {
        update(ref(db, `wishlist/${x.id}`), { status: !x.status, updatedAt: Date.now() });
      });

      btnEdit.addEventListener("click", () => {
        wishId.value = x.id;
        wishTitle.value = x.judul || "";
        wishTargetDate.value = x.target || "";
        wishNote.value = x.catatan || "";
        wishSubmitBtn.textContent = "Update";
        $("#wishFormSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      btnDelete.addEventListener("click", () => {
        if (confirm("Yakin hapus wish ini?")) {
          remove(ref(db, `wishlist/${x.id}`));
        }
      });

      listEl.appendChild(node);
    });
  }

  renderTo(wishListTodo, todo);
  renderTo(wishListDone, done);

  renderDashboard();
}

if (wishForm) {
  wishForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      judul: wishTitle.value.trim(),
      target: wishTargetDate.value || "",
      catatan: wishNote.value.trim(),
      status: false,
      updatedAt: Date.now(),
    };

    if (!payload.judul) return;

    if (wishId.value) {
      update(ref(db, `wishlist/${wishId.value}`), payload);
    } else {
      push(ref(db, "wishlist"), { ...payload, createdAt: Date.now() });
    }

    wishResetForm();
  });
}
if (wishCancelBtn) wishCancelBtn.addEventListener("click", wishResetForm);
if (wishSearch) wishSearch.addEventListener("input", renderWishlist);
if (wishStatusFilter) wishStatusFilter.addEventListener("change", renderWishlist);

onValue(ref(db, "wishlist"), (snap) => {
  store.wishlist = snap.val() || {};
  renderWishlist();
});

// =====================================================
// INITIAL
// =====================================================
renderDashboard();
