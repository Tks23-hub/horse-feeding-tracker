document.addEventListener("DOMContentLoaded", () => {
  fetchTodayFeedings();

  document.getElementById("feedForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;

    const res = await fetch("/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const messageEl = document.getElementById("message");

    if (res.ok) {
      const data = await res.json();
      messageEl.style.color = "green";
      messageEl.textContent = `✅ Success: ${name} fed the horse at ${data.time}`;
      fetchTodayFeedings(); // refresh list
    } else {
      const err = await res.json();
      messageEl.style.color = "red";
      messageEl.textContent = `❌ Error: ${err.error}`;
    }

    // Clear password field
    document.getElementById("password").value = "";
  });
});

function fetchTodayFeedings() {
  fetch("/today")
    .then((res) => res.json())
    .then((data) => {
      const ul = document.getElementById("todayFeedings");
      ul.innerHTML = "";

      if (data.length === 0) {
        ul.innerHTML = "<li>No one has fed the horse yet today.</li>";
        return;
      }

      data.forEach((entry) => {
        const li = document.createElement("li");
        li.textContent = `${entry.name} fed the horse at ${entry.time}`;
        ul.appendChild(li);
      });
    })
    .catch((err) => {
      console.error("Error fetching today's feedings:", err);
    });
}
