/* Vandan Kutch Travels - shared JavaScript
   IMPORTANT: replace the WhatsApp number below with your real business number.
   Format: country code + number, digits only. Example: 919876543210
*/
const CONFIG = {
  whatsappNumber: "919913747955",
  callNumber: "919913747955",
  currency: "₹",
  advancePercent: 20
};

// Editable estimate rules. Replace these with your actual fare/rate rules.
const FARES = {
  perKm: 18,
  minimumKm: 0
};

function waUrl(message) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function generalWhatsAppMessage() {
  return `Hello Vandan Kutch Travels, I want to book a ride. Please share availability and fare details.`;
}

function getBookings() {
  try { return JSON.parse(localStorage.getItem("vkt_bookings") || "[]"); }
  catch { return []; }
}

function saveBookings(bookings) {
  localStorage.setItem("vkt_bookings", JSON.stringify(bookings));
}

function money(value) {
  return `${CONFIG.currency}${Number(value || 0).toLocaleString("en-IN")}`;
}

function estimateFare(service, passengers, distanceKm = 0) {
  const km = Number(distanceKm || 0);
  if (km <= 0) return 0;
  return km * FARES.perKm;
}

function bookingMessage(b) {
  return [
    "🚕 *NEW BOOKING REQUEST*",
    "",
    `Name: ${b.name}`,
    `Mobile: ${b.mobile}`,
    `Service: ${b.service}`,
    b.tour ? `Tour: ${b.tour}` : "",
    `Pickup: ${b.pickup}`,
    `Drop: ${b.drop}`,
    b.airport ? `Airport: ${b.airport}` : "",
    `Date: ${b.date}`,
    `Time: ${b.time}`,
    `Passengers: ${b.passengers}`,\n    `Distance: ${b.distance} KM`,\n    `Rate: ₹${FARES.perKm}/KM`,
    `Distance: ${b.distance} KM`,
    `Rate: ₹${FARES.perKm}/KM`,
    `Estimated Fare: ${money(b.fare)}`,
    `Advance (20%): ${money(Math.round(b.fare * CONFIG.advancePercent / 100))}`,
    "",
    "Final fare will be confirmed by Vandan Kutch Travels."
  ].filter(Boolean).join("\n");
}

function initGeneralWhatsApp() {
  document.querySelectorAll("[data-whatsapp-general]").forEach(el => {
    el.href = waUrl(generalWhatsAppMessage());
    el.target = "_blank";
    el.rel = "noopener";
  });
  document.querySelectorAll("[data-call]").forEach(el => {
    el.href = `tel:+${CONFIG.callNumber}`;
  });
}

function initBookingPage() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  const params = new URLSearchParams(location.search);
  const service = document.getElementById("service");
  const tour = params.get("tour");

  if (params.get("service")) service.value = params.get("service");
  if (tour) {
    const drop = document.getElementById("drop");
    drop.value = tour;
  }

  const date = document.getElementById("date");
  date.min = new Date().toISOString().split("T")[0];

  const estimateBtn = document.getElementById("estimateBtn");
  const fareEl = document.getElementById("fare");
  const messageEl = document.getElementById("formMessage");

  function calculate() {
    const fare = estimateFare(service.value, document.getElementById("passengers").value, document.getElementById("distance").value);
    fareEl.textContent = fare ? money(fare) : "₹ —";
    return fare;
  }

  estimateBtn.addEventListener("click", () => {
    if (!service.value) {
      messageEl.textContent = "Please select a service first.";
      messageEl.className = "form-message error";
      return;
    }
    calculate();
    messageEl.textContent = "Estimate calculated. Final fare will be confirmed by Vandan.";
    messageEl.className = "form-message success";
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    messageEl.textContent = "";

    const data = Object.fromEntries(new FormData(form).entries());
    if (!/^[6-9]\d{9}$/.test(data.mobile)) {
      messageEl.textContent = "Please enter a valid 10-digit Indian mobile number.";
      messageEl.className = "form-message error";
      return;
    }
    if (Number(data.passengers) < 1 || Number(data.passengers) > 7) {
      messageEl.textContent = "Passengers must be between 1 and 7.";
      messageEl.className = "form-message error";
      return;
    }

    const fare = calculate();
    const booking = {
      id: "VKT-" + Date.now().toString().slice(-8),
      ...data,
      tour: tour || "",
      fare,
      createdAt: new Date().toISOString(),
      status: "WhatsApp Pending"
    };

    const bookings = getBookings();
    bookings.unshift(booking);
    saveBookings(bookings);

    if (CONFIG.whatsappNumber.includes("X")) {
      messageEl.textContent = "Booking saved, but WhatsApp number is not configured. Replace CONFIG.whatsappNumber in js/app.js.";
      messageEl.className = "form-message error";
      return;
    }

    window.open(waUrl(bookingMessage(booking)), "_blank", "noopener");
    messageEl.textContent = `Booking ${booking.id} saved. WhatsApp opened with the booking message.`;
    messageEl.className = "form-message success";
  });
}

function initBookingsPage() {
  const list = document.getElementById("bookingList");
  if (!list) return;

  const bookings = getBookings();
  if (!bookings.length) {
    list.innerHTML = `
      <section class="card empty">
        <div class="emoji">📋</div>
        <h2>No bookings yet.</h2>
        <p class="muted">Book your first ride from the Book tab.</p>
        <a class="btn primary" href="booking.html">🚕 Book Your Ride</a>
      </section>`;
    return;
  }

  list.innerHTML = bookings.map(b => `
    <article class="card booking-item">
      <div class="booking-head">
        <div><strong>${escapeHtml(b.id)}</strong><div class="muted">${escapeHtml(b.service)}</div></div>
        <span class="status">${escapeHtml(b.status)}</span>
      </div>
      <div class="booking-meta">
        <div class="meta"><small>Passenger</small><b>${escapeHtml(b.name)}</b></div>
        <div class="meta"><small>Date & Time</small><b>${escapeHtml(b.date)} • ${escapeHtml(b.time)}</b></div>
        <div class="meta"><small>Route</small><b>${escapeHtml(b.pickup)} → ${escapeHtml(b.drop)}</b></div>
        <div class="meta"><small>Estimate</small><b>${money(b.fare)}</b></div>
      </div>
    </article>
  `).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

document.addEventListener("DOMContentLoaded", () => {
  initGeneralWhatsApp();
  initBookingPage();
  initBookingsPage();
});
