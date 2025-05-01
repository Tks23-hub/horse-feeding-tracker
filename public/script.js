document.addEventListener("DOMContentLoaded", () => {
  fetchTodayFeedings();
  fetchBagCount();

  document.getElementById("feedForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const password = document.getElementById("password").value;
    const bagCount = document.getElementById("bagCount").value;

    const messageEl = document.getElementById("message");

    if (!name || !password || !bagCount) {
      messageEl.style.color = "red";
      messageEl.textContent = "❌ Please fill in all fields.";
      return;
    }

    try {
      const res = await fetch("/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password, bagCount }),
      });

      if (res.ok) {
        const data = await res.json();
        messageEl.style.color = "green";
        messageEl.textContent = `✅ Success: ${name} fed the horse at ${data.time} | 🧺 Bags left: ${data.bagCount}`;

        fetchTodayFeedings();
        fetchBagCount();
        document.getElementById("feedForm").reset();
      } else {
        const err = await res.json();
        messageEl.style.color = "red";
        messageEl.textContent = `❌ Error: ${err.error}`;
      }
    } catch (err) {
      messageEl.style.color = "red";
      messageEl.textContent = `❌ Network error`;
      console.error(err);
    }
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

function fetchBagCount() {
  fetch("/bag-count")
    .then((res) => res.json())
    .then((data) => {
      document.getElementById(
        "bagCountDisplay"
      ).textContent = `🧺 Current Feed Bags: ${data.count}`;
    })
    .catch((err) => {
      console.error("Error fetching bag count:", err);
    });
}
