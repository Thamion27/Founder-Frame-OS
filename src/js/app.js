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

function containsAny(text, phrases) {
  const lower = text.toLowerCase();
  return phrases.some(phrase => lower.includes(phrase));
}

function scoreRevenue(text) {
  const lower = text.toLowerCase();
  const weakPhrases = ["maybe", "someday", "eventually", "not sure", "might", "could"];
  const genericRevenue = ["subscription", "subscriptions", "ads", "donations", "affiliate"];
  const concreteSignals = ["$", "per month", "monthly", "one-time", "paid", "price", "client", "customer", "pilot", "invoice", "retainer", "tier", "package", "deposit"];

  if (!text) return 0;
  if (weakPhrases.some(phrase => lower.includes(phrase))) return 35;
  if (genericRevenue.some(phrase => lower.includes(phrase)) && text.length < 60) return 35;
  if (concreteSignals.some(signal => lower.includes(signal)) && text.length >= 50) return 100;
  if (text.length >= 80) return 70;
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
    revenue: scoreRevenue(data.revenue),
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

function assessRiskAndClaims(data, score, gate) {
  const combinedText = Object.values(data).join(" ");
  const riskFlags = [];
  const claimFlags = [];
  const boundaryFlags = [
    "External release, monetization, controlled user testing, institutional use, customer-facing deployment, and external claims remain paused."
  ];

  const overbroadAudienceSignals = ["everyone", "everybody", "anyone", "all people", "the public", "general public"];
  const weakProofSignals = ["none", "no proof", "not yet", "nothing", "no evidence", "no validation"];
  const prohibitedClaimSignals = ["guarantee", "guaranteed", "proven", "certified", "cures", "treats", "legal compliance", "investment returns", "automatic success"];
  const externalUseSignals = ["public", "launch", "release", "customers", "clients", "sell", "paid", "subscription", "subscriptions", "school", "students", "institution", "workplace", "employees"];
  const regulatedSignals = ["medical", "therapy", "clinical", "legal", "investment", "financial advice", "minors", "patients"];

  if (containsAny(data.user, overbroadAudienceSignals)) {
    riskFlags.push("Target audience is overbroad. Narrow to one specific user segment before outreach or product expansion.");
  }

  if (score.metrics.problem < 70) {
    riskFlags.push("Problem clarity is weak. A vague problem increases build risk and claim risk.");
  }

  if (score.metrics.revenue < 70) {
    riskFlags.push("Revenue path is unclear. Monetization should remain paused until buyer, price, and value are defined.");
  }

  if (score.metrics.execution < 70) {
    riskFlags.push("Execution commitment is vague or not time-bound. Require a concrete next action before expansion.");
  }

  if (!data.proof || containsAny(data.proof, weakProofSignals)) {
    claimFlags.push("Proof is missing or explicitly absent. Do not make external effectiveness claims.");
  }

  if (containsAny(data.solution, ["ai will solve", "ai solves", "automatic", "autonomous"])) {
    claimFlags.push("Solution language may imply autonomous or guaranteed AI authority. Reframe as support until validated.");
  }

  if (containsAny(combinedText, prohibitedClaimSignals)) {
    claimFlags.push("Potential prohibited claim language detected. Remove guarantees, certifications, treatment claims, and outcome promises.");
  }

  if (containsAny(combinedText, regulatedSignals)) {
    boundaryFlags.push("Regulated-domain language detected. Professional review may be required before external use.");
  }

  if (containsAny(combinedText, externalUseSignals)) {
    boundaryFlags.push("External-use or monetization language detected. CLEARANCE review is required before real-world exposure.");
  }

  const boundarySignalCount = Math.max(0, boundaryFlags.length - 1);
  const flagCount = riskFlags.length + claimFlags.length + boundarySignalCount;

  let status = "Risk Review: Internal Review May Continue";
  let className = "pass";

  if (flagCount > 0) {
    status = "Risk Review: Revise Before External Claims";
    className = "warn";
  }

  if (flagCount >= 4 || claimFlags.length >= 2 || gate.status === "Not Ready") {
    status = "Risk Review: Not Cleared for External Use";
    className = "fail";
  }

  return {
    status,
    className,
    riskFlags,
    claimFlags,
    boundaryFlags
  };
}
function assessClearanceReadiness(data, score, gate, riskClaims, humanApproval) {
  const present = [];
  const missing = [];
  const internalOnly = [];

  present.push("Founder intake record captured.");
  present.push("Risk and Claims Review generated.");
  present.push("Internal prototype posture preserved: PROCEED INTERNAL / PAUSE EXTERNAL.");

  if (humanApproval.approved) {
    present.push("Human authority attestation recorded.");
  } else {
    missing.push("Human authority attestation is missing.");
  }

  if (score.metrics.user >= 70) {
    present.push("Intended audience is specific enough for internal review.");
  } else {
    missing.push("Intended audience is too broad or unclear.");
  }

  if (score.metrics.problem >= 70 && score.metrics.solution >= 70) {
    present.push("Use case has enough problem and solution clarity for internal review.");
  } else {
    missing.push("Use case statement remains incomplete.");
  }

  if (score.metrics.proof >= 70) {
    present.push("Initial validation evidence or proof signal is present.");
  } else {
    missing.push("Validation evidence is weak or missing.");
  }

  if (riskClaims.claimFlags.length === 0) {
    present.push("No major claims flags detected in this run.");
  } else {
    missing.push("Claims Sheet is not ready because claims require revision.");
  }

  if (riskClaims.riskFlags.length === 0) {
    present.push("No major risk flags detected in this run.");
  } else {
    missing.push("Risk Sheet is not ready because risk flags remain unresolved.");
  }

  internalOnly.push("Executive Summary, ETSS, and Full Blueprint exist as upstream governance artifacts, but this static MVP does not verify the full packet.");
  internalOnly.push("Public-Safe Language Sheet is not yet generated inside the app.");
  internalOnly.push("Pause / rollback plan is represented only by the current internal posture.");
  internalOnly.push("CFO, legal, compliance, or professional reviews are not recorded in this static MVP.");
  internalOnly.push("CLEARANCE review has not been granted.");

  const ready = missing.length === 0 && gate.status !== "Not Ready" && riskClaims.className !== "fail" && humanApproval.approved;

  return {
    status: ready ? "CLEARANCE Packet: Internal Checklist Looks Complete" : "CLEARANCE Packet: Incomplete",
    className: ready ? "pass" : "fail",
    present,
    missing,
    internalOnly
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

function listHtml(items, fallback) {
  const list = items.length ? items : [fallback];
  return list.map(item => `<li>${item}</li>`).join("");
}

function render(data, score, gate, sprint, riskClaims, humanApproval, clearanceReadiness) {
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

    <h3>Risk and Claims Review</h3>
    <div class="risk-panel ${riskClaims.className}">
      <p><strong>${riskClaims.status}</strong></p>

      <h4>Risk Flags</h4>
      <ul>${listHtml(riskClaims.riskFlags, "No major risk flags detected. Continue with human review.")}</ul>

      <h4>Claims Flags</h4>
      <ul>${listHtml(riskClaims.claimFlags, "No major claim flags detected. Keep claims bounded and evidence-aware.")}</ul>

      <h4>Boundary Reminder</h4>
      <ul>${listHtml(riskClaims.boundaryFlags, "External use remains paused until CLEARANCE review.")}</ul>
    </div>

        <h3>Human Approval Attestation</h3>
    <div class="attestation-panel ${humanApproval.approved ? "pass" : "fail"}">
      <p><strong>${humanApproval.status}</strong></p>
      <ul>${listHtml(humanApproval.statements, "External use remains paused until CLEARANCE review.")}</ul>
    </div>

    <h3>CLEARANCE Packet Readiness</h3>
    <div class="clearance-readiness-panel ${clearanceReadiness.className}">
      <p><strong>${clearanceReadiness.status}</strong></p>

      <h4>Present Evidence</h4>
      <ul>${listHtml(clearanceReadiness.present, "No readiness evidence recorded.")}</ul>

      <h4>Missing or Unresolved</h4>
      <ul>${listHtml(clearanceReadiness.missing, "No missing items detected in this internal checklist.")}</ul>

      <h4>Internal-Only Limits</h4>
      <ul>${listHtml(clearanceReadiness.internalOnly, "External use remains paused until CLEARANCE review.")}</ul>
    </div>

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

    localStorage.setItem("founderFrameLastRun", JSON.stringify({ data, score, gate, sprint, riskClaims, humanApproval, clearanceReadiness }));
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

  const humanApprovalChecked = document.getElementById("human-approval").checked;
  const humanApproval = {
    approved: humanApprovalChecked,
    status: humanApprovalChecked ? "Human Approval: Acknowledged" : "Human Approval: Missing",
    statements: [
      "The human operator acknowledged this is an internal prototype result.",
      "This acknowledgment does not authorize public release, monetization, controlled user testing, institutional use, customer-facing deployment, or external claims.",
      "CLEARANCE review remains required before real-world exposure."
    ]
  };

    const score = scoreFounder(data);
  const gate = qualityGate(score, data);
  const sprint = generateSprint(data, gate);
  const riskClaims = assessRiskAndClaims(data, score, gate);
  const clearanceReadiness = assessClearanceReadiness(data, score, gate, riskClaims, humanApproval);

  render(data, score, gate, sprint, riskClaims, humanApproval, clearanceReadiness);
});
