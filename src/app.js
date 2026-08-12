const storageKey = "branches:functional-v12";

const defaultGoalIcon = "sprout";
const goalIcons = {
  sprout: "🌱",
  leaf: "🍃",
  tree: "🌳",
  target: "◎",
  star: "✦"
};

const taskColorValues = {
  fern: "#4f8a5f",
  sun: "#efb454",
  clay: "#d78a48",
  sky: "#6d9fb3",
  berry: "#a9556b"
};

const starterState = {
  theme: "light",
  currentPage: "goals",
  activeView: "branches",
  defaultView: "branches",
  activeTreeId: "tree-main",
  selectedId: "branch-root",
  selectedType: "branch",
  focusBranchId: "branch-root",
  selectedCollectionId: "",
  movingTaskId: "",
  editingTreeId: "",
  trees: [
    {
      id: "tree-main",
      root: {
        id: "branch-root",
        title: "",
        why: "",
        icon: defaultGoalIcon,
        finishedAt: "",
        deadline: "",
        order: "",
        children: []
      },
      collection: []
    }
  ]
};

let state = loadState();
let lastFocusBranchId = state.focusBranchId;
let pendingCenterTarget = null;
let undoSnapshot = null;

const elements = {
  root: document.documentElement,
  homeButton: document.querySelector("#homeButton"),
  dailyTrackerButton: document.querySelector("#dailyTrackerButton"),
  undoButton: document.querySelector("#undoButton"),
  goalsPage: document.querySelector("#goalsPage"),
  workspacePage: document.querySelector("#workspacePage"),
  treeForm: document.querySelector("#treeForm"),
  goalFormEyebrow: document.querySelector("#goalFormEyebrow"),
  goalFormTitle: document.querySelector("#goalFormTitle"),
  treeSubmitButton: document.querySelector("#treeSubmitButton"),
  cancelGoalEditButton: document.querySelector("#cancelGoalEditButton"),
  treeTitle: document.querySelector("#treeTitle"),
  treeWhy: document.querySelector("#treeWhy"),
  treeDeadline: document.querySelector("#treeDeadline"),
  treeList: document.querySelector("#treeList"),
  treeTemplate: document.querySelector("#treeTemplate"),
  goalCount: document.querySelector("#goalCount"),
  goalsTutorialButton: document.querySelector("#goalsTutorialButton"),
  activeTreeTitle: document.querySelector("#activeTreeTitle"),
  branchCount: document.querySelector("#branchCount"),
  branchCountLabel: document.querySelector("#branchCountLabel"),
  viewTutorialButton: document.querySelector("#viewTutorialButton"),
  selectedPath: document.querySelector("#selectedPath"),
  setDefaultViewButton: document.querySelector("#setDefaultViewButton"),
  branchLinks: document.querySelector("#branchLinks"),
  branchNodes: document.querySelector("#branchNodes"),
  viewTabs: Array.from(document.querySelectorAll(".view-tab")),
  viewContents: Array.from(document.querySelectorAll("[data-view-content]")),
  simpleMindmapView: document.querySelector("#simpleMindmapView"),
  organizedView: document.querySelector("#organizedView"),
  dailyTrackerView: document.querySelector("#dailyTrackerView"),
  selectedEyebrow: document.querySelector("#selectedEyebrow"),
  selectedTitle: document.querySelector("#selectedTitle"),
  inspector: document.querySelector("#inspector"),
  branchForm: document.querySelector("#branchForm"),
  titleLabel: document.querySelector("#titleLabel"),
  branchTitle: document.querySelector("#branchTitle"),
  taskNumber: document.querySelector("#taskNumber"),
  branchWhy: document.querySelector("#branchWhy"),
  deadlineField: document.querySelector("#deadlineField"),
  taskDeadline: document.querySelector("#taskDeadline"),
  taskColorField: document.querySelector("#taskColorField"),
  setDoneButton: document.querySelector("#setDoneButton"),
  moveTaskButton: document.querySelector("#moveTaskButton"),
  moveTaskPanel: document.querySelector("#moveTaskPanel"),
  cancelMoveButton: document.querySelector("#cancelMoveButton"),
  moveTaskSearch: document.querySelector("#moveTaskSearch"),
  moveTaskTargets: document.querySelector("#moveTaskTargets"),
  deleteSelectedButton: document.querySelector("#deleteSelectedButton"),
  collectionCount: document.querySelector("#collectionCount"),
  collectionList: document.querySelector("#collectionList"),
  collectionDetail: document.querySelector("#collectionDetail"),
  collectionDetailTitle: document.querySelector("#collectionDetailTitle"),
  collectionDetailGoal: document.querySelector("#collectionDetailGoal"),
  collectionDetailInitial: document.querySelector("#collectionDetailInitial"),
  collectionDetailNotes: document.querySelector("#collectionDetailNotes"),
  collectionDetailDate: document.querySelector("#collectionDetailDate"),
  restoreCollectionButton: document.querySelector("#restoreCollectionButton"),
  confirmOverlay: document.querySelector("#confirmOverlay"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmCancelButton: document.querySelector("#confirmCancelButton"),
  confirmAcceptButton: document.querySelector("#confirmAcceptButton"),
  tutorialOverlay: document.querySelector("#tutorialOverlay"),
  tutorialEyebrow: document.querySelector("#tutorialEyebrow"),
  tutorialTitle: document.querySelector("#tutorialTitle"),
  tutorialIntro: document.querySelector("#tutorialIntro"),
  tutorialSteps: document.querySelector("#tutorialSteps"),
  tutorialCloseButton: document.querySelector("#tutorialCloseButton")
};

bindEvents();
render();

function bindEvents() {
  elements.homeButton.addEventListener("click", () => {
    state.currentPage = "goals";
    state.movingTaskId = "";
    saveState();
    render();
  });

  elements.goalsTutorialButton.addEventListener("click", () => {
    openTutorial(getTutorialContent("goals"));
  });

  elements.viewTutorialButton.addEventListener("click", () => {
    openTutorial(getTutorialContent(state.activeView || "branches"));
  });

  elements.viewTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.activeView = tab.dataset.view;
      saveState();
      render();
    });
  });

  elements.setDefaultViewButton.addEventListener("click", () => {
    if (!isPrimaryView(state.activeView)) return;
    state.defaultView = state.activeView;
    saveState();
    render();
  });

  elements.dailyTrackerButton.addEventListener("click", () => {
    if (state.currentPage === "goals") {
      state.currentPage = "workspace";
      state.activeView = "daily";
    } else {
      state.activeView = state.activeView === "daily" ? "branches" : "daily";
    }
    saveState();
    render();
  });

  elements.undoButton.addEventListener("click", () => {
    restoreUndo();
  });

  elements.cancelGoalEditButton.addEventListener("click", () => {
    clearGoalEditForm();
  });

  elements.treeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.treeTitle.value.trim();
    if (!title) return;
    const formData = new FormData(elements.treeForm);
    const icon = formData.get("treeIcon") || defaultGoalIcon;

    if (state.editingTreeId) {
      const tree = state.trees.find((candidate) => candidate.id === state.editingTreeId);
      if (!tree) {
        clearGoalEditForm();
        return;
      }
      captureUndo();
      tree.root.title = title;
      tree.root.why = elements.treeWhy.value.trim();
      tree.root.deadline = elements.treeDeadline.value;
      tree.root.icon = icon;
      if (!tree.root.initialTitle && title) tree.root.initialTitle = title;
      clearGoalEditForm({ renderAfter: false });
      saveState();
      render();
      return;
    }

    const tree = {
      id: createId("tree"),
      root: {
        id: createId("branch"),
        title,
        why: elements.treeWhy.value.trim(),
        icon,
        finishedAt: "",
        deadline: elements.treeDeadline.value,
        order: "",
        children: []
      },
      collection: []
    };

    captureUndo();
    state.trees.unshift(tree);
    state.activeTreeId = tree.id;
    state.selectedId = tree.root.id;
    state.selectedType = "branch";
    state.focusBranchId = tree.root.id;
    state.selectedCollectionId = "";
    state.currentPage = "workspace";
    elements.treeForm.reset();
    saveState();
    render();
  });

  elements.branchForm.addEventListener("input", (event) => {
    if (event.target.closest("#moveTaskPanel")) return;
    const selected = getSelected();
    if (!selected) return;

    selected.item.title = elements.branchTitle.value.trim();
    selected.item.order = elements.taskNumber.value.trim();
    selected.item.why = elements.branchWhy.value.trim();
    selected.item.deadline = elements.taskDeadline.value;
    if (selected.item.id !== getActiveTree()?.root.id) {
      selected.item.color = getSelectedTaskColorInput();
    }
    if (!selected.item.initialTitle && selected.item.title) {
      selected.item.initialTitle = selected.item.title;
    }

    saveState();
    render({ keepFocus: true });
  });

  elements.setDoneButton.addEventListener("click", async () => {
    const selected = getSelected();
    if (!selected) return;
    if (selected.item.finishedAt) {
      await markSelectedNotDone();
      return;
    }
    await markSelectedDone();
  });

  elements.moveTaskButton.addEventListener("click", () => {
    const selected = getSelected();
    if (!selected) return;
    state.movingTaskId = state.movingTaskId === selected.item.id ? "" : selected.item.id;
    elements.moveTaskSearch.value = "";
    saveState();
    render();
  });

  elements.cancelMoveButton.addEventListener("click", () => {
    state.movingTaskId = "";
    elements.moveTaskSearch.value = "";
    saveState();
    render();
  });

  elements.moveTaskSearch.addEventListener("input", () => {
    renderMoveTargets();
  });

  elements.deleteSelectedButton.addEventListener("click", async () => {
    await deleteSelected();
  });

  elements.restoreCollectionButton.addEventListener("click", async () => {
    await restoreSelectedCollectionTask();
  });

  elements.tutorialCloseButton.addEventListener("click", closeTutorial);
  elements.tutorialOverlay.addEventListener("click", (event) => {
    if (event.target === elements.tutorialOverlay) closeTutorial();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.tutorialOverlay.hidden) closeTutorial();
  });
}

function render(options = {}) {
  elements.root.dataset.theme = state.theme;
  ensureSelection();
  if (syncAutoCompletedTasks()) saveState();
  renderPage();
  renderViewTabs();
  renderGoalForm();
  renderTreeList();
  renderMetrics();
  renderMindmap();
  renderSimpleMindmap();
  renderOrganized();
  renderDailyTracker();
  renderInspector(options);
  renderMoveTargets();
  renderCollection();
  renderUndoButton();
}

function renderViewTabs() {
  const activeView = state.activeView || "branches";
  elements.viewTabs.forEach((tab) => {
    const isActive = tab.dataset.view === activeView;
    const isDefault = tab.dataset.view === state.defaultView;
    tab.classList.toggle("active", isActive);
    tab.classList.toggle("default", isDefault);
    tab.setAttribute("aria-selected", String(isActive));
    tab.setAttribute("aria-label", `${tab.textContent}${isDefault ? ", default view" : ""}`);
  });
  const activePrimaryView = isPrimaryView(activeView);
  elements.setDefaultViewButton.hidden = !activePrimaryView;
  elements.setDefaultViewButton.disabled = !activePrimaryView || activeView === state.defaultView;
  elements.setDefaultViewButton.textContent = activeView === state.defaultView ? "Default view" : "Set as default";
  setDisabledHint(
    elements.setDefaultViewButton,
    activeView === state.defaultView ? "This is already your default view." : ""
  );
  const isDailyTrackerOpen = state.currentPage === "workspace" && activeView === "daily";
  elements.dailyTrackerButton.classList.toggle("active", isDailyTrackerOpen);
  elements.dailyTrackerButton.setAttribute("aria-pressed", String(isDailyTrackerOpen));
  elements.viewContents.forEach((content) => {
    content.classList.toggle("active", content.dataset.viewContent === activeView);
  });
}

function renderPage() {
  const page = state.currentPage === "workspace" ? "workspace" : "goals";
  elements.goalsPage.hidden = page !== "goals";
  elements.workspacePage.hidden = page !== "workspace";
  elements.homeButton.hidden = page === "goals";
  elements.dailyTrackerButton.hidden = false;
}

function openTutorial(content) {
  elements.tutorialEyebrow.textContent = content.eyebrow || "Quick tutorial";
  elements.tutorialTitle.textContent = content.title;
  elements.tutorialIntro.textContent = content.intro;
  elements.tutorialSteps.replaceChildren();
  content.steps.forEach((step) => {
    const item = document.createElement("li");
    item.textContent = step;
    elements.tutorialSteps.append(item);
  });
  elements.tutorialOverlay.hidden = false;
  elements.tutorialCloseButton.focus();
}

function closeTutorial() {
  elements.tutorialOverlay.hidden = true;
}

function getTutorialContent(view) {
  const tutorials = {
    goals: {
      title: "Main Goals",
      intro: "This is the home for your biggest goals before you enter the detailed workspace.",
      steps: [
        "Create a main goal with a name, deadline, and icon.",
        "Click a goal card to open its workspace.",
        "Use Edit main goal to update the goal later, or Remove to delete it with confirmation.",
        "Daily Tracker in the top bar opens deadline-focused end tasks for the current goal."
      ]
    },
    branches: {
      title: "Branches View",
      intro: "Use this when you want the most visual, tree-like version of your task structure.",
      steps: [
        "Click a task blob to select it and edit details on the right.",
        "Click a plus button around the branch to grow a smaller task.",
        "Use Back when zoomed into a smaller task to return to its parent.",
        "Set this view as default if you want every goal to open here first."
      ]
    },
    mindmap: {
      title: "Mindmap View",
      intro: "Use this when you want a cleaner map of how every task connects.",
      steps: [
        "Follow the connecting lines from the main goal to smaller tasks.",
        "Click any task card to select it and update the editor.",
        "Use the plus button on a card to add a smaller task directly under it.",
        "Task colors and completion states stay synced with the other views."
      ]
    },
    organized: {
      title: "Plan Board",
      intro: "Use this when you want a practical row-by-row planning view.",
      steps: [
        "The current task appears first, with its immediate smaller tasks below.",
        "Click a row to inspect that task and continue down the path.",
        "Use the breadcrumb to move back up to broader tasks.",
        "Use Set as default if this is your preferred planning layout."
      ]
    },
    daily: {
      title: "Daily Tracker",
      intro: "Use this to track end tasks that have deadlines.",
      steps: [
        "Only tasks with no smaller tasks and a due date appear here.",
        "Tasks are grouped by Overdue, Today, Tomorrow, This week, and Later.",
        "Click a task to see the full path from the main goal to that task.",
        "Change task deadlines or colors in the editor and the tracker updates automatically."
      ]
    }
  };

  return tutorials[view] || tutorials.branches;
}

function renderGoalForm() {
  const editingTree = state.editingTreeId
    ? state.trees.find((tree) => tree.id === state.editingTreeId)
    : null;
  elements.goalFormEyebrow.textContent = editingTree ? "Edit main goal" : "New main goal";
  elements.goalFormTitle.textContent = editingTree ? "Update goal" : "Plant a goal";
  elements.treeSubmitButton.textContent = editingTree ? "Save main goal" : "Create new goal";
  elements.cancelGoalEditButton.hidden = !editingTree;
}

function renderTreeList() {
  elements.treeList.replaceChildren();
  elements.goalCount.textContent = String(state.trees.length);

  state.trees.forEach((tree, index) => {
    const item = elements.treeTemplate.content.firstElementChild.cloneNode(true);
    const branchTotal = countBranches(tree.root);
    const openTotal = countOpenTasks(tree.root);
    const dashboard = getGoalDashboardStats(tree.root);

    item.classList.toggle("active", tree.id === state.activeTreeId);
    item.classList.toggle("editing", tree.id === state.editingTreeId);
    item.dataset.icon = tree.root.icon || defaultGoalIcon;
    item.querySelector(".goal-icon").textContent = getGoalIcon(tree);
    item.querySelector(".tree-name").textContent = displayTreeTitle(tree, index);
    item.querySelector(".tree-meta").textContent = `${branchTotal} task${branchTotal === 1 ? "" : "s"}, ${openTotal} open`;
    item.querySelector(".tree-deadline").textContent = tree.root.deadline ? `Due ${formatDate(tree.root.deadline)}` : "No deadline set";
    item.querySelector(".goal-progress-label").textContent = `${dashboard.percent}% complete`;
    item.querySelector(".goal-progress-fraction").textContent = `${dashboard.done}/${dashboard.total}`;
    item.querySelector(".goal-progress-bar").style.setProperty("--goal-progress", `${dashboard.percent}%`);
    item.querySelector(".goal-overdue").textContent = `${dashboard.overdue} overdue`;
    item.querySelector(".goal-overdue").classList.toggle("has-overdue", dashboard.overdue > 0);
    item.querySelector(".goal-next-deadline").textContent = dashboard.nextDeadline
      ? `Next ${formatDate(dashboard.nextDeadline.deadline)}: ${dashboard.nextDeadline.title}`
      : "No upcoming deadlines";
    item.querySelector(".goal-open-button").addEventListener("click", () => {
      openGoal(tree.id);
    });
    item.querySelector(".goal-edit-button").addEventListener("click", () => {
      editGoal(tree.id);
    });
    item.querySelector(".goal-delete-button").addEventListener("click", async () => {
      await removeGoal(tree.id);
    });

    elements.treeList.append(item);
  });
}

function editGoal(treeId) {
  const tree = state.trees.find((candidate) => candidate.id === treeId);
  if (!tree) return;
  state.editingTreeId = tree.id;
  state.currentPage = "goals";
  elements.treeTitle.value = tree.root.title || "";
  elements.treeWhy.value = tree.root.why || "";
  elements.treeDeadline.value = tree.root.deadline || "";
  setGoalIconInput(tree.root.icon || defaultGoalIcon);
  saveState();
  render();
  elements.treeTitle.focus();
}

function clearGoalEditForm(options = {}) {
  state.editingTreeId = "";
  elements.treeForm.reset();
  setGoalIconInput(defaultGoalIcon);
  if (options.renderAfter !== false) {
    saveState();
    render();
  }
}

function setGoalIconInput(icon) {
  const input = elements.treeForm.querySelector(`input[name="treeIcon"][value="${icon}"]`)
    || elements.treeForm.querySelector(`input[name="treeIcon"][value="${defaultGoalIcon}"]`);
  if (input) input.checked = true;
}

function getSelectedTaskColorInput() {
  const input = elements.taskColorField.querySelector("input[name='taskColor']:checked");
  return taskColorValues[input?.value] ? input.value : "";
}

function setTaskColorInput(color) {
  const normalizedColor = taskColorValues[color] ? color : "";
  const input = elements.taskColorField.querySelector(`input[name="taskColor"][value="${normalizedColor}"]`)
    || elements.taskColorField.querySelector("input[name='taskColor'][value='']");
  if (input) input.checked = true;
}

function renderMetrics() {
  const tree = getActiveTree();
  elements.branchCountLabel.textContent = "tasks";

  if (!tree) {
    elements.activeTreeTitle.textContent = "No goal selected";
    elements.branchCount.textContent = "0";
    return;
  }

  elements.activeTreeTitle.textContent = displayTreeTitle(tree, state.trees.findIndex((candidate) => candidate.id === tree.id));
  elements.branchCount.textContent = String(countBranches(tree.root));
}

function renderSelectedTracker(pathText) {
  const selected = getSelected();
  elements.selectedPath.replaceChildren();

  if (!selected) {
    elements.selectedPath.textContent = pathText || "Select or create a task.";
    return;
  }

  const progress = getImmediateProgress(selected.item);
  const percent = selected.item.finishedAt
    ? 100
    : progress.total
      ? Math.round(progress.done / progress.total * 100)
      : 0;
  const label = selected.item.finishedAt
    ? "Done"
    : progress.total
      ? `${progress.done}/${progress.total} smaller tasks done`
      : "No smaller tasks yet";

  const path = document.createElement("span");
  path.className = "tracker-path";
  path.textContent = pathText || displayBranchTitle(getActiveTree()?.root, selected.item);

  const progressWrap = document.createElement("span");
  progressWrap.className = "tracker-progress";

  const progressTextElement = document.createElement("span");
  progressTextElement.className = "tracker-progress-text";
  progressTextElement.textContent = label;

  const bar = document.createElement("span");
  bar.className = "tracker-bar";
  bar.style.setProperty("--tracker-progress", `${percent}%`);

  progressWrap.append(progressTextElement, bar);
  elements.selectedPath.append(path, progressWrap);
}

function renderMindmap() {
  const tree = getActiveTree();
  elements.branchLinks.replaceChildren();
  elements.branchNodes.replaceChildren();

  if (!tree) {
    elements.branchNodes.append(createEmptyState("Create a main goal to begin."));
    elements.selectedPath.textContent = "Create a main goal to begin.";
    return;
  }

  const selectedPath = getSelectionPath(tree);
  const focusBranch = findBranch(tree.root, state.focusBranchId) || tree.root;
  const generalPath = getGoalPath(tree.root, focusBranch.id).join(" > ");
  const generalSelection = getGeneralSelectionPath(tree);
  if ((state.activeView || "branches") === "branches") {
    renderSelectedTracker(selectedPath || getBranchPath(tree.root, focusBranch.id).join(" > "));
  } else {
    renderSelectedTracker(generalSelection || generalPath);
  }

  const canvas = elements.branchLinks.closest(".mindmap-canvas");
  const viewportWidth = canvas ? canvas.clientWidth : 760;
  const layout = buildMindmapLayout(focusBranch, tree.root, viewportWidth);
  const focusChanged = canvas && canvas.dataset.focusBranchId !== focusBranch.id;
  if (canvas && lastFocusBranchId !== focusBranch.id) {
    canvas.classList.remove("zooming");
    void canvas.offsetWidth;
    canvas.classList.add("zooming");
    lastFocusBranchId = focusBranch.id;
  }

  elements.branchLinks.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  elements.branchLinks.setAttribute("width", String(layout.width));
  elements.branchLinks.setAttribute("height", String(layout.height));
  elements.branchLinks.style.width = `${layout.width}px`;
  elements.branchLinks.style.height = `${layout.height}px`;
  elements.branchNodes.style.width = `${layout.width}px`;
  elements.branchNodes.style.height = `${layout.height}px`;
  elements.branchNodes.style.transform = "";
  elements.branchNodes.style.transformOrigin = "";

  elements.branchLinks.append(createSvgTextureDefs());
  elements.branchLinks.append(createFocusTrunk(layout));

  layout.links.forEach((link) => {
    elements.branchLinks.append(createMindmapLink(link));
  });

  layout.items.forEach((item) => {
    elements.branchNodes.append(createMindmapItem(item));
  });

  if (canvas) {
    const centerTarget = pendingCenterTarget || (focusChanged ? { id: focusBranch.id, type: "branch" } : null);
    if (centerTarget) {
      centerCanvasOnTarget(canvas, layout, centerTarget);
      pendingCenterTarget = null;
    }
    canvas.dataset.focusBranchId = focusBranch.id;
  }
}

function buildMindmapLayout(focusBranch, root, viewportWidth = 760) {
  const items = [];
  const links = [];
  const childTotal = (focusBranch.children || []).length;
  const childGenerationSpacing = 780;
  const maxChildSlot = Math.max(...(focusBranch.children || []).map((child, index) => Number.isInteger(child.slot) ? child.slot : index), childTotal);
  const childGenerations = Math.floor((maxChildSlot + 6) / 6) + 1;
  const width = Math.max(
    Math.floor(viewportWidth * 1.9),
    1180,
    1220 + (childGenerations - 1) * childGenerationSpacing
  );
  const height = 620;
  const trunkY = 320;
  const focusX = Math.max(260, Math.min(360, Math.floor(viewportWidth * 0.44)));
  const focus = {
    type: "branch",
    role: "focus",
    item: focusBranch,
    depth: getBranchDepth(root, focusBranch.id),
    x: focusX,
    y: trunkY - 48,
    displayTitle: displayBranchTitle(root, focusBranch)
  };
  const children = focusBranch.children || [];
  const childSlots = [
    { dx: 390, dy: -104, endDx: 630, endDy: -236 },
    { dx: 390, dy: 104, endDx: 630, endDy: 236 },
    { dx: 620, dy: -104, endDx: 860, endDy: -236 },
    { dx: 620, dy: 104, endDx: 860, endDy: 236 },
    { dx: 850, dy: -104, endDx: 1090, endDy: -236 },
    { dx: 850, dy: 104, endDx: 1090, endDy: 236 }
  ];

  items.push(focus);

  children.forEach((child, index) => {
    const slotIndex = Number.isInteger(child.slot) ? child.slot : index;
    const slot = getSlot(childSlots, slotIndex);
    const generation = Math.floor(slotIndex / childSlots.length);
    const startX = focusX + slot.dx + generation * childGenerationSpacing;
    const startY = trunkY;
    const endX = focusX + slot.endDx + generation * childGenerationSpacing;
    const endY = trunkY + slot.endDy;
    const label = getBranchLabelPosition(startX, startY, endX, endY);
    const item = {
      type: "branch",
      role: "child",
      item: child,
      depth: focus.depth + 1,
      x: label.x,
      y: label.y,
      angle: label.angle,
      order: child.order,
      displayTitle: displaySiblingTitle(children, child, index, "Name this task")
    };
    items.push(item);
    links.push({ kind: "branch", index, startX, startY, endX, endY });
  });

  if (!focusBranch.finishedAt) {
    getNextOpenSlots(children, childSlots.length).forEach((slotIndex) => {
      const slot = getSlot(childSlots, slotIndex);
      const generation = Math.floor(slotIndex / childSlots.length);
      items.push(createGrowthSpot("branch", focusBranch, slotIndex, focusX + slot.dx + generation * childGenerationSpacing, trunkY + slot.dy));
    });
  }

  return { items, links, width, height, focusBranch, trunkY, focusX };
}

function getSlot(slots, index) {
  return slots[index % slots.length];
}

function getNextOpenSlots(items, slotCount) {
  const usedSlots = new Set(items.map((item, index) => Number.isInteger(item.slot) ? item.slot : index));
  const generation = usedSlots.size ? Math.floor(Math.max(...usedSlots) / slotCount) : 0;
  const start = generation * slotCount;
  const currentGenerationSlots = Array.from({ length: slotCount }, (_, baseIndex) => start + baseIndex);
  const openCurrentSlots = currentGenerationSlots.filter((slotIndex) => !usedSlots.has(slotIndex));
  if (openCurrentSlots.length) return openCurrentSlots;
  return Array.from({ length: slotCount }, (_, baseIndex) => start + slotCount + baseIndex);
}

function createGrowthSpot(kind, parent, index, x, y) {
  return {
    type: "growth",
    role: `growth growth-${kind}`,
    kind,
    parent,
    index,
    x: x - 29,
    y: y - 29
  };
}

function createMindmapLink(link) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const shadow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const curve = createBranchCurve(link.startX, link.startY, link.endX, link.endY);
  const highlight = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const grain = document.createElementNS("http://www.w3.org/2000/svg", "path");

  shadow.setAttribute("class", "branch-shadow");
  shadow.setAttribute("d", curve);
  path.setAttribute("class", "mindmap-link branch-link");
  path.setAttribute("d", curve);
  highlight.setAttribute("class", "branch-highlight");
  highlight.setAttribute("d", curve);
  grain.setAttribute("class", "bark-grain");
  grain.setAttribute("d", curve);
  group.append(shadow, path, highlight, grain);
  return group;
}

function createFocusTrunk(layout) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const shadow = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const trunk = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const highlight = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const grain = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const trunkEnd = layout.width - 90;
  const d = createTrunkCurve(84, layout.trunkY, trunkEnd);
  shadow.setAttribute("class", "trunk-shadow");
  shadow.setAttribute("d", d);
  trunk.setAttribute("class", "focus-trunk");
  trunk.setAttribute("d", d);
  highlight.setAttribute("class", "trunk-highlight");
  highlight.setAttribute("d", d);
  grain.setAttribute("class", "trunk-grain");
  grain.setAttribute("d", d);
  group.append(shadow, trunk, highlight, grain);

  return group;
}

function createSvgTextureDefs() {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <pattern id="barkTexturePattern" patternUnits="userSpaceOnUse" width="420" height="210">
      <rect width="420" height="210" fill="#75440f"/>
      <image href="assets/bark-texture.png" width="420" height="210" preserveAspectRatio="xMidYMid slice" opacity="0.72"/>
    </pattern>
    <pattern id="branchTexturePattern" patternUnits="userSpaceOnUse" width="300" height="170">
      <rect width="300" height="170" fill="#7d4a12"/>
      <image href="assets/bark-texture.png" width="300" height="170" preserveAspectRatio="xMidYMid slice" opacity="0.78"/>
    </pattern>
    <linearGradient id="barkGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b1722a"/>
      <stop offset="28%" stop-color="#7f4a13"/>
      <stop offset="58%" stop-color="#965a19"/>
      <stop offset="100%" stop-color="#573109"/>
    </linearGradient>
    <linearGradient id="branchBarkGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#b87722"/>
      <stop offset="42%" stop-color="#85500e"/>
      <stop offset="100%" stop-color="#5f3507"/>
    </linearGradient>
  `;
  return defs;
}

function createTrunkCurve(startX, y, endX) {
  const first = startX + (endX - startX) * 0.34;
  const second = startX + (endX - startX) * 0.68;
  return `M ${startX} ${y} C ${first - 220} ${y - 8}, ${first - 80} ${y + 10}, ${first} ${y} C ${second - 130} ${y - 12}, ${second - 10} ${y + 8}, ${second} ${y} C ${endX - 180} ${y - 6}, ${endX - 70} ${y + 4}, ${endX} ${y}`;
}

function createBranchCurve(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const c1x = startX + dx * 0.24;
  const c1y = startY + dy * 0.1;
  const c2x = startX + dx * 0.72;
  const c2y = startY + dy * 0.9;
  return `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;
}

function getBranchLabelPosition(startX, startY, endX, endY) {
  const x = startX + (endX - startX) * 0.48 - 86;
  const y = startY + (endY - startY) * 0.48 - 38;
  const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
  return { x, y, angle };
}

function createMindmapItem(mapItem) {
  const wrapper = document.createElement("div");
  wrapper.className = `mindmap-node-wrap ${mapItem.role || ""}`;
  wrapper.style.left = `${mapItem.x}px`;
  wrapper.style.top = `${mapItem.y}px`;
  wrapper.dataset.itemId = mapItem.item?.id || `${mapItem.kind}-${mapItem.index}`;
  wrapper.dataset.itemType = mapItem.type;
  if (mapItem.angle) {
    wrapper.style.setProperty("--branch-angle", `${mapItem.angle}deg`);
  }

  if (mapItem.type === "growth") {
    const growButton = document.createElement("button");
    growButton.type = "button";
    growButton.className = "growth-button";
    growButton.textContent = "+";
    growButton.title = "Add smaller task here";
    growButton.setAttribute("aria-label", growButton.title);
    growButton.addEventListener("click", () => {
      growChild(mapItem.parent.id, mapItem.index);
    });
    wrapper.append(growButton);
    return wrapper;
  }

  const card = document.createElement("button");
  card.type = "button";
  card.className = "mindmap-node";
  card.classList.toggle("selected", mapItem.item.id === state.selectedId && mapItem.type === state.selectedType);
  card.classList.toggle("unnamed", !mapItem.item.title.trim());
  card.classList.toggle("focus-node", mapItem.role === "focus");
  card.classList.toggle("completed", Boolean(mapItem.item.finishedAt));
  applyTaskColor(card, mapItem.item);
  card.innerHTML = `
    <span class="task-order" hidden></span>
    <strong class="branch-title"></strong>
    <span class="branch-meta"></span>
    <span class="progress-chip"></span>
  `;
  const order = card.querySelector(".task-order");
  order.hidden = !mapItem.order;
  order.textContent = String(mapItem.order || "");
  card.querySelector(".branch-title").textContent = mapItem.displayTitle || displayTitle(mapItem.item, mapItem.depth === 0 ? "Main goal" : "Name this task");
  card.querySelector(".branch-meta").textContent = branchMeta(mapItem.item, mapItem.depth);
  const progress = card.querySelector(".progress-chip");
  setProgressChip(progress, "branch", mapItem.item);
  card.addEventListener("click", () => selectItem(mapItem.type, mapItem.item.id));

  wrapper.append(card);

  if (mapItem.type === "branch" && mapItem.role === "focus" && mapItem.item.id !== getActiveTree()?.root.id) {
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "zoom-back-button";
    backButton.textContent = "Back";
    backButton.addEventListener("click", () => zoomToParent(mapItem.item.id));
    wrapper.append(backButton);
  }

  return wrapper;
}

function centerCanvasOnTarget(canvas, layout, target) {
  const visualScale = 0.84;
  const item = layout.items.find((candidate) => candidate.item?.id === target.id && candidate.type === target.type);
  if (!item) {
    canvas.scrollLeft = Math.max(0, layout.focusX * visualScale - 180);
    return;
  }
  const itemWidth = item.role === "focus" ? 254 : 170;
  const targetCenter = (item.x + itemWidth / 2) * visualScale;
  canvas.scrollLeft = Math.max(0, targetCenter - canvas.clientWidth / 2);
}

function renderInspector(options = {}) {
  const selected = getSelected();
  elements.branchForm.hidden = !selected;
  elements.inspector.classList.toggle("branch-editor", selected?.type === "branch");
  elements.inspector.classList.toggle("task-editor", Boolean(selected));
  const tree = getActiveTree();
  elements.selectedTitle.textContent = selected
    ? displayBranchTitle(tree?.root, selected.item)
    : "Nothing selected";

  if (!selected) return;

  if (!options.keepFocus) {
    elements.branchTitle.value = selected.item.title;
    elements.taskNumber.value = selected.item.order || "";
    elements.branchWhy.value = selected.item.why || "";
    elements.taskDeadline.value = selected.item.deadline || "";
    setTaskColorInput(selected.item.color || "");
  }

  const isRoot = tree?.root.id === selected.item.id;

  elements.selectedEyebrow.textContent = "Selected task";
  elements.titleLabel.textContent = isRoot ? "Main goal name" : "Task name";
  elements.branchWhy.placeholder = "Add notes for this task.";
  elements.deadlineField.hidden = false;
  elements.taskColorField.hidden = isRoot;
  const immediateProgress = getImmediateProgress(selected.item);
  elements.setDoneButton.hidden = false;
  elements.setDoneButton.disabled = false;
  elements.setDoneButton.textContent = selected.item.finishedAt ? "Mark as not done" : "Set as done";
  elements.deleteSelectedButton.hidden = false;
  elements.deleteSelectedButton.disabled = isRoot && !selected.item.finishedAt;
  elements.deleteSelectedButton.textContent = selected.item.finishedAt ? "Remove task" : "Delete task";
  elements.moveTaskButton.hidden = false;
  elements.moveTaskButton.disabled = isRoot;
  setDisabledHint(elements.moveTaskButton, isRoot ? "The main goal cannot be moved." : "");
  elements.moveTaskButton.textContent = state.movingTaskId === selected.item.id ? "Choosing destination..." : "Move task";
  elements.moveTaskPanel.hidden = state.movingTaskId !== selected.item.id;
  setDisabledHint(
    elements.deleteSelectedButton,
    isRoot && !selected.item.finishedAt ? "Complete the main goal before removing it." : ""
  );
}

function renderMoveTargets() {
  if (!elements.moveTaskTargets) return;
  elements.moveTaskTargets.replaceChildren();

  const tree = getActiveTree();
  const selected = getSelected();
  if (!tree || !selected || state.movingTaskId !== selected.item.id) return;

  const query = elements.moveTaskSearch.value.trim().toLowerCase();
  const currentParent = findParentBranch(tree.root, selected.item.id);
  const candidates = flattenTasks(tree.root)
    .filter((entry) => entry.task.id !== selected.item.id)
    .filter((entry) => !findBranch(selected.item, entry.task.id))
    .filter((entry) => {
      if (!query) return true;
      return `${entry.title} ${entry.path.join(" ")}`.toLowerCase().includes(query);
    });

  if (!candidates.length) {
    elements.moveTaskTargets.append(createEmptyState("No available destination matches."));
    return;
  }

  candidates.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "move-target";
    const isCurrentParent = currentParent?.id === entry.task.id;
    button.disabled = isCurrentParent;
    setDisabledHint(button, isCurrentParent ? "This task already lives here." : "");
    button.innerHTML = `
      <strong></strong>
      <span></span>
      <small></small>
    `;
    button.querySelector("strong").textContent = entry.title;
    button.querySelector("span").textContent = entry.path.join(" > ");
    button.querySelector("small").textContent = isCurrentParent
      ? "Already under this task"
      : `${entry.task.children.length} smaller task${entry.task.children.length === 1 ? "" : "s"}`;
    button.addEventListener("click", () => {
      moveSelectedTask(entry.task.id);
    });
    elements.moveTaskTargets.append(button);
  });
}

function renderCollection() {
  const tree = getActiveTree();
  const collection = tree?.collection || [];
  elements.collectionList.replaceChildren();
  elements.collectionCount.textContent = String(collection.length);

  if (!collection.length) {
    elements.collectionList.append(createEmptyState("Removed completed tasks will collect here."));
    elements.collectionDetail.hidden = true;
    return;
  }

  collection.forEach((record) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "collection-card";
    button.textContent = `${record.title || "Unnamed task"} - finished ${formatDate(record.finishedAt)}`;
    button.addEventListener("click", () => {
      state.selectedCollectionId = record.id;
      saveState();
      renderCollection();
    });
    elements.collectionList.append(button);
  });

  const selectedRecord = collection.find((record) => record.id === state.selectedCollectionId) || collection[0];
  elements.collectionDetail.hidden = false;
  elements.collectionDetailTitle.textContent = selectedRecord.title || "Unnamed task";
  elements.collectionDetailGoal.textContent = selectedRecord.mainGoal || "Main goal";
  elements.collectionDetailInitial.textContent = selectedRecord.initialTitle || "Unnamed task";
  elements.collectionDetailNotes.textContent = selectedRecord.why || "No notes";
  elements.collectionDetailDate.textContent = formatDate(selectedRecord.finishedAt);
  elements.restoreCollectionButton.disabled = !selectedRecord.task;
}

function renderSimpleMindmap() {
  const tree = getActiveTree();
  elements.simpleMindmapView.replaceChildren();

  if (!tree) {
    elements.simpleMindmapView.append(createEmptyState("Create a main goal to begin."));
    return;
  }

  const layout = buildGeneralMindmapLayout(tree.root);
  const board = document.createElement("div");
  board.className = "simple-map-board";
  board.style.width = `${layout.width}px`;
  board.style.height = `${layout.height}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "simple-map-links");
  svg.setAttribute("viewBox", `0 0 ${layout.width} ${layout.height}`);
  svg.setAttribute("aria-hidden", "true");
  layout.links.forEach((link) => svg.append(createGeneralMindmapLink(link)));
  board.append(svg);

  layout.nodes.forEach((entry) => {
    board.append(createSimpleMindmapCard(entry));
  });

  elements.simpleMindmapView.append(board);
}

function createSimpleMindmapCard(entry) {
  const { item, parentTitle, childCount } = entry;
  const card = document.createElement("button");
  card.type = "button";
  card.className = `simple-map-card ${entry.isRoot ? "main-goal-card" : "task-card"}`;
  applyTaskColor(card, item);
  card.style.left = `${entry.x}px`;
  card.style.top = `${entry.y}px`;
  card.classList.toggle("selected", state.selectedType === "branch" && state.selectedId === item.id);
  card.classList.toggle("completed", Boolean(item.finishedAt));
  card.innerHTML = `
    <span class="task-order" hidden></span>
    <span class="simple-card-type"></span>
    <strong></strong>
    <small></small>
    <span class="progress-chip"></span>
    <em></em>
  `;
  const order = card.querySelector(".task-order");
  order.hidden = !entry.order;
  order.textContent = String(entry.order || "");
  card.querySelector(".simple-card-type").textContent = entry.isRoot ? "Main goal" : "Task";
  card.querySelector("strong").textContent = entry.displayTitle || displayTitle(item, entry.isRoot ? "Main goal" : "Name this task");
  card.querySelector("small").textContent = goalMeta(item, entry.depth, childCount);
  setProgressChip(card.querySelector(".progress-chip"), "branch", item);
  card.querySelector("em").textContent = parentTitle ? `Branches from ${parentTitle}` : "Starting point";
  card.addEventListener("click", () => selectItem("branch", item.id));

  if (!item.finishedAt) {
    const action = document.createElement("span");
    action.className = "mini-action mindmap-plus";
    action.textContent = "+";
    action.title = "Add smaller task";
    action.setAttribute("aria-label", action.title);
    action.addEventListener("click", (event) => {
      event.stopPropagation();
      growChild(item.id);
    });
    card.append(action);
  }

  return card;
}

function createGeneralMindmapLink(link) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const startX = link.startX + 220;
  const startY = link.startY + 54;
  const endX = link.endX;
  const endY = link.endY + 54;
  const midX = startX + (endX - startX) * 0.52;
  path.setAttribute("d", `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`);
  path.setAttribute("class", "simple-map-link");
  return path;
}

function renderOrganized() {
  const tree = getActiveTree();
  elements.organizedView.replaceChildren();

  if (!tree) {
    elements.organizedView.append(createEmptyState("Create a main goal to begin."));
    return;
  }

  const selected = getSelected();
  const focusBranch = findBranch(tree.root, state.focusBranchId) || tree.root;
  const header = document.createElement("div");
  header.className = "organized-header";
  header.append(createOrganizedBreadcrumb(tree.root, focusBranch.id));
  header.append(createPlanLegend());

  const summary = document.createElement("p");
  summary.className = "organized-summary";
  const goalTotal = countBranches(focusBranch);
  const openTotal = countOpenTasks(focusBranch);
  summary.textContent = `${goalTotal} connected task${goalTotal === 1 ? "" : "s"}, ${openTotal} open under this path`;
  header.append(summary);

  const focusSection = createPlannerSection(
    "Current task",
    "This is the task you are currently inspecting. Its immediate smaller tasks are shown below."
  );
  focusSection.querySelector(".organized-grid").append(
    createOrganizedCard("branch", focusBranch, true, 0)
  );

  const goalSection = createPlannerSection("Smaller tasks", "These branch directly from the current task. Click one to make it the current task.");
  const goalGrid = goalSection.querySelector(".organized-grid");
  (focusBranch.children || []).forEach((child) => {
    goalGrid.append(createOrganizedCard("branch", child, false, child.order || ""));
  });
  if (!focusBranch.finishedAt) goalGrid.append(createOrganizedAddCard(focusBranch));
  if (!goalGrid.childElementCount) goalGrid.append(createEmptyState("No smaller tasks yet."));

  elements.organizedView.append(header, focusSection, goalSection);
}

function renderDailyTracker() {
  const tree = getActiveTree();
  elements.dailyTrackerView.replaceChildren();

  if (!tree) {
    elements.dailyTrackerView.append(createEmptyState("Create a main goal to begin."));
    return;
  }

  const terminalTasks = getTerminalDeadlineTasks(tree.root);
  const header = document.createElement("div");
  header.className = "daily-tracker-header";
  header.innerHTML = `
    <div>
      <p class="eyebrow">Daily tracker</p>
      <h3>End tasks with deadlines</h3>
    </div>
    <span class="count-pill">${terminalTasks.length}</span>
  `;

  const intro = document.createElement("p");
  intro.className = "daily-tracker-copy";
  intro.textContent = "Only tasks with no smaller tasks and a due date appear here.";

  const selectedEntry = terminalTasks.find((entry) => entry.task.id === state.selectedId);
  const detail = createDailyTrackerDetail(selectedEntry);
  const groups = groupTerminalTasksByDeadline(terminalTasks);
  const board = document.createElement("div");
  board.className = "daily-tracker-board";

  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = `daily-group daily-group-${group.tone}`;
    const title = document.createElement("h4");
    title.textContent = group.label;
    section.append(title);

    if (!group.items.length) {
      section.append(createEmptyState(group.emptyText));
    } else {
      const list = document.createElement("div");
      list.className = "daily-task-list";
      group.items.forEach((entry) => {
        list.append(createDailyTaskCard(entry));
      });
      section.append(list);
    }

    board.append(section);
  });

  elements.dailyTrackerView.append(header, intro, detail, board);
}

function createDailyTrackerDetail(entry) {
  const detail = document.createElement("article");
  detail.className = "daily-path-detail";

  if (!entry) {
    detail.innerHTML = `
      <span class="daily-detail-icon">↳</span>
      <div>
        <p class="eyebrow">Task path</p>
        <h3>Select an end task</h3>
        <p>Click a task below to see its full path from the main goal.</p>
      </div>
    `;
    return detail;
  }

  detail.innerHTML = `
    <span class="daily-detail-icon">↳</span>
    <div>
      <p class="eyebrow">Task path</p>
      <h3></h3>
      <p></p>
    </div>
  `;
  applyTaskColor(detail, entry.task);
  detail.querySelector("h3").textContent = entry.title;
  detail.querySelector("p:last-child").textContent = entry.path.join(" > ");
  return detail;
}

function createDailyTaskCard(entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "daily-task-card";
  button.classList.toggle("selected", state.selectedType === "branch" && state.selectedId === entry.task.id);
  button.classList.toggle("completed", Boolean(entry.task.finishedAt));
  applyTaskColor(button, entry.task);
  button.innerHTML = `
    <span class="daily-date"></span>
    <strong></strong>
    <small></small>
    <span class="daily-status"></span>
  `;
  button.querySelector(".daily-date").textContent = formatDate(entry.task.deadline);
  button.querySelector("strong").textContent = entry.title;
  button.querySelector("small").textContent = entry.path.slice(0, -1).join(" > ") || "Main goal";
  button.querySelector(".daily-status").textContent = entry.task.finishedAt ? "Done" : getDeadlineStatus(entry.task.deadline);
  button.addEventListener("click", () => selectItem("branch", entry.task.id));
  return button;
}

function getTerminalDeadlineTasks(root) {
  return flattenTasks(root)
    .filter((entry) => !(entry.task.children || []).length)
    .filter((entry) => Boolean(entry.task.deadline))
    .sort((a, b) => a.task.deadline.localeCompare(b.task.deadline) || a.path.join(" ").localeCompare(b.path.join(" ")));
}

function groupTerminalTasksByDeadline(tasks) {
  const today = parseIsoDate(todayIso());
  const day = 24 * 60 * 60 * 1000;
  const groups = [
    { label: "Overdue", tone: "overdue", emptyText: "No overdue end tasks.", items: [] },
    { label: "Today", tone: "today", emptyText: "Nothing due today.", items: [] },
    { label: "Tomorrow", tone: "tomorrow", emptyText: "Nothing due tomorrow.", items: [] },
    { label: "This week", tone: "week", emptyText: "No end tasks due this week.", items: [] },
    { label: "Later", tone: "later", emptyText: "No later end tasks yet.", items: [] }
  ];

  tasks.forEach((entry) => {
    const due = parseIsoDate(entry.task.deadline);
    const diff = Math.round((due - today) / day);
    if (diff < 0) groups[0].items.push(entry);
    else if (diff === 0) groups[1].items.push(entry);
    else if (diff === 1) groups[2].items.push(entry);
    else if (diff <= 7) groups[3].items.push(entry);
    else groups[4].items.push(entry);
  });

  return groups;
}

function getDeadlineStatus(deadline) {
  const today = parseIsoDate(todayIso());
  const due = parseIsoDate(deadline);
  const diff = Math.round((due - today) / (24 * 60 * 60 * 1000));
  if (diff < 0) return `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} late`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `${diff} days left`;
}

function isPrimaryView(view) {
  return ["branches", "mindmap", "organized"].includes(view);
}

function createPlannerSection(title, description = "") {
  const section = document.createElement("section");
  section.className = "planner-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const copy = document.createElement("p");
  copy.className = "planner-section-copy";
  copy.textContent = description;
  const grid = document.createElement("div");
  grid.className = "organized-grid";
  section.append(heading);
  if (description) section.append(copy);
  section.append(grid);
  return section;
}

function createPlanLegend() {
  const legend = document.createElement("div");
  legend.className = "plan-legend";
  [
    ["Main goal", "main"],
    ["Current", "current"],
    ["Smaller task", "task"]
  ].forEach(([label, tone]) => {
    const item = document.createElement("span");
    item.className = `legend-item legend-${tone}`;
    item.textContent = label;
    legend.append(item);
  });
  return legend;
}

function createOrganizedBreadcrumb(root, focusId) {
  const nav = document.createElement("nav");
  nav.className = "organized-breadcrumb";
  const path = getBranchPathWithIds(root, focusId);

  path.forEach((item, index) => {
    const crumb = document.createElement("button");
    crumb.type = "button";
    crumb.textContent = item.title;
    crumb.disabled = index === path.length - 1;
    setDisabledHint(crumb, crumb.disabled ? "You are already viewing this task." : "");
    crumb.addEventListener("click", () => selectItem("branch", item.id));
    nav.append(crumb);
  });

  return nav;
}

function createOrganizedCard(type, item, isFocus, orderValue = 0) {
  const card = document.createElement("button");
  card.type = "button";
  const isRoot = item.id === getActiveTree()?.root.id;
  card.className = `organized-card ${isRoot ? "main-goal-card" : "task-card"} ${isFocus ? "focus-card" : ""}`;
  applyTaskColor(card, item);
  card.classList.toggle("selected", state.selectedType === type && state.selectedId === item.id);
  card.classList.toggle("completed", Boolean(item.finishedAt));

  const tree = getActiveTree();
  const title = displayBranchTitle(tree?.root, item);
  const meta = goalMeta(item, getActiveTree() ? getBranchDepth(getActiveTree().root, item.id) : 0);

  card.innerHTML = `
    <span class="task-order" hidden></span>
    <span>${isFocus ? "Current task" : "Task"}</span>
    <strong></strong>
    <small></small>
    <span class="progress-chip"></span>
    <em></em>
  `;
  const order = card.querySelector(".task-order");
  order.hidden = !orderValue;
  order.textContent = String(orderValue || "");
  card.querySelector("strong").textContent = title;
  card.querySelector("small").textContent = meta;
  setProgressChip(card.querySelector(".progress-chip"), "branch", item);
  card.querySelector("em").textContent = item.deadline ? `Due ${formatDate(item.deadline)}` : "Add a due date in the editor";
  card.addEventListener("click", () => selectItem(type, item.id));
  return card;
}

function createOrganizedAddCard(branch) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "organized-card add-card";
  card.innerHTML = `
    <span>Smaller task</span>
    <strong>Add smaller task</strong>
    <small>Branches this task into a smaller task</small>
  `;
  card.addEventListener("click", () => {
    growChild(branch.id);
  });
  return card;
}

function openGoal(treeId) {
  const tree = state.trees.find((candidate) => candidate.id === treeId);
  if (!tree) return;
  state.activeTreeId = tree.id;
  state.selectedId = tree.root.id;
  state.selectedType = "branch";
  state.focusBranchId = tree.root.id;
  state.selectedCollectionId = "";
  state.movingTaskId = "";
  state.editingTreeId = "";
  state.activeView = isPrimaryView(state.defaultView) ? state.defaultView : "branches";
  state.currentPage = "workspace";
  saveState();
  render();
}

async function removeGoal(treeId) {
  const tree = state.trees.find((candidate) => candidate.id === treeId);
  if (!tree) return;
  const title = displayTreeTitle(tree, state.trees.findIndex((candidate) => candidate.id === tree.id));
  if (!(await confirmAction(`Remove "${title}" and all tasks inside it?`, "Remove goal"))) return;

  captureUndo();
  state.trees = state.trees.filter((candidate) => candidate.id !== tree.id);
  if (!state.trees.length) {
    state.trees = [createBlankTree()];
  }
  const nextTree = state.trees[0];
  state.activeTreeId = nextTree.id;
  state.selectedType = "branch";
  state.selectedId = nextTree.root.id;
  state.focusBranchId = nextTree.root.id;
  state.selectedCollectionId = "";
  state.movingTaskId = "";
  state.editingTreeId = state.editingTreeId === tree.id ? "" : state.editingTreeId;
  state.currentPage = "goals";
  saveState();
  render();
}

function selectItem(type, id) {
  state.selectedType = type;
  state.selectedId = id;
  state.movingTaskId = "";
  if (type === "branch") {
    state.focusBranchId = id;
  } else {
    const tree = getActiveTree();
    const branch = tree ? findBranch(tree.root, id) : null;
    if (branch) state.focusBranchId = branch.id;
  }
  state.selectedCollectionId = "";
  saveState();
  render();
}

function growChild(parentId, slotIndex = null) {
  const parent = findBranch(getActiveTree()?.root, parentId);
  if (!parent || parent.finishedAt) return;

  captureUndo();
  parent.children.push({
    id: createId("branch"),
    title: "",
    why: "",
    finishedAt: "",
    deadline: "",
    order: "",
    color: "",
    slot: Number.isInteger(slotIndex) ? slotIndex : parent.children.length,
    children: []
  });

  const child = parent.children[parent.children.length - 1];
  state.selectedType = "branch";
  state.selectedId = child.id;
  state.focusBranchId = parent.id;
  pendingCenterTarget = { type: "branch", id: child.id };
  saveState();
  render();
}

function moveSelectedTask(destinationId) {
  const tree = getActiveTree();
  const selected = getSelected();
  if (!tree || !selected || selected.item.id === tree.root.id) return;
  if (selected.item.id === destinationId || findBranch(selected.item, destinationId)) return;

  const destination = findBranch(tree.root, destinationId);
  const currentParent = findParentBranch(tree.root, selected.item.id);
  if (!destination || !currentParent || destination.id === currentParent.id) return;

  captureUndo();
  const moved = detachBranch(tree.root, selected.item.id);
  if (!moved) return;

  moved.slot = getNextOpenSlots(destination.children, 6)[0] ?? destination.children.length;
  destination.children.push(moved);
  refreshCompletionState(tree.root);
  state.selectedType = "branch";
  state.selectedId = moved.id;
  state.focusBranchId = destination.id;
  state.movingTaskId = "";
  pendingCenterTarget = { type: "branch", id: moved.id };
  saveState();
  render();
}

async function markSelectedDone() {
  const selected = getSelected();
  if (!selected || selected.item.finishedAt) return;
  const progress = getImmediateProgress(selected.item);
  const openCount = Math.max(0, progress.total - progress.done);
  const message = openCount
    ? `This task still has ${openCount} unfinished smaller task${openCount === 1 ? "" : "s"}. Mark it done anyway?`
    : "Mark this task as done?";
  if (!(await confirmAction(message, "Set as done"))) return;
  captureUndo();
  selected.item.finishedAt = todayIso();
  selected.item.manuallyReopened = false;
  saveState();
  render();
}

async function markSelectedNotDone() {
  const tree = getActiveTree();
  const selected = getSelected();
  if (!tree || !selected || !selected.item.finishedAt) return;
  if (!(await confirmAction("Put this completed task back into progress?", "Put back"))) return;
  captureUndo();
  selected.item.finishedAt = "";
  selected.item.manuallyReopened = true;
  refreshCompletionState(tree.root);
  saveState();
  render();
}

async function collectAndRemoveSelected() {
  const tree = getActiveTree();
  const selected = getSelected();
  if (!tree || !selected || !selected.item.finishedAt) return;
  if (!(await confirmAction("Remove this completed task and send it to the collection?", "Remove task"))) return;

  const parentBranch = findParentBranch(tree.root, selected.item.id) || tree.root;
  const mainGoal = displayBranchTitle(tree.root, tree.root);

  captureUndo();
  tree.collection.unshift(createCollectionRecord(selected.item, mainGoal, parentBranch));

  if (selected.item.id === tree.root.id) {
    tree.root = {
      id: createId("branch"),
      title: "",
      why: "",
      finishedAt: "",
      deadline: "",
      order: "",
      color: "",
      children: []
    };
    state.selectedType = "branch";
    state.selectedId = tree.root.id;
    state.focusBranchId = tree.root.id;
  } else {
    removeBranch(tree.root, selected.item.id);
    state.selectedType = "branch";
    state.selectedId = parentBranch.id;
    state.focusBranchId = parentBranch.id;
  }

  state.selectedCollectionId = tree.collection[0].id;
  saveState();
  render();
}

function createCollectionRecord(item, mainGoal, parentBranch) {
  return {
    id: createId("finished"),
    type: "task",
    task: structuredClone(item),
    parentId: parentBranch?.id || "",
    wasRoot: item.id === getActiveTree()?.root.id,
    title: item.title,
    initialTitle: item.initialTitle || item.title || "Unnamed task",
    why: item.why,
    deadline: item.deadline || "",
    finishedAt: item.finishedAt || todayIso(),
    removedAt: todayIso(),
    mainGoal,
    parentBranchTitle: displayBranchTitle(getActiveTree()?.root, parentBranch)
  };
}

async function deleteSelected() {
  const selected = getSelected();
  const tree = getActiveTree();
  if (!selected || !tree) return;

  if (selected.item.finishedAt) {
    await collectAndRemoveSelected();
    return;
  }

  if (selected.item.id === tree.root.id) return;
  if (!(await confirmAction("Delete this task and every smaller task connected to it?", "Delete task"))) return;
  captureUndo();
  const parentBranch = findParentBranch(tree.root, selected.item.id) || tree.root;
  removeBranch(tree.root, selected.item.id);
  state.selectedType = "branch";
  state.selectedId = parentBranch.id;
  state.focusBranchId = parentBranch.id;
  state.movingTaskId = "";

  saveState();
  render();
}

async function restoreSelectedCollectionTask() {
  const tree = getActiveTree();
  if (!tree) return;
  const recordIndex = tree.collection.findIndex((record) => record.id === state.selectedCollectionId);
  const selectedRecord = recordIndex >= 0 ? tree.collection[recordIndex] : tree.collection[0];
  if (!selectedRecord?.task) return;
  if (!(await confirmAction("Put this removed task back into the current goal?", "Put task back"))) return;

  captureUndo();
  const restored = structuredClone(selectedRecord.task);
  const parent = selectedRecord.wasRoot
    ? null
    : findBranch(tree.root, selectedRecord.parentId) || tree.root;

  if (selectedRecord.wasRoot) {
    tree.root = restored;
  } else {
    restored.slot = getNextOpenSlots(parent.children || [], 6)[0] ?? parent.children.length;
    parent.children.push(restored);
  }

  tree.collection = tree.collection.filter((record) => record.id !== selectedRecord.id);
  state.selectedType = "branch";
  state.selectedId = restored.id;
  state.focusBranchId = selectedRecord.wasRoot ? restored.id : parent.id;
  state.selectedCollectionId = tree.collection[0]?.id || "";
  refreshCompletionState(tree.root);
  saveState();
  render();
}

function branchMeta(branch, depth) {
  if (branch.finishedAt) return `Completed ${formatDate(branch.finishedAt)}`;
  const count = branch.children.length;
  const due = branch.deadline ? ` - due ${formatDate(branch.deadline)}` : "";
  return `${depth === 0 ? "Main goal" : "Task"} - ${count} smaller task${count === 1 ? "" : "s"}${due}`;
}

function goalMeta(goal, depth, childCount = goal.children?.length || 0) {
  if (goal.finishedAt) return `Completed ${formatDate(goal.finishedAt)}`;
  const due = goal.deadline ? ` - due ${formatDate(goal.deadline)}` : "";
  return `${depth === 0 ? "Main goal" : "Task"} - ${childCount} smaller task${childCount === 1 ? "" : "s"}${due}`;
}

function taskMeta(task) {
  if (task.finishedAt) return `Completed ${formatDate(task.finishedAt)}`;
  return task.deadline ? `Task - due ${formatDate(task.deadline)}` : "Task - needs deadline";
}

function getImmediateTasks(branch) {
  return (branch.children || []).map((item) => ({ type: "branch", item, order: item.order || "" }));
}

function getImmediateProgress(branch) {
  const tasks = getImmediateTasks(branch);
  return {
    done: tasks.filter((task) => Boolean(task.item.finishedAt)).length,
    total: tasks.length
  };
}

function progressText(branch) {
  const progress = getImmediateProgress(branch);
  return `${progress.done}/${progress.total}`;
}

function setProgressChip(element, type, item) {
  if (!element) return;
  if (type === "branch") {
    const progress = getImmediateProgress(item);
    const percent = progress.total ? Math.round(progress.done / progress.total * 100) : 0;
    element.textContent = `${progress.done}/${progress.total}`;
    element.style.setProperty("--progress", `${percent}%`);
    element.classList.toggle("complete", Boolean(item.finishedAt));
    return;
  }

  element.textContent = item.finishedAt ? "Done" : "0/0";
  element.style.setProperty("--progress", item.finishedAt ? "100%" : "0%");
  element.classList.toggle("complete", Boolean(item.finishedAt));
}

function applyTaskColor(element, task) {
  if (!element || !task) return;
  const root = getActiveTree()?.root;
  const color = root?.id === task.id ? "" : taskColorValues[task.color];
  element.classList.toggle("colored-task", Boolean(color));
  if (color) {
    element.style.setProperty("--task-color", color);
  } else {
    element.style.removeProperty("--task-color");
  }
}

function syncAutoCompletedTasks() {
  const tree = getActiveTree();
  if (!tree) return false;
  let changed = false;

  function visit(branch) {
    (branch.children || []).forEach(visit);
    const progress = getImmediateProgress(branch);
  if (!branch.finishedAt && !branch.manuallyReopened && progress.total > 0 && progress.done === progress.total) {
    branch.finishedAt = todayIso();
    changed = true;
  }
  }

  visit(tree.root);
  return changed;
}

function refreshCompletionState(branch) {
  (branch.children || []).forEach(refreshCompletionState);
  const progress = getImmediateProgress(branch);
  if (branch.finishedAt && progress.total > 0 && progress.done < progress.total) {
    branch.finishedAt = "";
  }
  if (progress.total === 0 || progress.done < progress.total) {
    branch.manuallyReopened = false;
  }
  if (!branch.finishedAt && !branch.manuallyReopened && progress.total > 0 && progress.done === progress.total) {
    branch.finishedAt = todayIso();
  }
}

function buildGeneralMindmapLayout(root) {
  const nodes = [];
  const links = [];
  const horizontalGap = 300;
  const verticalGap = 142;
  const cardWidth = 220;
  const cardHeight = 108;
  let cursorY = 32;
  let maxDepth = 0;

  function layoutGoal(goal, depth, parentTitle = "", parentNode = null) {
    const branchChildren = goal.children || [];
    const childEntries = branchChildren.map((child, index) => ({
      type: "branch",
      item: child,
      order: child.order || "",
      title: displaySiblingTitle(branchChildren, child, index, "Name this task")
    }));
    const childNodes = [];
    maxDepth = Math.max(maxDepth, depth);

    if (childEntries.length) {
      childEntries.forEach((childEntry) => {
        childNodes.push(layoutGoal(childEntry.item, depth + 1, displayBranchTitle(root, goal)));
        childNodes[childNodes.length - 1].order = childEntry.order;
        childNodes[childNodes.length - 1].displayTitle = childEntry.title;
      });
    }

    const x = 34 + depth * horizontalGap;
    const y = childNodes.length
      ? (childNodes[0].y + childNodes[childNodes.length - 1].y) / 2
      : cursorY;
    if (!childNodes.length) cursorY += verticalGap;

    const node = {
      type: "branch",
      item: goal,
      parentTitle,
      childCount: branchChildren.length,
      depth,
      isRoot: depth === 0,
      order: 0,
      displayTitle: displayBranchTitle(root, goal),
      x,
      y
    };
    nodes.push(node);

    if (parentNode) {
      links.push({
        kind: "branch",
        startX: parentNode.x,
        startY: parentNode.y,
        endX: x,
        endY: y
      });
    }

    childNodes.forEach((childNode) => {
      links.push({ kind: "branch", startX: x, startY: y, endX: childNode.x, endY: childNode.y });
    });

    return node;
  }

  layoutGoal(root, 0);

  return {
    nodes: nodes.sort((a, b) => a.depth - b.depth || a.y - b.y),
    links,
    width: Math.max(860, 80 + (maxDepth + 1) * horizontalGap + cardWidth),
    height: Math.max(540, cursorY + cardHeight)
  };
}

function ensureSelection() {
  const tree = getActiveTree() || state.trees[0];
  if (!tree) return;

  state.activeTreeId = tree.id;
  if (!state.focusBranchId || !findBranch(tree.root, state.focusBranchId)) {
    state.focusBranchId = tree.root.id;
  }
  if (!getSelected()) {
    state.selectedType = "branch";
    state.selectedId = tree.root.id;
  }
}

function getActiveTree() {
  return state.trees.find((tree) => tree.id === state.activeTreeId) || null;
}

function getSelected() {
  const tree = getActiveTree();
  if (!tree) return null;

  const branch = findBranch(tree.root, state.selectedId);
  return branch ? { type: "branch", item: branch } : null;
}

function getSelectedBranch() {
  const selected = getSelected();
  return selected?.type === "branch" ? selected.item : null;
}

function findBranch(branch, id) {
  if (!branch) return null;
  if (branch.id === id) return branch;
  for (const child of branch.children || []) {
    const found = findBranch(child, id);
    if (found) return found;
  }
  return null;
}

function removeBranch(branch, id) {
  const index = branch.children.findIndex((child) => child.id === id);
  if (index >= 0) {
    branch.children.splice(index, 1);
    return true;
  }
  return branch.children.some((child) => removeBranch(child, id));
}

function detachBranch(branch, id) {
  const index = branch.children.findIndex((child) => child.id === id);
  if (index >= 0) {
    const [removed] = branch.children.splice(index, 1);
    return removed;
  }
  for (const child of branch.children || []) {
    const removed = detachBranch(child, id);
    if (removed) return removed;
  }
  return null;
}

function zoomToParent(branchId) {
  const tree = getActiveTree();
  if (!tree) return;
  const parent = findParentBranch(tree.root, branchId);
  if (!parent) return;
  state.focusBranchId = parent.id;
  state.selectedType = "branch";
  state.selectedId = parent.id;
  saveState();
  render();
}

function findParentBranch(branch, childId, parent = null) {
  if (branch.id === childId) return parent;
  for (const child of branch.children || []) {
    const found = findParentBranch(child, childId, branch);
    if (found) return found;
  }
  return null;
}

function getSelectionPath(tree) {
  return getBranchPath(tree.root, state.selectedId).join(" > ");
}

function getGeneralSelectionPath(tree) {
  return getGoalPath(tree.root, state.selectedId).join(" > ");
}

function getBranchPath(branch, id, path = [], depth = 0) {
  const nextPath = [...path, displayBranchTitle(getActiveTree()?.root || branch, branch)];
  if (branch.id === id) return nextPath;
  for (const child of branch.children || []) {
    const found = getBranchPath(child, id, nextPath, depth + 1);
    if (found.length) return found;
  }
  return [];
}

function getGoalPath(branch, id, path = [], depth = 0) {
  const nextPath = [...path, displayBranchTitle(getActiveTree()?.root || branch, branch)];
  if (branch.id === id) return nextPath;
  for (const child of branch.children || []) {
    const found = getGoalPath(child, id, nextPath, depth + 1);
    if (found.length) return found;
  }
  return [];
}

function getBranchPathWithIds(branch, id, path = [], depth = 0) {
  const nextPath = [...path, {
    id: branch.id,
    title: displayBranchTitle(getActiveTree()?.root || branch, branch)
  }];
  if (branch.id === id) return nextPath;
  for (const child of branch.children || []) {
    const found = getBranchPathWithIds(child, id, nextPath, depth + 1);
    if (found.length) return found;
  }
  return [];
}

function flattenTasks(root) {
  const tasks = [];

  function visit(task, path = [], depth = 0) {
    const title = displayBranchTitle(root, task);
    const nextPath = [...path, title];
    tasks.push({ task, title, path: nextPath, depth });
    (task.children || []).forEach((child) => visit(child, nextPath, depth + 1));
  }

  visit(root);
  return tasks;
}

function countBranches(branch) {
  return 1 + (branch.children || []).reduce((sum, child) => sum + countBranches(child), 0);
}

function countOpenTasks(branch) {
  const ownTask = branch.finishedAt ? 0 : 1;
  return ownTask + (branch.children || []).reduce((sum, child) => sum + countOpenTasks(child), 0);
}

function getGoalDashboardStats(root) {
  const tasks = flattenTasks(root);
  const total = tasks.length;
  const done = tasks.filter((entry) => Boolean(entry.task.finishedAt)).length;
  const today = todayIso();
  const overdue = tasks.filter((entry) => (
    entry.task.deadline
    && !entry.task.finishedAt
    && entry.task.deadline < today
  )).length;
  const nextDeadline = tasks
    .filter((entry) => entry.task.deadline && !entry.task.finishedAt && entry.task.deadline >= today)
    .sort((a, b) => a.task.deadline.localeCompare(b.task.deadline))[0];

  return {
    done,
    total,
    percent: total ? Math.round(done / total * 100) : 0,
    overdue,
    nextDeadline: nextDeadline
      ? {
        deadline: nextDeadline.task.deadline,
        title: nextDeadline.title
      }
      : null
  };
}

function getBranchDepth(branch, id, depth = 0) {
  if (branch.id === id) return depth;
  for (const child of branch.children || []) {
    const found = getBranchDepth(child, id, depth + 1);
    if (found >= 0) return found;
  }
  return -1;
}

function displayTreeTitle(tree, index) {
  const title = displayTitle(tree.root, "Main goal");
  const titleKey = normalizeTitleKey(tree.root, "Main goal");
  const priorMatches = state.trees
    .slice(0, Math.max(0, index))
    .filter((candidate) => normalizeTitleKey(candidate.root, "Main goal") === titleKey).length;
  return withDuplicateSuffix(title, priorMatches);
}

function getGoalIcon(tree) {
  return goalIcons[tree?.root?.icon] || goalIcons[defaultGoalIcon];
}

function displayBranchTitle(root, branch) {
  if (!root || !branch) return displayTitle(branch || { title: "" }, "Name this task");
  if (root.id === branch.id) return displayTitle(branch, "Main goal");
  const parent = findParentBranch(root, branch.id);
  if (!parent) return displayTitle(branch, "Name this task");
  const index = (parent.children || []).findIndex((child) => child.id === branch.id);
  return displaySiblingTitle(parent.children || [], branch, index, "Name this task");
}

function displaySiblingTitle(siblings, item, index, fallback) {
  const title = displayTitle(item, fallback);
  const titleKey = normalizeTitleKey(item, fallback);
  const priorMatches = siblings
    .slice(0, Math.max(0, index))
    .filter((sibling) => normalizeTitleKey(sibling, fallback) === titleKey).length;
  return withDuplicateSuffix(title, priorMatches);
}

function normalizeTitleKey(item, fallback) {
  return displayTitle(item, fallback).toLowerCase();
}

function withDuplicateSuffix(title, priorMatches) {
  return priorMatches > 0 ? `${title} (${priorMatches})` : title;
}

function displayTitle(item, fallback = "Name this branch") {
  return item?.title?.trim() || fallback;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function parseIsoDate(value) {
  return new Date(`${value}T00:00:00`);
}

function createId(prefix) {
  if (crypto.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyState(text) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = text;
  return empty;
}

function createBlankTree() {
  return {
    id: createId("tree"),
    root: {
      id: createId("branch"),
      title: "",
      why: "",
      icon: defaultGoalIcon,
      finishedAt: "",
      deadline: "",
      order: "",
      color: "",
      children: []
    },
    collection: []
  };
}

function captureUndo() {
  undoSnapshot = JSON.stringify(state);
  renderUndoButton();
}

function restoreUndo() {
  if (!undoSnapshot) return;
  const previousState = JSON.parse(undoSnapshot);
  undoSnapshot = null;
  state = normalizeState(previousState);
  elements.treeForm.reset();
  saveState();
  render();
}

function renderUndoButton() {
  elements.undoButton.disabled = !undoSnapshot;
  setDisabledHint(elements.undoButton, undoSnapshot ? "" : "Nothing to undo yet.");
}

function setDisabledHint(element, message) {
  if (!element) return;
  if (message) {
    element.dataset.disabledHint = message;
  } else {
    delete element.dataset.disabledHint;
  }
}

function confirmAction(message, acceptLabel = "Confirm") {
  return new Promise((resolve) => {
    elements.confirmTitle.textContent = "Are you sure?";
    elements.confirmMessage.textContent = message;
    elements.confirmAcceptButton.textContent = acceptLabel;
    elements.confirmOverlay.hidden = false;
    elements.confirmAcceptButton.focus();

    function finish(value) {
      elements.confirmOverlay.hidden = true;
      elements.confirmAcceptButton.textContent = "Confirm";
      elements.confirmAcceptButton.removeEventListener("click", accept);
      elements.confirmCancelButton.removeEventListener("click", cancel);
      elements.confirmOverlay.removeEventListener("click", overlayCancel);
      document.removeEventListener("keydown", escapeCancel);
      resolve(value);
    }

    function accept() {
      finish(true);
    }

    function cancel() {
      finish(false);
    }

    function overlayCancel(event) {
      if (event.target === elements.confirmOverlay) finish(false);
    }

    function escapeCancel(event) {
      if (event.key === "Escape") finish(false);
    }

    elements.confirmAcceptButton.addEventListener("click", accept);
    elements.confirmCancelButton.addEventListener("click", cancel);
    elements.confirmOverlay.addEventListener("click", overlayCancel);
    document.addEventListener("keydown", escapeCancel);
  });
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored && Array.isArray(stored.trees)) {
      return normalizeState({
        ...structuredClone(starterState),
        ...stored,
        theme: stored.theme || "light",
        activeView: stored.activeView || "branches",
        defaultView: stored.defaultView || "branches"
      }, { forceGoalsPage: true });
    }
  } catch (error) {
    console.warn("Branches could not load stored data.", error);
  }

  return normalizeState(structuredClone(starterState), { forceGoalsPage: true });
}

function normalizeState(nextState, options = {}) {
  nextState.theme = "light";
  if (options.forceGoalsPage || !["goals", "workspace"].includes(nextState.currentPage)) {
    nextState.currentPage = "goals";
  }
  if (!["branches", "mindmap", "organized", "daily"].includes(nextState.activeView)) {
    nextState.activeView = "branches";
  }
  if (!isPrimaryView(nextState.defaultView)) {
    nextState.defaultView = "branches";
  }
  nextState.movingTaskId = nextState.movingTaskId || "";
  nextState.editingTreeId = nextState.editingTreeId || "";
  nextState.selectedType = "branch";
  nextState.trees = Array.isArray(nextState.trees) && nextState.trees.length
    ? nextState.trees
    : structuredClone(starterState.trees);

  nextState.trees.forEach((tree) => {
    tree.collection = Array.isArray(tree.collection) ? tree.collection.map(normalizeCollectionRecord) : [];
    tree.root = normalizeTask(tree.root || structuredClone(starterState.trees[0].root));
  });

  const activeTree = nextState.trees.find((tree) => tree.id === nextState.activeTreeId) || nextState.trees[0];
  nextState.activeTreeId = activeTree.id;
  if (!findBranch(activeTree.root, nextState.selectedId)) nextState.selectedId = activeTree.root.id;
  if (!findBranch(activeTree.root, nextState.focusBranchId)) nextState.focusBranchId = activeTree.root.id;
  if (nextState.movingTaskId && !findBranch(activeTree.root, nextState.movingTaskId)) {
    nextState.movingTaskId = "";
  }
  if (nextState.editingTreeId && !nextState.trees.some((tree) => tree.id === nextState.editingTreeId)) {
    nextState.editingTreeId = "";
  }
  return nextState;
}

function normalizeTask(task) {
  const normalized = {
    id: task.id || createId("branch"),
    title: task.title || "",
    initialTitle: task.initialTitle || task.title || "",
    why: task.why || "",
    icon: goalIcons[task.icon] ? task.icon : defaultGoalIcon,
    finishedAt: task.finishedAt || "",
    manuallyReopened: Boolean(task.manuallyReopened),
    deadline: task.deadline || "",
    order: task.order || "",
    color: taskColorValues[task.color] ? task.color : "",
    slot: Number.isInteger(task.slot) ? task.slot : undefined,
    children: Array.isArray(task.children) ? task.children.map(normalizeTask) : []
  };

  const legacyFinalTasks = task["lea" + "ves"];
  if (Array.isArray(legacyFinalTasks) && legacyFinalTasks.length) {
    legacyFinalTasks.forEach((oldTask, index) => {
      normalized.children.push(normalizeTask({
        ...oldTask,
        id: oldTask.id?.replace(/^lea[f]-/, "branch-") || createId("branch"),
        slot: Number.isInteger(oldTask.slot) ? oldTask.slot : normalized.children.length + index,
        children: []
      }));
    });
  }

  return normalized;
}

function normalizeCollectionRecord(record) {
  const fallbackTask = {
    id: createId("branch"),
    title: record.title || "",
    initialTitle: record.initialTitle || record.title || "",
    why: record.why || "",
    finishedAt: record.finishedAt || todayIso(),
    manuallyReopened: false,
    deadline: record.deadline || "",
    order: "",
    color: taskColorValues[record.color] ? record.color : "",
    children: []
  };

  return {
    ...record,
    task: record.task ? normalizeTask(record.task) : normalizeTask(fallbackTask),
    parentId: record.parentId || "",
    wasRoot: Boolean(record.wasRoot)
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}
