//Code by Keja Wright-Thompson
//Main variables
const root = document.documentElement.style;
const themePicker = document.getElementById('themePicker');
let presetsList = loadList('presetsList');
let alarmsList = loadList('alarmsList');
let timersList = loadList('timersList');

//===================LoadList and SaveList==================//
function loadList(key){
    try {
        const savedList = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(savedList) ? savedList : [];
    } catch {
        return [];
    }
}

function saveList(key, list){
    try {
        localStorage.setItem(key, JSON.stringify(list));
        return true;
    } catch {
        alert('Could not save this item. The browser storage may be full.');
        return false;
    }
}


//=================Colors====================//
function colorModeChange(){//dark mode and light mode toggle
    document.documentElement.classList.toggle('dark-mode');
    saveThemes();
    setThemes();
}

function syncTitleBarTheme(){
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--system-theme').trim();
    window.versions?.setTitleBarColor?.(themeColor);
}

function styleChange(){//based on what the user selects as a value in the theme section and apply when selected
    var selectedTheme = themePicker.value;
    root.setProperty('--system-theme', selectedTheme);
    saveThemes();
    setThemes();
    syncTitleBarTheme();
}

themePicker?.addEventListener('input', styleChange);//apply the selected theme immediately

//================Opening navbar==================//
function navbarToggle(){
    var navbar = document.getElementsByClassName('navbar')[0];
    navbar.classList.toggle('is-open');
}

//=====================Displaying Timers Menus===================//
//Displaying presets menu
$('#addPresets').click(function(){
    $('#addTimerSection').toggle(),
    $('#addPresetTimerSection').toggle()
});

$('#cancelPresetTimer').click(function(){
    $('#addTimerSection').toggle(),
    $('#addPresetTimerSection').toggle()
});


//Displaying custom timer menu
$('#addCustom').click(function(){
    $('#addTimerSection').toggle(),
    $('#addCustomTimerSection').toggle()
});

$('#cancelCustom').click(function(){
    $('#addTimerSection').toggle(),
    $('#addCustomTimerSection').toggle()
});

//==================Adding Timers====================//
//function to append a cell to a row
function appendCell(row, value){
    const cell = document.createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
}

//function to create an action button with a symbol, action, and label
function createActionButton(symbol, action, label){
    const button = document.createElement('button');
    button.type = 'button';
    button.classList.add('icon-action');
    button.textContent = symbol;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.addEventListener('click', action);
    return button;
}

//function to parse time in HH:MM:SS format
function parseTime(value){
    const parts = value.trim().split(':').map(Number);
    if (parts.length !== 3 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 99)) {
        return null;
    }
    return {hr: parts[0], min: parts[1], sec: parts[2]};
}

//function to create a new preset
function makePreset(){
    const name = document.getElementById('presetName')?.value.trim();
    const time = parseTime(document.getElementById('presetTime')?.value || '');
    if (!name || !time) {
        alert('Enter a preset name and a time in HH:MM:SS format.');
        return;
    }
    presetsList.push({name, ...time, id: Date.now()});
    if (!saveList('presetsList', presetsList)) presetsList.pop();
    displayPresetList();
    populatePresetDropdown();
}

//function to add a timer from a preset
function addPresetTimer(){
    const preset = presetsList.find(item => String(item.id) === document.getElementById('presetsType')?.value);
    if (!preset) {
        alert('Choose a saved preset first.');
        return;
    }
    const alarm = document.getElementById('alarmsType')?.value || 'none';
    timersList.push({...preset, id: Date.now(), alarm});
    if (!saveList('timersList', timersList)) timersList.pop();
    displayTimersList();
}

//function to add a custom timer
function addCustomTimer(){
    const name = document.getElementById('customName')?.value.trim();
    const values = ['customTimeHR', 'customTimeMIN', 'customTimeSEC'].map(id => Number(document.getElementById(id)?.value));
    if (!name || values.some(value => !Number.isInteger(value) || value < 0 || value > 99)) {
        alert('Enter a timer name and valid hours, minutes, and seconds.');
        return;
    }
    timersList.push({name, hr: values[0], min: values[1], sec: values[2], alarm: document.getElementById('customAlarmsType')?.value || 'none', id: Date.now()});
    if (!saveList('timersList', timersList)) timersList.pop();
    displayTimersList();
}

//function to delete a timer
function deleteTimer(timerId){
    stopTimerSound(timerId);
    clearTimer(timerId);
    timersList = timersList.filter(timer => String(timer.id) !== String(timerId));
    saveList('timersList', timersList);
    displayTimersList();
}

//==================Timer Functionality====================//
const runningTimers = new Map();//map to store running timers with their remaining seconds and interval IDs

//function to format seconds into HH:MM:SS
function formatTimerTime(totalSeconds){
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds].map(value => String(value).padStart(2, '0')).join(':');
}

//function to update the timer display
function updateTimerDisplay(timerId, value){
    const display = document.getElementById(`timer-countdown-${timerId}`);
    if (display) display.textContent = value;
}

//function for when a timer hits 0
function finishTimer(timerId){
    const timerState = runningTimers.get(String(timerId));
    if (!timerState) return;
    clearInterval(timerState.intervalId);
    runningTimers.delete(String(timerId));
    updateTimerDisplay(timerId, 'Finished');
    playAlarmSound(timerId, timerState.alarmId);
}

//function to countdown
function tickTimer(timerId){
    const timerState = runningTimers.get(String(timerId));
    if (!timerState) return;
    if (timerState.remainingSeconds <= 0) {
        finishTimer(timerId);
        return;
    }
    timerState.remainingSeconds--;
    updateTimerDisplay(timerId, formatTimerTime(timerState.remainingSeconds));
    if (timerState.remainingSeconds === 0) finishTimer(timerId);
}

//start timer countdown and play alarm when finished
function playTimer(hr, min, sec, alarmId, timerId){
    const key = String(timerId);
    const currentTimer = runningTimers.get(key);
    if (currentTimer) {
        resumeTimer(timerId);
        return;
    }
    stopTimerSound(timerId);
    clearTimer(timerId);
    const remainingSeconds = Number(hr) * 3600 + Number(min) * 60 + Number(sec);
    runningTimers.set(key, {remainingSeconds, intervalId: null, alarmId});
    updateTimerDisplay(timerId, formatTimerTime(remainingSeconds));
    if (remainingSeconds === 0) {
        finishTimer(timerId);
        return;
    }
    const timerState = runningTimers.get(key);
    timerState.intervalId = setInterval(() => tickTimer(timerId), 1000);
}

//function to pause timer
function pauseTimer(timerId){
    const timerState = runningTimers.get(String(timerId));
    if (!timerState || !timerState.intervalId) return;
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
}

//function to resume timer
function resumeTimer(timerId){
    const timerState = runningTimers.get(String(timerId));
    if (!timerState || timerState.intervalId || timerState.remainingSeconds <= 0) return;
    timerState.intervalId = setInterval(() => tickTimer(timerId), 1000);
}

//function to clear timer
function clearTimer(timerId){
    const timerState = runningTimers.get(String(timerId));
    if (!timerState) return;
    clearInterval(timerState.intervalId);
    runningTimers.delete(String(timerId));
}

//Function to restore timer to the set time
function resetTimer(timerId){
    const timerItem = timersList.find(item => String(item.id) === String(timerId));
    if (!timerItem) return;
    stopTimerSound(timerId);
    clearTimer(timerId);
    const originalSeconds = Number(timerItem.hr) * 3600 + Number(timerItem.min) * 60 + Number(timerItem.sec);
    updateTimerDisplay(timerId, formatTimerTime(originalSeconds));
}

//function to delete a preset from the list
function deletePreset(presetId){
    presetsList = presetsList.filter(preset => String(preset.id) !== String(presetId));
    saveList('presetsList', presetsList);
    displayPresetList();
    populatePresetDropdown();
}

//================Alarm Section======================//
//function to make an alarm
function makeAlarm(){
    const nameInput = document.getElementById('alarmName');
    const fileInput = document.getElementById('alarmFile');
    const name = nameInput?.value.trim();
    const file = fileInput?.files?.[0];
    if (!name || !file) {
        alert('Enter an alarm name and choose an audio file.');
        return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
        const alarm = {name, fileName: file.name, fileData: reader.result, id: Date.now()};
        alarmsList.push(alarm);
        if (!saveList('alarmsList', alarmsList)) {
            alarmsList.pop();
            return;
        }
        displayAlarmList();
        populateAlarmDropdowns();
        nameInput.value = '';
        fileInput.value = '';
    });
    reader.addEventListener('error', () => alert('The selected audio file could not be read.'));
    reader.readAsDataURL(file);
}

//function to delete alarm from the list
function deleteAlarm(alarmId){
    stopAlarmSound(alarmId);
    alarmsList = alarmsList.filter(alarm => String(alarm.id) !== String(alarmId));
    saveList('alarmsList', alarmsList);
    displayAlarmList();
    populateAlarmDropdowns();
}

//function to display all added alarms to the dropdown menu options for creating a timer
function populateAlarmDropdowns(){
    alarmsList = loadList('alarmsList');
    document.querySelectorAll('#alarmsType, #customAlarmsType').forEach(select => {
        const selectedValue = select.value;
        select.replaceChildren(new Option('none', 'none'));
        alarmsList.forEach(alarm => select.add(new Option(alarm.name, String(alarm.id))));
        if ([...select.options].some(option => option.value === selectedValue)) select.value = selectedValue;
    });
}

//function to display all added presets to the dropdown menu options for creating a timer
function populatePresetDropdown(){
    presetsList = loadList('presetsList');
    const select = document.getElementById('presetsType');
    if (!select) return;
    const selectedValue = select.value;
    select.replaceChildren(new Option('Choose a preset', ''));
    presetsList.forEach(preset => select.add(new Option(preset.name, String(preset.id))));
    if ([...select.options].some(option => option.value === selectedValue)) select.value = selectedValue;
}

//===========================Displaying lists========================//
//display list of presets (for preset tab)
function displayPresetList(){
    presetsList = loadList('presetsList');
    const body = document.getElementById('presetList');
    if (!body) return;
    body.querySelectorAll('[data-saved-entry]').forEach(row => row.remove());
    presetsList.forEach(preset => {
        const row = document.createElement('tr');
        row.dataset.savedEntry = 'true';
        appendCell(row, preset.name);
        appendCell(row, `${preset.hr}:${preset.min}:${preset.sec}`);
        const actions = document.createElement('td');
        actions.appendChild(createActionButton('\u{1F5D1}', () => deletePreset(preset.id), 'Delete preset'));
        row.appendChild(actions);
        body.appendChild(row);
    });
}

//function to display list of alarms (for alarm tab)
function displayAlarmList(){
    alarmsList = loadList('alarmsList');
    const body = document.getElementById('alarmList');
    if (!body) return;
    body.querySelectorAll('[data-saved-entry]').forEach(row => row.remove());
    alarmsList.forEach(alarm => {
        const row = document.createElement('tr');
        row.dataset.savedEntry = 'true';
        appendCell(row, alarm.name);
        appendCell(row, alarm.fileName || 'Audio file');
        const actions = document.createElement('td');
        if (alarm.fileData) {
            actions.appendChild(createActionButton('\u23F5', () => playSound(alarm.id, alarm.fileData), 'Play alarm'));
            actions.appendChild(createActionButton('\u23F9', () => stopAlarmSound(alarm.id), 'Stop playing alarm'));
        }
        actions.appendChild(createActionButton('\u{1F5D1}', () => deleteAlarm(alarm.id), 'Delete alarm'));
        row.appendChild(actions);
        body.appendChild(row);
    });
}

//function to display list of created timers on the timers tab
function displayTimersList(){
    timersList = loadList('timersList');
    const container = document.querySelector('.timerContainer');
    if (!container) return;
    container.querySelectorAll('[data-saved-entry]').forEach(item => item.remove());
    timersList.forEach(timerItem => {
        const article = document.createElement('article');
        article.dataset.savedEntry = 'true';
        const heading = document.createElement('h3');
        heading.textContent = timerItem.name;
        article.appendChild(heading);
        const time = document.createElement('p');
        time.id = `timer-countdown-${timerItem.id}`;
        time.textContent = formatTimerTime(Number(timerItem.hr) * 3600 + Number(timerItem.min) * 60 + Number(timerItem.sec));
        article.appendChild(time);
        const actions = document.createElement('div');
        actions.className = 'timer-actions';
        actions.appendChild(createActionButton('\u23F5', () => playTimer(timerItem.hr, timerItem.min, timerItem.sec, timerItem.alarm, timerItem.id), 'Play or resume timer'));
        actions.appendChild(createActionButton('\u23F8', () => pauseTimer(timerItem.id), 'Pause timer'));
        actions.appendChild(createActionButton('\u21BB', () => resetTimer(timerItem.id), 'Reset timer'));
        actions.appendChild(createActionButton('\u{1F5D1}', () => deleteTimer(timerItem.id), 'Delete timer'));
        actions.lastElementChild.classList.add('timer-delete-action');
        article.appendChild(actions);
        container.appendChild(article);
    });
}


//===========Play sound=================//
function playAlarmSound(timerId, alarmType){
    const alarm = alarmsList.find(item => String(item.id) === String(alarmType));
    if (alarm?.fileData) playSound(alarm.id, alarm.fileData, timerId);
}

const playingAudio = new Map();

function playSound(alarmId, audioFile, timerId = null){
    const audio = new Audio(audioFile);
    audio.volume = currentVol / maxVol;
    playingAudio.set(audio, {alarmId: String(alarmId), timerId: timerId === null ? null : String(timerId)});
    audio.addEventListener('ended', () => playingAudio.delete(audio), {once: true});
    audio.play().catch(error => {
        playingAudio.delete(audio);
        console.error('Alarm playback failed:', error);
        if (timerId === null) alert(`Could not play this alarm: ${error.message}`);
    });
}

function stopMatchingAudio(matches){
    for (const [audio, details] of playingAudio) {
        if (!matches(details)) continue;
        audio.pause();
        audio.currentTime = 0;
        playingAudio.delete(audio);
    }
}

function stopAlarmSound(alarmId){
    stopMatchingAudio(details => details.alarmId === String(alarmId));
}

function stopTimerSound(timerId){
    stopMatchingAudio(details => details.timerId === String(timerId));
}


//===Push all information to local storage===//
function saveThemes(){//save information to localstorage to use later
    localStorage.setItem('theme-values', JSON.stringify({
        'background': root.getPropertyValue('--current-bg'),
        'navbar': root.getPropertyValue('--current-navbar'),
        'navbar-font-color': root.getPropertyValue('--current-navbar-font-color'),
        'font-color': root.getPropertyValue('--current-font-color'),
        'theme': root.getPropertyValue('--system-theme')
    }));
}

function setThemes(){//pull info from the localstorage
    const themeValues = JSON.parse(localStorage.getItem('theme-values') || 'null');
    if (!themeValues) return;
    const bg = themeValues['background'];
    const navbar = themeValues['navbar'];
    const navbarFontColor = themeValues['navbar-font-color'];
    const fontColor = themeValues['font-color'];
    const systemTheme = themeValues['theme'];
    root.setProperty('--current-bg', bg);
    root.setProperty('--current-navbar', navbar);
    root.setProperty('--current-navbar-font-color', navbarFontColor);
    root.setProperty('--current-font-color', fontColor);
    root.setProperty('--system-theme', systemTheme);
    if (themePicker && systemTheme) themePicker.value = systemTheme;
    syncTitleBarTheme();
}

document.addEventListener('DOMContentLoaded', function(){//will load on page load
    setThemes();
    syncTitleBarTheme();
    populateAlarmDropdowns();
    populatePresetDropdown();
    displayPresetList();
    displayAlarmList();
    displayTimersList();
    document.getElementById('addPresetTimer')?.addEventListener('click', addPresetTimer);
    document.getElementById('volUp')?.addEventListener('click', volUp);
    document.getElementById('volDown')?.addEventListener('click', volDown);
    setVolume(currentVol);
});


//=====================Final Extra Stuff==============//
//volume control
const maxVol = 100;
const minVol = 0;
const volStep = 10;
const storedVolume = Number(localStorage.getItem('audioVolume') ?? maxVol);
let currentVol = Number.isFinite(storedVolume)
    ? Math.min(maxVol, Math.max(minVol, storedVolume))
    : maxVol;

function volUp(){
    setVolume(currentVol + volStep);
}

function volDown(){
    setVolume(currentVol - volStep);
}

function setVolume(value){
    currentVol = Math.min(maxVol, Math.max(minVol, value));
    localStorage.setItem('audioVolume', String(currentVol));
    document.querySelectorAll('#curVolNumber').forEach(readout => {
        readout.textContent = String(currentVol);
    });
    for (const audio of playingAudio.keys()) {
        audio.volume = currentVol / maxVol;
    }

}

//reset the entire app buttom
function resetApp(){
    if (confirm("Reset App? This deletes all timers, presets, alarms, and color settings.") == true) {
        localStorage.removeItem('theme-values');
        localStorage.removeItem('timersList');
        localStorage.removeItem('presetsList');
        localStorage.removeItem('alarmsList');
        localStorage.removeItem('audioVolume');
        alert("App has been reset.");
        window.location.reload();
    } else {
        alert("Action canceled.");
    }
}