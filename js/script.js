// Select DOM elements
const projectForm = document.getElementById('projectForm');
const projectList = document.getElementById('projectList');
const filterStatus = document.getElementById('filterStatus');
const sortOption = document.getElementById('sortOption');
const searchInput = document.getElementById('searchInput');
const milestonesContainer = document.getElementById('milestonesContainer');
const addMilestoneBtn = document.getElementById('addMilestoneBtn');

// Retrieve projects from localStorage or initialize an empty array
let projects = JSON.parse(localStorage.getItem('projects')) || [];

/* -----------------------------------------
   Milestone Input Handling in Project Form
------------------------------------------ */
function addMilestoneRow(name = '', status = 'Not Started') {
  const row = document.createElement('div');
  row.className = 'milestone-row';
  row.innerHTML = `
    <input type="text" class="milestone-name" placeholder="Milestone name" value="${name}" required>
    <select class="milestone-status">
      <option value="Not Started" ${status === 'Not Started' ? 'selected' : ''}>Not Started</option>
      <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
      <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
    </select>
    <button type="button" class="remove-milestone">Remove</button>
  `;
  milestonesContainer.appendChild(row);
  
  row.querySelector('.remove-milestone').addEventListener('click', () => {
    row.remove();
  });
}

addMilestoneBtn.addEventListener('click', () => {
  addMilestoneRow();
});

/* ---------------------------
   Display Projects Function
---------------------------- */
function displayProjects() {
  projectList.innerHTML = '';
  
  // Filter projects based on status and search term
  let filteredProjects = projects.filter(project => {
    const matchesStatus = filterStatus.value === 'all' || project.status === filterStatus.value;
    const searchTerm = searchInput.value.toLowerCase();
    const matchesSearch = project.name.toLowerCase().includes(searchTerm) ||
                          project.description.toLowerCase().includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  // Sort the filtered projects
  if (sortOption.value === 'name') {
    filteredProjects.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortOption.value === 'dueDate') {
    filteredProjects.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }

  // Render each project; store original index via data attributes
  filteredProjects.forEach((project, idx) => {
    const originalIndex = projects.indexOf(project);
    const projectDiv = document.createElement('div');
    // Add a status-specific class based on project.status (converted to lower case without spaces)
    let statusClass = '';
    if (project.status === 'Not Started') {
      statusClass = 'status-not-started';
    } else if (project.status === 'In Progress') {
      statusClass = 'status-in-progress';
    } else if (project.status === 'Completed') {
      statusClass = 'status-completed';
    }
    projectDiv.className = `project ${statusClass}`;
    
// Inside displayProjects(), replace the card markup with something like:
projectDiv.innerHTML = `
  <div class="card-header">
    <strong class="editable" data-field="name" data-index="${originalIndex}">${project.name}</strong> - ${project.status}
    <button class="delete-btn" onclick="confirmDelete(${originalIndex})">X</button>
  </div>
  <div class="card-body">
    <em>Due:</em> ${project.dueDate ? project.dueDate : 'No date set'}<br>
    <span class="editable" data-field="description" data-index="${originalIndex}">${project.description}</span>
  </div>
  <div class="project-controls">
    <select onchange="updateStatus(${originalIndex}, this.value)">
      <option value="Not Started" ${project.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
      <option value="In Progress" ${project.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
      <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
    </select>
    <button class="toggle-milestones" data-index="${originalIndex}">Toggle Milestones</button>
  </div>
  <div class="milestones-list" id="milestones-${originalIndex}">
    ${project.milestones && project.milestones.length
      ? project.milestones.map((m, i) => `
          <div class="milestone-item" data-index="${i}">
            <span class="editable-milestone" data-project-index="${originalIndex}" data-milestone-index="${i}">${m.name}</span>
            <select onchange="updateMilestoneStatus(${originalIndex}, ${i}, this.value)">
              <option value="Not Started" ${m.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
              <option value="In Progress" ${m.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${m.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
            <span class="status-indicator ${m.status === 'Not Started' ? 'status-not-started' : 
              m.status === 'In Progress' ? 'status-in-progress' : 'status-completed'}">${m.status}</span>
          </div>
        `).join('') 
      : '<em>No milestones added</em>'}
    <button class="add-milestone-card" data-project-index="${originalIndex}">Add Milestone</button>
  </div>
`;

    projectList.appendChild(projectDiv);
    
    gsap.from(projectDiv, { opacity: 0, y: 20, duration: 0.5, delay: idx * 0.1 });
  });
}

/* -----------------------------------
   Event Delegation for Inline Editing
-------------------------------------- */
projectList.addEventListener('click', (e) => {
  const target = e.target;
  
  // --- Editable project fields ---
  if (target.classList.contains('editable')) {
    const field = target.getAttribute('data-field');
    const index = target.getAttribute('data-index');
    const currentValue = target.textContent;
    
    const input = document.createElement(field === 'description' ? 'textarea' : 'input');
    input.value = currentValue;
    input.style.fontSize = 'inherit';
    input.style.fontFamily = 'inherit';
    input.setAttribute('data-field', field);
    input.setAttribute('data-index', index);
    
    target.replaceWith(input);
    input.focus();
    
    const saveEdit = () => {
      const newValue = input.value;
      projects[index][field] = newValue;
      localStorage.setItem('projects', JSON.stringify(projects));
      displayProjects();
    };
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && field !== 'description') {
        input.blur();
      }
    });
  }
  
  // --- Editable milestone fields ---
  else if (target.classList.contains('editable-milestone')) {
    const projectIndex = target.getAttribute('data-project-index');
    const milestoneIndex = target.getAttribute('data-milestone-index');
    const currentValue = target.textContent;
    
    const input = document.createElement('input');
    input.value = currentValue;
    input.style.fontSize = 'inherit';
    input.style.fontFamily = 'inherit';
    input.setAttribute('data-project-index', projectIndex);
    input.setAttribute('data-milestone-index', milestoneIndex);
    
    target.replaceWith(input);
    input.focus();
    
    const saveMilestoneEdit = () => {
      const newValue = input.value;
      projects[projectIndex].milestones[milestoneIndex].name = newValue;
      localStorage.setItem('projects', JSON.stringify(projects));
      displayProjects();
    };
    
    input.addEventListener('blur', saveMilestoneEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  }
  
  // --- Toggle Milestones Visibility ---
  else if (target.classList.contains('toggle-milestones')) {
    const index = target.getAttribute('data-index');
    const milestonesDiv = document.getElementById(`milestones-${index}`);
    milestonesDiv.style.display = milestonesDiv.style.display === 'block' ? 'none' : 'block';
  }
  
  // --- Add New Milestone in Card ---
  else if (target.classList.contains('add-milestone-card')) {
    const projectIndex = target.getAttribute('data-project-index');
    const milestonesDiv = document.getElementById(`milestones-${projectIndex}`);
    if (!milestonesDiv.querySelector('.new-milestone')) {
      const newRow = document.createElement('div');
      newRow.className = 'milestone-item new-milestone';
      newRow.innerHTML = `
        <input type="text" placeholder="New milestone name" class="new-milestone-name">
        <select class="new-milestone-status">
          <option value="Not Started">Not Started</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button class="save-new-milestone">Save</button>
        <button class="cancel-new-milestone">Cancel</button>
      `;
      milestonesDiv.appendChild(newRow);
    }
  }
  
  // --- Save New Milestone in Card ---
  else if (target.classList.contains('save-new-milestone')) {
    const newRow = target.closest('.new-milestone');
    const projectIndex = newRow.closest('.milestones-list').id.split('-')[1];
    const nameInput = newRow.querySelector('.new-milestone-name');
    const statusSelect = newRow.querySelector('.new-milestone-status');
    const newName = nameInput.value.trim();
    if (newName === '') {
      alert('Milestone name cannot be empty');
      return;
    }
    const newStatus = statusSelect.value;
    if (!projects[projectIndex].milestones) {
      projects[projectIndex].milestones = [];
    }
    projects[projectIndex].milestones.push({ name: newName, status: newStatus });
    localStorage.setItem('projects', JSON.stringify(projects));
    displayProjects();
  }
  
  // --- Cancel New Milestone ---
  else if (target.classList.contains('cancel-new-milestone')) {
    const newRow = target.closest('.new-milestone');
    newRow.remove();
  }
});

/* ---------------------------
   Form Submission to Add a New Project
---------------------------- */
projectForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('projectName').value;
  const dueDate = document.getElementById('projectDueDate').value;
  const description = document.getElementById('projectDescription').value;
  const status = document.getElementById('projectStatus').value;
  
  // Gather milestones from the form's milestonesContainer
  const milestoneRows = milestonesContainer.querySelectorAll('.milestone-row');
  let milestones = [];
  milestoneRows.forEach(row => {
    const mName = row.querySelector('.milestone-name').value;
    const mStatus = row.querySelector('.milestone-status').value;
    milestones.push({ name: mName, status: mStatus });
  });
  
  projects.push({ name, dueDate, description, status, milestones });
  localStorage.setItem('projects', JSON.stringify(projects));
  displayProjects();
  projectForm.reset();
  milestonesContainer.innerHTML = ''; // Clear milestone inputs in form
});

/* ---------------------------
   Delete and Update Functions
---------------------------- */
function deleteProject(index) {
  projects.splice(index, 1);
  localStorage.setItem('projects', JSON.stringify(projects));
  displayProjects();
}

function updateStatus(index, status) {
  projects[index].status = status;
  localStorage.setItem('projects', JSON.stringify(projects));
  displayProjects();
}

function updateMilestoneStatus(projectIndex, milestoneIndex, status) {
  projects[projectIndex].milestones[milestoneIndex].status = status;
  localStorage.setItem('projects', JSON.stringify(projects));
  displayProjects();
}

/* ---------------------------
   Filter, Sort, and Search Controls
---------------------------- */
filterStatus.addEventListener('change', displayProjects);
sortOption.addEventListener('change', displayProjects);
searchInput.addEventListener('input', displayProjects);

/* ---------------------------
   GSAP Hover Animations
---------------------------- */
document.addEventListener('mouseover', (e) => {
  if (e.target.closest('.project')) {
    gsap.to(e.target.closest('.project'), { scale: 1.02, duration: 0.2 });
  }
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest('.project')) {
    gsap.to(e.target.closest('.project'), { scale: 1, duration: 0.2 });
  }
});

/* ---------------------------
   Modal for Delete Confirmation
---------------------------- */
let projectIndexToDelete = null;
function confirmDelete(index) {
  projectIndexToDelete = index;
  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
  gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.3 });
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  if (projectIndexToDelete !== null) {
    deleteProject(projectIndexToDelete);
    projectIndexToDelete = null;
  }
  closeModal();
});

document.getElementById('cancelDeleteBtn').addEventListener('click', closeModal);

function closeModal() {
  const modal = document.getElementById('modal');
  gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: () => {
    modal.classList.add('hidden');
  }});
}

/* ---------------------------
   Initial Display
---------------------------- */
displayProjects();
