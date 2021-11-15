window.ARThreeOnLoad = function() {
	ARController.getUserMediaThreeScene({maxARVideoSize: 320, cameraParam: '../../Libraries/JSARToolKit5/examples/Data/camera_para.dat',
	onSuccess: function(arScene, arController, arCamera) {  
		document.body.className = arController.orientation;

		var renderer = new THREE.WebGLRenderer({antialias: true});
		if (arController.orientation === 'portrait') {
			var w = (window.innerWidth / arController.videoHeight) * arController.videoWidth;
			var h = window.innerWidth;
			renderer.setSize(w, h);
			renderer.domElement.style.paddingBottom = (w-h) + 'px';
		} else {
			if (/Android|mobile|iPad|iPhone/i.test(navigator.userAgent)) {
				renderer.setSize(window.innerWidth, (window.innerWidth / arController.videoWidth) * arController.videoHeight);
			} else {
				renderer.setSize(arController.videoWidth, arController.videoHeight);
				document.body.className += ' desktop';
			}
		}

    document.body.insertBefore(renderer.domElement, document.body.firstChild);

    /**
     * setto cosa JSARToolKit deve rilevare
     */
    arController.setPatternDetectionMode(artoolkit.AR_TEMPLATE_MATCHING_COLOR);
     
    const MODEL_PATH = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy_lightweight.glb';
    let stacy_txt = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/1376484/stacy.jpg');
    stacy_txt.outputEncoding = THREE.sRGBEncoding;
    stacy_txt.flipY = false;

    const stacy_mtl = new THREE.MeshPhongMaterial({
        map: stacy_txt,
        color: 0xffffff,
        skinning: true
    });
        
    var loader = new THREE.GLTFLoader();
    var model3D = new THREE.Object3D();
    var stacy;
    var plant;
    var plight = new THREE.PointLight(0xffffff);
    var clock = new THREE.Clock();
    var plantR = false;
    var alight = new THREE.AmbientLight(0x808080);
    var mixer;
    var fileAnimations;
    var markerRoot;
    var markerHiro;
    var markerKanji;
    var number = 0;
    var sum = 0;
    var mean = 0;

    /**
     * carico il modello 3D
     */
    loader.load(MODEL_PATH, function(gltf){
            stacy = gltf.scene;
            fileAnimations = gltf.animations;
            stacy.rotation.x = 1.5;

            stacy.traverse(o => {
              o.castShadow = true;
              o.receiveShadow = true;
              o.material = stacy_mtl;
            });

            model3D = stacy;

            mixer = new THREE.AnimationMixer(stacy);
          
            anim = THREE.AnimationClip.findByName(fileAnimations, 'idle');

            var idle = mixer.clipAction(anim);
            
            idle.play();

            
            /**
              * carico marker ed aggiungo il modello 3D
              */   
            arController.loadMarker('../../Libraries/JSARToolKit5/examples/Data/patt.hiro', function(markerId){
                markerHiro = markerId;
                markerRoot = arController.createThreeMarker(markerId);
                markerRoot.add(model3D);
                arScene.scene.add(markerRoot);
                arScene.scene.add(alight);
                arScene.scene.add(plight); 
            });
            

            document.getElementById("randomizer").addEventListener("click", e => {
                mixer.clipAction(anim).stop();
                anim = fileAnimations[Math.floor(Math.random() * 8)];
                mixer.clipAction(anim).play();
            });
    });


    loader.load("plant.gltf", function(gltf){
      plant = gltf.scene;
      plant.scale.set(3, 3, 3);
      plant.rotation.x = 1.5;
      model3D = plant;
      arController.loadMarker('../../Libraries/JSARToolKit5/examples/Data/patt.kanji', function(markerId){
          markerKanji = markerId;
          markerRoot = arController.createThreeMarker(markerId); 
          markerRoot.add(model3D);
          arScene.scene.add(markerRoot);
          arScene.scene.add(alight);
          arScene.scene.add(plight); 
      });

      arController.addEventListener('getMarker', function(ev) {
        if (ev.data.marker.idPatt === markerHiro || ev.data.marker.idPatt === markerKanji ) {
          number++;
            }
      });

      document.getElementById("animatePlant").addEventListener("click", e => {
        plantR = !plantR;
      });
    });

    /**
     * processo ogni frame
     */   
		var tick = function() {

			  arScene.process();
			  arScene.renderOn(renderer);
        requestAnimationFrame(tick);
        
      //animazione stacy
      if (mixer) {
        mixer.update(clock.getDelta());
      }   
      //animazione pianta
      if(plantR){
        plant.rotation.y += 0.01;
      }
	  };
    
		tick();


    /**
     * Codice per i test sul rilevamento dei markers
     */
    setInterval(function(){

      console.log("number of detections"+number);
      sum = sum + number;
      number = 0;
      //console.log(tmat);
      //console.log(listMatrices)
    }, 1000);

    setInterval(function(){
      mean = sum/60;
      console.log("% successfull detections in 1 min: "+(mean*100/60));
      

  }, 60000);

	}});

	delete window.ARThreeOnLoad;

};

if (window.ARController && ARController.getUserMediaThreeScene) {
	ARThreeOnLoad();
  
}
