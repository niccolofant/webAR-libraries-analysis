window.onload = function(){

    /**
     * prendo gli elementi HTML su cui lavorare
     */
    var video = document.getElementById("video");
    var cnv = document.getElementById("canvas");
    var context = canvas.getContext('2d');
    var colors = new tracking.ColorTracker(['magenta', 'cyan', 'yellow']);

    /**
     * setup del tracker
     */
    var tracker = new tracking.ObjectTracker("face");
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    var face = tracking.track("video", tracker, {camera: true});
    var color = tracking.track("video", colors);
    face.stop();
    color.stop();

    document.getElementById("faceTracker").addEventListener("click", e => {
        context.clearRect(0, 0, cnv.width, cnv.height);
        color.stop();
        face.run();
    });
    
    document.getElementById("colorTracker").addEventListener("click", e => {
        context.clearRect(0, 0, cnv.width, cnv.height);
        face.stop();
        color.run();
        
    });
    
    /**
     * scelgo cosa mostrare al tracciamento
     */
    tracker.on("track", e => {
        context.clearRect(0, 0, cnv.width, cnv.height);

        e.data.forEach(r => {
            context.strokeStyle = "yellow";
            context.strokeRect(r.x, r.y, r.width, r.height);
            context.font = "50px Roboto";
            context.fillStyle = "#fff";
            //context.fillText('ciao', r.x + 100, r.y);
        });
    });


    var renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});

    renderer.setSize( cnv.width, cnv.height );
    
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera( 75, cnv.width / cnv.height, 0.1, 1000 );
    camera.position.z = 3;
    scene.add(camera);

    // adding lights
    var plight = new THREE.PointLight(0xffffff);
    plight.position.set(0,3,3);
    scene.add(plight);
    var alight = new THREE.AmbientLight(0x808080);
    scene.add(alight);

    /**
     * scelgo cosa mostrare al traccimento dei colori
     */
    colors.on('track', e => {
        if (e.data.length === 0) {
          // No colors were detected in this frame.
        } else {
            context.clearRect(0, 0, cnv.width, cnv.height);
            e.data.forEach(r => {
                
                
                // create a cube
                var geometry = new THREE.BoxGeometry(1, 1, 1);
                var material = new THREE.MeshLambertMaterial({ color: r.color });
                var cube = new THREE.Mesh( geometry, material );
                scene.add( cube );

                // render loop
                renderer.render( scene, camera );
    
                context.drawImage(document.getElementById("canvas").appendChild( renderer.domElement ), r.x - 175, r.y - 250);
                
                context.strokeStyle = "transparent";
                context.strokeRect(r.x, r.y, r.width, r.height);
                context.font = "30px Roboto";
                context.fillStyle = "#000";
                context.fillText(r.color, r.x + 100, r.y);
                

    
    /*console.log(document.getElementById("canvas").appendChild( renderer.domElement ).width);
    var scene = new THREE.Scene();
    //var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    //var material = new THREE.MeshBasicMaterial( { color: r.color } );
    var camera = new THREE.PerspectiveCamera();
    //var cube = new THREE.Mesh( geometry, material );
    //scene.add( cube );
    console.log(scene);
    context.drawImage(scene, 0, 0);
    // render loop
    function renderloop() {
    requestAnimationFrame( renderloop );
    renderer.render( scene, camera );
    }
    renderloop();
    */
            });
        }
      });
    
      

/*
    var gui = new dat.GUI();
    gui.add(tracker, 'edgesDensity', 0.1, 0.5).step(0.01);
    gui.add(tracker, 'initialScale', 1.0, 10.0).step(0.1);
    gui.add(tracker, 'stepSize', 1, 5).step(0.1);*/
};