// Founder Frame OS MVP
// This is Founder Frame OS, not Raspberry Pi FrameOS.
// Client-side only. No external API calls. No server persistence.

const weights = {
  vision: 15,
  problem: 20,
  user: 15,
  solution: 15,
  proof: 15,
  revenue: 10,
  execution: 10
};

function value(id) {
  return document.getElementById(id).value.trim();
}

function lengthScore(text, minStrong, minAcceptable) {
  if (!text) return 0;
  if (text.length >= minStrong) return 100;
  if (text.length >= minAcceptable) return 70;
  return 35;
}
function scoreExecution(text) {
  const weakPhrases = ["soon", "later", "maybe", "try", "work on it", "figure it out"];
  const lower = text.toLowerCase();

  if (!text) return 0;
  if (weakPhrases.some(phrase => lower.includes(phrase))) return 35;
  if (lower.includes("today") || lower.includes("tonight") || lower.includes("tomorrow") || lower.includes("by ")) return 100;
  if (text.length >= 50) return 70;
  return 35;
}
function scoreFounder(data) {
  const metrics = {
    vision: lengthScore(data.vision, 80, 25),
    problem: lengthScore(data.problem, 100, 35),
    user: lengthScore(data.user, 80, 25),
    solution: lengthScore(data.solution, 100, 35),
    proof: lengthScore(data.proof, 80, 20),
    revenue: lengthScore(data.revenue, 80, 20),
    execution: scoreExecution(data.execution)
  };

  const total = Object.entries(metrics).reduce((sum, [key, score]) => {
    return sum + score * (weights[key] / 100);
  }, 0);

  return {
    total: Math.round(total),
    metrics
  };
}

function qualityGate(score, data) {
  const issues = [];

  if (score.metrics.problem < 70) issues.push("Problem is not defined clearly enough.");
  if (score.metrics.user < 70) issues.push("Target user is too vague.");
  if (score.metrics.solution < 70) issues.push("Solution needs sharper mechanism.");
  if (score.metrics.proof < 70) issues.push("Proof is weak or missing.");
  if (score.metrics.revenue < 70) issues.push("Revenue path is unclear.");
    if (score.metrics.execution < 70) issues.push("Execution commitment is too vague or not time-bound.");
  let status = "Ready for Human Review";
  let className = "pass";

  if (score.total < 70 || issues.length >= 3) {
    status = "Needs Revision";
    className = "warn";
  }

  if (score.total < 50) {
    status = "Not Ready";
    className = "fail";
  }

  return {
    status,
    className,
    issues
  };
}

function generateSprint(data, gate) {
  const focus = gate.issues.length ? gate.issues[0] : "Begin market contact.";

  return [
    {
      day: "Day 1",
      task: "Rewrite the idea as one sentence: user, problem, solution, outcome.",
      proof: "One clear Founder Frame sentence."
    },
    {
      day: "Day 2",
      task: "Interview or message 3 target users about the problem.",
      proof: "3 notes with exact pain language."
    },
    {
      day: "Day 3",
      task: "Convert the solution into a simple offer or demo promise.",
      proof: "One offer statement."
    },
    {
      day: "Day 4",
      task: "Create a rough prototype, landing page, mockup, or workflow.",
      proof: "Clickable, viewable, or readable artifact."
    },
    {
      day: "Day 5",
      task: "Show the artifact to 3 people and collect objections.",
      proof: "3 objections recorded."
    },
    {
      day: "Day 6",
      task: "Repair the weakest quality gate: " + focus,
      proof: "Updated version with fix."
    },
    {
      day: "Day 7",
      task: "Decide: continue, revise, pause, or kill the idea based on evidence.",
      proof: "One decision memo."
    }
  ];
}

function render(data, score, gate, sprint) {
  const dashboard = document.getElementById("dashboard");
  dashboard.classList.remove("hidden");

  const metricsHtml = Object.entries(score.metrics).map(([key, value]) => `
    <div class="metric">
      <span>${key.toUpperCase()}</span>
      <strong>${value}</strong>
    </div>
  `).join("");

  const issuesHtml = gate.issues.length
    ? gate.issues.map(issue => `<li>${issue}</li>`).join("")
    : "<li>No critical blockers detected. Continue with human review.</li>";

  const sprintHtml = sprint.map(item => `
    <li>
      <strong>${item.day}:</strong> ${item.task}<br />
      <em>Proof:</em> ${item.proof}
    </li>
  `).join("");

  dashboard.innerHTML = `
    <h2>Founder Frame Result</h2>
    <p class="score ${gate.className}">${score.total}/100</p>
    <h3 class="${gate.className}">CLEARANCE Status: ${gate.status}</h3>

    <div class="grid">
      ${metricsHtml}
    </div>

    <h3>Quality Gate Issues</h3>
    <ul>${issuesHtml}</ul>

    <h3>Primitive Extraction</h3>
    <p><strong>Vision:</strong> ${data.vision}</p>
    <p><strong>Problem:</strong> ${data.problem}</p>
    <p><strong>User:</strong> ${data.user}</p>
    <p><strong>Solution:</strong> ${data.solution}</p>

    <h3>7-Day Execution Sprint</h3>
    <ul>${sprintHtml}</ul>

    <h3>CASF Baby Step</h3>
    <p>Complete Day 1 before adding features, styling, automation, or monetization.</p>
  `;

  localStorage.setItem("founderFrameLastRun", JSON.stringify({ data, score, gate, sprint }));
}

document.getElementById("intake-form").addEventListener("submit", function (event) {
  event.preventDefault();

  const data = {
    vision: value("vision"),
    problem: value("problem"),
    user: value("user"),
    solution: value("solution"),
    proof: value("proof"),
    revenue: value("revenue"),
    execution: value("execution")
  };

  const score = scoreFounder(data);
  const gate = qualityGate(score, data);
  const sprint = generateSprint(data, gate);

  render(data, score, gate, sprint);
});
