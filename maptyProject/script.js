'use strict';

// const { jar } = require("superagent");

// import uniqid from 'uniqid';
// var uniqid = require('uniqid'); 
const form = document.querySelector('.form');
const inputDistance = document.querySelector('.form__input--distance');
const inputType = document.querySelector('.form__input--type');
const containerWorkouts = document.querySelector('.workouts');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let mapEvent, map;

class Workout {
    date = new Date() // it returns an object 
    id = (Date.now() + '').slice(-10)

    constructor(coords, distance, duration) {
        // super()
        // this.date = ...
        // this.id = ...
        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration; // in minutes
    }

    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase() + this.type.slice(1)} 
        on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

}

class Running extends Workout {
    type = 'running'
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence
        this.calcPace();
        this._setDescription();

    }
    calcPace() {
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling'
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();

    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}


// const run1 = new Cycling([39, -12], 5.2, 24, 178)
// const cycling1 = new Running([39, -12], 27, 95, 523)
// console.log(run1, cycling1)
// Application architecture 

class App {
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;

    constructor() {
        this._getPosition();
        // console.log(this)
        form.addEventListener('submit', this._newWorkout.bind(this))

        inputType.addEventListener('change', this._toggleElevationField)
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));

    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get your position')
                });
    }

    _loadMap(position) {

        // console.log(this)
        const { longitude } = position.coords;
        const { latitude } = position.coords;
        console.log(latitude, longitude);
        // console.log(`https://www.google.com.br/maps/@${latitude},${longitude}z`)
        const coords = [latitude, longitude]

        this.#map =
            L.map('map')
                .setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,

        })
            .addTo(this.#map);

        // Handling clicks on map
        this.#map.on('click', this._showForm.bind(this));


    }

    _newWorkout(e) {
        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp))

        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault()


        // Get data from form
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const cadence = +inputCadence.value
        const elevation = +inputElevation.value
        const { lat, lng } = this.#mapEvent.latlng;
        const coords = [lat, lng]
        let workout;
        // const inputType = document.querySelector('.form__input--type');


        // Check if data is valid

        // If activity is running, create running object
        if (type === 'running') {

            if (
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be positive numbers!')

            workout = new Running(coords, distance, duration, cadence)
            this.#workouts.push(workout)
        }
        // console.log(workout)
        // console.log(this.#workouts)
        // If activity is Cycling, create running object
        if (type === 'cycling') {
            if (
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration, elevation)
            )
                return alert('Inputs have to be positive numbers!')

            workout = new Cycling(coords, distance, duration, elevation)
            this.#workouts.push(workout)
        }
        console.log(workout.type, 1)
        // cleaning and hidding input after submit

        // Render workout on map as marker
        this._renderWorkoutMarker(workout)

        // Render workout on list
        this._renderWorkout(workout)

        // hide form and clean inputs
        this._hideForm()

        // Set local storage to all workouts
        this._setLocalStorage()
    }

    _renderWorkoutMarker(workout) {
        // const type = inputType.value
        // const { lat, lng } = this.#mapEvent.latlng;
        // const coords = [lat, lng]

        // console.log(lat, lng)
        L
            .marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    closeOnClick: false,
                    autoClose: false,
                    closeButton: false,
                    closeOnEscapeKey: 0,
                    className: `${workout.type}-popup`,
                    maxWidth: 250,
                    maxHeight: 100,
                })
                    .setLatLng(workout.coords)
                    .setContent(`${workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'} ${workout.description}`)
                    .openOn(this.#map)
            )
            // .setPopupContent(workout.distance)
            .openPopup();

    }

    _renderWorkout(workout) {
        console.log(workout)
        let html =
            `  <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
            <span class="workout__icon">${workout.type === 'cycling' ? '🚴‍♀️' : '🏃‍♂️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>
`;

        if (workout.type === 'running') {
            html += `   
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
            </div>
        </li>`
        }

        if (workout.type === 'cycling') {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
        </div>
        </li>`
        }

        form.insertAdjacentHTML('afterend', html)
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden')
        inputDistance.focus()
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ''
        form.style.display = 'none'
        form.classList.add('hidden')
        setTimeout(() => form.style.display = 'grid', 1000)

    }

    _toggleElevationField() {
        inputCadence
            .closest('.form__row')
            .classList
            .toggle('form__row--hidden')

        inputElevation
            .closest('.form__row')
            .classList
            .toggle('form__row--hidden')
    }

    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout')
        console.log(workoutEl)
        console.log(e.target)

        if (!workoutEl) return;

        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate:true,
            pan: {
                duration: 1,
            }
        })
    }


    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts)) 
    }

    _getLocalStorage() {
const data = JSON.parse(localStorage.getItem('workout'));
console.log(data)

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }
};

const app = new App();
// app._getPosition();
// app._loadMap()
