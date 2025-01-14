import * as THREE from "three";
import { World, Body, Sphere, Plane, Vec3 } from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export const useInititializeThreeJS = () => {
    let mixer,
        scene,
        camera,
        renderer,
        light,
        directionalLight,
        pointLight,
        lightBody,
        fallingLight,
        snowfallIntervalID,
        animationFrameID,
        controls,
        loader,
        clock,
        world, // Physics world
        groundBody; // Ground physics body   

    const createScene = () => {
        // Create the Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020);
    };

    const createCamera = () => {
        // Camera
        camera = new THREE.PerspectiveCamera(
            75,
            innerWidth / innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 10, 30);
    };
    const createPhysicsWorld = () => {
        // Create the physics world
        world = new World();
        world.gravity.set(0, -9.82, 0); // Gravity pointing downward
    };

    const createLights = () => {
        const ambientLight = new THREE.AmbientLight(0x404040, 5); // Color: 0x404040 (soft white), Intensity: 0.2
        scene.add(ambientLight);
        // Lights
        /*light = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(light);
        directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);*/
    };


    const createGround = () => {
        // Add ground to the scene (Three.js)
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xF0F8FF });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2; // Make it horizontal
        scene.add(groundMesh);

        // Add ground to the physics world (Cannon.js)
        groundBody = new Body({
            mass: 0, // Static ground
            shape: new Plane(),
            position: new Vec3(0, 0, 0),
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // Align with Three.js ground
        world.addBody(groundBody);
    };

    const addControls = () => {
        // Orbit Controls
        controls = new OrbitControls(camera, renderer.domElement);
    };

    const loadModel = () => {
        // Load the GLTF Model
        loader = new GLTFLoader();

        loader.load(
            "/assets/House_001_GLB.glb",
            (gltf) => {
                const model = gltf.scene;
                scene.add(model);

                // Animation
                mixer = new THREE.AnimationMixer(model);
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play(); // Play all animations in the model
                });
            },
            undefined,
            (error) => {
                console.error("Error loading the model:", error);
            }
        );
    };
    
    const lights = [];
    const addFallingLight = () => {
        snowfallIntervalID = setInterval(() => {
            const randomZ = Math.random() * 20;
            const randomX = Math.random() * 20;
            const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8B00FF'];
            const randomColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        // Create a Point Light
            fallingLight = new THREE.PointLight(randomColor, 10, 100); //color, radius, magnitude
            fallingLight.position.set(randomZ, 15, randomX); // Start above the ground

            const sphereGeometry = new THREE.SphereGeometry(0.1, 10, 16); // radius, width segments, height segments
            const sphereMaterial = new THREE.MeshStandardMaterial({color: randomColor, emissive: randomColor, emissiveIntensity: 5, });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);    
            sphere.position.copy(fallingLight.position); // Start the sphere at the same position as the light

            scene.add(sphere);
            scene.add(fallingLight);
        
            // Add physics to the light
            lightBody = new Body({
                mass: 0.001, // Dynamic object
                shape: new Sphere(0.5), // Spherical physics shape
                position: new Vec3(randomZ, 20, randomX),
            });
            world.addBody(lightBody);
            lights.push({ light: fallingLight, sphere, body: lightBody });
        }, 300);
    };    
    //dont forget to add logic to destroy light fallen after collison.

    let composer;

    const setupPostProcessing = () => {
    // Render Pass: Render the scene normally
    const renderPass = new RenderPass(scene, camera);

    // Bloom Pass: Add glow effects
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // Strength of bloom
        0.4, // Bloom radius
        0.85 // Threshold
    );

    // Composer: Combine passes
    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    };

    const addAnimation = () => {
        // Animation Loop
        clock = new THREE.Clock();

        const animate = () => {
            const animationFrameID = requestAnimationFrame(animate);
        
            const delta = clock.getDelta();
        
            // Update the physics world
            world.step(1 / 60, delta, 3);
        
            // Sync the falling light with its physics body
            lights.forEach(({ light, sphere, body }, index) => {
                if (body.position.y < 1) {
                    scene.remove(light);
                    scene.remove(sphere);
                    world.removeBody(body);
                    lights.splice(index, 1); // Remove from the array
                } else {
                    light.position.set(body.position.x, body.position.y, body.position.z);
                    sphere.position.set(body.position.x, body.position.y, body.position.z);
                }
            });
            
        
            if (mixer) {
                mixer.update(delta);
            }
        
            controls.update();
            composer.render();
        };    

        animate();

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
              cancelAnimationFrame(animationFrameID);
            } else {
              animate();
            }
          });
    };

    const addWindowResizeListener = () => {
        // Handle Window Resize
        addEventListener("resize", () => {
            camera.aspect = innerWidth / innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(innerWidth, innerHeight);
        });
    };

    const render = () => {
        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(innerWidth, innerHeight);
        const container = document.querySelector(`.scene`) || document.body;
        container.appendChild(renderer.domElement);
    };

    createScene();
    createCamera();
    render();
    createPhysicsWorld();
    createLights();
    createGround();
    addControls();
    loadModel();
    addFallingLight();
    setupPostProcessing();
    addAnimation();
    addWindowResizeListener();

    return {scene, snowfallIntervalID, animationFrameID};
   
}