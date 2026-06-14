const STORAGE_KEY = "daily-project-checklist";
const ACCOUNT_KEY = "clinical-assistant-account";

const projectForm = document.querySelector("#projectForm");
const projectFormToggle = document.querySelector("#projectFormToggle");
const projectNameInput = document.querySelector("#projectName");
const exportButton = document.querySelector("#exportButton");
const collapseAllButton = document.querySelector("#collapseAllButton");
const loginButton = document.querySelector("#loginButton");
const quickTaskButton = document.querySelector("#quickTaskButton");
const searchToggle = document.querySelector("#searchToggle");
const searchInput = document.querySelector("#searchInput");
const searchResults = document.querySelector("#searchResults");
const projectsList = document.querySelector("#projectsList");
const taskDimensionView = document.querySelector("#taskDimensionView");
const taskDimensionList = document.querySelector("#taskDimensionList");
const taskDimensionEmpty = document.querySelector("#taskDimensionEmpty");
const taskFilterIncompleteCount = document.querySelector("#taskFilterIncompleteCount");
const taskFilterCompletedCount = document.querySelector("#taskFilterCompletedCount");
const taskFilterAllCount = document.querySelector("#taskFilterAllCount");
const emptyState = document.querySelector("#emptyState");
const projectSummaryButton = document.querySelector("#projectSummaryButton");
const projectSummaryPopover = document.querySelector("#projectSummaryPopover");
const projectSummaryList = document.querySelector("#projectSummaryList");
const projectCount = document.querySelector("#projectCount");
const completedCount = document.querySelector("#completedCount");
const incompleteCount = document.querySelector("#incompleteCount");
const totalCount = document.querySelector("#totalCount");
const completedStatButton = document.querySelector("#completedStatButton");
const incompleteStatButton = document.querySelector("#incompleteStatButton");
const projectTemplate = document.querySelector("#projectTemplate");
const taskTemplate = document.querySelector("#taskTemplate");
const noteModal = document.querySelector("#noteModal");
const noteTaskTitle = document.querySelector("#noteTaskTitle");
const noteInput = document.querySelector("#noteInput");
const saveNoteButton = document.querySelector("#saveNoteButton");
const cancelNoteButton = document.querySelector("#cancelNoteButton");
const completedModal = document.querySelector("#completedModal");
const completedProjectTitle = document.querySelector("#completedProjectTitle");
const completedTaskList = document.querySelector("#completedTaskList");
const closeCompletedButton = document.querySelector("#closeCompletedButton");
const globalTaskModal = document.querySelector("#globalTaskModal");
const globalTaskModalTitle = document.querySelector("#globalTaskModalTitle");
const globalTaskModalSubtitle = document.querySelector("#globalTaskModalSubtitle");
const globalTaskList = document.querySelector("#globalTaskList");
const closeGlobalTaskButton = document.querySelector("#closeGlobalTaskButton");
const quickTaskModal = document.querySelector("#quickTaskModal");
const quickTaskForm = document.querySelector("#quickTaskForm");
const quickTaskTitle = document.querySelector("#quickTaskTitle");
const quickTaskProject = document.querySelector("#quickTaskProject");
const quickNewProjectField = document.querySelector("#quickNewProjectField");
const quickNewProjectName = document.querySelector("#quickNewProjectName");
const quickTaskError = document.querySelector("#quickTaskError");
const closeQuickTaskButton = document.querySelector("#closeQuickTaskButton");
const loginModal = document.querySelector("#loginModal");
const loginForm = document.querySelector("#loginForm");
const accountInput = document.querySelector("#accountInput");
const passwordInput = document.querySelector("#passwordInput");
const closeLoginButton = document.querySelector("#closeLoginButton");

let currentAccount = loadAccount();
let projects = normalizeProjects(loadProjects());
let activeNoteTask = null;
let activeCompletedProjectId = null;
let activeGlobalTaskFilter = null;
let draggedProjectId = null;
let activeView = "project";
let activeTaskFilter = "incomplete";

render();
renderAuthState();

exportButton.addEventListener("click", exportToExcel);
collapseAllButton.addEventListener("click", collapseAllProjects);
loginButton.addEventListener("click", handleAuthButtonClick);
quickTaskButton.addEventListener("click", openQuickTaskModal);
searchToggle.addEventListener("click", () => {
  const isOpen = searchInput.parentElement.classList.toggle("is-open");
  searchToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    searchInput.focus();
    renderSearchResults();
  } else {
    searchResults.hidden = true;
  }
});
projectFormToggle.addEventListener("click", () => {
  const isOpen = projectForm.classList.toggle("is-open");
  projectFormToggle.setAttribute("aria-expanded", String(isOpen));
  if (isOpen) {
    projectNameInput.focus();
  }
});
saveNoteButton.addEventListener("click", saveActiveNote);
cancelNoteButton.addEventListener("click", closeNoteModal);
searchInput.addEventListener("input", () => {
  if (searchInput.value) {
    searchInput.parentElement.classList.add("is-open");
    searchToggle.setAttribute("aria-expanded", "true");
  }
  renderSearchResults();
});
projectSummaryButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const shouldOpen = projectSummaryPopover.hidden;
  projectSummaryPopover.hidden = !shouldOpen;
  projectSummaryButton.setAttribute("aria-expanded", String(shouldOpen));
});
projectSummaryPopover.addEventListener("click", (event) => {
  event.stopPropagation();
});
completedStatButton.addEventListener("click", () => openGlobalTaskModal("completed"));
incompleteStatButton.addEventListener("click", () => openGlobalTaskModal("incomplete"));
closeCompletedButton.addEventListener("click", () => {
  completedModal.hidden = true;
});
closeGlobalTaskButton.addEventListener("click", () => {
  activeGlobalTaskFilter = null;
  globalTaskModal.hidden = true;
});
quickTaskProject.addEventListener("change", updateQuickTaskProjectMode);
quickTaskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuickTask();
});
closeQuickTaskButton.addEventListener("click", closeQuickTaskModal);
document.querySelectorAll(".dimension-tab").forEach((button) => {
  button.addEventListener("click", () => {
    activeView = button.dataset.view;
    render();
  });
});
document.querySelectorAll(".task-filter").forEach((button) => {
  button.addEventListener("click", () => {
    activeTaskFilter = button.dataset.filter;
    render();
  });
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginWithAccount();
});
closeLoginButton.addEventListener("click", () => {
  loginModal.hidden = true;
});

document.querySelectorAll(".provider-button").forEach((button) => {
  button.addEventListener("click", () => {
    alert(`${button.dataset.provider}登录需要接入云端认证服务后启用。`);
  });
});

document.addEventListener("click", (event) => {
  if (
    projectSummaryPopover.hidden ||
    projectSummaryPopover.contains(event.target) ||
    projectSummaryButton.contains(event.target)
  ) {
    return;
  }

  projectSummaryPopover.hidden = true;
  projectSummaryButton.setAttribute("aria-expanded", "false");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    projectSummaryPopover.hidden = true;
    projectSummaryButton.setAttribute("aria-expanded", "false");
  }
});

projectForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = projectNameInput.value.trim();
  if (!name) return;

  projects.push({
    id: createId(),
    name,
    collapsed: false,
    tasks: [],
  });

  projectNameInput.value = "";
  projectForm.classList.remove("is-open");
  projectFormToggle.setAttribute("aria-expanded", "false");
  saveAndRender();
});

function loadProjects() {
  try {
    const saved = localStorage.getItem(getProjectStorageKey());
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.warn("无法读取本地清单数据，已使用空列表。", error);
    return [];
  }
}

function saveProjects() {
  localStorage.setItem(getProjectStorageKey(), JSON.stringify(projects));
}

function saveAndRender() {
  saveProjects();
  render();
  renderSearchResults();
  refreshGlobalTaskModal();
}

function loadAccount() {
  try {
    const saved = localStorage.getItem(ACCOUNT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("无法读取账户信息，已使用访客模式。", error);
    return null;
  }
}

function saveAccount(account) {
  if (!account) {
    localStorage.removeItem(ACCOUNT_KEY);
    return;
  }

  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

function getProjectStorageKey() {
  if (!currentAccount) return STORAGE_KEY;

  return `${STORAGE_KEY}:account:${currentAccount.id}`;
}

function createAccountId(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9@._+-]/g, "-");
}

function renderAuthState() {
  if (!currentAccount) {
    loginButton.textContent = "登录";
    loginButton.title = "登录账户";
    return;
  }

  loginButton.textContent = currentAccount.label;
  loginButton.title = "点击退出登录";
}

function handleAuthButtonClick() {
  if (currentAccount) {
    const confirmed = confirm(`退出 ${currentAccount.label}？退出后会回到访客清单。`);
    if (!confirmed) return;

    saveProjects();
    currentAccount = null;
    saveAccount(null);
    projects = normalizeProjects(loadProjects());
    renderAuthState();
    render();
    return;
  }

  accountInput.value = "";
  passwordInput.value = "";
  loginModal.hidden = false;
  accountInput.focus();
}

function loginWithAccount() {
  const accountValue = accountInput.value.trim();
  const passwordValue = passwordInput.value.trim();

  if (!accountValue || !passwordValue) {
    alert("请输入邮箱/手机号和验证码或密码。");
    return;
  }

  saveProjects();
  currentAccount = {
    id: createAccountId(accountValue),
    label: accountValue,
    signedInAt: new Date().toISOString(),
  };
  saveAccount(currentAccount);
  projects = normalizeProjects(loadProjects());
  loginModal.hidden = true;
  renderAuthState();
  render();
}

function collapseAllProjects() {
  projects = projects.map((project) => ({
    ...project,
    collapsed: true,
  }));
  saveAndRender();
}

function render() {
  projectsList.replaceChildren();
  projectSummaryList.replaceChildren();
  taskDimensionList.replaceChildren();

  const totals = getTotals(projects);
  const incomplete = totals.total - totals.completed;
  projectCount.textContent = projects.length;
  completedCount.textContent = totals.completed;
  incompleteCount.textContent = incomplete;
  totalCount.textContent = totals.total;
  completedStatButton.disabled = totals.completed === 0;
  incompleteStatButton.disabled = incomplete === 0;
  collapseAllButton.disabled = projects.length === 0;
  emptyState.hidden = projects.length > 0;
  projectsList.hidden = projects.length === 0 || activeView !== "project";
  taskDimensionView.hidden = projects.length === 0 || activeView !== "task";
  updateViewControls();
  renderProjectSummary();

  projects.forEach((project) => {
    const projectNode = projectTemplate.content.firstElementChild.cloneNode(true);
    const titleInput = projectNode.querySelector(".project-title-input");
    const count = projectNode.querySelector(".project-count");
    const dragButton = projectNode.querySelector(".drag-project");
    const toggleButton = projectNode.querySelector(".toggle-project");
    const showCompletedButton = projectNode.querySelector(".show-completed");
    const deleteProjectButton = projectNode.querySelector(".delete-project");
    const pinnedTaskList = projectNode.querySelector(".pinned-task-list");
    const projectBody = projectNode.querySelector(".project-body");
    const taskForm = projectNode.querySelector(".task-form");
    const taskFormToggle = taskForm.querySelector(".task-form-toggle");
    const taskInput = taskForm.querySelector("input");
    const taskList = projectNode.querySelector(".task-list");
    const projectEmpty = projectNode.querySelector(".project-empty");
    const projectTotals = getTotals([project]);

    projectNode.dataset.projectId = project.id;
    titleInput.value = project.name;
    autoResizeTextArea(titleInput);
    count.textContent = `${projectTotals.completed} / ${projectTotals.total} 已完成`;
    projectEmpty.hidden = project.tasks.length > 0;
    projectBody.hidden = Boolean(project.collapsed);
    toggleButton.textContent = project.collapsed ? "展开" : "折叠";
    toggleButton.setAttribute("aria-expanded", String(!project.collapsed));

    dragButton.addEventListener("dragstart", (event) => {
      draggedProjectId = project.id;
      projectNode.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", project.id);
    });

    dragButton.addEventListener("dragend", () => {
      draggedProjectId = null;
      projectNode.classList.remove("dragging");
      document
        .querySelectorAll(".project-card.drag-over")
        .forEach((node) => node.classList.remove("drag-over"));
    });

    projectNode.addEventListener("dragover", (event) => {
      if (!draggedProjectId || draggedProjectId === project.id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      projectNode.classList.add("drag-over");
    });

    projectNode.addEventListener("dragleave", () => {
      projectNode.classList.remove("drag-over");
    });

    projectNode.addEventListener("drop", (event) => {
      event.preventDefault();
      projectNode.classList.remove("drag-over");
      const sourceId = event.dataTransfer.getData("text/plain") || draggedProjectId;

      moveProject(sourceId, project.id);
    });

    toggleButton.addEventListener("click", () => {
      project.collapsed = !project.collapsed;
      saveAndRender();
    });

    titleInput.addEventListener("change", () => {
      updateProjectName(project.id, titleInput.value);
    });

    titleInput.addEventListener("input", () => {
      autoResizeTextArea(titleInput);
    });

    titleInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      titleInput.blur();
    });

    showCompletedButton.textContent = `已完成 ${projectTotals.completed}`;
    showCompletedButton.disabled = projectTotals.completed === 0;
    showCompletedButton.addEventListener("click", () => {
      openCompletedModal(project.id);
    });

    deleteProjectButton.addEventListener("click", () => {
      const confirmed = confirm(
        "删除项目会删除项目中所有的待办事项，确定要删除这个项目吗？"
      );

      if (!confirmed) return;

      projects = projects.filter((item) => item.id !== project.id);
      saveAndRender();
    });

    taskFormToggle.addEventListener("click", () => {
      const isOpen = taskForm.classList.toggle("is-open");
      taskFormToggle.setAttribute("aria-expanded", String(isOpen));
      if (isOpen) {
        taskInput.focus();
      }
    });

    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const taskTitle = taskInput.value.trim();
      if (!taskTitle) return;

      addTaskToProject(project, taskTitle);

      taskInput.value = "";
      taskForm.classList.remove("is-open");
      taskFormToggle.setAttribute("aria-expanded", "false");
      saveAndRender();
    });

    const pinnedTasks = getSortedTasks(project.tasks).filter(
      (task) => task.pinned && !task.completed
    );
    const bodyTasks = getSortedTasks(project.tasks).filter(
      (task) => !task.completed && !task.pinned
    );

    pinnedTaskList.hidden = pinnedTasks.length === 0;
    pinnedTasks.forEach((task) => {
      pinnedTaskList.appendChild(createTaskNode(project.id, task));
    });

    bodyTasks.forEach((task) => {
      taskList.appendChild(createTaskNode(project.id, task));
    });
    projectEmpty.hidden = pinnedTasks.length + bodyTasks.length > 0;

    projectsList.appendChild(projectNode);
  });

  document
    .querySelectorAll(".project-title-input, .task-title-input")
    .forEach(autoResizeTextArea);
  renderTaskDimension();
}

function updateViewControls() {
  document.querySelectorAll(".dimension-tab").forEach((button) => {
    const isActive = button.dataset.view === activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  document.querySelectorAll(".task-filter").forEach((button) => {
    const isActive = button.dataset.filter === activeTaskFilter;
    button.classList.toggle("is-active", isActive);
  });
}

function renderTaskDimension() {
  const allTasks = getFlatTasks();
  const completedTasks = allTasks.filter(({ task }) => task.completed);
  const incompleteTasks = allTasks.filter(({ task }) => !task.completed);
  const visibleTasks = getFilteredFlatTasks(allTasks);

  taskFilterIncompleteCount.textContent = incompleteTasks.length;
  taskFilterCompletedCount.textContent = completedTasks.length;
  taskFilterAllCount.textContent = allTasks.length;
  taskDimensionList.replaceChildren();

  if (visibleTasks.length === 0) {
    taskDimensionEmpty.hidden = false;
    taskDimensionEmpty.textContent =
      activeTaskFilter === "completed"
        ? "暂无已完成待办。"
        : activeTaskFilter === "all"
          ? "暂无待办事项。"
          : "暂无未完成待办。";
    return;
  }

  taskDimensionEmpty.hidden = true;
  visibleTasks.forEach(({ project, task }) => {
    const taskNode = createTaskNode(project.id, task);
    taskNode.dataset.taskDimension = "true";
    const projectBadge = document.createElement("span");
    projectBadge.className = "task-project-badge";
    projectBadge.textContent = project.name;
    taskNode.querySelector(".task-meta").prepend(projectBadge);
    taskDimensionList.appendChild(taskNode);
  });
}

function getFlatTasks() {
  return projects
    .flatMap((project) => project.tasks.map((task) => ({ project, task })))
    .sort((first, second) => {
      if (first.task.pinned !== second.task.pinned) {
        return first.task.pinned ? -1 : 1;
      }

      return new Date(first.task.createdAt) - new Date(second.task.createdAt);
    });
}

function getFilteredFlatTasks(tasks) {
  if (activeTaskFilter === "completed") {
    return tasks.filter(({ task }) => task.completed);
  }

  if (activeTaskFilter === "all") {
    return tasks;
  }

  return tasks.filter(({ task }) => !task.completed);
}

function createTaskNode(projectId, task) {
  const taskNode = taskTemplate.content.firstElementChild.cloneNode(true);
  const checkbox = taskNode.querySelector("input");
  const taskTitleInput = taskNode.querySelector(".task-title-input");
  const taskMeta = taskNode.querySelector(".task-meta");
  const noteButton = taskNode.querySelector(".note-task");
  const pinButton = taskNode.querySelector(".pin-task");
  const deleteButton = taskNode.querySelector(".delete-task");

  taskNode.dataset.projectId = projectId;
  taskNode.dataset.taskId = task.id;
  taskNode.classList.toggle("completed", task.completed);
  taskNode.classList.toggle("pinned", task.pinned && !task.completed);
  taskNode.classList.toggle("has-note", Boolean(task.note));
  checkbox.checked = task.completed;
  taskTitleInput.value = task.title;
  autoResizeTextArea(taskTitleInput);
  taskMeta.replaceChildren(
    document.createTextNode(`添加时间：${formatDateTime(task.createdAt)}`)
  );
  if (task.note) {
    const noteBadge = document.createElement("span");
    noteBadge.className = "note-badge";
    noteBadge.textContent = "有注释";
    taskMeta.appendChild(noteBadge);
  }
  noteButton.classList.toggle("has-note", Boolean(task.note));
  pinButton.textContent = task.pinned ? "取消置顶" : "置顶";

  taskTitleInput.addEventListener("change", () => {
    updateTaskTitle(projectId, task.id, taskTitleInput.value);
  });

  taskTitleInput.addEventListener("input", () => {
    autoResizeTextArea(taskTitleInput);
  });

  taskTitleInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    taskTitleInput.blur();
  });

  checkbox.addEventListener("change", () => {
    updateTask(projectId, task.id, (currentTask) => {
      currentTask.completed = checkbox.checked;
      if (currentTask.completed) {
        currentTask.pinned = false;
      }
    });
  });

  noteButton.addEventListener("click", () => {
    openNoteModal(projectId, task.id);
  });

  pinButton.addEventListener("click", () => {
    updateTask(projectId, task.id, (currentTask) => {
      currentTask.pinned = !currentTask.pinned;
      if (currentTask.pinned) {
        currentTask.completed = false;
      }
    });
  });

  deleteButton.addEventListener("click", () => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    project.tasks = project.tasks.filter((item) => item.id !== task.id);
    saveAndRender();
  });

  return taskNode;
}

function autoResizeTextArea(input) {
  input.style.height = "auto";
  input.style.height = `${input.scrollHeight}px`;
}

function updateProjectName(projectId, name) {
  const nextName = name.trim();
  const project = projects.find((item) => item.id === projectId);

  if (!project) return;

  if (!nextName) {
    render();
    return;
  }

  project.name = nextName;
  saveAndRender();
}

function moveProject(sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return;

  const sourceIndex = projects.findIndex((project) => project.id === sourceId);
  const targetIndex = projects.findIndex((project) => project.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1) return;

  const [movedProject] = projects.splice(sourceIndex, 1);
  projects.splice(targetIndex, 0, movedProject);
  saveAndRender();
}

function addTaskToProject(project, title) {
  project.tasks.push({
    id: createId(),
    title,
    completed: false,
    pinned: false,
    createdAt: new Date().toISOString(),
  });
}

function updateTaskTitle(projectId, taskId, title) {
  const nextTitle = title.trim();
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);

  if (!task) return;

  if (!nextTitle) {
    render();
    return;
  }

  task.title = nextTitle;
  saveAndRender();
}

function openQuickTaskModal() {
  quickTaskTitle.value = "";
  quickNewProjectName.value = "";
  hideQuickTaskError();
  renderQuickTaskProjectOptions();
  updateQuickTaskProjectMode();
  quickTaskModal.hidden = false;
  quickTaskTitle.focus();
}

function closeQuickTaskModal() {
  quickTaskModal.hidden = true;
  hideQuickTaskError();
}

function renderQuickTaskProjectOptions() {
  quickTaskProject.replaceChildren();

  projects.forEach((project, index) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    option.selected = index === 0;
    quickTaskProject.appendChild(option);
  });

  const newProjectOption = document.createElement("option");
  newProjectOption.value = "__new__";
  newProjectOption.textContent = "新建项目";
  newProjectOption.selected = projects.length === 0;
  quickTaskProject.appendChild(newProjectOption);
}

function updateQuickTaskProjectMode() {
  const isNewProject = quickTaskProject.value === "__new__";
  quickNewProjectField.hidden = !isNewProject;

  if (isNewProject && !quickTaskModal.hidden) {
    quickNewProjectName.focus();
  }
}

function submitQuickTask() {
  const taskTitle = quickTaskTitle.value.trim();
  const selectedProjectId = quickTaskProject.value;

  if (!taskTitle) {
    showQuickTaskError("请输入待办事项名称。");
    quickTaskTitle.focus();
    return;
  }

  if (selectedProjectId === "__new__") {
    const projectName = quickNewProjectName.value.trim();

    if (!projectName) {
      showQuickTaskError("请输入新建项目名称。");
      quickNewProjectName.focus();
      return;
    }

    const project = {
      id: createId(),
      name: projectName,
      collapsed: false,
      tasks: [],
    };
    addTaskToProject(project, taskTitle);
    projects.push(project);
    closeQuickTaskModal();
    saveAndRender();
    return;
  }

  const project = projects.find((item) => item.id === selectedProjectId);
  if (!project) {
    showQuickTaskError("请选择归属项目，或新建一个项目。");
    quickTaskProject.focus();
    return;
  }

  addTaskToProject(project, taskTitle);
  closeQuickTaskModal();
  saveAndRender();
}

function showQuickTaskError(message) {
  quickTaskError.textContent = message;
  quickTaskError.hidden = false;
}

function hideQuickTaskError() {
  quickTaskError.textContent = "";
  quickTaskError.hidden = true;
}

function renderProjectSummary() {
  if (projects.length === 0) {
    const emptySummary = document.createElement("p");
    emptySummary.className = "project-summary-empty";
    emptySummary.textContent = "暂无项目工作量。";
    projectSummaryList.appendChild(emptySummary);
    return;
  }

  projects.forEach((project) => {
    const projectTotals = getTotals([project]);
    const summaryItem = document.createElement("button");
    summaryItem.className = "project-summary-item";
    summaryItem.type = "button";
    summaryItem.innerHTML = `
      <span class="summary-project-name"></span>
      <span class="summary-project-stats">
        <span class="summary-stat"></span>
        <span class="summary-stat"></span>
      </span>
    `;
    summaryItem.querySelector(".summary-project-name").textContent = project.name;
    const summaryStats = summaryItem.querySelectorAll(".summary-stat");
    summaryStats[0].textContent = `已完成 ${projectTotals.completed}`;
    summaryStats[1].textContent = `工作量 ${projectTotals.total}`;
    summaryItem.addEventListener("click", () => {
      projectSummaryPopover.hidden = true;
      projectSummaryButton.setAttribute("aria-expanded", "false");
      goToSearchResult({
        type: "project",
        projectId: project.id,
      });
    });
    projectSummaryList.appendChild(summaryItem);
  });
}

function updateTask(projectId, taskId, updater) {
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);

  if (!task) return;

  updater(task);
  saveAndRender();
}

function openNoteModal(projectId, taskId) {
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);

  if (!task) return;

  activeNoteTask = { projectId, taskId };
  noteTaskTitle.textContent = task.title;
  noteInput.value = task.note || "";
  noteModal.hidden = false;
  noteInput.focus();
}

function saveActiveNote() {
  if (!activeNoteTask) return;

  updateTask(activeNoteTask.projectId, activeNoteTask.taskId, (task) => {
    task.note = noteInput.value.trim();
  });

  activeNoteTask = null;
  noteModal.hidden = true;
}

function closeNoteModal() {
  activeNoteTask = null;
  noteModal.hidden = true;
}

function openCompletedModal(projectId) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  activeCompletedProjectId = projectId;
  const completedTasks = getSortedTasks(project.tasks).filter((task) => task.completed);

  completedProjectTitle.textContent = project.name;
  completedTaskList.replaceChildren();

  if (completedTasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "completed-empty";
    empty.textContent = "暂无已完成待办事项。";
    completedTaskList.appendChild(empty);
  }

  completedTasks.forEach((task) => {
    const item = document.createElement("article");
    item.className = "completed-task-item";
    item.innerHTML = `
      <label class="completed-task-check">
        <input type="checkbox" checked />
        <span>
          <span class="completed-task-title"></span>
          <span class="completed-task-meta"></span>
          <span class="completed-task-note"></span>
        </span>
      </label>
    `;
    item.querySelector(".completed-task-title").textContent = task.title;
    item.querySelector(".completed-task-meta").textContent = `添加时间：${formatDateTime(
      task.createdAt
    )}`;
    item.querySelector(".completed-task-note").textContent = task.note
      ? `注释：${task.note}`
      : "注释：暂无";
    item.querySelector("input").addEventListener("change", () => {
      restoreCompletedTask(projectId, task.id);
    });
    completedTaskList.appendChild(item);
  });

  completedModal.hidden = false;
}

function restoreCompletedTask(projectId, taskId) {
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);

  if (!task) return;

  task.completed = false;
  task.pinned = false;
  saveProjects();
  render();
  openCompletedModal(activeCompletedProjectId || projectId);
}

function openGlobalTaskModal(filter) {
  activeGlobalTaskFilter = filter;
  renderGlobalTaskModal(filter);
  globalTaskModal.hidden = false;
}

function refreshGlobalTaskModal() {
  if (globalTaskModal.hidden || !activeGlobalTaskFilter) return;

  renderGlobalTaskModal(activeGlobalTaskFilter);
}

function renderGlobalTaskModal(filter) {
  const isCompleted = filter === "completed";
  const allTasks = projects.flatMap((project) =>
    getSortedTasks(project.tasks)
      .filter((task) => task.completed === isCompleted)
      .map((task) => ({ project, task }))
  );

  globalTaskModalTitle.textContent = isCompleted ? "全部已完成事项" : "全部未完成事项";
  globalTaskModalSubtitle.textContent = isCompleted
    ? "点击前面的勾选框，可以撤回为未完成。"
    : "这里可以直接编辑、注释、置顶、删除或勾选完成。";
  globalTaskList.replaceChildren();

  if (allTasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "completed-empty";
    empty.textContent = isCompleted ? "暂无已完成事项。" : "暂无未完成事项。";
    globalTaskList.appendChild(empty);
    return;
  }

  projects.forEach((project) => {
    const tasks = getSortedTasks(project.tasks).filter(
      (task) => task.completed === isCompleted
    );
    if (tasks.length === 0) return;

    const group = document.createElement("section");
    group.className = "global-task-group";

    const title = document.createElement("h3");
    title.textContent = project.name;
    group.appendChild(title);

    if (isCompleted) {
      tasks.forEach((task) => {
        group.appendChild(createCompletedTaskNode(project.id, task));
      });
    } else {
      const list = document.createElement("ul");
      list.className = "task-list";
      tasks.forEach((task) => {
        list.appendChild(createTaskNode(project.id, task));
      });
      group.appendChild(list);
    }

    globalTaskList.appendChild(group);
  });
}

function createCompletedTaskNode(projectId, task) {
  const item = document.createElement("article");
  item.className = "completed-task-item";
  item.innerHTML = `
    <label class="completed-task-check">
      <input type="checkbox" checked />
      <span>
        <span class="completed-task-title"></span>
        <span class="completed-task-meta"></span>
        <span class="completed-task-note"></span>
      </span>
    </label>
  `;
  item.querySelector(".completed-task-title").textContent = task.title;
  item.querySelector(".completed-task-meta").textContent = `添加时间：${formatDateTime(
    task.createdAt
  )}`;
  item.querySelector(".completed-task-note").textContent = task.note
    ? `注释：${task.note}`
    : "注释：暂无";
  item.querySelector("input").addEventListener("change", () => {
    restoreTaskToIncomplete(projectId, task.id);
  });

  return item;
}

function restoreTaskToIncomplete(projectId, taskId) {
  const project = projects.find((item) => item.id === projectId);
  const task = project?.tasks.find((item) => item.id === taskId);

  if (!task) return;

  task.completed = false;
  task.pinned = false;
  saveAndRender();
}

function renderSearchResults() {
  const query = searchInput.value.trim().toLowerCase();
  searchResults.replaceChildren();
  searchResults.hidden = !query;

  if (!query) return;

  const matches = getSearchMatches(query);

  if (matches.length === 0) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "没有找到匹配内容。";
    searchResults.appendChild(empty);
    return;
  }

  matches.forEach((match) => {
    const button = document.createElement("button");
    button.className = "search-result-item";
    button.type = "button";
    button.innerHTML = `
      <span class="search-result-title"></span>
      <span class="search-result-meta"></span>
    `;
    button.querySelector(".search-result-title").textContent = match.title;
    button.querySelector(".search-result-meta").textContent = match.meta;
    button.addEventListener("click", () => {
      goToSearchResult(match);
    });
    searchResults.appendChild(button);
  });
}

function getSearchMatches(query) {
  return projects
    .flatMap((project) => {
      const projectMatch = project.name.toLowerCase().includes(query)
        ? [
            {
              type: "project",
              projectId: project.id,
              title: project.name,
              meta: "项目",
            },
          ]
        : [];
      const taskMatches = project.tasks
        .filter((task) =>
          [project.name, task.title, task.note || ""]
            .join(" ")
            .toLowerCase()
            .includes(query)
        )
        .map((task) => ({
          type: "task",
          projectId: project.id,
          taskId: task.id,
          completed: task.completed,
          title: task.title,
          meta: `${project.name} · ${task.completed ? "已完成" : "未完成"}${
            task.note ? " · 有注释" : ""
          }`,
        }));

      return [...projectMatch, ...taskMatches];
    })
    .slice(0, 12);
}

function goToSearchResult(match) {
  const project = projects.find((item) => item.id === match.projectId);
  if (!project) return;

  if (activeView === "task" && match.type === "task") {
    const task = project.tasks.find((item) => item.id === match.taskId);
    if (!task) return;

    if (activeTaskFilter === "incomplete" && task.completed) {
      activeTaskFilter = "completed";
    }

    if (activeTaskFilter === "completed" && !task.completed) {
      activeTaskFilter = "incomplete";
    }

    saveAndRender();
    searchResults.hidden = true;

    requestAnimationFrame(() => {
      const taskNode = taskDimensionView.querySelector(
        `[data-task-id="${match.taskId}"]`
      );
      taskNode?.scrollIntoView({ behavior: "smooth", block: "center" });
      taskNode?.classList.add("search-highlight");
      window.setTimeout(() => {
        taskNode?.classList.remove("search-highlight");
      }, 1800);
    });
    return;
  }

  activeView = "project";
  project.collapsed = false;
  saveAndRender();
  searchResults.hidden = true;

  requestAnimationFrame(() => {
    const projectNode = document.querySelector(`[data-project-id="${match.projectId}"]`);

    if (match.type === "task" && match.completed) {
      openCompletedModal(match.projectId);
      return;
    }

    const taskNode =
      match.type === "task"
        ? document.querySelector(`[data-task-id="${match.taskId}"]`)
        : null;
    const target = taskNode || projectNode;

    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    target?.classList.add("search-highlight");
    window.setTimeout(() => {
      target?.classList.remove("search-highlight");
    }, 1800);
  });
}

function getSortedTasks(tasks) {
  return [...tasks].sort((first, second) => {
    if (first.pinned !== second.pinned) {
      return first.pinned ? -1 : 1;
    }

    return new Date(first.createdAt) - new Date(second.createdAt);
  });
}

function getTotals(projectItems) {
  return projectItems.reduce(
    (totals, project) => {
      totals.total += project.tasks.length;
      totals.completed += project.tasks.filter((task) => task.completed).length;
      return totals;
    },
    { completed: 0, total: 0 }
  );
}

function normalizeProjects(projectItems) {
  return projectItems.map((project) => ({
    ...project,
    collapsed: Boolean(project.collapsed),
    tasks: (project.tasks || []).map((task) => ({
      ...task,
      completed: Boolean(task.completed),
      pinned: Boolean(task.pinned),
      note: task.note || "",
      createdAt: task.createdAt || new Date().toISOString(),
    })),
  }));
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function exportToExcel() {
  const rows = [
    ["项目名称", "任务名称", "状态", "是否置顶", "添加时间", "注释"],
    ...projects.flatMap((project) => {
      if (project.tasks.length === 0) {
        return [[project.name, "", "暂无任务", "", "", ""]];
      }

      return getSortedTasks(project.tasks).map((task) => [
        project.name,
        task.title,
        task.completed ? "已完成" : "未完成",
        task.pinned && !task.completed ? "是" : "否",
        formatDateTime(task.createdAt),
        task.note || "",
      ]);
    }),
  ];
  const table = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table>${table}</table></body></html>`;
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);

  link.href = URL.createObjectURL(blob);
  link.download = `每日项目工作清单-${today}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
