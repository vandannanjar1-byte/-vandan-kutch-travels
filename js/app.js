/* Vandan Kutch Travels - shared JavaScript */

const CONFIG = {
  whatsappNumber: "919913747955",
  callNumber: "919913747955",
  currency: "₹",
  advancePercent: 20
};

const FARES = {
  perKm: 18,
  minimumKm: 0
};


/* =========================
   WHATSAPP
========================= */

function waUrl(message) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function generalWhatsAppMessage() {
  return "Hello Vandan Kutch Travels, I want to book a ride. Please share availability and fare details.";
}


/* =========================
   BOOKINGS STORAGE
========================= */

function getBookings() {
  try {
    return JSON.parse(localStorage.getItem("vkt_bookings") || "[]");
  } catch (error) {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem("vkt_bookings", JSON.stringify(bookings));
}


/* =========================
   MONEY
========================= */

function money(value) {
  return `${CONFIG.currency}${Number(value || 0).toLocaleString("en-IN")}`;
}


/* =========================
   FARE CALCULATION
========================= */

function estimateFare(service, passengers, distanceKm) {
  const km = Number(distanceKm || 0);

  if (km <= 0) {
    return 0;
  }

  return km * FARES.perKm;
}


/* =========================
   WHATSAPP BOOKING MESSAGE
========================= */

function bookingMessage(b) {
  return [
    "🚕 NEW BOOKING REQUEST",
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
    `Passengers: ${b.passengers}`,
    `Distance: ${b.distance} KM`,
    `Rate: ₹${FARES.perKm}/KM`,
    `Estimated Fare: ${money(b.fare)}`,
    `Advance (20%): ${money(
      Math.round(b.fare * CONFIG.advancePercent / 100)
    )}`,
    "",
    "Final fare will be confirmed by Vandan Kutch Travels."
  ]
    .filter(Boolean)
    .join("\n");
}


/* =========================
   GENERAL WHATSAPP BUTTON
========================= */

function initGeneralWhatsApp() {

  document.querySelectorAll("[data-whatsapp-general]").forEach(el => {

    el.href = waUrl(generalWhatsAppMessage());

    el.target = "_blank";

    el.rel = "noopener noreferrer";

  });


  document.querySelectorAll("[data-call]").forEach(el => {

    el.href = `tel:+${CONFIG.callNumber}`;

  });

}


/* =========================
   BOOKING PAGE
========================= */

function initBookingPage() {

  const form = document.getElementById("bookingForm");

  if (!form) {
    return;
  }


  const params = new URLSearchParams(window.location.search);

  const service = document.getElementById("service");

  const tour = params.get("tour");


  if (params.get("service") && service) {

    service.value = params.get("service");

  }


  if (tour) {

    const drop = document.getElementById("drop");

    if (drop) {
      drop.value = tour;
    }

  }


  /* DATE */

  const date = document.getElementById("date");

  if (date) {

    const today = new Date();

    const yyyy = today.getFullYear();

    const mm = String(today.getMonth() + 1).padStart(2, "0");

    const dd = String(today.getDate()).padStart(2, "0");

    date.min = `${yyyy}-${mm}-${dd}`;

  }


  const estimateBtn = document.getElementById("estimateBtn");

  const fareEl = document.getElementById("fare");

  const messageEl = document.getElementById("formMessage");


  /* =========================
     CALCULATE
  ========================= */

  function calculate() {

    const distanceInput =
      document.getElementById("distance");

    const passengersInput =
      document.getElementById("passengers");


    const distance =
      distanceInput ? distanceInput.value : 0;

    const passengers =
      passengersInput ? passengersInput.value : 1;


    const fare = estimateFare(
      service ? service.value : "",
      passengers,
      distance
    );


    if (fareEl) {

      fareEl.textContent =
        fare > 0 ? money(fare) : "₹ —";

    }


    return fare;

  }


  /* =========================
     ESTIMATE BUTTON
  ========================= */

  if (estimateBtn) {

    estimateBtn.type = "button";

    estimateBtn.addEventListener("click", function () {

      if (!service || !service.value) {

        if (messageEl) {

          messageEl.textContent =
            "Please select a service first.";

          messageEl.className =
            "form-message error";

        }

        return;

      }


      const distance =
        document.getElementById("distance");


      if (!distance || Number(distance.value) <= 0) {

        if (messageEl) {

          messageEl.textContent =
            "Please enter distance in KM.";

          messageEl.className =
            "form-message error";

        }

        return;

      }


      calculate();


      if (messageEl) {

        messageEl.textContent =
          "Estimate calculated successfully.";

        messageEl.className =
          "form-message success";

      }

    });

  }


  /* =========================
     FORM SUBMIT / WHATSAPP
  ========================= */

  form.addEventListener("submit", function (e) {

    e.preventDefault();


    if (messageEl) {
      messageEl.textContent = "";
    }


    const data =
      Object.fromEntries(
        new FormData(form).entries()
      );


    /* MOBILE VALIDATION */

    if (!/^[6-9]\d{9}$/.test(data.mobile)) {

      if (messageEl) {

        messageEl.textContent =
          "Please enter a valid 10-digit Indian mobile number.";

        messageEl.className =
          "form-message error";

      }

      return;

    }


    /* PASSENGER VALIDATION */

    if (
      Number(data.passengers) < 1 ||
      Number(data.passengers) > 7
    ) {

      if (messageEl) {

        messageEl.textContent =
          "Passengers must be between 1 and 7.";

        messageEl.className =
          "form-message error";

      }

      return;

    }


    /* DISTANCE VALIDATION */

    if (Number(data.distance) <= 0) {

      if (messageEl) {

        messageEl.textContent =
          "Please enter distance in KM.";

        messageEl.className =
          "form-message error";

      }

      return;

    }


    const fare = calculate();


    /* CREATE BOOKING */

    const booking = {

      id:
        "VKT-" +
        Date.now().toString().slice(-8),

      ...data,

      tour: tour || "",

      fare: fare,

      createdAt:
        new Date().toISOString(),

      status:
        "WhatsApp Pending"

    };


    /* SAVE BOOKING */

    const bookings =
      getBookings();

    bookings.unshift(booking);

    saveBookings(bookings);


    /* WHATSAPP */

    const message =
      bookingMessage(booking);

    const whatsappURL =
      waUrl(message);


    /*
      iPhone Safari માટે
      window.open કરતાં location.href વધુ reliable છે.
    */

    window.location.href =
      whatsappURL;

  });

}


/* =========================
   BOOKINGS PAGE
========================= */

function initBookingsPage() {

  const list =
    document.getElementById("bookingList");

  if (!list) {
    return;
  }


  const bookings =
    getBookings();


  if (!bookings.length) {

    list.innerHTML = `
      <section class="card empty">
        <div class="emoji">📋</div>

        <h2>No bookings yet.</h2>

        <p class="muted">
          Book your first ride from the Book tab.
        </p>

        <a
          class="btn primary"
          href="booking.html"
        >
          🚕 Book Your Ride
        </a>

      </section>
    `;

    return;

  }


  list.innerHTML =
    bookings.map(function (b) {

      return `
        <article class="card booking-item">

          <div class="booking-head">

            <div>

              <strong>
                ${escapeHtml(b.id)}
              </strong>

              <div class="muted">
                ${escapeHtml(b.service)}
              </div>

            </div>

            <span class="status">
              ${escapeHtml(b.status)}
            </span>

          </div>


          <div class="booking-meta">

            <div class="meta">
              <small>Passenger</small>
              <b>${escapeHtml(b.name)}</b>
            </div>

            <div class="meta">
              <small>Date & Time</small>
              <b>
                ${escapeHtml(b.date)}
                •
                ${escapeHtml(b.time)}
              </b>
            </div>

            <div class="meta">
              <small>Route</small>
              <b>
                ${escapeHtml(b.pickup)}
                →
                ${escapeHtml(b.drop)}
              </b>
            </div>

            <div class="meta">
              <small>Estimate</small>
              <b>
                ${money(b.fare)}
              </b>
            </div>

          </div>

        </article>
      `;

    }).join("");

}


/* =========================
   SECURITY
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      function (ch) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[ch];

      }
    );

}


/* =========================
   START APP
========================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    initGeneralWhatsApp();

    initBookingPage();

    initBookingsPage();

  }
);
