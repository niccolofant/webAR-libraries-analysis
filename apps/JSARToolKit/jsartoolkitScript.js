window.onload = function(){
    /**
     * mi connetto alla webcam
     */
    var video = document.getElementById("hiddenVideo");	
    var constraints = {audio: false, video: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream){
        video.srcObject = stream;
    })
    .catch(function(err){
        alert(err.name + ": " + err.message);	
        video.src = "marker.webm";
    });
    
    /**
     * dopo aver ricevuto l'input video inizio a processare ogni frame
     */
    video.onloadedmetadata = start_processing;
}


/**
 * funzione che processa il video alla ricerca di markers
 * @param {*} event 
 */
function start_processing(event){

    /**
     *  Set up video e canvas
     */
    var hvideo = document.getElementById("hiddenVideo");
    var hcanvas = document.getElementById("hiddenCanvas");
    var dcanvas = document.getElementById("drawingCanvas");
    var ocanvas = document.getElementById("outCanvas");
    hcanvas.width = ocanvas.width = dcanvas.width = hvideo.clientWidth;
    hcanvas.height = ocanvas.height = dcanvas.height = hvideo.clientHeight;
    hvideo.style.display = "none";
	hcanvas.style.display = "none";
	dcanvas.style.display = "none";
    
    /**
     * setup di JSARToolKit
     */
    var ART_raster = new NyARRgbRaster_Canvas2D(hcanvas);
    var ART_param = new FLARParam(hcanvas.width, hcanvas.height);
    var ART_detector = new FLARMultiIdMarkerDetector(ART_param, 65);
    ART_detector.setContinueMode(true);

    /**
     * setup di Three.js
     */
    var renderer = new THREE.WebGLRenderer( {canvas: ocanvas, antialias: true} );
    renderer.setPixelRatio(ocanvas.devicePixelRatio);
    renderer.setSize(ocanvas.width, ocanvas.height);
    renderer.autoClear = false;
    
    /**
     * creo il piano del background e la sua camera
     */
    var bgTexture = new THREE.Texture(hcanvas);
    bgTexture.minFilter = THREE.LinearFilter;
    var bgPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2,2),
        new THREE.MeshBasicMaterial({
            map: bgTexture,
            depthTest: false,  
            depthWrite: false
        })
    );
    
    /**
     * setto camera
     */
    var bgCamera = new THREE.OrthographicCamera(-1,1,1,-1);
    bgCamera.position.z = 1;
    var bgScene = new THREE.Scene();
    bgScene.add(bgPlane);
    bgScene.add(bgCamera);
    
    /**
     * setto la scena e i parametri di JSARToolKit
     */
    var scene = new THREE.Scene();
    var camera = new THREE.Camera();
    var tmp = new Float32Array(16);
    ART_param.copyCameraMatrix(tmp, 1, 10000);
    camera.projectionMatrix = ConvertCameraMatrix(tmp);
    scene.add(camera);

    /**
     * aggiungo luci
     */
    var plight = new THREE.PointLight(0xffffff);
    plight.position.set(0,3,3);
    scene.add(plight);
    var alight = new THREE.AmbientLight(0x808080);
    scene.add(alight);
    
    var container = new THREE.Object3D();
    container.matrixAutoUpdate = false;
    scene.add(container);

    const MODEL_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy_lightweight.glb';
    let stacy_txt = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy.jpg');
    stacy_txt.flipY = false;

    const stacy_mtl = new THREE.MeshPhongMaterial({
        map: stacy_txt,
        color: 0xffffff,
        skinning: true
      });

    var loader = new THREE.GLTFLoader();
    var model;
    var mixer;
    var anim;
    var markerCount;
    var tmat;
    
    var clock = new THREE.Clock();  

    /**
     * carico il modello 3D
     */
    loader.load(
        MODEL_PATH,
        function(gltf) {
          model = gltf.scene;
          let fileAnimations = gltf.animations;

          model.traverse(o => {

            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              o.material = stacy_mtl;
            }
            
          });

          model.scale.set(100, 100, 100);
          model.position.y = -11;

          container.add(model);

          mixer = new THREE.AnimationMixer(model);
          anim = THREE.AnimationClip.findByName(fileAnimations, 'idle');
          
          var idle = mixer.clipAction(anim);
          
          idle.play();


          document.getElementById("randomizer").addEventListener("click", e => {
            mixer.clipAction(anim).stop();
            anim = fileAnimations[Math.floor(Math.random() * 8)];
            mixer.clipAction(anim).play();
        });
    });

    var number = 0;
    var sum = 0;
    var mean = 0;
    var numDetections = 0; 
    var matrix = [
        [0, 0, 0, 0], 
        [0, 0, 0, 0],
        [0, 0, 0, 0],     
    ];
    var averageMatrix = [
        [0, 0, 0, 0], 
        [0, 0, 0, 0],
        [0, 0, 0, 0],  
    ];
    var listMatrices = []
    var deviation = 0;
    var standardDeviation = 0;
        
    /**
     * funzione che processa ogni frame, ogni 10ms
     */
    setInterval(function(){
    
        /**
         *  aggiorno l'hidden canvas
         * */ 
        hcanvas.getContext("2d").drawImage(hvideo, 0, 0, hcanvas.width, hcanvas.height);
        hcanvas.changed = true;
        bgTexture.needsUpdate = true;

        renderer.clear();
        renderer.render(bgScene, bgCamera);
        
        markerCount = ART_detector.detectMarkerLite(ART_raster, 128);
        
        if(markerCount > 0){
            tmat = new NyARTransMatResult();
            ART_detector.getTransformMatrix(0, tmat);
            number++;
            numDetections++;
            
            averageMatrix[0][0] += tmat.m00;
            averageMatrix[0][1] += tmat.m01;
            averageMatrix[0][2] += tmat.m02;
            averageMatrix[0][3] += tmat.m03;

            averageMatrix[1][0] += tmat.m10;
            averageMatrix[1][1] += tmat.m11;
            averageMatrix[1][2] += tmat.m12;
            averageMatrix[1][3] += tmat.m13;

            averageMatrix[2][0] += tmat.m20;
            averageMatrix[2][1] += tmat.m21;
            averageMatrix[2][2] += tmat.m22;
            averageMatrix[2][3] += tmat.m23;

            //utilizzo la matrice per visuallizare il modello sul marker
            container.matrix = ConvertMarkerMatrix(tmat);
            renderer.render(scene, camera);

            //animazione
            if (mixer) {
              mixer.update(clock.getDelta());
            }
        }
    }, 10);
    
    
    /**
     * Codice per i test sul rilevamento dei markers
     */
    setInterval(function(){

        console.log("number of detections"+number);
        sum = sum + number;
        number = 0;
    }, 1000);

    setInterval(function(){
        mean = sum/60;
        console.log("% successfull detections in 1 min: "+mean);
        for(var i = 0; i < 3; i++){
            for(var j = 0; j < 4; j++){
                averageMatrix[i][j] = averageMatrix[i][j]/numDetections;
            }
        }
        console.log(averageMatrix);
    }, 60000);    
}


/**
 * conversione matrice della camera di proiezione da JSARToolKit al formato Three.js
 * @param {*} m 
 * @returns myMat
 */
function ConvertCameraMatrix(m) {
    myMat = new THREE.Matrix4();
    myMat.set(
        m[0], m[4], m[8], m[12],
        -m[1], -m[5], -m[9], -m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15]	
    );
    return myMat;
}


/**
 * conversione matrice da JSARToolKit al formato Three.js
 * @param {*} m
 * @returns myMat
 */
function ConvertMarkerMatrix(m){
    myMat = new THREE.Matrix4();
    myMat.set(
        m.m00, m.m02, -m.m01, m.m03,
        m.m10, m.m12, -m.m11, m.m13, 
        m.m20, m.m22, -m.m21, m.m23,
        0, 0, 0, 1	
    );
    return myMat;
}
