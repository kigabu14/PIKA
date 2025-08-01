const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_URL/exec";
let employees = [];
let selectedMonth = new Date().getMonth();
let selectedYear = new Date().getFullYear();
let selectedEmployee = null;

const employeeSelect = document.getElementById("employeeSelect");
const calendarGrid = document.getElementById("calendarGrid");
const currentMonthLabel = document.getElementById("currentMonth");

function loadEmployees() {
  fetch(`${API_URL}?listEmployees=true`)
    .then(res => res.json())
    .then(data => {
      employees = data.employees;
      employees.forEach(emp => {
        const option = document.createElement("option");
        option.value = emp.empId;
        option.textContent = `👤 ${emp.name}`;
        employeeSelect.appendChild(option);
      });
    });
}

employeeSelect.addEventListener("change", () => {
  const empId = employeeSelect.value;
  selectedEmployee = employees.find(e => e.empId === empId);
  renderCalendar();
});

function renderCalendar() {
  if (!selectedEmployee) return;

  const firstDay = new Date(selectedYear, selectedMonth, 1);
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
  const today = new Date();
  calendarGrid.innerHTML = "";
  currentMonthLabel.textContent = firstDay.toLocaleString("th-TH", { month: "long", year: "numeric" });

  fetch(`${API_URL}?empId=${selectedEmployee.empId}&month=${selectedMonth + 1}&year=${selectedYear}`)
    .then(res => res.json())
    .then(data => {
      const workDates = data.workDates.map(d => new Date(d).toDateString());
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const day = new Date(selectedYear, selectedMonth, d);
        const box = document.createElement("div");
        box.className = "border p-2 rounded text-center";
        box.textContent = d;

        if (day.toDateString() === today.toDateString()) box.classList.add("bg-red-100");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = workDates.includes(day.toDateString());
        checkbox.onclick = () => toggleWorkDate(day);
        box.appendChild(document.createElement("br"));
        box.appendChild(checkbox);
        calendarGrid.appendChild(box);
      }
    });
}

function toggleWorkDate(date) {
  fetch(`${API_URL}?toggleWork=true`, {
    method: "POST",
    body: JSON.stringify({
      empId: selectedEmployee.empId,
      dateStr: date.toISOString().split("T")[0]
    })
  }).then(() => renderCalendar());
}

document.getElementById("prevMonth").onclick = () => {
  selectedMonth--;
  if (selectedMonth < 0) {
    selectedMonth = 11;
    selectedYear--;
  }
  renderCalendar();
};

document.getElementById("nextMonth").onclick = () => {
  selectedMonth++;
  if (selectedMonth > 11) {
    selectedMonth = 0;
    selectedYear++;
  }
  renderCalendar();
};

document.getElementById("exportReport").onclick = () => {
  const empId = selectedEmployee.empId;
  fetch(`${API_URL}?report=true&empId=${empId}&month=${selectedMonth + 1}&year=${selectedYear}`)
    .then(res => res.text())
    .then(text => {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `รายงาน_${selectedEmployee.name}_${selectedMonth + 1}.txt`;
      a.click();
    });
};

document.getElementById("exportAllBtn").onclick = () => {
  fetch(`${API_URL}?all=true&month=${selectedMonth + 1}&year=${selectedYear}`)
    .then(res => res.text())
    .then(text => {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `รายงานรวมเดือน_${selectedMonth + 1}.txt`;
      a.click();
    });
};

document.getElementById("addEmpBtn").onclick = () => {
  const empId = prompt("รหัสพนักงาน:");
  const name = prompt("ชื่อพนักงาน:");
  const position = prompt("ตำแหน่ง:");
  const salary = Number(prompt("ค่าแรงต่อวัน:"));

  if (!empId || !name || !position || isNaN(salary)) return alert("ข้อมูลไม่ครบ");

  fetch(`${API_URL}?addEmployee=true`, {
    method: "POST",
    body: JSON.stringify({ empId, name, position, salary }),
  }).then(() => {
    alert("เพิ่มพนักงานสำเร็จ");
    location.reload();
  });
};

loadEmployees();