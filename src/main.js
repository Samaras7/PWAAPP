const rooms = [
  {
    id: 'dorm',
    name: 'Łóżko w dormie 6-os.',
    price: 89,
    badge: 'Najpopularniejsze',
    description: 'Wygodne łóżko z zasłonką, lampką, gniazdkiem i prywatną szafką.',
    features: ['Pościel w cenie', 'Wspólna łazienka', 'Idealne solo'],
  },
  {
    id: 'twin',
    name: 'Pokój twin prywatny',
    price: 220,
    badge: 'Dla znajomych',
    description: 'Dwa osobne łóżka, biurko, łazienka na korytarzu i widok na patio.',
    features: ['2 osoby', 'Ręczniki', 'Cisza nocna'],
  },
  {
    id: 'family',
    name: 'Studio rodzinne',
    price: 360,
    badge: 'Komfort',
    description: 'Prywatne studio z aneksem, łazienką i rozkładaną sofą dla grup do 4 osób.',
    features: ['Do 4 osób', 'Aneks kuchenny', 'Prywatna łazienka'],
  },
];

const breakfastPrice = 25;
const reservationStorageKey = 'hostel-zakatek-reservation';

const roomsGrid = document.querySelector('#roomsGrid');
const roomTypeSelect = document.querySelector('#roomType');
const bookingForm = document.querySelector('#bookingForm');
const bookingSummary = document.querySelector('#bookingSummary');
const installStatus = document.querySelector('#installStatus');

function formatPrice(value) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(value);
}

function calculateNights(checkIn, checkOut) {
  const start = new Date(`${checkIn}T12:00:00`);
  const end = new Date(`${checkOut}T12:00:00`);
  const difference = end.getTime() - start.getTime();
  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getRoom(roomId) {
  return rooms.find((room) => room.id === roomId) ?? rooms[0];
}

function renderRooms() {
  roomsGrid.innerHTML = rooms
    .map(
      (room) => `
        <article class="room-card">
          <div class="room-card__badge">${room.badge}</div>
          <h3>${room.name}</h3>
          <p>${room.description}</p>
          <ul>${room.features.map((feature) => `<li>${feature}</li>`).join('')}</ul>
          <div class="room-card__footer">
            <strong>${formatPrice(room.price)}</strong>
            <span>/ noc</span>
          </div>
        </article>
      `,
    )
    .join('');

  roomTypeSelect.innerHTML = rooms
    .map((room) => `<option value="${room.id}">${room.name} - ${formatPrice(room.price)} / noc</option>`)
    .join('');
}

function setDefaultDates() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(today.getDate() + 2);

  bookingForm.elements.checkIn.valueAsDate = tomorrow;
  bookingForm.elements.checkOut.valueAsDate = afterTomorrow;
}

function buildReservation(formData) {
  const room = getRoom(formData.get('roomType'));
  const guests = Number(formData.get('guests'));
  const nights = calculateNights(formData.get('checkIn'), formData.get('checkOut'));
  const hasBreakfast = formData.get('breakfast') === 'on';

  if (nights <= 0 || Number.isNaN(nights)) {
    throw new Error('Data wyjazdu musi być późniejsza niż data przyjazdu.');
  }

  const roomCost = room.price * nights;
  const breakfastCost = hasBreakfast ? breakfastPrice * guests * nights : 0;
  const total = roomCost + breakfastCost;

  return {
    guestName: formData.get('guestName'),
    email: formData.get('email'),
    checkIn: formData.get('checkIn'),
    checkOut: formData.get('checkOut'),
    guests,
    room,
    nights,
    hasBreakfast,
    total,
  };
}

function showReservation(reservation) {
  bookingSummary.classList.add('booking-summary--visible');
  bookingSummary.innerHTML = `
    <strong>Rezerwacja zapisana!</strong>
    <span>${reservation.guestName}, ${reservation.room.name}</span>
    <span>${reservation.nights} noc(e), ${reservation.guests} gość/gości, ${
      reservation.hasBreakfast ? 'ze śniadaniem' : 'bez śniadania'
    }</span>
    <b>Szacunkowy koszt: ${formatPrice(reservation.total)}</b>
  `;
}

function restoreReservation() {
  const savedReservation = localStorage.getItem(reservationStorageKey);

  if (!savedReservation) {
    return;
  }

  try {
    showReservation(JSON.parse(savedReservation));
  } catch {
    localStorage.removeItem(reservationStorageKey);
  }
}

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    const reservation = buildReservation(new FormData(bookingForm));
    localStorage.setItem(reservationStorageKey, JSON.stringify(reservation));
    showReservation(reservation);
  } catch (error) {
    bookingSummary.classList.add('booking-summary--visible');
    bookingSummary.textContent = error.message;
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js');
      installStatus.textContent = 'PWA działa offline po pierwszym załadowaniu.';
    } catch {
      installStatus.textContent = 'Service worker nie został zarejestrowany w tym środowisku.';
    }
  });
}

renderRooms();
setDefaultDates();
restoreReservation();
