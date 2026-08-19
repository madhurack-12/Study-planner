const qs = (id) => document.getElementById(id);

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));

const profile = {
  name: "Student",
  college: "College",
  course: "Course",
  target: 5,
  struggle: "Phone distraction"
};

const chaptersEl = qs("chapters");
const activitiesEl = qs("activities");

const chapterSeed = [
  {
    subject: "Physics",
    chapter: "Current electricity",
    pages: 22,
    difficulty: "hard"
  },
  {
    subject: "Math",
    chapter: "Integration basics",
    pages: 18,
    difficulty: "medium"
  },
  {
    subject: "Chemistry",
    chapter: "Chemical bonding",
    pages: 16,
    difficulty: "medium"
  }
];

const activitySeed = [
  { name: "Focused study", hours: 4, type: "study" },
  { name: "Phone scrolling", hours: 2, type: "phone" },
  { name: "Sports", hours: 1, type: "active" },
  { name: "Sleep", hours: 7, type: "rest" },
  { name: "Family / meals", hours: 2, type: "life" }
];

function chapterRow(data = {}) {
  const row = document.createElement("div");
  row.className = "chapter-row";

  row.innerHTML = `
    <label>
      Subject
      <input class="subject" value="${esc(data.subject || "")}" placeholder="Biology">
    </label>

    <label>
      Pages
      <input class="pages" type="number" min="1" value="${esc(data.pages || 10)}">
    </label>

    <label>
      Difficulty
      <select class="difficulty">
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </label>

    <button class="remove" type="button" aria-label="Remove chapter">x</button>

    <label>
      Chapter name
      <input class="chapter" value="${esc(data.chapter || "")}" placeholder="Chapter name">
    </label>
  `;

  row.querySelector(".difficulty").value =
    data.difficulty || "medium";

  row.querySelector(".remove").addEventListener("click", () => {
    if (chaptersEl.children.length > 1) {
      row.remove();
    }
  });

  return row;
}

function activityRow(data = {}) {
  const row = document.createElement("div");
  row.className = "activity-row";

  row.innerHTML = `
    <label>
      Activity
      <input class="activity-name" value="${esc(data.name || "")}" placeholder="Reading, phone, sports">
    </label>

    <label>
      Hours
      <input class="activity-hours" type="number" min="0" max="24" step="0.25" value="${esc(data.hours ?? 1)}">
    </label>

    <label>
      Type
      <select class="activity-type">
        <option value="study">Study</option>
        <option value="phone">Phone</option>
        <option value="active">Sports</option>
        <option value="rest">Sleep/rest</option>
        <option value="life">Life</option>
        <option value="creative">Creative</option>
      </select>
    </label>

    <button class="remove" type="button" aria-label="Remove activity">x</button>
  `;

  row.querySelector(".activity-type").value =
    data.type || "life";

  row.querySelector(".remove").addEventListener("click", () => {
    if (activitiesEl.children.length > 1) {
      row.remove();
    }
  });

  return row;
}

function parseStart(value) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";

  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function estimateChapter(chapter, focus) {
  const difficulty =
    {
      easy: 1,
      medium: 1.28,
      hard: 1.65
    }[chapter.difficulty] || 1.28;

  const focusFactor =
    {
      calm: 1.12,
      normal: 1,
      intense: 0.9
    }[focus] || 1;

  const reading = chapter.pages * 3.1;
  const practice = chapter.pages * 1.7 * difficulty;
  const revision = 18 * difficulty;

  const minutes = Math.max(
    35,
    Math.round(
      ((reading + practice + revision) * focusFactor) / 5
    ) * 5
  );

  const profileText =
    difficulty > 1.5
      ? "heavy practice and recall"
      : difficulty > 1.1
        ? "mixed theory and problem solving"
        : "quick reading with light revision";

  return {
    minutes,
    profileText
  };
}

function collectChapters() {
  return [...chaptersEl.querySelectorAll(".chapter-row")].map((row) => ({
    subject:
      row.querySelector(".subject").value.trim() || "Subject",

    chapter:
      row.querySelector(".chapter").value.trim() ||
      "Unnamed chapter",

    pages:
      Number(row.querySelector(".pages").value) || 10,

    difficulty:
      row.querySelector(".difficulty").value
  }));
}

function collectActivities() {
  return [...activitiesEl.querySelectorAll(".activity-row")].map(
    (row) => ({
      name:
        row.querySelector(".activity-name").value.trim() ||
        "Activity",

      hours:
        Number(row.querySelector(".activity-hours").value) || 0,

      type:
        row.querySelector(".activity-type").value
    })
  );
}

function renderPlan() {
  const chapters = collectChapters();

  const startTime = qs("startTime").value || "06:30";
  const availableHours =
    Number(qs("availableHours").value) || profile.target;

  const focus =
    qs("focusLevel").value || "normal";

  const breakType =
    qs("activityBreak").value || "Sports";

  let current = parseStart(startTime);

  let totalMinutes = 0;

  const estimated = chapters.map((chapter) => {
    const result = estimateChapter(chapter, focus);

    totalMinutes += result.minutes;

    return {
      ...chapter,
      ...result
    };
  });

  const maxMinutes = availableHours * 60;

  const blocks = [];

  for (const item of estimated) {
    if (totalMinutes > maxMinutes) {
      break;
    }

    const studyStart = current;
    const studyEnd = current + item.minutes;

    blocks.push({
      type: "study",
      title: `${item.subject}: ${item.chapter}`,
      time: `${minutesToTime(studyStart)} - ${minutesToTime(studyEnd)}`,
      detail: `${Math.round(item.minutes / 60 * 10) / 10} hr • ${item.profileText}`
    });

    current = studyEnd;

    blocks.push({
      type: "break",
      title: `${breakType} break`,
      time: `${minutesToTime(current)} - ${minutesToTime(current + 20)}`,
      detail: "20 min recovery"
    });

    current += 20;
  }

  blocks.push({
    type: "review",
    title: "Final recall review",
    time: `${minutesToTime(current)} - ${minutesToTime(current + 25)}`,
    detail: "Recall key ideas without looking at notes."
  });

  const output = qs("planOutput");

  output.innerHTML = `
    <div class="result-summary">
      <strong>${estimated.length} chapters planned</strong>
      <span>${Math.round(totalMinutes / 60 * 10) / 10} study hours estimated</span>
    </div>

    <div class="plan-list">
      ${blocks.map((block) => `
        <article class="plan-card">
          <small>${esc(block.time)}</small>
          <h4>${esc(block.title)}</h4>
          <p>${esc(block.detail)}</p>
        </article>
      `).join("")}
    </div>
  `;

  qs("planStamp").textContent = "Generated";
}

function renderDayAnalysis() {
  const activities = collectActivities();

  const studyHours = activities
    .filter((item) => item.type === "study")
    .reduce((sum, item) => sum + item.hours, 0);

  const phoneHours = activities
    .filter((item) => item.type === "phone")
    .reduce((sum, item) => sum + item.hours, 0);

  const sleepHours = activities
    .filter((item) => item.type === "rest")
    .reduce((sum, item) => sum + item.hours, 0);

  const activeHours = activities
    .filter((item) => item.type === "active")
    .reduce((sum, item) => sum + item.hours, 0);

  const target = Number(profile.target) || 5;

  let score = 60;

  score += Math.min(25, (studyHours / target) * 25);

  if (phoneHours <= 1) {
    score += 8;
  } else if (phoneHours <= 2) {
    score += 4;
  } else {
    score -= 8;
  }

  if (sleepHours >= 7) {
    score += 5;
  } else if (sleepHours < 5) {
    score -= 8;
  }

  if (activeHours >= 0.5) {
    score += 2;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let feedback = "";

  if (score >= 85) {
    feedback =
      "Excellent day. Keep this rhythm and protect your focus.";
  } else if (score >= 70) {
    feedback =
      "Good progress. Reduce distractions and keep your study rhythm consistent.";
  } else {
    feedback =
      "Your day can improve. Start with one focused study block and reduce phone time.";
  }

  const focusFeeling = qs("focusFeeling").value;
  const completed = qs("completedToday").value.trim();
  const disturbance = qs("disturbance").value.trim();
  const proud = qs("proudMoment").value.trim();

  qs("dayOutput").innerHTML = `
    <div class="score-card">
      <span>Today utilization</span>
      <strong>${score}%</strong>
      <div class="meter">
        <i style="width:${score}%"></i>
      </div>
    </div>

    <div class="feedback">
      <h4>Feedback</h4>
      <p>${esc(feedback)}</p>

      <ul>
        <li>Focused study: ${studyHours.toFixed(1)} hrs</li>
        <li>Phone: ${phoneHours.toFixed(1)} hrs</li>
        <li>Sleep/rest: ${sleepHours.toFixed(1)} hrs</li>
        <li>Sports/activity: ${activeHours.toFixed(1)} hrs</li>
        <li>Focus feeling: ${esc(focusFeeling)}</li>
      </ul>

      ${
        completed
          ? `<p><strong>Completed:</strong> ${esc(completed)}</p>`
          : ""
      }

      ${
        disturbance
          ? `<p><strong>Disturbance:</strong> ${esc(disturbance)}</p>`
          : ""
      }

      ${
        proud
          ? `<p><strong>Proud moment:</strong> ${esc(proud)}</p>`
          : ""
      }
    </div>
  `;

  qs("dayStamp").textContent = "Analyzed";
}

function setupProfile() {
  const form = qs("profileForm");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    profile.name =
      qs("studentName").value.trim() || "Student";

    profile.college =
      qs("collegeName").value.trim() || "College";

    profile.course =
      qs("courseName").value.trim() || "Course";

    profile.target =
      Number(qs("targetHours").value) || 5;

    profile.struggle =
      qs("struggle").value;

    qs("profileName").textContent = profile.name;

    qs("profileMeta").textContent =
      `${profile.college} - ${profile.course}`;

    qs("plannerIntro").textContent =
      `Target: ${profile.target} hours/day • Main struggle: ${profile.struggle}`;

    qs("dashboard").classList.remove("hidden");

    qs("home").classList.add("hidden");
    qs("modules").classList.add("hidden");
    qs("student-setup").classList.add("hidden");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    renderPlan();
  });
}

function setupTabs() {
  qs("plannerTab").addEventListener("click", () => {
    qs("plannerTab").classList.add("active");
    qs("dayTab").classList.remove("active");

    qs("plannerView").classList.remove("hidden");
    qs("dayView").classList.add("hidden");

    qs("sidebarNote").textContent =
      "Generate your plan, then compare it with your real day.";
  });

  qs("dayTab").addEventListener("click", () => {
    qs("dayTab").classList.add("active");
    qs("plannerTab").classList.remove("active");

    qs("dayView").classList.remove("hidden");
    qs("plannerView").classList.add("hidden");

    qs("sidebarNote").textContent =
      "Reflect on your day and see where your time went.";
  });
}

function setupButtons() {
  qs("addChapter").addEventListener("click", () => {
    chaptersEl.appendChild(chapterRow());
  });

  qs("generatePlan").addEventListener("click", renderPlan);

  qs("addActivity").addEventListener("click", () => {
    activitiesEl.appendChild(activityRow());
  });

  qs("analyzeDay").addEventListener("click", renderDayAnalysis);
}

function init() {
  chapterSeed.forEach((chapter) => {
    chaptersEl.appendChild(chapterRow(chapter));
  });

  activitySeed.forEach((activity) => {
    activitiesEl.appendChild(activityRow(activity));
  });

  setupProfile();
  setupTabs();
  setupButtons();

  renderPlan();
}

document.addEventListener("DOMContentLoaded", init);