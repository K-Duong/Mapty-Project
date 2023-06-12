'use strict';

/////Create class Workout and child class Running and Cycling////
class Workout {
  // date;
  marker;
  // existed = false;

  constructor(coords, distance, duration, date) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
    this.date = date;
    this.id = String(this.date.getTime());
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()} - ${this.date.getHours()}h${this.date.getMinutes()}min`;
  }
}

class Running extends Workout {
  type = 'running';
  // existed = true;

  constructor(coords, distance, duration, cadence, date = new Date()) {
    super(coords, distance, duration, date);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  // existed = 'true';

  constructor(coords, distance, duration, elevation, date = new Date()) {
    super(coords, distance, duration, date);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 27, 95, 523);

// App class

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const formModified = document.querySelector('.form__modified');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const btnClose = document.querySelector('.close');
const btnModify = document.querySelector('.modify');

const inputTypeModified = document.querySelector(
  '.form__input__modified--type'
);
const inputDurationModified = document.querySelector(
  '.form__input__modified--duration'
);
const inputDistanceModified = document.querySelector(
  '.form__input__modified--distance'
);
const inputCadenceModified = document.querySelector(
  '.form__input__modified--cadence'
);
const inputElevationModified = document.querySelector(
  '.form__input__modified--elevation'
);

const overlay = document.querySelector('.overlay');
const messageAlert = document.querySelector('.alert__message');

const sortType = document.querySelector('.sorting__type');
const sortDate = document.querySelector('.sorting__date');
const sortDistance = document.querySelector('.sorting__distance');
const sortDuration = document.querySelector('.sorting__duration');
const noSort = document.querySelector('.title__back');
const btnClear = document.querySelector('.clear');

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];
  #workoutToDelete = null;
  // #workout = null;
  foundWorkout;

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    this._getNewFeature();

    //events handler
    form.addEventListener('submit', this._updateWorkout.bind(this));
    form.addEventListener('keydown', this._hideFormModify.bind(this));

    inputType.addEventListener('change', this._changeTypeOfWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._displayQuestion.bind(this)
    );
    document
      .querySelector('#yes')
      .addEventListener('click', this._removeWorkout.bind(this));
    document
      .querySelector('#no')
      .addEventListener('click', this._refuse.bind(this));

    containerWorkouts.addEventListener(
      'click',
      this._showFormModify.bind(this)
    );

    //events handler sorting
    sortType.addEventListener('change', this._sortType.bind(this));
    sortDate.addEventListener('change', this._sortDate.bind(this));
    sortDistance.addEventListener('change', this._sortDistance.bind(this));
    sortDuration.addEventListener('change', this._sortDuration.bind(this));
    noSort.addEventListener('click', this._ascendingDate.bind(this));
    btnClear.addEventListener('click', function () {
      console.log('clear');
    });
  }

  _getPosition() {
    const error = function () {
      alert('Could/nt access to your current location');
    };

    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), error); // App._loadMap
  }

  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];
    console.log('Mapty project-extended version');
    this.#map = L.map('map', {
      closePopupOnClick: false,
    }).setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    this.foundWorkout = null;
    form.classList.remove('hidden');
    inputDistance.focus();
    this._clearInputsFields();
  }

  _hideForm() {
    // Empty inputs
    this._clearInputsFields();

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _changeTypeOfWorkout() {
    //change input for running or cycling
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _updateWorkout(e) {
    // let workout;

    e.preventDefault();

    //get data from form

    if (this.foundWorkout) {
      this._modifyWorkout();
    } else {
      this._createNewWorkout();
    }
  }

  _renderWorkoutMarker(workout) {
    workout.marker = L.marker(workout.coords);
    workout.marker
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          className: `${workout.type}-popup`,
          autoClose: false,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴'} ${workout.description} `
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__title">
      <span>${workout.description}</span>
      <div class = "icons">
      
      <svg class = "modify" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
  <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
  <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
</svg>

<svg class = "close" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
</svg>
</div>
    </h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃' : '🚴'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.cadence.toFixed(1)} </span>
    <span class="workout__unit">min/km</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">🦶🏼</span>
    <span class="workout__value">${workout.pace.toFixed(1)}
    } </span>
    <span class="workout__unit">spm</span>
    
  </div>
</li>`;

    if (workout.type === 'cycling')
      html += `<div class="workout__details">
    <span class="workout__icon">⚡️</span>
    <span class="workout__value">${workout.elevation.toFixed(1)} </span>
    <span class="workout__unit">km/h</span>
  </div>
  <div class="workout__details">
    <span class="workout__icon">⛰</span>
    <span class="workout__value">${workout.speed.toFixed(1)} </span>
    <span class="workout__unit">m</span>
  </div>
</li>`;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const targ = e.target.closest('.workout');
    if (!targ) return;

    const workout = this.#workouts.find(this._matchedWorkout.bind(targ));

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
        // easeLinearity: 5,
        noMoveStart: false,
      },
    });
  }

  _setLocalStorage() {
    const workoutsToSave = this.#workouts.map(workout => ({
      ...workout,
      marker: null,
    }));
    localStorage.setItem('workouts', JSON.stringify(workoutsToSave));
  }

  _getLocalStorage() {
    const storage = JSON.parse(localStorage.getItem('workouts'));

    if (!storage) return;

    this.#workouts = storage;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _removeWorkout() {
    const workout = this.#workoutToDelete;
    if (!workout) return;

    //find object and index workout to remove
    const workoutRemoved = this.#workouts.find(
      this._matchedWorkout.bind(workout)
    );
    const indexWorkout = this.#workouts.findIndex(
      this._matchedWorkout.bind(workout)
    );

    console.log(
      'workout removed',
      workoutRemoved,
      'index workout removed',
      indexWorkout
    );

    //remove this workout from arr workouts
    this.workoutsArr = indexWorkout;

    //remove marker of this workout
    workoutRemoved.marker.remove(); // hoac cach 2:  this.#map.removeLayer(workout.marker);

    //remove this workout from sidebar
    workout.remove();

    //hide overlay + question
    this._hideOverlay();
    this._hideRemoveMessage();

    //update Local Storage
    this._setLocalStorage();
  }

  _removeAllWorkouts() {
    const allWorkoutElements = document.querySelectorAll('.workout');

    for (const workout of allWorkoutElements) {
      workout.remove();
    }
  }

  _displayQuestion(e) {
    const btnClose = e.target.closest('.close');

    if (!btnClose) {
      this.#workoutToDelete = null;
      this._hideOverlay();
      this._hideRemoveMessage();
      return;
    }

    // display overlay + question to confirm
    overlay.classList.remove('overlay__hidden');
    messageAlert.classList.remove('alert__hidden');
    this.#workoutToDelete = e.target.closest('.workout');
  }

  _hideOverlay() {
    overlay.classList.add('overlay__hidden');
  }
  _hideRemoveMessage() {
    messageAlert.classList.add('alert__hidden');
  }

  _findWorkout(e) {
    const workout = e.target.closest('.workout');
    this.foundWorkout = this.#workouts.find(this._matchedWorkout.bind(workout));
  }
  _matchedWorkout(work) {
    return work.id === this.dataset.id;
  }
  _refuse() {
    this._hideOverlay();
    this._hideRemoveMessage();
    this.#workoutToDelete = null;
  }

  _showFormModify(e) {
    const modify = e.target.closest('.modify');
    if (!modify) return;

    form.classList.remove('hidden');
    this._findWorkout(e);

    // console.log(this.foundWorkout);

    inputDistance.focus();
    inputDistance.value = this.foundWorkout.distance;
    inputDuration.value = this.foundWorkout.duration;

    if (this.foundWorkout.type === 'running') {
      inputType.value = this.foundWorkout.type;
      inputCadence.value = this.foundWorkout.cadence;
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
    }
    if (this.foundWorkout.type === 'cycling') {
      inputType.value = this.foundWorkout.type;
      inputElevation.value = this.foundWorkout.elevation;
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
    }
  }

  _hideFormModify(e) {
    if (e.key === 'Escape') {
      this._hideForm();
      this.foundWorkout = null;
    } else {
      return;
    }
  }

  _clearInputsFields() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }

  _validData = (...inputs) => inputs.every(inp => Number.isFinite(inp));
  _positiveData = (...inputs) => inputs.every(inp => inp > 0);

  _createNewWorkout() {
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    const coords = this.#mapEvent.latlng;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !this._validData(distance, duration, cadence) ||
        !this._positiveData(distance, duration, cadence)
      )
        return alert('Inputs fail');

      this.foundWorkout = new Running(coords, distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !this._validData(distance, duration, elevation) ||
        !this._positiveData(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers');
      }

      this.foundWorkout = new Cycling(coords, distance, duration, elevation);
    }

    //add new object to workout
    this.#workouts.push(this.foundWorkout);

    //show new workout on sidebar
    this._renderWorkout(this.foundWorkout);

    //show marker with data
    this._renderWorkoutMarker(this.foundWorkout);

    // hide form
    this._hideForm();

    //store data in local storage
    this._setLocalStorage();

    console.log(this.foundWorkout.calcPace);

    //reset foundWorkout
    this.foundWorkout = null;
  }

  _modifyWorkout() {
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    if (this.foundWorkout.type === 'running') {
      // this.foundWorkout.prototype = Object.create(Workout.prototype);
      const cadence = +inputCadence.value;
      if (
        !this._validData(distance, duration, cadence) ||
        !this._positiveData(distance, duration, cadence)
      )
        return alert('Inputs fail');

      this.foundWorkout.distance = distance;
      this.foundWorkout.duration = duration;
      this.foundWorkout.cadence = cadence;
      // this.foundWorkout.prototype = Object.create(Running.prototype);
      // console.log(this.foundWorkout.calcPace);

      this.foundWorkout.pace =
        this.foundWorkout.duration / this.foundWorkout.distance;
    } else if (this.foundWorkout.type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !this._validData(distance, duration, elevation) ||
        !this._positiveData(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers');
      }

      this.foundWorkout.distance = distance;
      this.foundWorkout.duration = duration;
      this.foundWorkout.elevation = elevation;
      // this.foundWorkout.prototype = Object.create(Cycling.prototype);
      // console.log(console.log(this.foundWorkout.calcSpeed));

      this.foundWorkout.speed =
        this.foundWorkout.distance / (this.foundWorkout.duration / 60); //refactoring lai vi sao ko the goi dc calcSpeed()
    }

    this._hideForm();
    this.#workouts.forEach(workout => workout.marker.remove());

    this._setLocalStorage();
    this._removeAllWorkouts();
    this._getLocalStorage();

    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));

    // console.log(
    //   'found workout',
    //   this.foundWorkout.prototype,
    //   'class Running',
    //   Running.prototype
    // );
  }

  ////////////sort//////// ATTENTION : thu tu sort bi dao nguoc tren dao dien vi #workouts list doc nguoc tu tren xuong duoi
  _sortTypeCycling(workouts, el) {
    const typeAsNumber = {
      cycling: 0,
      running: 1,
    };

    return workouts.sort(
      (work1, work2) => typeAsNumber[work1[el]] - typeAsNumber[work2[el]]
    );
  }
  _sortTypeRunning(workouts, el) {
    const typeAsNumber = {
      cycling: 1,
      running: 0,
    };

    return workouts.sort(
      (work1, work2) => typeAsNumber[work1[el]] - typeAsNumber[work2[el]]
    );
  }

  _ascending(workouts, el) {
    return workouts.sort((work1, work2) => work1[el] - work2[el]);
  }

  _descending(workouts, el) {
    return workouts.sort((work1, work2) => work2[el] - work1[el]);
  }

  // _ascendingDate(workouts) {
  //   return workouts.sort((work1, work2) => workouts);
  // }
  // _descendingDate(workouts) {}

  _sortDistance() {
    if (sortDistance.value === 'descending') {
      this._ascending(this.#workouts, 'distance');
      this._removeAllWorkouts();
      this.#workouts.forEach(work => {
        this._renderWorkout(work);
      });
      // console.log('descending');
    } else {
      this._descending(this.#workouts, 'distance');
      this._removeAllWorkouts();
      this.#workouts.forEach(work => {
        this._renderWorkout(work);
      });
      // console.log('ascending');
    }
  }

  _sortDuration() {
    if (sortDuration.value === 'descending') {
      this._ascending(this.#workouts, 'duration');
      this._removeAllWorkouts();
      this.#workouts.forEach(work => {
        this._renderWorkout(work);
      });
      console.log('descending', this.workoutsArr);
    } else {
      this._descending(this.#workouts, 'duration');
      this._removeAllWorkouts();
      this.#workouts.forEach(work => {
        this._renderWorkout(work);
      });
      console.log('ascending', this.workoutsArr);
    }
  }

  _sortType() {
    if (sortType.value === 'running') {
      this._sortTypeCycling(this.#workouts, 'type');
      // this._descending(this.#workouts, 'type');
      this._removeAllWorkouts();
      this.#workouts.forEach(work => {
        this._renderWorkout(work);
      });
      console.log('running', this.workoutsArr);
    } else {
      this._sortTypeRunning(this.#workouts, 'type');
      // this._ascending(this.#workouts, 'type');
      this._removeAllWorkouts();
      this.#workouts.forEach(work => {
        this._renderWorkout(work);
      });
      console.log('cycling', this.workoutsArr);
    }
    // else {
    //   this._sortDate();
    // }
  }

  _descendingDate() {
    this.#workouts.sort(
      (work1, work2) => new Date(work2.date) - new Date(work1.date)
    );
    this._removeAllWorkouts();
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  _ascendingDate() {
    this.#workouts.sort(
      (work1, work2) => new Date(work1.date) - new Date(work2.date)
    );
    this._removeAllWorkouts();
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _sortDate() {
    if (sortDate.value === 'ascending') {
      this._descendingDate();
      console.log(this.workoutsArr);
    } else {
      this._ascendingDate();
    }
  }

  //getter vs setter

  get workoutsArr() {
    return this.#workouts;
  }

  set workoutsArr(index) {
    this.#workouts.splice(index, 1);
    return this.#workouts;
  }

  get mapEvent() {
    return this.#mapEvent;
  }

  // get workout() {
  //   return this.#workout;
  // }

  get workoutToDelete() {
    return this.#workoutToDelete;
  }

  _clearAllWorkout() {
    this._displayQuestion();
    localStorage.clear();
  }

  _getNewFeature() {
    console.log('Here is a new feature');
  }
}

const app = new App();

const run2 = new Running([39, -12], 2, 100, 124);
const workouts = [run1, cycling1, run2];
