// web socket connection pattern article
// https://medium.com/@julianminde/realtime-updates-with-appsync-over-websockets-88fbe4ae62cc

const APPSYNC_HOST = "afno5ipvkfamfagfok7ad4qnwm.appsync-api.us-west-1.amazonaws.com";
const APPSYNC_REALTIME_HOST = 'wss://afno5ipvkfamfagfok7ad4qnwm.appsync-realtime-api.us-west-1.amazonaws.com/graphql'
const APPSYNC_API_KEY = "da2-b5axtuh2kbd6djkz6c34kyqw2q";

function encodeAppSyncCredentials() {
    const creds = {
      host: APPSYNC_HOST,
      "x-api-key": APPSYNC_API_KEY,
    };
    const b64Creds = window.btoa(JSON.stringify(creds));
  
    return b64Creds;
  }

  function getWebsocketUrl() {
    const header = encodeAppSyncCredentials(APPSYNC_HOST, APPSYNC_API_KEY);
    const payload = window.btoa(JSON.stringify({}));
  
    const url = `${APPSYNC_REALTIME_HOST}?header=${header}&payload=${payload}`;
  
    return url;
  }

/*
 * @name Applying Shaders as Textures
 * @description Shaders can be applied to 2D/3D shapes as textures. 
 * To learn more about shaders and p5.js: https://itp-xstory.github.io/p5js-shaders/
 */

let theShader;
let shaderTexture;

let theta = 0;

let x;
let y;
let outsideRadius = 200;
let insideRadius = 100;


function preload(){
  // load the shader
  theShader = loadShader('texture.vert','texture.frag');
}

let slider;
let midiValue = 1;

function setNewValue() {
    midiValue = Math.random() * 0.2;
}


function setup() {
    
    var websocket = new WebSocket(getWebsocketUrl(), ["graphql-ws"]);

    websocket.addEventListener("open", () => {
        websocket.send(
          JSON.stringify({
            type: "connection_init",
          })
        );
      });

    websocket.addEventListener("message", (event) => {
    message = JSON.parse(event.data);
    switch (message.type) {
        case "connection_ack":  
            startSubscription(websocket);
        break;
        case "start_ack":
            console.log("start_ack");            
        break;
        case "error":
            console.error(message);
        break;
        case "data":
            console.log(message.payload.data);
            setNewValue()
        break;
    }
    });

    function startSubscription(websocket) {
        const subscribeMessage = {
          id: window.crypto.randomUUID(),
          type: "start",
          payload: {
            data: JSON.stringify({
              query: `subscription GetMessagesSub {
                        subscribe2channel {
                            midi {
                                note
                                value
                            }
                                name
                        }
                    }`,
            }),
            extensions: {
              authorization: {
                "x-api-key": APPSYNC_API_KEY,
                host: APPSYNC_HOST,
              },
            },
          },
        };
        websocket.send(JSON.stringify(subscribeMessage));
      }
  // disables scaling for retina screens which can create inconsistent scaling between displays
  //pixelDensity(1);
  // shaders require WEBGL mode to work
  createCanvas(350, 800, WEBGL);
  noStroke();

  // initialize the createGraphics layers
  shaderTexture = createGraphics(350, 800, WEBGL);

  // turn off the createGraphics layers stroke
  shaderTexture.noStroke();

   x = -90;
   y = 0;

//    slider = createSlider(0, 255);
//    slider.position(10, 10);
//    slider.size(800);
}

function draw() {

  // instead of just setting the active shader we are passing it to the createGraphics layer
  shaderTexture.shader(theShader);

  // here we're using setUniform() to send our uniform values to the shader
  theShader.setUniform("resolution", [width / 50, height / 50]);
  theShader.setUniform("time", millis() / 1000.0);
  theShader.setUniform("mouse", [175, map(211, 0, height, height, 0)]);

  // passing the shaderTexture layer geometry to render on
  shaderTexture.rect(0,0,width,height);

  background(255);
  
  //pass the shader as a texture
  texture(shaderTexture);
  
  translate(-50, 0, 0)
  push();
  let dateRotation = Date.now() * 0.000000000001
  rotateZ(theta * dateRotation * midiValue);
  rotateX(theta * dateRotation * midiValue);
  rotateY(theta * dateRotation * midiValue);

  theta += 0.05;
  sphere(525);
  pop();
  
  /* when you put a texture or shader on an ellipse it is rendered in 3d,
     so a fifth parameter that controls the # vertices in it becomes necessary,
     or else you'll have sharp corners. setting it to 100 is smooth. */
  let ellipseFidelity = int(map(375, 0, width, 8, 500));
  ellipse(50, 0, 900, 900, ellipseFidelity);
}