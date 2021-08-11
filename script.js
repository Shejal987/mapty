'use strict';

// prettier-ignore


class Workout{

  date = new Date();
  id=(Date.now() + '').slice(-10)
  clicks=0;

  constructor(coords,distance,duration){
    this.coords= coords;
    this.distance=distance;
    this.duration= duration;
  }

  _setDescription(){
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description= `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}` 

  }

  click(){
    this.clicks++;
  }
}

class Running extends Workout{

  type='running';

  constructor(coords,distance,duration,cadence){
    super (coords,distance,duration);
    this.cadence= cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace(){
    this.pace= this.duration/this.distance;
    return this.pace
  }

}

class Cycling extends Workout{


  constructor(coords,distance,duration,elevationGain){
    super (coords,distance,duration);
    this.elevationGain= elevationGain;
    this.calcSpeed();
    this.type='cycling';
    this._setDescription();
  }

  calcSpeed(){
    this.speed=this.distance/(this.duration/60);
    return this.speed;
  }
}


const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const form = document.querySelector('.form');

class App {
  #map;
  #mapEvent;
  #workouts=[];

  constructor() {
    this._getposition();

    this._getlocalstorage();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change',this._toggleElevationField);

    containerWorkouts.addEventListener('click',this._movToPopup.bind(this))


  }

  _getposition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadmap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
    }
  }

  _loadmap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.co.in/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 7);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));
    
    this.#workouts.forEach(work=> {
      this._renderWorkoutMarker(work);
    })
  }

  _showForm(mape) {
    form.classList.remove('hidden');
    inputDistance.focus();
    this.#mapEvent = mape;
  }

  _hideForm(){
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
        '';

    form.style.display='none';
    form.classList.add('hidden');
    setTimeout(()=> form.style.display='grid',1000)

  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs= (...inputs)=>inputs.every(inp=> Number.isFinite(inp));

    const allPositive=(...inputs)=> inputs.every(inp=> inp>0)


    e.preventDefault();

    const type= inputType.value;
    const distance= +inputDistance.value;
    const duration= +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    if(type=== 'running'){
      const cadence= +inputCadence.value;

      // if(!Number.isFinite(distance)||!Number.isFinite(duration)||!Number.isFinite(cadence)) return alert('Number should be a positive no.')

      if(!validInputs(distance,duration,cadence)|| !allPositive(distance,duration,cadence)) return alert('Number should be a positive no.')

      workout= new Running([lat,lng],distance,duration,cadence)

      
    }

    if(type === 'cycling' ){
      const elevation= +inputElevation.value;

      if(!validInputs(distance,duration,elevation)|| !allPositive(distance,duration)) return alert('Number should be a positive no.')

      workout= new Cycling([lat,lng],distance,duration,elevation)

    }
    this.#workouts.push(workout);

    this._hideForm();

    // console.log(mapEvent);
    
    this._renderWorkout(workout);

    this._renderWorkoutMarker(workout);

    this._setlocalstorage();
  }

  _renderWorkoutMarker(workout){
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.type === 'running'? '🏃🏻‍♂️':'🚴🏻‍♂️'} ${workout.description}`)
      .openPopup();
  }

  _renderWorkout(workout){
    let html=`
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.type === 'running'? '🏃🏻‍♂️':'🚴🏻‍♂️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>`

    if(workout.type==='running'){
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

    if(workout.type==='cycling'){
      html +=`
      <div class="workout__details">
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

    form.insertAdjacentHTML('afterend',html)
  }

  _movToPopup(e){
    const workoutEl= e.target.closest('.workout')

    if(!workoutEl) return;

    const workout= this.#workouts.find(work=> work.id=== workoutEl.dataset.id)

    this.#map.setView(workout.coords, 7,{
      animate: true,
      pan:{
        duration:1,
      }
    })
  
  
  }

  _setlocalstorage(){
    localStorage.setItem('workouts',JSON.stringify(this.#workouts));
  }

  _getlocalstorage(){
    const data= JSON.parse(localStorage.getItem('workouts'));
    
    if(!data) return;

    this.#workouts= data;

    this.#workouts.forEach(work=> {
      this._renderWorkout(work);
    })
  }

  reset(){
    localStorage.removeItem('workouts')
    location.reload();
  }
}

const app = new App();
// app._geoposition();
