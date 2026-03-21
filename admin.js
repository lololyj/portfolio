const PROJECTS_STORAGE_KEY = "portfolio_projects_v1";
const ADMIN_UNLOCK_KEY = "portfolio_admin_unlocked_v1";

// 보안을 위한 용도(간단한 프론트 비밀번호). 배포/공유용이라면 서버 인증이 필요합니다.
const ADMIN_PASSWORD = "100533";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function safeParseJSON(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function loadProjects() {
  const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParseJSON(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((p) => ({
    id: String(p.id || ""),
    title: String(p.title || "").trim(),
    year: String(p.year || "").trim(),
    tags: Array.isArray(p.tags) ? p.tags.map(String).map((t) => t.trim()).filter(Boolean) : [],
    role: String(p.role || "").trim(),
    tools: Array.isArray(p.tools) ? p.tools.map(String).map((t) => t.trim()).filter(Boolean) : [],
    summary: String(p.summary || "").trim(),
    highlights: Array.isArray(p.highlights) ? p.highlights.map(String).map((h) => h.trim()).filter(Boolean) : [],
    accent: String(p.accent || "#4f46e5").trim(),
  }));
}

function saveProjects(projects) {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function parseTags(value) {
  return String(value || "")
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function makeId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function showToast(message) {
  const toast = $("#adminToast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("is-show");
  setTimeout(() => toast.classList.remove("is-show"), 2600);
}

let currentId = "";
let projects = [];

function setUnlocked(unlocked) {
  sessionStorage.setItem(ADMIN_UNLOCK_KEY, unlocked ? "true" : "false");
}

function isUnlocked() {
  return sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "true";
}

function renderList() {
  const list = $("#projectList");
  if (!list) return;

  list.innerHTML = "";

  if (!projects.length) {
    const empty = document.createElement("div");
    empty.className = "form-hint";
    empty.style.marginTop = "10px";
    empty.textContent = "저장된 프로젝트가 없습니다. 폼에서 새 프로젝트를 추가해보세요.";
    list.appendChild(empty);
    return;
  }

  projects.forEach((p) => {
    const item = document.createElement("div");
    item.className = "list-item";

    const head = document.createElement("div");
    head.className = "list-head";

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "list-title";
    title.textContent = p.title;

    const meta = document.createElement("div");
    meta.className = "list-meta";
    meta.innerHTML = `
      <span>${p.year}</span>
      <span>•</span>
      <span>${(p.tags || []).slice(0, 3).join(", ")}</span>
    `;

    left.appendChild(title);
    left.appendChild(meta);

    const right = document.createElement("div");
    right.className = "row";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-ghost";
    editBtn.type = "button";
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", () => startEdit(p.id));

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-ghost danger-btn";
    delBtn.type = "button";
    delBtn.textContent = "삭제";
    delBtn.addEventListener("click", () => deleteOne(p.id));

    right.appendChild(editBtn);
    right.appendChild(delBtn);

    head.appendChild(left);
    head.appendChild(right);
    item.appendChild(head);
    list.appendChild(item);
  });
}

function setFormFromProject(p) {
  $("#pTitle").value = p.title || "";
  $("#pYear").value = p.year || "";
  $("#pTags").value = (p.tags || []).join(", ");
  $("#pRole").value = p.role || "";
  $("#pTools").value = (p.tools || []).join(", ");
  $("#pSummary").value = p.summary || "";
  $("#pHighlights").value = (p.highlights || []).join(", ");
  $("#pAccent").value = p.accent || "#4f46e5";
}

function clearFormSelection() {
  currentId = "";
  $("#projectForm").reset();
  $("#pAccent").value = "#7c3aed";
  showToast("새 프로젝트로 입력할 수 있어요.");
}

function startEdit(id) {
  const p = projects.find((x) => x.id === id);
  if (!p) return;
  currentId = id;
  setFormFromProject(p);
  showToast("편집 모드로 전환했어요.");
}

function deleteOne(id) {
  const target = projects.find((p) => p.id === id);
  if (!target) return;
  const ok = confirm(`"${target.title}" 프로젝트를 삭제할까요?`);
  if (!ok) return;

  projects = projects.filter((p) => p.id !== id);
  saveProjects(projects);
  renderList();
  if (currentId === id) currentId = "";
  showToast("삭제 완료");
}

function validateForm(data) {
  if (!data.title) return "제목을 입력해주세요.";
  if (!data.year) return "년도를 입력해주세요.";
  if (!data.tags.length) return "태그를 입력해주세요.";
  if (!data.role) return "역할을 입력해주세요.";
  if (!data.tools.length) return "도구를 입력해주세요.";
  if (!data.summary) return "요약을 입력해주세요.";
  if (!data.highlights.length) return "하이라이트를 입력해주세요.";

  const accent = data.accent || "#4f46e5";
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) return "포인트 컬러는 예: #7c3aed 형태로 입력해주세요.";
  return "";
}

function gatherFormData() {
  const title = $("#pTitle").value.trim();
  const year = $("#pYear").value.trim();
  const tags = parseTags($("#pTags").value);
  const role = $("#pRole").value.trim();
  const tools = parseCommaList($("#pTools").value);
  const summary = $("#pSummary").value.trim();
  const highlights = parseCommaList($("#pHighlights").value);
  const accent = $("#pAccent").value.trim();

  return {
    id: currentId || "",
    title,
    year,
    tags,
    role,
    tools,
    summary,
    highlights,
    accent,
  };
}

function upsertProject() {
  const data = gatherFormData();
  const error = validateForm(data);
  if (error) {
    showToast(error);
    return;
  }

  const normalized = {
    id: data.id || makeId(),
    title: data.title,
    year: data.year,
    tags: data.tags,
    role: data.role,
    tools: data.tools,
    summary: data.summary,
    highlights: data.highlights,
    accent: data.accent,
  };

  const idx = projects.findIndex((p) => p.id === normalized.id);
  if (idx >= 0) projects[idx] = normalized;
  else projects.push(normalized);

  projects = projects.slice().sort((a, b) => (b.year || "").localeCompare(a.year || "")); // 최신 연도 우선
  saveProjects(projects);
  renderList();
  currentId = normalized.id;
  showToast("저장 완료");
}

function deleteAll() {
  const ok = confirm("정말로 모든 프로젝트를 삭제할까요?");
  if (!ok) return;
  projects = [];
  saveProjects(projects);
  currentId = "";
  renderList();
  $("#projectForm").reset();
  $("#pAccent").value = "#7c3aed";
  showToast("전체 삭제 완료");
}

document.addEventListener("DOMContentLoaded", () => {
  const authView = $("#authView");
  const adminView = $("#adminView");
  const authForm = $("#authForm");
  const authError = $("#authError");
  const logoutBtn = $("#logoutBtn");

  const showAdmin = () => {
    if (authView) authView.classList.add("hidden");
    if (adminView) {
      adminView.classList.remove("hidden");
      adminView.setAttribute("aria-hidden", "false");
    }
  };

  const hideAdmin = () => {
    if (authView) authView.classList.remove("hidden");
    if (adminView) {
      adminView.classList.add("hidden");
      adminView.setAttribute("aria-hidden", "true");
    }
  };

  projects = loadProjects();
  renderList();

  if (isUnlocked()) {
    showAdmin();
  } else {
    hideAdmin();
  }

  logoutBtn?.addEventListener("click", () => {
    setUnlocked(false);
    hideAdmin();
    authError.textContent = "";
    $("#adminPassword").value = "";
    showToast("관리자 세션이 해제됐어요.");
  });

  authForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    authError.textContent = "";

    const pw = ($("#adminPassword").value || "").trim();
    if (pw !== ADMIN_PASSWORD) {
      authError.textContent = "비밀번호가 올바르지 않습니다.";
      showToast("비밀번호 확인 필요");
      return;
    }

    setUnlocked(true);
    showAdmin();
    $("#adminPassword").value = "";
    showToast("관리자 입장 완료");
  });

  $("#projectForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    upsertProject();
  });

  $("#resetBtn")?.addEventListener("click", () => {
    clearFormSelection();
  });

  $("#deleteAllBtn")?.addEventListener("click", () => {
    deleteAll();
  });

  // 기본 accent값
  if (!$("#pAccent").value) $("#pAccent").value = "#7c3aed";
});

