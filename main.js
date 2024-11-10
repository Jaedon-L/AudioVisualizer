import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { GUI } from 'dat.gui';

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sets the color of the background.
// renderer.setClearColor(0xFEFEFE);


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
const params = {
    red: 2.0, 
    green: 2.0, 
    blue: 2.0,
    threshold: 0.1,
    strength: 0.4, 
    radius: 0.5, 
};
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Sets orbit control to move the camera around.
// const orbit = new OrbitControls(camera, renderer.domElement);
let mouseX = 0; 
let mouseY = 0; 
document.addEventListener('mousemove', function(e){
    let windowHalfX = window.innerWidth /2;
    let windowHalfY = window.innerHeight /2; 
    mouseX = (e.clientX - windowHalfX)/100; 
    mouseY = (e.clientY - windowHalfY)/100; 
})
// Camera positioning.
camera.position.set(6, 8, 14);
// Has to be done everytime we update the camera position.
// orbit.update();

// // Creates a 12 by 12 grid helper.
// const gridHelper = new THREE.GridHelper(12, 12);
// scene.add(gridHelper);

// // Creates an axes helper with an axis length of 4.
// const axesHelper = new THREE.AxesHelper(4);
// scene.add(axesHelper);
const uniforms = {
    u_time: {value: 0.0},
    u_frequency: { value: 0.0}, 
    u_red: {value: params.red}, 
    u_green: {value: params.green},
    u_blue: {value: params.blue}, 
};
const listener = new THREE.AudioListener(); 
camera.add(listener); 

const sound = new THREE.Audio(listener); 
const audioLoader = new THREE.AudioLoader(); //audio input

let audioQueue = []; // Queue to hold the uploaded audio files
let isPlaying = false; // To track the play/pause state
let currentAudioIndex = 0; // To track which audio in the queue is playing
// Function to render the audio queue in the UI


const queueDisplay = document.getElementById('audio-queue-list'); 
function updateQueueDisplay() {
    // Clear the existing queue list
    queueDisplay.innerHTML = '';

    // Add each file in the queue to the list
    audioQueue.forEach((fileURL, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `Track ${index + 1}: ${fileURL}`;

        // Highlight the currently playing track
        if (index === currentAudioIndex) {
            listItem.style.fontWeight = 'bold';
            listItem.textContent += ' (Now Playing)';
        }

        // Add a remove button for each track
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.addEventListener('click', () => {
            removeTrack(index);
        });

        // Add move up / move down buttons for reordering
        const moveUpButton = document.createElement('button');
        moveUpButton.textContent = 'Move Up';
        moveUpButton.disabled = index === 0; // Disable if it's the first track
        moveUpButton.addEventListener('click', () => {
            moveTrack(index, index - 1);
        });

        const moveDownButton = document.createElement('button');
        moveDownButton.textContent = 'Move Down';
        moveDownButton.disabled = index === audioQueue.length - 1; // Disable if it's the last track
        moveDownButton.addEventListener('click', () => {
            moveTrack(index, index + 1);
        });

        // Append buttons to the list item
        listItem.appendChild(moveUpButton);
        listItem.appendChild(moveDownButton);
        listItem.appendChild(removeButton);

        queueDisplay.appendChild(listItem);
    });
}
// Function to load and play the next audio in the queue
function playNextInQueue() {
    if (audioQueue.length === 0) return; // If queue is empty, return

    // Stop the current audio if playing
    if (sound.isPlaying) {
        sound.stop();
    }

    // Load the next audio in the queue
    const nextAudioFile = audioQueue[currentAudioIndex];
    audioLoader.load(nextAudioFile, function (buffer) {
        sound.setBuffer(buffer); // Set the new audio buffer
        sound.play(); // Start playing the new audio
        isPlaying = true; // Mark as playing
        updateQueueDisplay();
    });

    // Update current audio index for the next track
    currentAudioIndex = (currentAudioIndex + 1) % audioQueue.length; // Loop back to the start of the queue when it ends
}

// Play / Pause functionality
function togglePlayPause() {
    if (isPlaying) {
        sound.pause(); // Pause the audio
        isPlaying = false;
    } else {
        sound.play(); // Play the audio
        isPlaying = true;
    }
}
// Function to skip to the next track
function skipTrack() {
    if (audioQueue.length > 1) {
        playNextInQueue(); // Call function to skip to the next track
    } else {
        console.log("No more tracks in the queue.");
    }
}
// Function to stop the current audio and load a new file into the queue
function addToQueue(file) {
    audioQueue.push(file); // Add file to the queue
    if (audioQueue.length === 1) {
        // If this is the first file in the queue, start playing it immediately
        playNextInQueue();
    }else {
        updateQueueDisplay();
    }
}
function removeTrack(index){
    audioQueue.splice(index, 1); 

    if (currentAudioIndex >= index){
        currentAudioIndex = Math.max(currentAudioIndex -1, 0); 
    }
    if (audioQueue.length == 0) {
        sound.stop(); 
    }else {
        playNextInQueue(); 
    }
    updateQueueDisplay(); 
}


// Function to move a track in the queue
function moveTrack(fromIndex, toIndex) {
    if (toIndex >= 0 && toIndex < audioQueue.length) {
        const [movedTrack] = audioQueue.splice(fromIndex, 1); // Remove the track from its current position
        audioQueue.splice(toIndex, 0, movedTrack); // Insert it at the new position
        updateQueueDisplay(); // Update the queue display
    }
}
// function stopAndLoadNewAudio(file) {
//     // Stop the current audio if it's playing
//     if (sound.isPlaying) {
//         sound.stop(); // Stop the current audio
//     }

//     // Reset audio object to ensure it's fully stopped before loading new audio
//     sound.setBuffer(null);  // Reset the audio buffer

//     // Load the new audio file
//     audioLoader.load(file, function(buffer) {
//         sound.setBuffer(buffer); // Set the new audio buffer
//         sound.play(); // Start playing the new audio
//     });
// }
// Audio input from user (using the file input element)
const audioFileInput = document.getElementById('audio-file');
const playPauseButton = document.getElementById('play-pause'); 
const skipButton = document.getElementById('skip');

// audioLoader.load('/track1.mp3', function (buffer) {
//     sound.setBuffer(buffer);
//     window.addEventListener('click', function (){
//         sound.play(); 
//     });
// });
// Event listener for the file input
// Function to stop the current audio and load a new one

audioFileInput.addEventListener('change', function (event) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
        const fileURL = URL.createObjectURL(file); // Create a URL for the file
        addToQueue(fileURL); 
        // Stop the current song and load the new one
        // stopAndLoadNewAudio(fileURL);
    }
  });

  // Play / Pause button event listener
playPauseButton.addEventListener('click', function () {
    togglePlayPause();
});
// Skip button event listener
skipButton.addEventListener('click', function () {
    skipTrack(); // Skip the current track
});
// Play the next track when the current track finishes
sound.onEnded = function () {
    playNextInQueue(); // Play the next audio in the queue when the current one finishes
};
const analyzer = new THREE.AudioAnalyser(sound, 32); 

const mat = new THREE.ShaderMaterial({
    wireframe: true,
    uniforms,
    vertexShader: document.getElementById('vertexshader').textContent,
    fragmentShader: document.getElementById('fragmentshader').textContent,
});

const geo = new THREE.IcosahedronGeometry(1.5, 20); //manipulate vertice and geometry size here
const mesh = new THREE.Mesh(geo, mat); 
scene.add(mesh); 


const renderScene = new RenderPass(scene, camera); 
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    params.strength,
    params.radius, 
    params.threshold
);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength; 
bloomPass.radius = params.radius; 

const outputPass = new OutputPass(); 

const bloomComposer = new EffectComposer(renderer); 
bloomComposer.addPass(renderScene); 
bloomComposer.addPass(bloomPass);
bloomComposer.addPass(outputPass); 

const gui = new GUI(); 

const colorsFolder = gui.addFolder('Colors'); 
colorsFolder.add(params, 'red', 0.1).onChange(function(value){
    uniforms.u_red.value= Number(value); 
}); 
colorsFolder.add(params, 'green', 0.1).onChange(function(value){
    uniforms.u_green.value= Number(value); 
}); 
colorsFolder.add(params, 'blue', 0.1).onChange(function(value){
    uniforms.u_blue.value= Number(value); 
}); 

const bloomFolder = gui.addFolder('Bloom'); 
bloomFolder.add(params, 'threshold', 0, 1).onChange(function (value){
    bloomPass.threshold = Number(value);
}); 
bloomFolder.add(params, 'strength', 0, 3).onChange(function (value){
    bloomPass.strength = Number(value);
}); 
bloomFolder.add(params, 'radius', 0, 1).onChange(function (value){
    bloomPass.radius = Number(value);
}); 
const clock = new THREE.Clock(); 
// Function to map the frequency to a color using the HSL color space
function calculateColorFromFrequency(frequency) {
    const normalizedFrequency = frequency / 255.0;  // Normalize the frequency to a 0-1 range

    // Adjusting the hue mapping to make it more dynamic and cover a wider range of colors
    // We can map the frequency to a hue range of 0-360 degrees for full color spectrum
    const hue = normalizedFrequency * 360; // Expanding the range to include more colors

    // Optionally, use frequency to modulate saturation or lightness for more dynamic colors
    const saturation = 0.7 + (normalizedFrequency * 0.3);  // Full saturation for vivid colors
    const lightness = 0.4 + (normalizedFrequency * 0.4); // Slight variation in lightness based on frequency

    // Convert the hue to RGB values
    const rgb = hslToRgb(hue / 360, saturation, lightness); // HSL to RGB conversion

    // Return the RGB values (r, g, b)
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
}
// Function to convert HSL to RGB
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic (grey)
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 3) return q;
            if (t < 1 / 2) return p;
            return p + (q - p) * (2 / 3 - t) * 6;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b]; // Return RGB values in range [0, 1]
}
let smoothedFrequency = 0;
let lastBeatTime = 0;
let simulatedTempo = 120;  // Simulated BPM (beats per minute)
let simulatedPitch = 440;  // Simulated pitch (in Hz)
let simulatedBeats = [];   // Array to store beat timestamps
let previousFrequency = 0;
let beatInterval = 0.8;  // Interval between beats (adjust as needed)
let targetScale = new THREE.Vector3(simulatedTempo / 60, simulatedTempo/60, simulatedTempo/60);
let scaleSpeed = Math.max(0.01, simulatedTempo/200); 

// Function to simulate tempo (beats per minute)
function simulateTempo(currentFrequency) {
    // If the frequency change is significant (indicating a "beat"), update the tempo
    if (Math.abs(currentFrequency - previousFrequency) > 20) {
        const currentTime = clock.getElapsedTime();
        const timeSinceLastBeat = currentTime - lastBeatTime;

        // If the time since last beat is short, we have a faster tempo
        if (timeSinceLastBeat < beatInterval) {
            simulatedTempo = 180;  // High tempo (fast beat)
        } else {
            simulatedTempo = 120;  // Regular tempo
        }

        // Update last beat time
        lastBeatTime = currentTime;
    }

    previousFrequency = currentFrequency;
}

// Function to simulate pitch
function simulatePitch(currentFrequency) {
    // Normalize the frequency to simulate pitch (in Hz)
    simulatedPitch = Math.max(100, Math.min(currentFrequency, 1000));  // Keep within a sensible range
}

// Function to detect and simulate beats
function simulateBeats(currentFrequency) {
    const currentTime = clock.getElapsedTime();

    // Simulate a beat if there's a significant change in frequency
    if (Math.abs(currentFrequency - previousFrequency) > 50) {
        simulatedBeats.push(currentTime); // Store beat time
    }
}
function animate() {
    camera.position.x += (mouseX - camera.position.x) * 0.05; 
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position); //camera controls

    uniforms.u_time.value = clock.getElapsedTime();

    const currentFrequency = analyzer.getAverageFrequency(); 

    //simulate tempo, pitch and beats
    simulateTempo(currentFrequency); 
    simulatePitch(currentFrequency);
    simulateBeats(currentFrequency); 
    
    smoothedFrequency = THREE.MathUtils.lerp(smoothedFrequency, currentFrequency, 1);
    const cappedFrequency = Math.min(smoothedFrequency, 200); 

    uniforms.u_frequency.value = cappedFrequency;

     // Calculate RGB values from frequency
    const color = calculateColorFromFrequency(cappedFrequency);
    
    // Smoothly update the uniform color values
    uniforms.u_red.value = THREE.MathUtils.lerp(uniforms.u_red.value, color.r, 0.05);
    uniforms.u_green.value = THREE.MathUtils.lerp(uniforms.u_green.value, color.g, 0.05);
    uniforms.u_blue.value = THREE.MathUtils.lerp(uniforms.u_blue.value, color.b, 0.05);
    
    //simulate effects based on pitch and tempo
    // const scaleFactor = simulatedTempo / 60; //normalize tempo to a reasonable scale
    // mesh.scale.set(scaleFactor, scaleFactor, scaleFactor); 
    mesh.scale.lerp(targetScale, scaleSpeed); 

    // const pitchColor = new THREE.Color(); 
    // pitchColor.setHSL(simulatedPitch / 1000, 0.5, 0.5); //normalize pitch to hsl range
    // mesh.material.color.set(pitchColor);

    if (simulateBeats.length > 0){
        const beatIndex = Math.floor(Date.now() / 1000) % simulateBeats.length; 
        const beatTime = simulatedBeats[beatIndex]; 
        // mesh.position.y = Math.sin(beatTime * 2 * Math.PI); //make object bounce with beat
    }

    bloomComposer.render(); 
    requestAnimationFrame(animate); 

    // renderer.render(scene, camera);
}

animate(); 

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
});