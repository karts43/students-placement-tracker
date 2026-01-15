/* =======================
   GLOBAL CONFIG & STATE
======================= */
const BASE = "https://placementstracker-4.onrender.com/api";

let students = [];
let selectedId = null;
let mode = "view"; // add | edit

/* =======================
   NAVIGATION
======================= */
const showPage = id => {
  document.querySelectorAll(".page").forEach(p =>
    p.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");

  // 🔹 SAFE triggers (no overlap)
  if (id === "students") {
    loadStudents();
  }

  if (id === "colleges") {
    loadColleges();
  }

  if (id === "companies") {
    loadCompanies();
  }

  if (id === "jobs") {
    loadJobRoles();
  }

};

/* =======================
   LOAD STUDENTS
======================= */
const loadStudents = async () => {
  const res = await fetch(`${BASE}/students`);
  students = await res.json();
  updateDashboard();
  renderStudents(students);
};

/* =======================
   RENDER STUDENTS LIST
======================= */
const renderStudents = data => {
  show.innerHTML = data.map(s => `
    <div class="card" onclick='openViewPanel(${JSON.stringify(s)})'>
      <h3>${s.personal_info.full_name}</h3>
      <p>${s.academic_info.department}</p>
      <p class="${s.placement_status}">${s.placement_status}</p>
    </div>
  `).join("");
};

/* =======================
   DASHBOARD (HOME)
======================= */
const updateDashboard = () => {
  total.innerText = students.length;
  placed.innerText = students.filter(s => s.placement_status === "Placed").length;
  notPlaced.innerText = students.filter(s => s.placement_status === "Not Placed").length;

  renderDepartmentAnalytics();
  renderYearAnalytics();   // ✅ NEW
};

/* =======================
   PLACEMENT ANALYTICS
======================= */

const renderDepartmentAnalytics = () => {
  const deptMap = {};

  students.forEach(s => {
    const dept = s.academic_info.department;
    if (!deptMap[dept]) {
      deptMap[dept] = { total: 0, placed: 0 };
    }
    deptMap[dept].total++;
    if (s.placement_status === "Placed") {
      deptMap[dept].placed++;
    }
  });

  deptAnalytics.innerHTML = Object.keys(deptMap).map(d => {
    const pct = Math.round(
      (deptMap[d].placed / deptMap[d].total) * 100
    );

    return `
      <div class="card">
        <h3>${d}</h3>
        <p>Total: ${deptMap[d].total}</p>
        <p>Placed: ${deptMap[d].placed}</p>
        <p><b>${pct}% Placed</b></p>
      </div>
    `;
  }).join("");
};

/* =======================
   YEAR-WISE PLACEMENT TREND
======================= */

const renderYearAnalytics = () => {
  const yearMap = {};

  students.forEach(s => {
    const year = s.academic_info.graduation_year;

    if (!yearMap[year]) {
      yearMap[year] = { total: 0, placed: 0 };
    }

    yearMap[year].total++;

    if (s.placement_status === "Placed") {
      yearMap[year].placed++;
    }
  });

  yearAnalytics.innerHTML = Object.keys(yearMap)
    .sort()
    .map(year => {
      const placed = yearMap[year].placed;
      const total = yearMap[year].total;
      const percent = Math.round((placed / total) * 100);

      return `
        <div class="card">
          <h3>Batch ${year}</h3>
          <p>Total Students: ${total}</p>
          <p>Placed: ${placed}</p>
          <p><b>${percent}% Placement</b></p>
        </div>
      `;
    }).join("");
};

/* =======================
   SEARCH STUDENTS
======================= */
search.addEventListener("input", e => {
  const value = e.target.value.toLowerCase();
  renderStudents(
    students.filter(s =>
      s.personal_info.full_name.toLowerCase().includes(value)
    )
  );
});

/* =======================
   SLIDE PANEL – VIEW / EDIT
======================= */
const openViewPanel = s => {
  mode = "edit";
  selectedId = s.student_id;
  panelTitle.innerText = "Student Profile";

  pName.value = s.personal_info.full_name;
  pGender.value = s.personal_info.gender;
  pDob.value = s.personal_info.date_of_birth;

  pCollege.value = s.academic_info.college_id;
  pDept.value = s.academic_info.department;
  pDegree.value = s.academic_info.degree;
  pYear.value = s.academic_info.graduation_year;
  pCgpa.value = s.academic_info.cgpa;
  pBacklogs.value = s.academic_info.backlogs;

  pSkills.value = s.skills.programming.join(", ");
  pStatus.value = s.placement_status;

  panel.classList.remove("hidden");
};

/* =======================
   OPEN PANEL – ADD STUDENT
======================= */
const openAddPanel = () => {
  mode = "add";
  selectedId = null;
  panelTitle.innerText = "Add New Student";

  document.querySelectorAll("#panel input").forEach(i => i.value = "");
  pStatus.value = "Not Placed";

  panel.classList.remove("hidden");
};

/* =======================
   SAVE STUDENT (POST / PUT)
======================= */
const saveStudent = async () => {
  const payload = {
    personal_info: {
      full_name: pName.value,
      gender: pGender.value,
      date_of_birth: pDob.value,
      profile_image: "string"
    },
    academic_info: {
      college_id: pCollege.value,
      department: pDept.value,
      degree: pDegree.value,
      graduation_year: +pYear.value,
      cgpa: +pCgpa.value,
      backlogs: +pBacklogs.value
    },
    skills: {
      programming: pSkills.value.split(",").map(s => s.trim()),
      databases: [],
      tools: []
    },
    placement_status: pStatus.value
  };

  await fetch(
    mode === "add"
      ? `${BASE}/students`
      : `${BASE}/students/${selectedId}`,
    {
      method: mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  closePanel();
  loadStudents();
};

/* =======================
   DELETE STUDENT
======================= */
const deleteStudent = async () => {
  if (!selectedId || !confirm("Delete student?")) return;

  await fetch(`${BASE}/students/${selectedId}`, {
    method: "DELETE"
  });

  closePanel();
  loadStudents();
};

/* =======================
   CLOSE PANEL
======================= */
const closePanel = () => {
  panel.classList.add("hidden");
  selectedId = null;
};

/* =======================
   INIT APP
======================= */
loadStudents();

/* ==================================================
   ================= COLLEGES MODULE =================
================================================== */

let collegeData = [];
let activeCollegeId = null;
let collegeFormMode = "view"; // add | edit

/* LOAD COLLEGES */
const loadColleges = async () => {
  const res = await fetch(`${BASE}/colleges`);
  collegeData = await res.json();
  renderCollegeCards(collegeData);
};

/* NORMALIZE COLLEGE (handles mixed schemas) */
const normalizeCollege = c => ({
  id: c.college_id || "",
  name: c.name || c.college_name || "",
  type: c.type || "",
  affiliated: c.affiliated_to || "",
  year: c.established_year || "",
  total: c.total_students || "",
  city: c.location?.city || c.city || "",
  state: c.location?.state || c.state || "",
  country: c.location?.country || "India",
  pincode: c.location?.pincode || "",
  departments: c.departments || []
});


/* RENDER COLLEGES LIST */
const renderCollegeCards = data => {
  collegeList.innerHTML = data.map(raw => {
    const c = normalizeCollege(raw);

    return `
      <div class="card" onclick='openCollegePanel(${JSON.stringify(raw)})'>
        <h3>${c.name}</h3>
        <p>${c.city}, ${c.state}</p>
        <p><b>Total Students:</b> ${c.total || "-"}</p>
      </div>
    `;
  }).join("");
};

/* OPEN COLLEGE PANEL – VIEW / EDIT */
const openCollegePanel = raw => {
  const c = normalizeCollege(raw);

  collegeFormMode = "edit";
  activeCollegeId = c.id;
  collegePanelTitle.innerText = "College Profile";

  cName.value = c.name;
  cType.value = c.type;
  cAffiliated.value = c.affiliated;
  cYear.value = c.year;
  cStudents.value = c.total;

  cCity.value = c.city;
  cState.value = c.state;
  cCountry.value = c.country;
  cPincode.value = c.pincode;

  cDepartments.value = c.departments.join(", ");

  collegePanel.classList.remove("hidden");
};


/* OPEN COLLEGE PANEL – ADD MODE */
const openAddCollegePanel = () => {
  collegeFormMode = "add";
  activeCollegeId = null;
  collegePanelTitle.innerText = "Add New College";

  cName.value = "";
  cCity.value = "";
  cState.value = "";

  collegePanel.classList.remove("hidden");
};

/* SAVE COLLEGE (POST / PUT) */
const saveCollege = async () => {
  const payload = {
    name: cName.value,
    type: cType.value,
    affiliated_to: cAffiliated.value,
    established_year: Number(cYear.value),
    total_students: Number(cStudents.value),
    departments: cDepartments.value.split(",").map(d => d.trim()),
    location: {
      city: cCity.value,
      state: cState.value,
      country: cCountry.value || "India",
      pincode: cPincode.value
    }
  };

  await fetch(
    collegeFormMode === "add"
      ? `${BASE}/colleges`
      : `${BASE}/colleges/${activeCollegeId}`,
    {
      method: collegeFormMode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  closeCollegePanel();
  loadColleges();
};


/* DELETE COLLEGE */
const deleteCollege = async () => {
  if (!activeCollegeId || !confirm("Delete college?")) return;

  await fetch(`${BASE}/colleges/${activeCollegeId}`, {
    method: "DELETE"
  });

  closeCollegePanel();
  loadColleges();
};

/* CLOSE COLLEGE PANEL */
const closeCollegePanel = () => {
  collegePanel.classList.add("hidden");
  activeCollegeId = null;
};

/* =======================
   COMPANIES (GET + POST ONLY)
======================= */

// const BASE = "https://placementstracker-4.onrender.com/api";

let companies = [];

/* LOAD COMPANIES (GET) */
const loadCompanies = async () => {
  const res = await fetch(`${BASE}/companies`);
  companies = await res.json();

  // show only valid companies
  const valid = companies.filter(c => c.company_id && c.name);
  renderCompanies(valid);
};

/* RENDER COMPANIES LIST */
const renderCompanies = data => {
  companyList.innerHTML = data.map(c => `
    <div class="card">
      <h3>${c.name}</h3>
      <p><b>Industry:</b> ${c.industry}</p>
      <p><b>ID:</b> ${c.company_id}</p>
    </div>
  `).join("");
};

/* ADD NEW COMPANY (POST) */
const addCompany = async () => {
  const payload = {
    name: compName.value,
    industry: compIndustry.value
  };

  await fetch(`${BASE}/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  compName.value = "";
  compIndustry.value = "";

  loadCompanies();
};

/* =======================
   JOB ROLES (GET + POST)
======================= */

let jobRoles = [];

/* LOAD JOB ROLES */
const loadJobRoles = async () => {
  const res = await fetch(`${BASE}/job-roles`);
  jobRoles = await res.json();
  renderJobRoles(jobRoles);
};

/* RENDER JOB ROLES */
const renderJobRoles = data => {
  jobRoleList.innerHTML = data.map(r => `
    <div class="card">
      <h3>${r.title}</h3>
      <p><b>Role ID:</b> ${r.role_id}</p>
    </div>
  `).join("");
};

/* ADD JOB ROLE */
const addJobRole = async () => {
  if (!jobTitle.value.trim()) return alert("Enter job title");

  const payload = {
    title: jobTitle.value
  };

  await fetch(`${BASE}/job-roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  jobTitle.value = "";
  loadJobRoles();
};

/* INIT */
showPage("home");
loadStudents(); // only for dashboard numbers